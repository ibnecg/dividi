import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCampaignAction, updateCampaignAction, toggleCampaignStatusAction } from './actions';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

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
    batch: vi.fn(),
    select: vi.fn(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-campaign-id' }]),
        onConflictDoNothing: vi.fn().mockResolvedValue({}),
      }),
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

describe('Campaign Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCampaignAction', () => {
    it('should return error if user is not authenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const result = await createCampaignAction({
        name: 'Test',
        description: 'Valid description with more than 10 chars',
        pixKey: 'key',
        items: [],
      });

      expect(result).toEqual({ error: 'Usuário não autenticado' });
    });

    it('should return error if data is invalid', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const result = await createCampaignAction({
        name: 'Te', // Too short
        description: 'Valid description',
        pixKey: 'key',
        items: [],
      });

      expect(result).toEqual({ error: 'Dados inválidos' });
    });

    it('should save campaign and redirect on success', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      vi.mocked(db.batch).mockResolvedValueOnce([{}]);

      try {
        await createCampaignAction({
          name: 'Valid Name',
          description: 'Valid description with enough characters',
          pixKey: 'valid-pix',
          items: [{ description: 'Item 1', amount: 10, quantity: 1 }],
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          expect(e.message).toBe('NEXT_REDIRECT');
        }
      }

      expect(db.batch).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/campaigns');
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns');
      expect(redirect).toHaveBeenCalledWith('/dashboard/campaigns');
    });
  });

  describe('updateCampaignAction', () => {
    it('should return error if user is not authenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const result = await updateCampaignAction('camp-1', {
        name: 'Updated Name',
        description: 'Valid description with more than 10 chars',
        pixKey: 'pix-key-123',
        items: [],
      });

      expect(result).toEqual({ error: 'Usuário não autenticado' });
    });

    it('should return error if campaign is not found', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const mockLimit = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

      const result = await updateCampaignAction('camp-1', {
        name: 'Updated Name',
        description: 'Valid description with more than 10 chars',
        pixKey: 'pix-key-123',
        items: [],
      });

      expect(result).toEqual({ error: 'Campanha não encontrada' });
    });

    it('should return error if user is not the owner', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const mockLimit = vi.fn().mockResolvedValueOnce([{ id: 'camp-1', userId: 'other-user' }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

      const result = await updateCampaignAction('camp-1', {
        name: 'Updated Name',
        description: 'Valid description with more than 10 chars',
        pixKey: 'pix-key-123',
        items: [],
      });

      expect(result).toEqual({ error: 'Você não tem permissão para editar esta campanha' });
    });

    it('should return error if validation fails', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const mockLimit = vi.fn().mockResolvedValueOnce([{ id: 'camp-1', userId: 'user-id' }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

      const result = await updateCampaignAction('camp-1', {
        name: 'ab', // Invalid: min 3 chars
        description: 'short',
        pixKey: 'key',
        items: [],
      });

      expect(result).toEqual({ error: 'Dados inválidos' });
    });

    it('should update campaign and items, revalidate paths, and redirect on success', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      // First select: campaign query
      const mockCampaignLimit = vi.fn().mockResolvedValueOnce([{ id: 'camp-1', userId: 'user-id' }]);
      const mockCampaignWhere = vi.fn().mockReturnValue({ limit: mockCampaignLimit });
      
      // Second select: current items query
      const mockItemsWhere = vi.fn().mockResolvedValueOnce([
        { id: 'item-1', description: 'Item 1', amount: '10', quantity: 1 },
        { id: 'item-2', description: 'Item 2', amount: '20', quantity: 2 },
      ]);

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ where: mockCampaignWhere })
        .mockReturnValueOnce({ where: mockItemsWhere });

      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);
      vi.mocked(db.batch).mockResolvedValueOnce([{}]);

      try {
        await updateCampaignAction('camp-1', {
          name: 'Updated Name',
          description: 'Updated description with plenty of characters',
          pixKey: 'pix-12345',
          items: [
            { id: 'item-1', description: 'Item 1 Updated', amount: 15, quantity: 2 },
            { description: 'Item 3 New', amount: 30, quantity: 1 },
          ],
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          expect(e.message).toBe('NEXT_REDIRECT');
        }
      }

      expect(db.batch).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/campaigns');
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns');
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns/camp-1');
      expect(redirect).toHaveBeenCalledWith('/dashboard/campaigns');
    });
  });

  describe('toggleCampaignStatusAction', () => {
    it('should return error if user is not authenticated', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const result = await toggleCampaignStatusAction('camp-1');
      expect(result).toEqual({ error: 'Usuário não autenticado' });
    });

    it('should return error if campaign not found', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const mockLimit = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

      const result = await toggleCampaignStatusAction('camp-1');
      expect(result).toEqual({ error: 'Campanha não encontrada' });
    });

    it('should return error if user is not owner', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const mockLimit = vi.fn().mockResolvedValueOnce([{ id: 'camp-1', userId: 'another-user', isActive: true }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

      const result = await toggleCampaignStatusAction('camp-1');
      expect(result).toEqual({ error: 'Você não tem permissão para alterar esta campanha' });
    });

    it('should toggle status to false when currently true', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const mockLimit = vi.fn().mockResolvedValueOnce([{ id: 'camp-1', userId: 'user-id', isActive: true }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

      const mockUpdateWhere = vi.fn().mockResolvedValueOnce({});
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockUpdateSet } as unknown as ReturnType<typeof db.update>);

      const result = await toggleCampaignStatusAction('camp-1');

      expect(result).toEqual({ success: true, isActive: false });
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/campaigns');
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns');
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns/camp-1');
    });

    it('should set specified status when passed explicitly', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({ 
        data: { user: { id: 'user-id' } } 
      } as unknown as Awaited<ReturnType<typeof auth.getSession>>);

      const mockLimit = vi.fn().mockResolvedValueOnce([{ id: 'camp-1', userId: 'user-id', isActive: false }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

      const mockUpdateWhere = vi.fn().mockResolvedValueOnce({});
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockUpdateSet } as unknown as ReturnType<typeof db.update>);

      const result = await toggleCampaignStatusAction('camp-1', true);

      expect(result).toEqual({ success: true, isActive: true });
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });
});

