import test from 'node:test';
import assert from 'node:assert';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

test('organization flow (create, isolation)', async (t) => {
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Setup two users
  const email1 = `user1-${crypto.randomUUID()}@example.com`;
  const email2 = `user2-${crypto.randomUUID()}@example.com`;
  const password = 'securepassword123';

  await client1.auth.signUp({ email: email1, password });
  await client2.auth.signUp({ email: email2, password });

  // 2. User 1 creates an organization
  const orgName = `Org ${crypto.randomUUID()}`;
  const { data: createData, error: createError } = await client1.rpc('create_organization', {
    input_name: orgName,
  });

  assert.strictEqual(createError, null, 'User 1 should be able to create organization');
  const orgId = createData;
  assert.ok(orgId, 'Organization ID should be returned');

  // 3. User 1 can fetch their organization
  const { data: fetchOrg1, error: fetchError1 } = await client1
    .from('organizations')
    .select('*')
    .eq('id', orgId);

  assert.strictEqual(fetchError1, null, 'User 1 fetching organization should not error');
  assert.strictEqual(fetchOrg1.length, 1, 'User 1 should see the organization');

  // 4. User 2 cannot fetch User 1's organization
  const { data: fetchOrg2, error: fetchError2 } = await client2
    .from('organizations')
    .select('*')
    .eq('id', orgId);

  assert.strictEqual(fetchError2, null, 'User 2 fetching organization should not error (RLS just returns 0 rows)');
  assert.strictEqual(fetchOrg2.length, 0, 'User 2 should NOT see the organization');
});
