import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pledgeDonationAction } from './actions';
import { db } from '@/db';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('pledgeDonationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error if validation fails', async () => {
    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: '',
      quantity: 0,
    });

    expect(result).toEqual({ error: 'Dados inválidos' });
  });

  it('should return error if item has insufficient quantity or not found', async () => {
    const mockWhere = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as unknown as ReturnType<typeof db.update>);

    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: 'item-1',
      quantity: 2,
    });

    expect(result).toEqual({ error: 'Quantidade indisponível ou item não encontrado' });
  });

  it('should successfully record donation and update item quantity', async () => {
    const mockWhere = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'item-1' }]),
    });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as unknown as ReturnType<typeof db.update>);

    const mockValues = vi.fn().mockResolvedValue([{}]);
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as unknown as ReturnType<typeof db.insert>);

    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: 'item-1',
      quantity: 2,
      donorName: 'Maria',
      donorPhone: '11999999999',
      message: 'Boa sorte!',
    });

    expect(result).toEqual({ success: true });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/campaigns/camp-1');
  });

  it('should rollback quantity decrement if donation insert fails', async () => {
    const mockWhere = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'item-1' }]),
    });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as unknown as ReturnType<typeof db.update>);

    const mockValues = vi.fn().mockRejectedValue(new Error('Insert failed'));
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as unknown as ReturnType<typeof db.insert>);

    const result = await pledgeDonationAction('camp-1', {
      campaignItemId: 'item-1',
      quantity: 2,
    });

    expect(result).toEqual({ error: 'Insert failed' });
    // Verify rollback update was called
    expect(db.update).toHaveBeenCalledTimes(2);
  });
});
