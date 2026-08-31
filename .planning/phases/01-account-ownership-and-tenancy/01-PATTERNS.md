# Phase 1: Account Ownership and Tenancy - Pattern Map

**Mapped:** 2026-08-30  
**Files analyzed:** 27 planned new files  
**Analogs found:** 0 / 27

## Finding

This repository is a true greenfield skeleton. At mapping time it contains only `AGENTS.md`, `.gitignore`, and planning artifacts; there are no application, Supabase, test, configuration, or component source files. Consequently, there is no local code excerpt to copy and no project-specific import, error-handling, or testing convention to preserve yet.

The phase must establish its patterns from the locked stack and architecture in `01-RESEARCH.md`, then later phases should treat the Phase 1 output as the local source of truth. The approved `01-UI-SPEC.md` additionally requires the official shadcn baseline and the listed generated primitives.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `package.json` | config | batch | None | none - initial scaffold |
| `tsconfig.json` | config | batch | None | none - initial scaffold |
| `next.config.ts` | config | request-response | None | none - initial scaffold |
| `eslint.config.mjs` | config | batch | None | none - initial scaffold |
| `components.json` | config | batch | None | none - shadcn initialization |
| `src/app/globals.css` | config | transform | None | none - Tailwind/shadcn baseline |
| `src/app/layout.tsx` | component | request-response | None | none - App Router root layout |
| `src/app/page.tsx` | component | request-response | None | none - public entry route |
| `src/app/auth/sign-up/page.tsx` | component | request-response | None | none - auth route |
| `src/app/auth/sign-in/page.tsx` | component | request-response | None | none - auth route |
| `src/app/auth/verify-email/page.tsx` | component | request-response | None | none - auth state route |
| `src/app/auth/forgot-password/page.tsx` | component | request-response | None | none - auth route |
| `src/app/auth/update-password/page.tsx` | component | request-response | None | none - auth route |
| `src/app/auth/confirm/route.ts` | route | request-response | None | none - PKCE callback |
| `src/app/admin/page.tsx` | component | request-response | None | none - protected redirect route |
| `src/app/admin/setup/page.tsx` | component | request-response | None | none - protected setup route |
| `src/app/admin/organizations/[id]/page.tsx` | component | request-response | None | none - RLS-backed workspace |
| `src/app/actions/auth.ts` | service | request-response | None | none - Server Actions |
| `src/app/actions/organizations.ts` | service | CRUD | None | none - validated RPC caller |
| `src/lib/supabase/client.ts` | utility | request-response | None | none - browser client factory |
| `src/lib/supabase/server.ts` | utility | request-response | None | none - server client and cookies |
| `src/lib/supabase/proxy.ts` | middleware | request-response | None | none - session refresh helper |
| `src/lib/auth/require-user.ts` | utility | request-response | None | none - authenticated identity guard |
| `src/lib/validation/auth.ts` | utility | transform | None | none - Zod command schemas |
| `src/proxy.ts` | middleware | request-response | None | none - Next request boundary |
| `supabase/migrations/<timestamp>_account_ownership.sql` | migration | CRUD | None | none - initial tenancy schema/RLS/RPC |
| `supabase/tests/database/organization_rls.test.sql` | test | CRUD | None | none - pgTAP RLS allow/deny coverage |

## Pattern Assignments

### Application and UI files

**Files:** `src/app/layout.tsx`, `src/app/page.tsx`, all listed `src/app/auth/**/page.tsx`, `src/app/admin/**/page.tsx`, `src/app/globals.css`

**Analog:** None. There are no React or Next.js source files in the repository.

**Baseline to establish:** Follow the `src/app` App Router structure in `01-RESEARCH.md` (Recommended Project Structure) and the page contract in `01-UI-SPEC.md`. Render protected route decisions on the server: no identity redirects to sign-in; a verified identity without membership redirects to `/admin/setup`; an RLS-empty organization query calls `notFound()`.

**UI construction pattern:** Initialize the approved `b0` shadcn preset, then use its generated `Button`, `Input`, `Label`, `Card`, `Dropdown Menu`, `Avatar`, and `Skeleton` primitives. Keep auth and setup pages as one 420px maximum form surface and build the 64px workspace header with an accessible avatar account menu. All visible copy must be Brazilian Portuguese as specified by `01-UI-SPEC.md`.

**Required security behavior:** Do not use a client session or `getSession()` as authorization. Each protected page must obtain a trusted identity through the server client and query data under the caller's RLS context.

### Auth actions, callback, and validation

**Files:** `src/app/actions/auth.ts`, `src/app/auth/confirm/route.ts`, `src/lib/validation/auth.ts`

**Analog:** None. There are no Server Actions, route handlers, or validation modules.

**Baseline to establish:** Use one Zod schema source for sign-up (`name`, `email`, `password`), sign-in, reset request, password update, organization name, and any callback `next` parameter. Every Server Action must parse `FormData` on the server, return only safe generic errors, and omit passwords from returned form state.

**Callback core pattern:** Adopt the documented flow quoted in `01-RESEARCH.md` under “Safe confirmation callback”: obtain `code`, validate `next` as an app-local path, call `supabase.auth.exchangeCodeForSession(code)`, redirect to the safe destination on success, and redirect to a generic sign-in error on failure. Never redirect to an unchecked query value.

**Auth result pattern:** Signup redirects to verify-email; sign-in determines membership server-side; password-reset submission always returns the same non-enumerating sent-if-present message; sign-out ends the session and redirects to sign-in.

### Supabase SSR clients and request proxy

**Files:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/proxy.ts`, `src/proxy.ts`, `src/lib/auth/require-user.ts`

**Analog:** None. There are no Supabase or middleware files.

**Baseline to establish:** Keep browser and server factory modules separate. The browser module creates only the browser client; the server module creates the cookie-adapted server client; the proxy helper refreshes and propagates session cookies. `src/proxy.ts` delegates only to that refresh helper and contains no tenancy authorization policy.

**Trusted identity excerpt to implement** (from `01-RESEARCH.md`, Architecture Pattern 1):

```typescript
export async function requireUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data.claims?.sub) {
    redirect('/auth/sign-in')
  }

  return data.claims.sub
}
```

### Organization setup and workspace

**Files:** `src/app/actions/organizations.ts`, `src/app/admin/page.tsx`, `src/app/admin/setup/page.tsx`, `src/app/admin/organizations/[id]/page.tsx`

**Analog:** None. There are no protected routes, services, or database queries.

**Baseline to establish:** The setup action accepts only a Zod-validated organization name and calls a caller-scoped `create_organization` RPC. It must not accept a user ID, role, or organization ID. The admin route performs a membership lookup under RLS, redirects a user with no organization to setup, and routes the sole organization to its workspace. A workspace fetch by `[id]` uses the RLS-scoped query result; missing or foreign rows map to `notFound()`, never a forbidden response.

### Database schema, RLS, RPC, and pgTAP test

**Files:** `supabase/migrations/<timestamp>_account_ownership.sql`, `supabase/tests/database/organization_rls.test.sql`

**Analog:** None. There are no migrations or database tests.

**Baseline to establish:** Create `organizations` and `organization_members`, make membership the authorization source of truth, enable RLS, and expose no direct membership mutations. The migration creates a private, security-definer membership-set helper with an empty pinned `search_path`; organization select policies reuse that helper. The constrained `create_organization(name)` security-definer RPC derives `auth.uid()`, creates organization and owner membership in one transaction, and is executable only by `authenticated`.

**Core SQL pattern** (from `01-RESEARCH.md`, Architecture Patterns 2 and 3):

```sql
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

create policy "members read their organizations"
on public.organizations for select to authenticated
using (id in (select private.user_organization_ids()));
```

The pgTAP file must seed deterministic users, organizations, and memberships in its transaction; impersonate each owner with `set local role authenticated` and `request.jwt.claim.sub`; assert own-row visibility and foreign-row emptiness. Extend it to deny direct membership writes and unauthorized RPC behavior.

### Bootstrap and generated UI configuration

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `components.json`

**Analog:** None. No build configuration exists.

**Baseline to establish:** Build the initial Next.js TypeScript/Tailwind project using the pinned packages and `pnpm`. Configure explicit linting, because `next build` is not the lint gate. Initialize shadcn from the approved `b0` preset; generated primitive source belongs in the initial scaffold and should become the component convention for subsequent phases.

## Shared Patterns

### Authentication and authorization

**Source:** `01-RESEARCH.md`, Architecture Patterns 1 and 3 (no local implementation exists)

**Apply to:** all Server Actions, Route Handlers, protected Server Components, and every tenant table.

Use `auth.getClaims()` or `auth.getUser()` at protected server boundaries. Let RLS be the tenant authority, and turn empty RLS results into neutral not-found or setup UX. The request proxy refreshes cookies only; it does not authorize data access.

### Validation and error exposure

**Source:** `01-RESEARCH.md`, Standard Stack / Security Domain; `01-UI-SPEC.md`, Form and State Rules

**Apply to:** all form actions and callback query parameters.

Use Zod at the server boundary. Preserve only non-secret safe input after a failure; expose no raw Supabase error, organization ID, ownership fact, or account-existence signal. Reset-password responses must be enumeration-safe.

### Data mutations and isolation

**Source:** `01-RESEARCH.md`, Architecture Pattern 2

**Apply to:** initial organization bootstrap and future organization-owned tables.

Use a constrained, caller-scoped RPC for atomic organization-plus-owner-membership creation. Do not use a browser service-role client, direct membership insert, application-only tenant filters, or user/role/organization identifiers supplied by a form.

### Tests

**Source:** `01-RESEARCH.md`, Code Examples / Validation Architecture

**Apply to:** database policies and the initial tenancy RPC.

Use Supabase CLI pgTAP tests in `supabase/tests/database/`. Every RLS allow assertion needs a cross-tenant deny assertion, and the tests must run versioned migrations rather than relying on Supabase dashboard state.

## No Analog Found

All classified files have no local analog because no application code exists. The planner should use the selected Phase 1 baseline above and should not infer conventions from unrelated planning Markdown.

## Metadata

**Analog search scope:** repository files outside `.git` and `.planning`, plus a project-wide search for Next.js, Supabase, middleware, tenancy, migration, and test patterns.  
**Files scanned:** 2 non-planning files (`AGENTS.md`, `.gitignore`); 0 application source files.  
**Pattern extraction date:** 2026-08-30
