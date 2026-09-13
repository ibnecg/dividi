import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'http://localhost:3000/api/auth',
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET || 'fallback_secret_must_be_at_least_32_characters' },
});
