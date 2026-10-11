/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserOrganizationName } from './actions';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

describe('getUserOrganizationName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "Organização" if there is no authenticated session', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as any);

    const result = await getUserOrganizationName();
    expect(result).toBe('Organização');
  });

  it('returns the organization name when user belongs to an organization', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    vi.mocked((db as any).limit).mockResolvedValueOnce([{ orgName: 'ONG Esperança' }] as any);

    const result = await getUserOrganizationName();
    expect(result).toBe('ONG Esperança');
  });

  it('returns fallback "Organização" when member array is empty', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    vi.mocked((db as any).limit).mockResolvedValueOnce([] as any);

    const result = await getUserOrganizationName();
    expect(result).toBe('Organização');
  });

  it('catches database error and returns fallback "Organização"', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    vi.mocked((db as any).limit).mockRejectedValueOnce(new Error('DB failure'));

    const result = await getUserOrganizationName();
    expect(result).toBe('Organização');
  });
});
