/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLocalUserAndOrganization } from './actions';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    batch: vi.fn(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn(),
      }),
    }),
  },
}));

describe('createLocalUserAndOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error if user already exists locally', async () => {
    vi.mocked((db as any).limit).mockResolvedValueOnce([{ id: 'existing-id', name: 'Existing User' }] as any);

    const result = await createLocalUserAndOrganization(
      'existing-id',
      'Existing User',
      'existing@example.com',
      'Existing Org'
    );

    expect(result).toEqual({ error: 'O usuário já possui registros locais.' });
    expect(db.batch).not.toHaveBeenCalled();
  });

  it('creates user, organization, and organization member in batch', async () => {
    vi.mocked((db as any).limit).mockResolvedValueOnce([] as any);
    vi.mocked(db.batch).mockResolvedValueOnce([] as any);

    const result = await createLocalUserAndOrganization(
      'new-user-id',
      'Novo Usuario',
      'novo@example.com',
      'Nova Org'
    );

    expect(result).toEqual({ success: true });
    expect(db.batch).toHaveBeenCalledTimes(1);
  });

  it('returns friendly error if database batch fails', async () => {
    vi.mocked((db as any).limit).mockResolvedValueOnce([] as any);
    vi.mocked(db.batch).mockRejectedValueOnce(new Error('Connection error'));

    const result = await createLocalUserAndOrganization(
      'new-user-id',
      'Novo Usuario',
      'novo@example.com',
      'Nova Org'
    );

    expect(result).toEqual({
      error: 'Erro ao criar registros no banco de dados. A transação falhou.',
    });
  });
});
