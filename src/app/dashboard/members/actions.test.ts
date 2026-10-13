/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrganizationMembersData,
  inviteMemberAction,
  revokeInvitationAction,
  removeMemberAction,
} from './actions';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  },
}));

describe('Organization Members Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrganizationMembersData', () => {
    it('returns error when user is unauthenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as any);

      const result = await getOrganizationMembersData();
      expect(result).toEqual({ error: 'Usuário não autenticado' });
    });

    it('returns error when user does not belong to any organization', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      } as any);

      const result = await getOrganizationMembersData();
      expect(result).toEqual({ error: 'Organização não encontrada para este usuário' });
    });

    it('returns members, pending invites and counts correctly', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      // 1. Caller org
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          { orgId: 'org-1', orgName: 'Minha ONG', role: 'owner' },
        ]),
      } as any);

      // 2. Active members (1 member)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            userId: 'user-1',
            name: 'Gestor',
            email: 'gestor@ong.org',
            role: 'owner',
            createdAt: new Date(),
          },
        ]),
      } as any);

      // 3. Pending invitations (1 invite)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            id: 'invite-1',
            email: 'colaborador@ong.org',
            role: 'member',
            token: 'tok-123',
            status: 'pending',
            expiresAt: new Date(Date.now() + 100000),
            createdAt: new Date(),
            inviterName: 'Gestor',
          },
        ]),
      } as any);

      const result = await getOrganizationMembersData();

      expect(result).not.toHaveProperty('error');
      if ('counts' in result && result.counts) {
        expect(result.counts.active).toBe(1);
        expect(result.counts.pending).toBe(1);
        expect(result.counts.total).toBe(2);
        expect(result.counts.limit).toBe(3);
        expect(result.canInvite).toBe(true);
        expect(result.isOwner).toBe(true);
      }
    });
  });

  describe('inviteMemberAction', () => {
    it('returns error when user is unauthenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as any);

      const result = await inviteMemberAction({ email: 'teste@exemplo.com' });
      expect(result).toEqual({ error: 'Usuário não autenticado' });
    });

    it('returns validation error on invalid email', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      const result = await inviteMemberAction({ email: 'invalido' });
      expect(result.error).toBeDefined();
    });

    it('prevents non-owner members from inviting', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-2' } },
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'member' }]),
      } as any);

      const result = await inviteMemberAction({ email: 'novo@exemplo.com' });
      expect(result).toEqual({
        error: 'Apenas gestores da organização podem enviar convites.',
      });
    });

    it('blocks invitation when organization capacity (3) is reached', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      // Caller info
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'owner' }]),
      } as any);

      // Active members: 2
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }]),
      } as any);

      // Pending invitations: 1 (Total = 3)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ id: 'inv-1' }]),
      } as any);

      const result = await inviteMemberAction({ email: 'novo@exemplo.com' });
      expect(result).toEqual({
        error: 'A organização atingiu o limite de 3 membros (incluindo convites pendentes).',
      });
    });

    it('rejects inviting a user who is already an active member', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      // Caller info
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'owner' }]),
      } as any);

      // Active members: 1
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: 'u1' }]),
      } as any);

      // Pending invitations: 0
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      } as any);

      // Check existing active member with same email
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ userId: 'u1' }]),
      } as any);

      const result = await inviteMemberAction({ email: 'u1@exemplo.com' });
      expect(result).toEqual({
        error: 'Este usuário já é membro desta organização.',
      });
    });

    it('rejects duplicate pending invite for the same email', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      // Caller info
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'owner' }]),
      } as any);

      // Active members: 1
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: 'u1' }]),
      } as any);

      // Pending invitations: 1
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ id: 'inv-1' }]),
      } as any);

      // Check existing active member -> empty
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      } as any);

      // Check existing pending invite -> found!
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ id: 'inv-1' }]),
      } as any);

      const result = await inviteMemberAction({ email: 'pendente@exemplo.com' });
      expect(result).toEqual({
        error: 'Já existe um convite pendente para este e-mail.',
      });
    });

    it('successfully creates an invite when space is available', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      // Caller info
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'owner' }]),
      } as any);

      // Active members: 1
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: 'u1' }]),
      } as any);

      // Pending invitations: 0
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      } as any);

      // Check existing active member -> empty
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      } as any);

      // Check existing pending invite -> empty
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      } as any);

      const result = await inviteMemberAction({ email: 'novo@exemplo.com' });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.inviteUrl).toContain('/invite/');
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('revokeInvitationAction', () => {
    it('fails if caller is not owner', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-2' } },
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'member' }]),
      } as any);

      const result = await revokeInvitationAction('inv-1');
      expect(result).toEqual({
        error: 'Apenas gestores da organização podem cancelar convites.',
      });
    });

    it('successfully revokes pending invitation', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      // Caller is owner
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'owner' }]),
      } as any);

      // Invite found
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ id: 'inv-1', status: 'pending' }]),
      } as any);

      const result = await revokeInvitationAction('inv-1');
      expect(result).toEqual({ success: true });
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeMemberAction', () => {
    it('prevents owner from removing themselves', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      const result = await removeMemberAction('user-1');
      expect(result).toEqual({
        error: 'Você não pode remover a si mesmo da organização.',
      });
    });

    it('successfully removes another member', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      } as any);

      // Caller is owner
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ orgId: 'org-1', role: 'owner' }]),
      } as any);

      const result = await removeMemberAction('user-2');
      expect(result).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalledTimes(1);
    });
  });
});
