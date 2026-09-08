# Phase 02: Organizer Campaign Management - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 13 planned new or modified files
**Analogs found:** 10 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/<timestamp>_campaign_management.sql` | migration | CRUD / event-driven | `supabase/migrations/202608300001_account_ownership.sql` | role-match |
| `src/types/database.types.ts` | model | transform | None | no analog |
| `src/lib/campaigns/validation.ts` | utility | transform | `src/lib/organizations/validation.ts` | exact |
| `src/lib/campaigns/actions.ts` | service | request-response / CRUD | `src/lib/organizations/actions.ts` | exact |
| `src/lib/campaigns/queries.ts` | service | request-response | `src/app/espaco/page.tsx` | partial |
| `src/app/espaco/page.tsx` | page/component | request-response | `src/app/espaco/page.tsx` | exact modification target |
| `src/app/espaco/campanhas/nova/page.tsx` | page/component | request-response | `src/app/setup/page.tsx` | role-match |
| `src/app/espaco/campanhas/[campaignId]/page.tsx` | page/component | request-response | `src/app/setup/page.tsx` | role-match |
| `src/components/campaigns/campaign-wizard.tsx` | component | request-response / CRUD | `src/app/setup/setup-form.tsx` | partial |
| `src/components/campaigns/campaign-card.tsx` | component | transform | `src/components/ui/card.tsx` | role-match |
| `src/components/campaigns/item-form.tsx` | component | request-response / CRUD | `src/app/setup/setup-form.tsx` | partial |
| `tests/unit/campaign-validation.test.ts` | test | transform | `tests/unit/validation.test.ts` | exact |
| `supabase/tests/database/02_campaign_management.test.sql` | test | CRUD / event-driven | `supabase/tests/database/01_account_ownership.test.sql` | role-match |
| `package.json` | config | batch | `package.json` | exact modification target |

`src/components/campaigns/item-list.tsx` and `src/components/campaigns/lifecycle-controls.tsx`, if split from the wizard/detail screen, should use the same component analogs as `item-form.tsx` and `campaign-wizard.tsx` respectively.

## Pattern Assignments

### `supabase/migrations/<timestamp>_campaign_management.sql` (migration, CRUD / event-driven)

**Analog:** `supabase/migrations/202608300001_account_ownership.sql`

**Schema and tenant-reference pattern** (lines 1-16):
```sql
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
```

**RLS and owner helper pattern** (lines 18-44):
```sql
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

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

create policy "Users can view their own organizations"
  on public.organizations
  for select
  using (public.is_member_of(id));
```

**Database command pattern** (lines 46-65):
```sql
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
```

Apply this migration structure to `campaigns`, `campaign_items`, and `campaign_audit_events`; add dedicated database functions for every allow-listed mutation, RLS owner reads, restricted grants, and trigger-owned audit inserts. The existing helper is membership-level, while Phase 2 must additionally restrict mutations to `role = 'owner'`; the closest file has no such role gate, lifecycle transition, or audit-trigger analog.

---

### `src/lib/campaigns/validation.ts` (utility, transform)

**Analog:** `src/lib/organizations/validation.ts`

**Zod import and named-schema pattern** (lines 1-5):
```typescript
import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(1, 'Informe o nome da sua organização.').max(120, 'Nome muito longo.')
})
```

Use exported Zod schemas for draft content, mutable campaign content, item create/edit, typed PIX key input, and lifecycle command input. Keep CPF/CNPJ checksum and PIX canonicalization as pure exported helpers alongside the schemas so the unit test can import them directly. Do not put client organization IDs, status fields, confirmed quantity, or immutable slug/id fields in editable schemas.

---

### `src/lib/campaigns/actions.ts` (service, request-response / CRUD)

**Analog:** `src/lib/organizations/actions.ts`

**Server Action validation and field-error contract** (lines 1-17):
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { organizationSchema } from './validation'

export async function createOrganization(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const result = organizationSchema.safeParse(data)
  
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      formData: { name: data.name?.toString() }
    }
  }
```

**Supabase RPC and failure result pattern** (lines 19-29):
```typescript
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_organization', { input_name: result.data.name })

  if (error) {
    return { 
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      formData: { name: data.name?.toString() }
    }
  }

  redirect('/espaco')
}
```

Every campaign action must call `requireUser()` before parsing or calling an RPC, invoke one specific owner-scoped RPC, and revalidate `/espaco` and the affected campaign detail path after a successful mutation. Draft creation alone redirects to `/espaco/campanhas/${campaignId}`. Preserve the returned `{ errors, message, formData }` shape for `useActionState`; do not throw database errors into the form UI.

**Authentication source:** `src/lib/auth/require-user.ts` (lines 1-12):
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/entrar')
  }
  
  return user
}
```

---

### `src/lib/campaigns/queries.ts` (service, request-response)

**Analog:** `src/app/espaco/page.tsx`

**Authenticated owner-scoped query pattern** (lines 10-34):
```typescript
export default async function WorkspacePage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: memberData } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!memberData) {
    redirect('/setup')
  }

  const { data: orgData } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', memberData.organization_id)
    .single()
```

Extract the membership lookup and campaign/item/audit DTO selection into narrow query functions. Pages should call `requireUser()` then those queries. Do not accept an organization ID from page parameters or forms; a detail query may accept only a campaign UUID and must rely on RPC/RLS owner scoping to reject foreign IDs.

---

### `src/app/espaco/page.tsx` (page/component, request-response)

**Analog:** current `src/app/espaco/page.tsx`

**Protected page and redirect guard** (lines 10-34):
```typescript
const user = await requireUser()
const supabase = await createClient()

const { data: memberData } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .limit(1)
  .single()

if (!memberData) {
  redirect('/setup')
}
```

**Existing workspace shell and reusable UI imports** (lines 1-8, 39-75):
```typescript
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

return (
  <div className="min-h-screen bg-muted">
    <header className="h-[64px] border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-md md:px-xl">
```

Replace only the current private-workspace body with an owner-scoped campaign card grid and empty state. Retain the authenticated header/account menu unless a shared workspace layout is intentionally introduced in the plan.

---

### `src/app/espaco/campanhas/nova/page.tsx` and `src/app/espaco/campanhas/[campaignId]/page.tsx` (page/component, request-response)

**Analog:** `src/app/setup/page.tsx`

**Protected Server Component with client form composition** (lines 1-10, 23-37):
```typescript
import { requireUser } from '@/lib/auth/require-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupForm } from './setup-form'

export default async function SetupPage() {
  const user = await requireUser()
  const supabase = await createClient()
  // ... server guard/query
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-[420px]">
        <CardHeader>{/* title and description */}</CardHeader>
        <CardContent><SetupForm /></CardContent>
      </Card>
    </div>
  )
}
```

Keep these routes as Server Components: validate authentication/membership and obtain owner-scoped DTOs before rendering client wizard or controls. The new campaign page has no existing multi-step analog, so it must add local step state around this server/client boundary; it must persist a draft at step 1 rather than relying on route-local state.

---

### `src/components/campaigns/campaign-wizard.tsx` and `src/components/campaigns/item-form.tsx` (component, request-response / CRUD)

**Analog:** `src/app/setup/setup-form.tsx`

**Client component, `useActionState`, and accessible field error pattern** (lines 1-11, 14-39):
```tsx
'use client'

import { createOrganization } from '@/lib/organizations/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionState } from 'react'

export function SetupForm() {
  const [state, formAction, pending] = useActionState(createOrganization, null)

  return (
    <form action={formAction} className="space-y-lg">
      <div className="space-y-sm">
        <Label htmlFor="name">Nome da organização</Label>
        <Input id="name" name="name" defaultValue={state?.formData?.name}
          aria-invalid={!!state?.errors?.name} />
        {state?.errors?.name && (
          <p className="text-sm font-medium text-destructive">
            {state.errors.name[0]}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} aria-busy={pending}>...</Button>
    </form>
  )
}
```

Use a client component only for step selection, dialog interaction, and `useActionState` pending/error feedback. Bind the campaign ID only after the durable draft exists, and submit each item/PIX/lifecycle command to its dedicated action. Follow this error-state contract, but use the UI-spec error copy: `Failed to save changes. Please try again.`

---

### `src/components/campaigns/campaign-card.tsx` (component, transform)

**Analog:** `src/components/ui/card.tsx`

**Card composition slots** (lines 4-18, 22-31, 71-90):
```tsx
function Card({ className, size = "default", ...props }) {
  return <div data-slot="card" data-size={size} className={cn(
    "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10",
    className
  )} {...props} />
}

function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn(
    "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing)", className
  )} {...props} />
}
```

Compose campaign cards from the existing `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and optional `CardAction` exports. Display title, status, and small summary; preserve stable card layout rather than adding a custom floating section surface.

---

### `tests/unit/campaign-validation.test.ts` (test, transform)

**Analog:** `tests/unit/validation.test.ts`

**Node test runner and direct-schema assertions** (lines 1-22):
```typescript
import test from 'node:test'
import assert from 'node:assert'
import { organizationSchema } from '../../src/lib/organizations/validation.ts'

test('organizationSchema validates correctly', () => {
  assert.strictEqual(organizationSchema.safeParse({ name: 'My Org' }).success, true)
  assert.strictEqual(organizationSchema.safeParse({ name: '' }).success, false)
  assert.strictEqual(organizationSchema.safeParse({ name: 'a'.repeat(121) }).success, false)
})
```

Add compact positive/negative tests for campaign slug/content, quantities, centavos, each selected PIX type and checksum/canonicalization helper, and lifecycle transition helper. Keep database authorization/audit expectations in the database suite, not this unit file.

---

### `supabase/tests/database/02_campaign_management.test.sql` (test, CRUD / event-driven)

**Analog:** `supabase/tests/database/01_account_ownership.test.sql`

**Transactional pgTAP structure** (lines 1-24, 39-40):
```sql
begin;
select plan(7);

select has_table('public', 'organizations', 'organizations table should exist');
select row_security_is_enforced('public', 'organizations', 'organizations table should have RLS enforced');
select has_function('public', 'create_organization', ARRAY['text'], 'create_organization function should exist');

insert into auth.users (id, instance_id, aud, role, email)
values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@test.com');

select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);

select public.create_organization('Test Org');

select * from finish();
rollback;
```

Create owner and non-owner users, establish their organizations/membership, then test table presence/RLS, allowed owner RPC commands, foreign-owner denial, direct-DML denial, immutable identity/audit behavior, allowed and rejected lifecycle transitions, PIX/status audit events, and item edit rejection after `confirmed_quantity > 0`. Update `plan(...)` to match actual assertions.

---

### `src/types/database.types.ts` (model, transform)

**Analog:** None.

This file is generated mechanical output from the applied Supabase schema, not hand-authored domain code. Plan it after the Phase 2 migration and use the project-local Supabase CLI's type-generation command. No generated database types currently exist in `src/`, so there is no local code excerpt to copy.

### `package.json` (config, batch)

**Analog:** current `package.json`

**Verification script composition** (lines 9-20):
```json
"lint": "next lint",
"typecheck": "tsc --noEmit",
"test:unit": "node --experimental-strip-types --test tests/unit/**/*.test.ts",
"verify:skeleton": "pnpm lint && pnpm typecheck && pnpm verify:db",
"verify:phase": "pnpm verify:skeleton && pnpm verify:unit && pnpm verify:app"
```

Change only the deprecated/broken `lint` command to the explicit ESLint CLI supported by the existing `eslint.config.mjs`; preserve the existing verification dependency chain.

## Shared Patterns

### Authentication and tenant derivation

**Sources:** `src/lib/auth/require-user.ts` lines 1-12; `src/app/espaco/page.tsx` lines 10-24
**Apply to:** all campaign Server Actions and protected campaign pages

```typescript
const user = await requireUser()
const supabase = await createClient()

const { data: memberData } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .limit(1)
  .single()

if (!memberData) redirect('/setup')
```

Server Actions must never trust an organization ID/role submitted through `FormData`; database functions must independently enforce owner membership.

### Validation and action feedback

**Source:** `src/lib/organizations/actions.ts` lines 7-17
**Apply to:** all browser-submitted campaign/item/PIX/lifecycle commands

```typescript
const data = Object.fromEntries(formData.entries())
const result = schema.safeParse(data)

if (!result.success) {
  return {
    errors: result.error.flatten().fieldErrors,
    message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
    formData: { /* only safe, editable inputs */ }
  }
}
```

### Database authorization and atomic audit

**Source:** `supabase/migrations/202608300001_account_ownership.sql` lines 18-65
**Apply to:** all campaign tables and mutation paths

Enable RLS, use scoped SQL functions for commands, and let the database derive `auth.uid()`. Phase 2 adds the missing strict pieces: owner-role checks, revoked direct mutations, campaign status checks, and an append-only trigger-written audit table. The raw PIX key must never be copied into audit metadata.

### Server/client component boundary

**Sources:** `src/app/setup/page.tsx` lines 1-37; `src/app/setup/setup-form.tsx` lines 1-40
**Apply to:** campaign dashboard, new campaign route, and detail route

Fetch protected DTOs in async Server Components. Use client components only for wizard step state, forms, dialogs, and pending/error feedback through `useActionState`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/types/database.types.ts` | model | transform | No generated Supabase database types exist yet. |
| `src/lib/campaigns/queries.ts` | service | request-response | No existing domain query module; only inline page queries exist. |
| `src/components/campaigns/campaign-wizard.tsx` | component | request-response / CRUD | No multi-step durable-wizard or dialog implementation exists. |

## Metadata

**Analog search scope:** `src/app`, `src/components/ui`, `src/lib`, `supabase/migrations`, `supabase/tests/database`, `tests/unit`, `package.json`
**Files scanned:** 21
**Pattern extraction date:** 2026-09-07
