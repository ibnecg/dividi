# Phase 1: Account Ownership and Tenancy - Research

**Researched:** 2026-08-30
**Domain:** Next.js App Router authentication, Supabase SSR sessions, Postgres row-level tenancy
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** New owners must verify their email address before entering the private admin workspace.
- **D-02:** The signup form collects email, password, and owner name. Organization details are collected after email verification.
- **D-03:** After successful signup, the app shows a verify-email screen with guidance and recovery actions such as resend/sign-in options.
- **D-04:** Phase 1 includes password reset as the only authentication recovery flow. Email change, MFA, and advanced account recovery are deferred.
- **D-05:** A verified signed-in user must create their first organization before entering the admin workspace.
- **D-06:** Phase 1 organization setup collects organization name only. Public display name, contact email, PIX details, and profile metadata are deferred to later campaign/admin phases.
- **D-07:** Phase 1 supports one organization per owner in the product UI. Future multi-organization support is a separate capability.
- **D-08:** After creating the organization, the owner lands on the admin home.
- **D-09:** The protected admin home is a minimal workspace shell showing the organization name, owner identity, and only the private controls that work in phase 1.
- **D-10:** Navigation exposes only working routes in phase 1. Do not add disabled or coming-soon campaign/items/donations pages yet.
- **D-11:** Logout lives in an account menu that shows the owner name/email in the admin header.
- **D-12:** An authenticated user without an organization is redirected to the forced organization setup page.
- **D-13:** When a signed-in owner tries to access an organization they do not own, the product should present a not-found result rather than a forbidden message or ownership leak.
- **D-14:** Tenant ownership source of truth is an `organization_members` table with an owner role, even though v1 has only one owner. Direct owner-only columns should not be the primary authorization model. -- **Reversibility:** costly -- Changing this later would require schema and RLS policy migration across every tenant-owned table.
- **D-15:** Supabase RLS policies should return no rows for non-owned organization data, letting the app show not-found or empty states rather than surfacing cross-tenant access details.
- **D-16:** Phase 1 must include explicit RLS allow/deny tests proving an owner can access their own organization and cannot access another owner's organization.

### the agent's Discretion
- Standard copy, form layout, validation wording, and exact route names are open to the planner as long as they preserve the decisions above and the project stack constraints.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create an account with email and password. | Email/password SSR signup, allowed confirmation redirect, verify-email state, and server validation. [CITED: https://supabase.com/docs/guides/auth/passwords] |
| AUTH-02 | User can log in and stay authenticated across browser refreshes. | `@supabase/ssr` browser/server clients, PKCE cookie session, and request-boundary refresh. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager] |
| AUTH-03 | User can log out from the admin experience. | Authenticated server action calls `signOut`, then redirects to public sign-in. [CITED: https://supabase.com/docs/guides/auth/passwords] |
| AUTH-04 | User can create an organization after signing in. | A validated, authenticated RPC creates the organization and owner membership atomically. [CITED: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language] |
| AUTH-05 | User can access only organizations and campaigns that they own. | Membership-backed RLS, no direct tenant-table writes, not-found route behavior, and pgTAP allow/deny tests. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Deploy as a Vercel-compatible serverless Next.js application; do not depend on always-on servers, paid workers, or durable local files. [CITED: AGENTS.md]
- Keep the public surface safe while keeping administration protected; Phase 1 builds only private ownership and workspace foundations. [CITED: AGENTS.md]
- Use the locked Next.js App Router, Supabase Auth/Postgres/RLS, `@supabase/ssr`, TypeScript, Zod, pnpm, and Supabase CLI direction. [CITED: AGENTS.md]
- Store database changes as repository migrations and test RLS with `supabase test db`; do not rely on dashboard-only schema changes. [CITED: AGENTS.md]
- Keep privileged Supabase credentials out of browser code; the Phase 1 flow must operate with the publishable key and caller-scoped RLS. [CITED: AGENTS.md]
- Run lint explicitly because the project stack states that Next.js 16 build does not supply the required lint gate. [CITED: AGENTS.md]

## Summary

Phase 1 should establish a single App Router application with Supabase SSR cookie sessions, public auth pages, an authenticated organization-setup route, and a small organization-scoped admin shell. Use the current Supabase Next.js split: a browser client for browser interactions, a server client for Server Components/actions/routes, and `proxy.ts` to refresh shared auth cookies. Server authorization must validate claims or fetch the user; a cookie-loaded `getSession()` user is not a trusted authorization input. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager]

The database is the tenancy authority. Model `organizations` plus `organization_members`, store the only v1 membership as `owner`, and make the organization-creation RPC insert both rows in one database transaction. Expose no direct authenticated inserts, updates, or deletes on either tenancy table. RLS must grant a caller only rows whose organization ID is in that caller's membership set; a direct query for another organization's UUID will therefore return no rows, which the route renders with `notFound()`. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

Email confirmation is a deployment configuration as well as code: hosted Supabase projects require email confirmation by default, and SSR uses PKCE. Configure the production and local callback URLs in Supabase Auth before testing signup and recovery. Password-reset requests deliberately return non-enumerating feedback, so the UI must always show the same sent-if-present result. [CITED: https://supabase.com/docs/guides/auth/passwords]

**Primary recommendation:** Use caller-scoped Supabase clients plus membership-based RLS as the hard tenant boundary; server route guards improve UX but must never be the sole authorization control. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Email/password signup, sign-in, confirmation, recovery, and logout | Frontend Server (SSR) | Supabase Auth | Server Actions/Route Handlers coordinate redirects and cookies; Supabase Auth owns credentials and sessions. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide] |
| Browser session persistence | Browser / Client | Frontend Server (SSR) | `@supabase/ssr` shares PKCE session cookies between browser and server while `proxy.ts` propagates refreshed cookies. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager] |
| Protected-route decision and forced organization setup | Frontend Server (SSR) | Database / Storage | The server verifies identity, then reads only RLS-permitted memberships to choose sign-in, setup, workspace, or not-found. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager] |
| Organization ownership and cross-tenant authorization | Database / Storage | Frontend Server (SSR) | Postgres RLS evaluates every database request and is the defense-in-depth tenant boundary; pages translate empty results into UX. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| First organization bootstrap | Database / Storage | Frontend Server (SSR) | An authenticated RPC owns the atomic creation of organization plus owner membership; a Server Action supplies validated caller input. [CITED: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language] |
| Form interaction and validation feedback | Browser / Client | Frontend Server (SSR) | Client forms collect input, while the server action reparses all data before a mutation. [CITED: https://nextjs.org/docs/app/guides/data-security] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` [WARNING: flagged as suspicious - verify before using.] | `16.3.3`, published 2026-08-25 | App Router pages, Server Actions, Route Handlers, and `proxy.ts`. | Locked project framework; App Router supports server-rendered protected routes without a separate API server. [CITED: https://nextjs.org/docs/app/guides/authentication] |
| `react`, `react-dom` | `19.2.8`, published 2026-07-21 | Next.js component runtime. | Required peer runtime for the locked Next.js stack. [CITED: AGENTS.md] |
| `typescript` | `7.0.2`, published 2026-07-08 | Types for Supabase schema, auth action results, and form commands. | Locked project language and the standard typed Next.js application setup. [CITED: AGENTS.md] |
| `@supabase/supabase-js` [WARNING: flagged as suspicious - verify before using.] | `2.112.4`, published 2026-08-24 | Auth calls and caller-scoped database/RPC requests. | Official JavaScript client; requests carry the user JWT that RLS evaluates. [CITED: https://supabase.com/docs/guides/auth] |
| `@supabase/ssr` [WARNING: flagged as suspicious - verify before using.] | `0.12.4` project pin, published 2026-07-28; registry latest is `0.12.5` | Cookie-aware browser/server Supabase clients. | Official Next.js SSR package; preserve the existing project pin until a human consciously evaluates the patch upgrade. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager] |
| `zod` [WARNING: flagged as suspicious - verify before using.] | `4.5.4`, published 2026-08-29 | Reusable server-side schemas for credentials, owner name, organization name, and callback parameters. | Locked boundary-validation library; every action must treat form data as untrusted. [CITED: AGENTS.md] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tailwindcss` | `4.3.3` project pin | Responsive auth and minimal admin-shell styling. | Use the project-approved utility styling in the initial scaffold; do not add a second UI framework in this phase. [CITED: AGENTS.md] |
| `supabase` [WARNING: flagged as suspicious - verify before using.] | `2.116.0`, published 2026-08-26 | Local Supabase stack, migrations, generated types, and pgTAP test runner. | Install project-local as a dev dependency, initialize `supabase/`, and invoke it via pnpm. [CITED: https://supabase.com/docs/guides/local-development/cli/getting-started] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Membership-table RLS | Application-only ownership checks | Do not use; exported Server Actions are public endpoints and application checks cannot secure direct database access. [CITED: https://nextjs.org/docs/app/guides/data-security] |
| Caller-scoped RPC for organization bootstrap | Server action with a service-role client | Do not use; a secret/service-role key bypasses RLS and is unnecessary for this caller-owned mutation. [CITED: https://supabase.com/docs/guides/auth/users] |
| `@supabase/ssr` | Deprecated `@supabase/auth-helpers-nextjs` | Do not use; the project stack locks `@supabase/ssr` as the supported SSR integration. [CITED: AGENTS.md] |

**Installation:**

```bash
pnpm add next@16.3.3 react@19.2.8 react-dom@19.2.8 @supabase/supabase-js@2.112.4 @supabase/ssr@0.12.4 zod@4.5.4
pnpm add -D typescript@7.0.2 tailwindcss@4.3.3 supabase@2.116.0
```

Package versions were verified against npm on 2026-08-30; no named package reported a `postinstall` script. The planner must place `checkpoint:human-verify` before installing each `[WARNING]` package because the legitimacy seam flags releases that are too recent for its heuristic, even when their source repository is the expected official project. [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age / publish date | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|--------------------|-----------|-------------|---------|-------------|
| `next` | npm | 2026-08-25 | 55.3M/wk | github.com/vercel/next.js | SUS: too new | Flagged - human checkpoint before install. [VERIFIED: npm registry] |
| `react` | npm | 2026-07-21 | 171.6M/wk | github.com/react/react | OK | Approved. [VERIFIED: npm registry] |
| `react-dom` | npm | 2026-07-21 | 161.2M/wk | github.com/react/react | OK | Approved. [VERIFIED: npm registry] |
| `typescript` | npm | 2026-07-08 | 273.4M/wk | github.com/microsoft/TypeScript | OK | Approved. [VERIFIED: npm registry] |
| `@supabase/supabase-js` | npm | 2026-08-24 | 25.0M/wk | github.com/supabase/supabase-js | SUS: too new | Flagged - human checkpoint before install. [VERIFIED: npm registry] |
| `@supabase/ssr` | npm | 2026-07-28 for the pinned version | 7.4M/wk | github.com/supabase/ssr | SUS: too new | Flagged - human checkpoint before install. [VERIFIED: npm registry] |
| `zod` | npm | 2026-08-29 | 274.7M/wk | github.com/colinhacks/zod | SUS: too new | Flagged - human checkpoint before install. [VERIFIED: npm registry] |
| `tailwindcss` | npm | 2026-07-16 | 125.6M/wk | github.com/tailwindlabs/tailwindcss | OK | Approved. [VERIFIED: npm registry] |
| `supabase` | npm | 2026-08-26 | 4.0M/wk | github.com/supabase/cli | SUS: too new | Flagged - human checkpoint before install. [VERIFIED: npm registry] |

**Packages removed due to [SLOP] verdict:** none. [VERIFIED: npm registry]

**Packages flagged as suspicious [SUS]:** `next`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, and `supabase`; the planner inserts a `checkpoint:human-verify` task before each install. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Public auth form
  -> Server Action validates FormData with Zod
  -> browser/server Supabase client calls Auth
  -> Supabase Auth sends confirmation or recovery email
  -> /auth/confirm route exchanges PKCE code for cookie session
  -> /admin server page verifies identity and queries RLS-scoped membership
       -> no identity: redirect /auth/sign-in
       -> no organization: redirect /admin/setup
       -> organization membership: redirect /admin/organizations/[id]

Organization setup form
  -> Server Action validates organization name and verified caller
  -> authenticated RPC create_organization(name)
       -> inserts organizations row
       -> inserts organization_members(owner) row in same transaction
  -> RLS-scoped workspace query
       -> own organization: render admin shell
       -> foreign / absent organization UUID: zero rows -> notFound()
```

The request boundary only refreshes and propagates auth cookies; every protected server page/action independently verifies identity and asks the RLS-protected database for the selected organization. This avoids coupling UI middleware to authorization rules. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide]

### Recommended Project Structure

```text
src/
├── app/
│   ├── auth/
│   │   ├── confirm/route.ts          # PKCE code exchange and safe redirect
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── update-password/page.tsx
│   ├── admin/
│   │   ├── setup/page.tsx            # forced first-organization setup
│   │   └── organizations/[id]/page.tsx # RLS-backed workspace / notFound
│   ├── actions/auth.ts
│   ├── actions/organizations.ts
│   └── layout.tsx
├── lib/
│   ├── supabase/client.ts            # createBrowserClient only
│   ├── supabase/server.ts            # createServerClient + cookies adapter
│   ├── supabase/proxy.ts             # session refresh response propagation
│   ├── auth/require-user.ts          # verified identity helper
│   └── validation/auth.ts             # Zod command schemas
└── proxy.ts
supabase/
├── migrations/
└── tests/database/organization_rls.test.sql
```

The browser and server client factories must remain separate, and the proxy helper must not contain data authorization logic. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager]

### Pattern 1: Verify identity at every protected server boundary

**What:** Use `auth.getClaims()` for identity protection or `auth.getUser()` when a current user record is needed; never authorize from `getSession().data.session.user`. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager]

**When to use:** Admin pages, Server Actions, route handlers, and the session-refresh proxy. [CITED: https://nextjs.org/docs/app/guides/data-security]

**Example:**

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
export async function requireUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data.claims?.sub) {
    redirect('/auth/sign-in')
  }

  return data.claims.sub
}
```

### Pattern 2: Create organization plus owner membership only through a controlled RPC

**What:** The client calls `public.create_organization(name)` with its own JWT; the security-definer function validates the caller, enforces the one-organization v1 limit, and inserts both rows. Its only input is a name, never a caller ID, role, or existing organization ID. [CITED: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language]

**When to use:** First organization setup. This is the one Phase 1 tenant mutation; later membership administration remains deferred. [CITED: .planning/phases/01-account-ownership-and-tenancy/01-CONTEXT.md]

**Example:**

```sql
-- Source: https://supabase.com/docs/guides/database/functions
create function public.create_organization(input_name text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_organization public.organizations;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required';
  end if;

  if exists (
    select 1 from public.organization_members
    where user_id = (select auth.uid())
  ) then
    raise exception 'organization already exists for this owner';
  end if;

  insert into public.organizations (name)
  values (trim(input_name))
  returning * into new_organization;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization.id, (select auth.uid()), 'owner');

  return new_organization;
end;
$$;

revoke execute on function public.create_organization(text) from public, anon;
grant execute on function public.create_organization(text) to authenticated;
```

Add a unique constraint on `organization_members.user_id` for the v1 one-owner/one-organization invariant, and translate a concurrent unique-violation into the same already-created result. Removing that constraint is the explicit future multi-organization migration. [ASSUMED]

### Pattern 3: Membership set is reused by every tenant policy

**What:** Keep a non-exposed `private.user_organization_ids()` security-definer helper that returns only organization IDs for `auth.uid()`, then use it in organization and later tenant-table policies. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

**When to use:** All present and future organization-owned tables, including Phase 2 campaigns, items, and audit records. [CITED: .planning/ROADMAP.md]

**Example:**

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
create schema if not exists private;

create function private.user_organization_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select organization_id
  from public.organization_members
  where user_id = (select auth.uid())
$$;

revoke execute on function private.user_organization_ids() from public;
grant usage on schema private to authenticated;
grant execute on function private.user_organization_ids() to authenticated;

create policy "members read their organizations"
on public.organizations for select to authenticated
using (id in (select private.user_organization_ids()));
```

Do not put a security-definer helper in an API-exposed schema, leave its `search_path` unpinned, or grant direct insert/update/delete on membership rows. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Anti-Patterns to Avoid

- **Route-only tenancy checks:** A private route does not secure a Server Action or a direct database request; use RLS for every exposed table. [CITED: https://nextjs.org/docs/app/guides/data-security]
- **Accepting `user_id`, `role`, or `organization_id` from organization setup:** These fields permit privilege or tenancy reassignment; derive the caller from `auth.uid()` and create the organization internally. [CITED: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language]
- **Mutable identity from auth metadata:** Owner name in user metadata may be displayed, but it must not decide ownership or role. [CITED: https://supabase.com/docs/guides/auth/users]
- **Open callback redirect:** Permit only known relative post-auth paths; Supabase also requires the external callback URL to be allow-listed. [CITED: https://supabase.com/docs/guides/auth/passwords]
- **Static/ISR caching of authenticated responses:** Auth cookie refresh emits `Set-Cookie`; cache reuse can serve a session to the wrong browser. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password storage, verification, reset tokens, and email confirmation | Custom users/password-hash tables or signed reset links | Supabase Auth email/password flow | Credential and recovery security require token expiry, hashing, email delivery, and enumeration controls. [CITED: https://supabase.com/docs/guides/auth/passwords] |
| SSR session-cookie lifecycle | Manual JWT/cookie parsing and refresh logic | `@supabase/ssr` browser/server clients plus documented proxy helper | The package uses cookie-backed PKCE state and propagates refreshed session cookies. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide] |
| Tenant filter in every query | Ad hoc `organization_id` comparisons in pages/actions | Postgres RLS membership policies | RLS is enforced at the data boundary for application and third-party database access. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| Cross-table bootstrap transaction | Two client inserts with rollback code | Minimal, constrained Postgres RPC | The function executes the organization and owner-membership inserts atomically and prevents a membership attach to an arbitrary existing organization. [CITED: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language] |
| RLS regression test harness | One-off dashboard policy checks | Supabase CLI pgTAP tests | Versioned SQL tests run locally and exercise authenticated allow/deny paths repeatably. [CITED: https://supabase.com/docs/guides/database/testing] |

**Key insight:** RLS cannot be added later as a cosmetic filter; its membership model and reusable policy helper need to be the initial schema contract so every later organization-owned table can inherit the same boundary. [CITED: .planning/phases/01-account-ownership-and-tenancy/01-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Treating a session cookie as authorization proof

**What goes wrong:** A route accepts `getSession()` data from shared cookie storage and authorizes a request with a spoofed or stale user value. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager]

**How to avoid:** Use `getClaims()` to protect server pages/data or `getUser()` for fresh user data; reauthorize the organization query on every Server Action. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager]

**Warning signs:** The protected code only tests for a cookie/session object or trusts a browser-submitted organization ID. [CITED: https://nextjs.org/docs/app/guides/data-security]

### Pitfall 2: Direct membership creation lets users join another tenant

**What goes wrong:** A policy that permits `organization_members` inserts where `user_id = auth.uid()` can still accept another organization's ID. [ASSUMED]

**How to avoid:** Do not grant direct membership mutation; expose only a narrow RPC without an organization-ID argument. [CITED: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language]

**Warning signs:** The client submits role, owner ID, or foreign-key UUID fields during onboarding. [ASSUMED]

### Pitfall 3: Recursive RLS policies

**What goes wrong:** Policies that require `organizations` to read `organization_members` and memberships to read organizations can fail with infinite recursion. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

**How to avoid:** Keep the member-set helper in `private`, qualify all references, pin an empty `search_path`, and test both member and non-member cases. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

**Warning signs:** PostgreSQL error `42P17`, or a policy unexpectedly denies every authenticated request. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Pitfall 4: Callback URLs and session refresh are only partially configured

**What goes wrong:** Email links return to an unapproved URL, the PKCE code is not exchanged, or the response drops refreshed cookies, so users appear logged out after redirect/refresh. [CITED: https://supabase.com/docs/guides/auth/passwords]

**How to avoid:** Configure local and deployed callback URLs in Supabase Auth; exchange the code in a Route Handler; preserve every cookie/header returned by the SSR client. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide]

**Warning signs:** Auth works in a single client navigation but fails after a full reload or confirmation link. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide]

## Code Examples

### Safe confirmation callback

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = safeLocalPath(request.nextUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next ?? '/admin', request.url))
    }
  }

  return NextResponse.redirect(new URL('/auth/sign-in?error=confirm', request.url))
}
```

The `safeLocalPath` helper must accept only a fixed allow-list or a path that starts with one slash and not two; never redirect directly to an arbitrary query parameter. [ASSUMED]

### pgTAP cross-tenant read test

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
begin;
select plan(2);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$ select id from public.organizations where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::uuid[],
  'owner reads their organization'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$ select id from public.organizations where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'other owner receives no organization row'
);

select * from finish();
rollback;
```

Seed two deterministic auth users, two organizations, and matching memberships inside the test transaction; extend the same file with unauthorized RPC/membership-write cases and, when Phase 2 adds campaigns, cross-tenant campaign reads and writes. [CITED: https://supabase.com/docs/guides/database/testing]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` with separate browser/server clients | Current project stack | Do not introduce auth helpers into the scaffold. [CITED: AGENTS.md] |
| Next.js `middleware.ts` naming | Next.js `proxy.ts` request-boundary entry point | Current Supabase Next.js SSR guide | Use the current guide's `proxy.ts` pattern in a Next.js 16 scaffold. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager] |
| Trusting server `getSession()` user data | `getClaims()` for identity protection and `getUser()` for current user data | Current Supabase Next.js SSR guide | Do not base authorization on cookie-loaded session data. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A unique `organization_members.user_id` constraint is the best v1 enforcement for one organization per owner. | Architecture Patterns | Future multi-organization work must deliberately remove the constraint and update UX. |
| A2 | A direct self-membership insert policy can be exploited to join an existing foreign organization without a constrained bootstrap RPC. | Common Pitfalls | A weaker policy could violate tenant isolation. |
| A3 | A local callback redirect helper should allow-list app-relative destinations and reject protocol-relative paths. | Code Examples | An incorrect parser could create an open redirect. |

## Open Questions

1. **Which Supabase project and email sender will Phase 1 use?**
   - What we know: Hosted Supabase supports email confirmation; password reset and signup require a configured redirect URL and email delivery. [CITED: https://supabase.com/docs/guides/auth/passwords]
   - What's unclear: No project URL, allowed callback URL list, or production SMTP sender is present in the repository. [VERIFIED: codebase grep]
   - Recommendation: Add a human setup checkpoint that records `NEXT_PUBLIC_SUPABASE_URL`, the publishable key, allowed local/deployed callbacks, confirmation-email enabled, and the sender/SMTP decision before end-to-end auth testing. [CITED: https://supabase.com/docs/guides/auth/passwords]

2. **Is one organization per owner an application rule or a durable database constraint?**
   - What we know: The UI is limited to one organization in Phase 1 and future multi-organization support is deferred. [CITED: .planning/phases/01-account-ownership-and-tenancy/01-CONTEXT.md]
   - What's unclear: The context does not lock whether the invariant is database-enforced. [VERIFIED: .planning/phases/01-account-ownership-and-tenancy/01-CONTEXT.md]
   - Recommendation: Confirm A1 during planning; default to the unique constraint because it makes concurrent onboarding safe, and document its removal as the multi-organization migration. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next.js and local Supabase CLI | Yes | `v24.14.0` | None needed. [VERIFIED: environment probe] |
| npm | Initial dependency installation / registry audit | Yes | `11.9.0` | pnpm remains the project package manager after bootstrap. [VERIFIED: environment probe] |
| pnpm | Locked package manager and reproducible lockfile | No | -- | Install/enable before implementation. [VERIFIED: environment probe] |
| Supabase CLI | Migrations, local stack, type generation, pgTAP RLS tests | No | -- | Install `supabase` project-local dev dependency; Node meets the documented Node 20+ minimum. [CITED: https://supabase.com/docs/guides/local-development/cli/getting-started] |
| Docker-compatible runtime | `supabase start` and local database tests | CLI present; daemon unavailable to this audit | Docker `29.6.2-rd` | Start/authorize the Docker runtime; no practical local-test fallback. [VERIFIED: environment probe] |
| Supabase hosted project / Auth configuration | Email confirmation and deployed auth flows | Not configured in repository | -- | Human project setup is required. [VERIFIED: codebase grep] |

**Missing dependencies with no fallback:** a usable Docker daemon and a configured Supabase project are prerequisites for local RLS and deployed email-flow verification. [VERIFIED: environment probe]

**Missing dependencies with fallback:** pnpm and the Supabase CLI can be installed project-locally before execution. [CITED: https://supabase.com/docs/guides/local-development/cli/getting-started]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Supabase CLI pgTAP database tests; no application test framework exists yet. [CITED: https://supabase.com/docs/guides/database/testing] |
| Config file | `supabase/config.toml` and `supabase/tests/database/*.sql` - Wave 0 creates them. [CITED: https://supabase.com/docs/guides/local-development/cli/getting-started] |
| Quick run command | `pnpm lint && pnpm exec tsc --noEmit` after the scaffold exists. [CITED: AGENTS.md] |
| Full suite command | `pnpm supabase test db && pnpm lint && pnpm exec tsc --noEmit`. [CITED: https://supabase.com/docs/guides/database/testing] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Signup validates inputs and sends the caller to verify-email state. | manual integration plus static validation | `pnpm lint && pnpm exec tsc --noEmit` | No - Wave 0. [CITED: https://supabase.com/docs/guides/auth/passwords] |
| AUTH-02 | Login persists through refresh and protected route recognizes the user. | manual browser integration | `pnpm lint && pnpm exec tsc --noEmit` | No - Wave 0. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide] |
| AUTH-03 | Account menu logs out and protected route returns to sign-in. | manual browser integration | `pnpm lint && pnpm exec tsc --noEmit` | No - Wave 0. [CITED: https://supabase.com/docs/guides/auth/passwords] |
| AUTH-04 | Authenticated caller creates one organization and owner membership atomically. | pgTAP plus manual integration | `pnpm supabase test db supabase/tests/database/organization_rls.test.sql` | No - Wave 0. [CITED: https://supabase.com/docs/guides/database/testing] |
| AUTH-05 | Owner reads own org; foreign owner sees no row and cannot mutate memberships/RPC results. | pgTAP RLS allow/deny | `pnpm supabase test db supabase/tests/database/organization_rls.test.sql` | No - Wave 0. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |

### Sampling Rate

- **Per task commit:** `pnpm lint && pnpm exec tsc --noEmit` once bootstrap is complete. [CITED: AGENTS.md]
- **Per wave merge:** `pnpm supabase test db` after each migration/policy change. [CITED: https://supabase.com/docs/guides/database/testing]
- **Phase gate:** Full suite green plus manual confirmation, refresh, password reset, logout, organization setup, and foreign-UUID not-found smoke tests. [CITED: .planning/ROADMAP.md]

### Wave 0 Gaps

- [ ] `package.json`, pnpm lockfile, Next.js TypeScript/Tailwind scaffold, and lint script - application does not exist. [VERIFIED: codebase grep]
- [ ] `supabase/config.toml`, SQL migration directory, and generated database type destination. [VERIFIED: codebase grep]
- [ ] `supabase/tests/database/organization_rls.test.sql` - own/foreign select, direct mutation denial, and bootstrap RPC behavior. [CITED: https://supabase.com/docs/guides/database/testing]
- [ ] Local Supabase CLI, usable Docker daemon, and a configured Supabase Auth project. [VERIFIED: environment probe]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase email/password Auth with confirmation enabled, PKCE callback exchange, and password reset. [CITED: https://supabase.com/docs/guides/auth/passwords] |
| V3 Session Management | Yes | `@supabase/ssr` cookie refresh at request boundary; protected responses are dynamic/non-cacheable. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide] |
| V4 Access Control | Yes | `organization_members` owner relation, least-privilege grants, RLS policies, and pgTAP deny cases. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| V5 Input Validation | Yes | Zod parses every form and route query server-side; RPC accepts only the organization name and independently derives `auth.uid()`. [CITED: https://nextjs.org/docs/app/guides/data-security] |
| V6 Cryptography | Yes | Supabase Auth owns credential and session cryptography; application code does not implement crypto. [CITED: https://supabase.com/docs/guides/auth] |

### Known Threat Patterns for Next.js + Supabase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Calling a Server Action directly with forged form values | Tampering / Elevation of privilege | Validate form data, verify identity, and authorize the selected organization in the database. [CITED: https://nextjs.org/docs/app/guides/data-security] |
| Guessing another organization UUID | Information disclosure | RLS returns no tenant row; render `notFound()` for the missing RLS-scoped result. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| Forged or stale server cookie session | Spoofing | Use `getClaims()` or `getUser()`, not `getSession()` user data, for authorization. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager] |
| Membership self-escalation | Elevation of privilege | No direct membership writes; narrow security-definer bootstrap RPC with explicit grants and no foreign IDs. [CITED: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language] |
| Security-definer privilege abuse | Elevation of privilege | Private helper schema, empty pinned `search_path`, fully qualified relations, and explicit execute grants. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| Auth response cached at CDN/ISR | Information disclosure / Spoofing | Do not statically cache authenticated routes and preserve SSR cache-prevention headers. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide] |

## Sources

### Primary (MEDIUM confidence)

- [Supabase Next.js SSR client guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager) - browser/server clients, `proxy.ts`, trusted identity APIs.
- [Supabase SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) - PKCE cookies, refresh propagation, prefetch and caching pitfalls.
- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords) - confirmation, recovery, redirects, enumeration-safe reset behavior.
- [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) - grants, policies, helper functions, recursion avoidance, and test patterns.
- [Supabase database functions](https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language) - security-definer safeguards and function privileges.
- [Supabase database testing](https://supabase.com/docs/guides/database/testing) - pgTAP layout and `supabase test db`.
- [Next.js authentication](https://nextjs.org/docs/app/guides/authentication) and [data security](https://nextjs.org/docs/app/guides/data-security) - Server Action/Route Handler authorization requirements.
- [Supabase CLI local development](https://supabase.com/docs/guides/local-development/cli/getting-started) - project-local CLI installation and Node requirement.

### Registry (verified)

- npm registry - exact package versions, publish dates, repository signals, weekly-download signals, and no named-package `postinstall` scripts checked 2026-08-30. [VERIFIED: npm registry]

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM - package versions and legitimacy were registry-checked, while the mandatory recent-release checkpoint prevents overclaiming. [VERIFIED: npm registry]
- Architecture: MEDIUM - patterns are from current official Supabase/Next.js documentation; the one-organization database constraint remains an explicit assumption. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]
- Pitfalls: MEDIUM - session, callback, and recursive-policy risks are official guidance; direct self-membership escalation is flagged as an assumption to validate in migration tests. [CITED: https://supabase.com/docs/guides/auth/server-side/advanced-guide]

**Research date:** 2026-08-30
**Valid until:** 2026-09-06, because the Supabase and Next.js guidance plus several locked package releases are fast-moving. [VERIFIED: npm registry]
