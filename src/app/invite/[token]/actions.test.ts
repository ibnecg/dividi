/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInvitationDetails, acceptInvitationAction } from './actions';
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
    batch: vi.fn(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue({}),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

describe('Invite Token Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInvitationDetails', () => {
    it('returns error on missing or invalid token', async () => {
      const result = await getInvitationDetails('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token de convite inválido.');
    });

    it('returns error when invite does not exist', async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      } as any);

      const result = await getInvitationDetails('token-inexistente');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Convite não encontrado.');
    });

    it('returns error when invite is revoked', async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          {
            id: 'inv-1',
            status: 'revoked',
            expiresAt: new Date(Date.now() + 100000),
          },
        ]),
      } as any);

      const result = await getInvitationDetails('token-revogado');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cancelado');
    });

    it('returns error when invite is expired', async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          {
            id: 'inv-1',
            status: 'pending',
            expiresAt: new Date(Date.now() - 100000), // Expirado
          },
        ]),
      } as any);

      const result = await getInvitationDetails('token-expirado');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expirou');
    });

    it('returns error when organization already has 3 members', async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          {
            id: 'inv-1',
            organizationId: 'org-1',
            orgName: 'ONG Cheia',
            email: 'convidado@teste.com',
            role: 'member',
            status: 'pending',
            expiresAt: new Date(Date.now() + 100000),
          },
        ]),
      } as any);

      // 3 active members
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: '1' }, { userId: '2' }, { userId: '3' }]),
      } as any);

      const result = await getInvitationDetails('token-valido');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('atingiu o limite de 3 membros');
    });

    it('returns valid invite details when all checks pass', async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          {
            id: 'inv-1',
            organizationId: 'org-1',
            orgName: 'ONG Esperança',
            email: 'convidado@teste.com',
            role: 'member',
            status: 'pending',
            expiresAt: new Date(Date.now() + 100000),
          },
        ]),
      } as any);

      // 1 active member (< 3)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: '1' }]),
      } as any);

      const result = await getInvitationDetails('token-valido');
      expect(result.valid).toBe(true);
      if (result.valid && result.invite) {
        expect(result.invite.organizationName).toBe('ONG Esperança');
        expect(result.invite.email).toBe('convidado@teste.com');
      }
    });
  });

  describe('acceptInvitationAction', () => {
    it('returns error when user is not authenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as any);

      const result = await acceptInvitationAction('tok-123');
      expect(result).toEqual({
        error: 'Você precisa estar autenticado para aceitar o convite.',
      });
    });

    it('returns error when organization already reached 3 members at accept time', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-novo', email: 'novo@teste.com' } },
      } as any);

      // Find invite
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          {
            id: 'inv-1',
            organizationId: 'org-1',
            status: 'pending',
            expiresAt: new Date(Date.now() + 100000),
          },
        ]),
      } as any);

      // Active members: 3
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: '1' }, { userId: '2' }, { userId: '3' }]),
      } as any);

      const result = await acceptInvitationAction('tok-123');
      expect(result).toEqual({
        error: 'A organização já atingiu o limite máximo de 3 membros.',
      });
    });

    it('marks invite accepted if user is already a member', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-membro', email: 'membro@teste.com' } },
      } as any);

      // Find invite
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          {
            id: 'inv-1',
            organizationId: 'org-1',
            status: 'pending',
            expiresAt: new Date(Date.now() + 100000),
          },
        ]),
      } as any);

      // Active members: 1
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: '1' }]),
      } as any);

      // Existing membership: user-membro is already a member
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([{ userId: 'user-membro' }]),
      } as any);

      const result = await acceptInvitationAction('tok-123');
      expect(result).toEqual({ success: true, alreadyMember: true });
      expect(db.update).toHaveBeenCalledTimes(1);
    });

    it('successfully accepts invitation and links user to organization', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        data: { user: { id: 'user-novo', name: 'Ana', email: 'ana@teste.com' } },
      } as any);

      // Find invite
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([
          {
            id: 'inv-1',
            organizationId: 'org-1',
            status: 'pending',
            role: 'member',
            expiresAt: new Date(Date.now() + 100000),
          },
        ]),
      } as any);

      // Active members: 1
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ userId: '1' }]),
      } as any);

      // Existing membership: None
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      } as any);

      vi.mocked(db.batch).mockResolvedValueOnce([] as any);

      const result = await acceptInvitationAction('tok-123');
      expect(result).toEqual({ success: true });
      expect(db.batch).toHaveBeenCalledTimes(1);
    });
  });
});
