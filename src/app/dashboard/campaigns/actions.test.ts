import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCampaignAction } from './actions';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@/db', () => ({
  db: {
    batch: vi.fn(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-campaign-id' }]),
        onConflictDoNothing: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

describe('createCampaignAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      // Catch redirect which throws in Next.js
      if (e instanceof Error) {
        expect(e.message).toBe('NEXT_REDIRECT');
      }
    }

    expect(db.batch).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/campaigns');
    expect(redirect).toHaveBeenCalledWith('/dashboard/campaigns');
  });
});
