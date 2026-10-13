'use server';

import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { organizations, organizationMembers, organizationInvitations, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const MAX_MEMBERS_PER_ORG = 3;

export async function getInvitationDetails(token: string) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token de convite inválido.' };
  }

  try {
    const inviteRows = await db
      .select({
        id: organizationInvitations.id,
        organizationId: organizationInvitations.organizationId,
        orgName: organizations.name,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        status: organizationInvitations.status,
        expiresAt: organizationInvitations.expiresAt,
      })
      .from(organizationInvitations)
      .innerJoin(organizations, eq(organizationInvitations.organizationId, organizations.id))
      .where(eq(organizationInvitations.token, token))
      .limit(1);

    if (inviteRows.length === 0) {
      return { valid: false, error: 'Convite não encontrado.' };
    }

    const invite = inviteRows[0];

    if (invite.status === 'revoked') {
      return { valid: false, error: 'Este convite foi cancelado pelo gestor da organização.' };
    }

    if (invite.status === 'accepted') {
      return { valid: false, error: 'Este convite já foi utilizado.' };
    }

    const isExpired = invite.status === 'expired' || new Date(invite.expiresAt) < new Date();
    if (isExpired) {
      if (invite.status !== 'expired') {
        await db
          .update(organizationInvitations)
          .set({ status: 'expired' })
          .where(eq(organizationInvitations.id, invite.id));
      }
      return { valid: false, error: 'Este convite expirou.' };
    }

    // Verificar capacidade de membros ativos da organização
    const activeMembers = await db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, invite.organizationId));

    if (activeMembers.length >= MAX_MEMBERS_PER_ORG) {
      return {
        valid: false,
        error: `Esta organização já atingiu o limite de ${MAX_MEMBERS_PER_ORG} membros.`,
      };
    }

    return {
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        organizationId: invite.organizationId,
        organizationName: invite.orgName,
        expiresAt: invite.expiresAt,
      },
    };
  } catch (error) {
    console.error('Erro ao consultar detalhes do convite:', error);
    return { valid: false, error: 'Ocorreu um erro ao carregar os dados do convite.' };
  }
}

export async function acceptInvitationAction(token: string) {
  const { data: session } = await auth.getSession();

  if (!session?.user?.id) {
    return { error: 'Você precisa estar autenticado para aceitar o convite.' };
  }

  if (!token || typeof token !== 'string') {
    return { error: 'Token de convite inválido.' };
  }

  try {
    // 1. Buscar convite
    const inviteRows = await db
      .select({
        id: organizationInvitations.id,
        organizationId: organizationInvitations.organizationId,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        status: organizationInvitations.status,
        expiresAt: organizationInvitations.expiresAt,
      })
      .from(organizationInvitations)
      .where(eq(organizationInvitations.token, token))
      .limit(1);

    if (inviteRows.length === 0) {
      return { error: 'Convite não encontrado.' };
    }

    const invite = inviteRows[0];

    if (invite.status === 'revoked') {
      return { error: 'Este convite foi cancelado pelo gestor da organização.' };
    }

    if (invite.status === 'accepted') {
      return { error: 'Este convite já foi aceito anteriormente.' };
    }

    if (invite.status === 'expired' || new Date(invite.expiresAt) < new Date()) {
      return { error: 'Este convite expirou.' };
    }

    // 2. Verificar capacidade de membros ativos da organização
    const activeMembers = await db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, invite.organizationId));

    if (activeMembers.length >= MAX_MEMBERS_PER_ORG) {
      return {
        error: `A organização já atingiu o limite máximo de ${MAX_MEMBERS_PER_ORG} membros.`,
      };
    }

    // 3. Verificar se o usuário já é membro desta organização
    const existingMembership = await db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, invite.organizationId),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      // Já é membro, marcar convite como aceito
      await db
        .update(organizationInvitations)
        .set({ status: 'accepted' })
        .where(eq(organizationInvitations.id, invite.id));

      revalidatePath('/dashboard');
      return { success: true, alreadyMember: true };
    }

    // 4. Executar transação/batch para garantir usuário local e membro da organização
    const userName = session.user.name || session.user.email || 'Usuário';
    const userEmail = session.user.email || invite.email;

    await db.batch([
      db.insert(users).values({
        id: session.user.id,
        name: userName,
        email: userEmail,
      }).onConflictDoNothing(),
      db.insert(organizationMembers).values({
        userId: session.user.id,
        organizationId: invite.organizationId,
        role: invite.role || 'member',
      }),
      db.update(organizationInvitations)
        .set({ status: 'accepted' })
        .where(eq(organizationInvitations.id, invite.id)),
    ]);

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    return { error: 'Ocorreu um erro ao processar o aceite do convite.' };
  }
}
