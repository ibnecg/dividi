import { createAuthClient } from '@neondatabase/neon-js/auth';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const authClient = createAuthClient(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
  adapter: BetterAuthReactAdapter(),
});
