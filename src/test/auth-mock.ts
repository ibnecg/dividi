import { vi } from 'vitest';

export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  emailVerified: true,
};

export const mockSession = {
  id: 'test-session-id',
  userId: mockUser.id,
  token: 'mock-session-token',
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  createdAt: new Date(),
  updatedAt: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent'
};

export const createAuthMock = () => {
  return {
    getSession: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
    }),
  };
};

export const createAuthClientMock = () => {
  return {
    useSession: vi.fn().mockReturnValue({
      data: { user: mockUser, session: mockSession },
      isPending: false,
    }),
    signIn: {
      email: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
    },
    signUp: {
      email: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
    },
    signOut: vi.fn().mockResolvedValue({}),
  };
};
