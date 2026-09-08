import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test('auth flow (signup, signin, logout)', async () => {
  const email = `test-${crypto.randomUUID()}@example.com`;
  const password = 'securepassword123';
  const name = 'Integration Test User';

  // 1. Sign up
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  expect(signUpError).toBeNull()
  expect(signUpData.user).toBeDefined()
  expect(signUpData.session).toBeDefined()

  // 2. Sign out
  const { error: signOutError } = await client.auth.signOut();
  expect(signOutError).toBeNull();

  const { data: sessionDataAfterOut } = await client.auth.getSession();
  expect(sessionDataAfterOut.session).toBeNull();

  // 3. Sign in
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  expect(signInError).toBeNull()
  expect(signInData.user).toBeDefined()
  expect(signInData.session).toBeDefined()
  expect(signInData.user?.email).toBe(email)
})
