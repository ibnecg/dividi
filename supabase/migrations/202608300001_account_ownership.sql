create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

-- RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Function to check membership
create or replace function public.is_member_of(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Policies for organizations
create policy "Users can view their own organizations"
  on public.organizations
  for select
  using (public.is_member_of(id));

-- Policies for organization_members
create policy "Users can view members of their organizations"
  on public.organization_members
  for select
  using (public.is_member_of(organization_id));

-- Bootstrap RPC
create or replace function public.create_organization(input_name text)
returns uuid as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations (name)
  values (input_name)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$ language plpgsql security definer;
