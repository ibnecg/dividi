import { createAuthClient } from '@neondatabase/neon-js/auth';

export const authClient = createAuthClient(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
