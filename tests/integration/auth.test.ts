import test from 'node:test';
import assert from 'node:assert';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test('auth flow (signup, signin, logout)', async (t) => {
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

  assert.strictEqual(signUpError, null, 'Sign up should succeed');
  assert.ok(signUpData.user, 'User should be created');
  assert.ok(signUpData.session, 'Session should be created after signup (auto-confirm is on in local)');

  // 2. Sign out
  const { error: signOutError } = await client.auth.signOut();
  assert.strictEqual(signOutError, null, 'Sign out should succeed');

  const { data: sessionDataAfterOut } = await client.auth.getSession();
  assert.strictEqual(sessionDataAfterOut.session, null, 'Session should be null after sign out');

  // 3. Sign in
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  assert.strictEqual(signInError, null, 'Sign in should succeed');
  assert.ok(signInData.session, 'Session should be returned after sign in');
  assert.strictEqual(signInData.user?.email, email, 'Email should match');
});
