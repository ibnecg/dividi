import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pledgeDonationAction } from './actions';
import { db } from '@/db';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe('pledgeDonationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error if validation fails', async () => {
    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: '',
      donationType: 'pix',
      quantity: 0,
    });

    expect(result).toEqual({ error: 'Dados inválidos' });
  });

  it('should return error if item has insufficient quantity or not found', async () => {
    vi.mocked(db.execute)
      .mockResolvedValueOnce({ rows: [] } as any) // for expireOverdueDonations
      .mockResolvedValueOnce({ rows: [] } as any); // for pledgeDonation

    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: 'item-1',
      donationType: 'pix',
      quantity: 2,
    });

    expect(result).toEqual({ error: 'Quantidade indisponível ou item não encontrado' });
  });

  it('should successfully record donation', async () => {
    vi.mocked(db.execute)
      .mockResolvedValueOnce({ rows: [] } as any) // for expireOverdueDonations
      .mockResolvedValueOnce({ rows: [{ id: 'donation-1', status: 'pending', expires_at: new Date() }] } as any); // for pledgeDonation

    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: 'item-1',
      donationType: 'pix',
      quantity: 2,
      donorName: 'Maria',
      donorPhone: '11999999999',
      message: 'Boa sorte!',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('pending');
    expect(db.execute).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/campaigns/camp-1');
  });

  it('should handle insertion failure', async () => {
    vi.mocked(db.execute)
      .mockResolvedValueOnce({ rows: [] } as any) // for expireOverdueDonations
      .mockRejectedValueOnce(new Error('Insert failed')); // for pledgeDonation

    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: 'item-1',
      donationType: 'pix',
      quantity: 2,
    });

    expect(result).toEqual({ error: 'Falha ao processar doação' });
  });
});
