import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

test('organization flow (create, isolation)', async () => {
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

  expect(createError).toBeNull()
  const orgId = createData;
  expect(orgId).toBeDefined()

  // 3. User 1 can fetch their organization
  const { data: fetchOrg1, error: fetchError1 } = await client1
    .from('organizations')
    .select('*')
    .eq('id', orgId);

  expect(fetchError1).toBeNull()
  expect(fetchOrg1?.length).toBe(1)

  // 4. User 2 cannot fetch User 1's organization
  const { data: fetchOrg2, error: fetchError2 } = await client2
    .from('organizations')
    .select('*')
    .eq('id', orgId);

  expect(fetchError2).toBeNull()
  expect(fetchOrg2?.length).toBe(0)
})
