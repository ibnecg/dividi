begin;
select plan(7);

-- Table existence
select has_table('public', 'organizations', 'organizations table should exist');
select has_table('public', 'organization_members', 'organization_members table should exist');

-- RLS check
select row_security_is_enforced('public', 'organizations', 'organizations table should have RLS enforced');
select row_security_is_enforced('public', 'organization_members', 'organization_members table should have RLS enforced');

-- Check create_organization RPC
select has_function('public', 'create_organization', ARRAY['text'], 'create_organization function should exist');

-- Test behavior
-- create a mock user
insert into auth.users (id, instance_id, aud, role, email) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@test.com');

-- set auth context
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);

-- Execute RPC
select public.create_organization('Test Org');

-- Verify data
select is(
  (select count(*) from public.organizations),
  1::bigint,
  'one organization should be created'
);

select is(
  (select count(*) from public.organization_members where user_id = '00000000-0000-0000-0000-000000000001'),
  1::bigint,
  'one organization member should be created for the user'
);

select * from finish();
rollback;
