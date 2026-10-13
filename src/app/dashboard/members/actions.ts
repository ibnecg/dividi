'use server';

import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { organizations, organizationMembers, organizationInvitations, users } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { inviteMemberSchema } from '@/lib/validations/member';

const MAX_MEMBERS_PER_ORG = 3;

export async function getOrganizationMembersData() {
  const { data: session } = await auth.getSession();

  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  try {
    // 1. Obter a organização e o papel do usuário atual
    const callerMember = await db
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!callerMember || callerMember.length === 0) {
      return { error: 'Organização não encontrada para este usuário' };
    }

    const { orgId, orgName, role: userRole } = callerMember[0];

    // 2. Atualizar convites expirados automaticamente
    const now = new Date();
    await db
      .update(organizationInvitations)
      .set({ status: 'expired' })
      .where(
        and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.status, 'pending'),
          lt(organizationInvitations.expiresAt, now)
        )
      );

    // 3. Buscar membros ativos
    const activeMembers = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, orgId));

    // 4. Buscar convites pendentes
    const pendingInvitations = await db
      .select({
        id: organizationInvitations.id,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        token: organizationInvitations.token,
        status: organizationInvitations.status,
        expiresAt: organizationInvitations.expiresAt,
        createdAt: organizationInvitations.createdAt,
        inviterName: users.name,
      })
      .from(organizationInvitations)
      .innerJoin(users, eq(organizationInvitations.invitedByUserId, users.id))
      .where(
        and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.status, 'pending')
        )
      );

    const isOwner = userRole === 'owner';
    const totalCount = activeMembers.length + pendingInvitations.length;
    const canInvite = isOwner && totalCount < MAX_MEMBERS_PER_ORG;

    return {
      organization: {
        id: orgId,
        name: orgName,
      },
      currentUserRole: userRole,
      isOwner,
      members: activeMembers,
      invitations: pendingInvitations,
      counts: {
        active: activeMembers.length,
        pending: pendingInvitations.length,
        total: totalCount,
        limit: MAX_MEMBERS_PER_ORG,
      },
      canInvite,
    };
  } catch (error) {
    console.error('Erro ao buscar dados de membros da organização:', error);
    return { error: 'Ocorreu um erro ao carregar os dados dos membros.' };
  }
}

export async function inviteMemberAction(data: { email: string }) {
  const { data: session } = await auth.getSession();

  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  const parsed = inviteMemberSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'E-mail inválido' };
  }

  const { email, role } = parsed.data;

  try {
    // 1. Obter organização e papel do usuário que está convidando
    const callerMember = await db
      .select({
        orgId: organizations.id,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!callerMember || callerMember.length === 0) {
      return { error: 'Organização não encontrada' };
    }

    const { orgId, role: callerRole } = callerMember[0];

    // 2. Verificar permissão: apenas 'owner' pode convidar
    if (callerRole !== 'owner') {
      return { error: 'Apenas gestores da organização podem enviar convites.' };
    }

    // 3. Atualizar convites expirados primeiro
    const now = new Date();
    await db
      .update(organizationInvitations)
      .set({ status: 'expired' })
      .where(
        and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.status, 'pending'),
          lt(organizationInvitations.expiresAt, now)
        )
      );

    // 4. Contabilizar membros ativos e convites pendentes
    const activeMembers = await db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    const pendingInvitations = await db
      .select({ id: organizationInvitations.id })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.status, 'pending')
        )
      );

    const totalUsed = activeMembers.length + pendingInvitations.length;
    if (totalUsed >= MAX_MEMBERS_PER_ORG) {
      return {
        error: `A organização atingiu o limite de ${MAX_MEMBERS_PER_ORG} membros (incluindo convites pendentes).`,
      };
    }

    // 5. Verificar se o e-mail já é de um membro ativo da mesma organização
    const existingMember = await db
      .select({ userId: users.id })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(users.email, email)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'Este usuário já é membro desta organização.' };
    }

    // 6. Verificar se já existe um convite pendente para este e-mail
    const existingPendingInvite = await db
      .select({ id: organizationInvitations.id })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.email, email),
          eq(organizationInvitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingPendingInvite.length > 0) {
      return { error: 'Já existe um convite pendente para este e-mail.' };
    }

    // 7. Gerar token criptográfico e criar o convite (validade: 7 dias)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const inviteId = crypto.randomUUID();

    await db.insert(organizationInvitations).values({
      id: inviteId,
      organizationId: orgId,
      email,
      role,
      token,
      invitedByUserId: session.user.id,
      status: 'pending',
      expiresAt,
    });

    revalidatePath('/dashboard/members');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${token}`;

    return {
      success: true,
      token,
      inviteUrl,
    };
  } catch (error) {
    console.error('Erro ao gerar convite de membro:', error);
    return { error: 'Ocorreu um erro ao gerar o convite.' };
  }
}

export async function revokeInvitationAction(invitationId: string) {
  const { data: session } = await auth.getSession();

  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  try {
    // 1. Obter organização e papel do usuário
    const callerMember = await db
      .select({
        orgId: organizations.id,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!callerMember || callerMember.length === 0) {
      return { error: 'Organização não encontrada' };
    }

    const { orgId, role: callerRole } = callerMember[0];

    if (callerRole !== 'owner') {
      return { error: 'Apenas gestores da organização podem cancelar convites.' };
    }

    // 2. Verificar se o convite pertence a esta organização
    const invite = await db
      .select({ id: organizationInvitations.id, status: organizationInvitations.status })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.id, invitationId),
          eq(organizationInvitations.organizationId, orgId)
        )
      )
      .limit(1);

    if (invite.length === 0) {
      return { error: 'Convite não encontrado nesta organização.' };
    }

    // 3. Atualizar status para 'revoked'
    await db
      .update(organizationInvitations)
      .set({ status: 'revoked' })
      .where(eq(organizationInvitations.id, invitationId));

    revalidatePath('/dashboard/members');
    return { success: true };
  } catch (error) {
    console.error('Erro ao revogar convite:', error);
    return { error: 'Ocorreu um erro ao cancelar o convite.' };
  }
}

export async function removeMemberAction(targetUserId: string) {
  const { data: session } = await auth.getSession();

  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  if (targetUserId === session.user.id) {
    return { error: 'Você não pode remover a si mesmo da organização.' };
  }

  try {
    // 1. Obter organização e papel do usuário chamador
    const callerMember = await db
      .select({
        orgId: organizations.id,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!callerMember || callerMember.length === 0) {
      return { error: 'Organização não encontrada' };
    }

    const { orgId, role: callerRole } = callerMember[0];

    if (callerRole !== 'owner') {
      return { error: 'Apenas gestores da organização podem remover membros.' };
    }

    // 2. Remover vínculo
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, targetUserId)
        )
      );

    revalidatePath('/dashboard/members');
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover membro da organização:', error);
    return { error: 'Ocorreu um erro ao remover o membro.' };
  }
}
