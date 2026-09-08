begin;
select plan(14);

-- 1. Structural checks
select has_table('public', 'campaigns', 'campaigns table should exist');
select results_eq($$ select relrowsecurity from pg_class where relname = 'campaigns' $$, $$ values(true) $$, 'campaigns table should have RLS enforced');
select has_function('public', 'create_campaign_draft', ARRAY['uuid', 'text', 'text', 'text', 'text'], 'create_campaign_draft function should exist');

-- Setup deterministic identities
-- User 1: Owner
insert into auth.users (id, instance_id, aud, role, email) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@test.com');
-- User 2: Foreign Owner
insert into auth.users (id, instance_id, aud, role, email) values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'foreign@test.com');
-- User 3: Member (not owner)
insert into auth.users (id, instance_id, aud, role, email) values ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member@test.com');

-- Setup organizations
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);
select public.create_organization('Owner Org');

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002"}', true);
select public.create_organization('Foreign Org');

-- Demote User 3 to just a member in Owner Org
-- First need to find Owner Org ID
select set_config('role', 'postgres', true);
do $$
declare
  owner_org_id uuid;
begin
  select id into owner_org_id from public.organizations where name = 'Owner Org' limit 1;
  insert into public.organization_members (organization_id, user_id, role) values (owner_org_id, '00000000-0000-0000-0000-000000000003', 'member');
end $$;
select set_config('role', 'authenticated', true);

-- Switch to Owner
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);

-- Test 2: Direct DML Deny
PREPARE insert_direct AS INSERT INTO public.campaigns (id, organization_id, title) VALUES (gen_random_uuid(), gen_random_uuid(), 'Direct Insert');
select throws_ok('insert_direct', 'permission denied for table campaigns', 'Direct insert should be denied by RLS');

-- Test 3: Own Allow
select lives_ok(
  $$select public.create_campaign_draft('11111111-1111-1111-1111-111111111111'::uuid, 'Test Campaign', 'Desc', 'Attr', 'test-slug')$$,
  'Owner can create campaign draft'
);

select is(
  (select count(*) from public.campaigns where title = 'Test Campaign'),
  1::bigint,
  'Campaign was created successfully'
);

-- Test 4: Idempotency (repeat token)
select lives_ok(
  $$select public.create_campaign_draft('11111111-1111-1111-1111-111111111111'::uuid, 'Test Campaign', 'Desc', 'Attr', 'test-slug')$$,
  'Repeating the same token works'
);

select is(
  (select count(*) from public.campaigns where title = 'Test Campaign'),
  1::bigint,
  'No second row created for the same token'
);

-- Test 5: Empty input rollback
select throws_ok(
  $$select public.create_campaign_draft('22222222-2222-2222-2222-222222222222'::uuid, '', 'Desc', 'Attr', 'slug-2')$$,
  'new row for relation "campaigns" violates check constraint "campaigns_title_check"',
  'Empty title should be rejected'
);

-- Test 6: Slug collision fails with generic error (different token)
select throws_ok(
  $$select public.create_campaign_draft('33333333-3333-3333-3333-333333333333'::uuid, 'Another Campaign', 'Desc', 'Attr', 'test-slug')$$,
  'duplicate key value violates unique constraint "campaigns_slug_key"',
  'Slug collision across different tokens must fail'
);

-- Test 7: Foreign Owner Deny (can't see or collide if slug is same? wait, slug is global unique)
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002"}', true);

-- Let's test they can create their own, but CANNOT read the first owner's campaign.
select lives_ok(
  $$select public.create_campaign_draft('44444444-4444-4444-4444-444444444444'::uuid, 'Foreign Campaign', 'Desc', 'Attr', 'foreign-slug')$$,
  'Foreign owner can create their own campaign draft'
);

select is(
  (select count(*) from public.campaigns where title = 'Test Campaign'),
  0::bigint,
  'Foreign owner cannot see the other owner''s campaign'
);

-- Test 8: Member Deny
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000003"}', true);

select throws_ok(
  $$select public.create_campaign_draft('55555555-5555-5555-5555-555555555555'::uuid, 'Member Campaign', 'Desc', 'Attr', 'member-slug')$$,
  'No owned organization found',
  'Member should not be able to create a campaign if they are not an owner'
);

-- Test 9: Anonymous Deny
select set_config('role', 'anon', true);
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$select public.create_campaign_draft('66666666-6666-6666-6666-666666666666'::uuid, 'Anon Campaign', 'Desc', 'Attr', 'anon-slug')$$,
  'Not authenticated',
  'Anonymous user should not be able to create a campaign'
);

select * from finish();
rollback;
