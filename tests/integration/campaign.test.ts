import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

test('campaign flow (create draft, isolation)', async () => {
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
  const { data: orgId, error: createOrgError } = await client1.rpc('create_organization', {
    input_name: orgName,
  });

  expect(createOrgError).toBeNull()
  expect(orgId).toBeDefined()

  // 3. User 1 creates a campaign draft using RPC
  const { data: campaignData, error: createCampaignError } = await client1.rpc('create_campaign_draft', {
    input_title: 'My First Campaign',
    input_description: 'This is a test campaign',
    input_attribution: orgId, // Linking to the created org
    input_slug: `my-first-campaign-${crypto.randomUUID().slice(0, 8)}`,
    input_creation_token: crypto.randomUUID(),
  });

  expect(createCampaignError).toBeNull()
  expect(campaignData?.id).toBeDefined()
  const campaignId = campaignData.id;

  // 4. User 1 can fetch their campaign
  const { data: fetchCampaign1, error: fetchError1 } = await client1
    .from('campaigns')
    .select('*')
    .eq('id', campaignId);

  expect(fetchError1).toBeNull()
  expect(fetchCampaign1?.length).toBe(1)
  expect(fetchCampaign1?.[0].title).toBe('My First Campaign')

  // 5. User 2 cannot fetch User 1's campaign
  const { data: fetchCampaign2, error: fetchError2 } = await client2
    .from('campaigns')
    .select('*')
    .eq('id', campaignId);

  expect(fetchError2).toBeNull()
  expect(fetchCampaign2?.length).toBe(0) // RLS hides it
});
