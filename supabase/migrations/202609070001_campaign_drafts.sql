create schema if not exists private;

create or replace function private.is_organization_owner(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and user_id = auth.uid()
    and role = 'owner'
  );
end;
$$ language plpgsql security definer;

-- Trigger for updated_at
create or replace function private.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null,
  attribution text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  creation_token uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(slug),
  unique(organization_id, creation_token)
);

-- RLS
alter table public.campaigns enable row level security;

-- Only owner can read
create policy "Owners can view their campaigns"
  on public.campaigns
  for select
  using (private.is_organization_owner(organization_id));

-- Direct mutation is denied to all (only via RPC)
-- Explicit grants
revoke all on public.campaigns from public, anon, authenticated;
grant select on public.campaigns to authenticated;
grant insert, update, delete on public.campaigns to service_role;
grant usage on schema public to anon, authenticated;

-- trigger
create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row
  execute function private.set_updated_at();

-- RPC
create or replace function public.create_campaign_draft(
  input_creation_token uuid,
  input_title text,
  input_description text,
  input_attribution text,
  input_slug text
) returns public.campaigns as $$
declare
  user_org_id uuid;
  existing_campaign public.campaigns;
  new_campaign public.campaigns;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Get sole owned organization
  select organization_id into user_org_id
  from public.organization_members
  where user_id = auth.uid() and role = 'owner'
  limit 1;

  if user_org_id is null then
    raise exception 'No owned organization found';
  end if;

  -- Idempotency check
  select * into existing_campaign
  from public.campaigns
  where organization_id = user_org_id and creation_token = input_creation_token
  limit 1;

  if found then
    return existing_campaign;
  end if;

  insert into public.campaigns (
    organization_id,
    title,
    description,
    attribution,
    slug,
    status,
    creation_token
  ) values (
    user_org_id,
    trim(input_title),
    trim(input_description),
    trim(input_attribution),
    input_slug,
    'draft',
    input_creation_token
  ) returning * into new_campaign;

  return new_campaign;
end;
$$ language plpgsql security definer set search_path = '';
