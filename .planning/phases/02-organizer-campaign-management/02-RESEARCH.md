# Phase 02: Organizer Campaign Management - Research

**Researched:** 2026-09-07
**Domain:** Authenticated, multi-tenant campaign and item management on Next.js App Router and Supabase Postgres
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The campaign creation uses a Multi-step Wizard (Campaign details first, then Items/PIX key).
- **D-02:** The campaign is created immediately on step 1 as a Draft, auto-saving as the user progresses through the wizard.
- **D-03:** PIX Key validation is strict: enforce CPF/CNPJ, Email, Phone, or Random Key patterns rather than allowing free-form text.
- **D-04:** Campaigns are displayed on the admin dashboard as Cards, showing title, status, and maybe a small summary.

### the agent's Discretion
None

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAMP-01 | Owner creates title, description, organization attribution, and public slug. | Persist an immutable UUID and immutable globally unique slug; create the draft through a constrained owner command. [VERIFIED: REQUIREMENTS.md] |
| CAMP-02 | Owner configures the PIX recipient key. | Use a typed PIX-key schema with the four Banco Central key categories; keep the key nullable until publish and audit its change. [CITED: https://www.bcb.gov.br/meubc/faqs/p/O-que-e-chave-pix] |
| CAMP-03 | Owner publishes, unpublishes, closes, and archives. | Expose dedicated lifecycle commands backed by a database status transition check, never a free-form status update. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| CAMP-04 | Owner edits content without losing identity/history. | Keep `id` and slug immutable; update editable fields with allow-listed commands and retain lifecycle/PIX audit rows. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server] |
| ITEM-01 | Owner adds name, optional description, needed quantity, and BRL unit price. | Store quantity as positive integer and price as positive integer centavos; validate and format BRL only at the boundary/UI. [VERIFIED: .planning/research/STACK.md] |
| ITEM-02 | Owner edits item details before confirmed donations. | Model `confirmed_quantity` from Phase 2 and enforce an edit guard in a database command/trigger before Phase 4 writes donations. [ASSUMED] |
| ITEM-03 | Owner disables an item from new donations. | Use a reversible `disabled_at` or status field, not deletion; compute future availability from disabled/fulfilled state. [ASSUMED] |
| ADMN-01 | Owner views a dashboard of their campaigns. | Replace the Phase 1 private workspace body with the owner-scoped card dashboard and empty state specified by the UI contract. [VERIFIED: 02-UI-SPEC.md] |
| ADMN-02 | Owner views campaign items, remaining quantities, and fulfillment state. | Show item records with `needed_quantity`, derived `remaining_quantity`, and state; do not create donation activity UI in this phase. [VERIFIED: REQUIREMENTS.md] |
| SAFE-06 | System records audit events for publication and PIX recipient changes. | Use an append-only audit table populated by a database trigger/function; deny direct client changes to audit rows. [CITED: https://supabase.com/docs/guides/database/functions] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Read the relevant guide under `node_modules/next/dist/docs/` before writing Next.js code because this project uses a breaking Next.js version. [VERIFIED: AGENTS.md]
- Heed Next.js deprecation notices. [VERIFIED: AGENTS.md]
- Retain the Next.js-generated AGENTS.md block when it changes; removing it merely recreates an uncommitted change. [VERIFIED: AGENTS.md]

## Summary

Phase 2 should be a protected campaign domain slice: one durable database migration, owner-only command paths, and a private dashboard/wizard over the existing App Router/Supabase architecture. The repository already has Next.js 16.3.3, Supabase SSR/client libraries, Zod 4.5.4, Base UI, and Lucide installed, so this phase requires no new external package. [VERIFIED: package.json]

Make Step 1 create a real draft with its UUID and immutable public slug, then use subsequent server-authorized commands to update campaign setup, add/edit/disable items, and transition lifecycle status. Use an append-only database audit table and trigger for status and PIX-key events so the audit guarantee does not depend on a specific form or route being used. [CITED: https://supabase.com/docs/guides/database/functions]

The Phase 1 foundation is not yet green in this working tree: unit tests pass, while `pnpm lint` and `pnpm typecheck` fail. The Phase 2 plan must begin by checking the completed Phase 1 schema/types and repairing only the validation infrastructure needed to make the inherited gate reliable; it must not silently build Phase 2 on an unverified tenancy baseline. [VERIFIED: command output on 2026-09-07]

**Primary recommendation:** Implement a database-governed, owner-scoped campaign command boundary with server actions as the only UI entry point, then layer the draft-first wizard and card dashboard on top. [CITED: https://nextjs.org/docs/app/guides/forms]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Draft-first wizard state and field feedback | Browser / Client | Frontend Server (SSR) | The browser owns step presentation and pending/error UI; each progression submits a durable server mutation. [CITED: https://nextjs.org/docs/app/guides/forms] |
| Owner authentication and organization derivation | Frontend Server (SSR) | Database / Storage | Every server action rechecks the authenticated user; RLS independently limits rows to that user's owned organization. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server] [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| Campaign/item creation, content editing, and lifecycle transitions | Database / Storage | Frontend Server (SSR) | Database commands constrain writable fields and lifecycle invariants; actions validate FormData, call them, and revalidate views. [CITED: https://supabase.com/docs/guides/database/functions] [CITED: https://nextjs.org/docs/app/api-reference/functions/revalidatePath] |
| Campaign audit activity | Database / Storage | Frontend Server (SSR) | A trigger records the protected rows atomically with a PIX-key or status update; the admin detail page reads the owner-visible history. [CITED: https://supabase.com/docs/guides/database/functions] |
| Campaign cards and item detail dashboard | Frontend Server (SSR) | Browser / Client | The protected page should render owner-scoped data on the server; client code is reserved for forms, dialogs, and local wizard state. [VERIFIED: 02-CONTEXT.md] |
| Public campaign exposure and donation fulfillment | API / Backend | Database / Storage | These are explicitly Phase 3/4 concerns; Phase 2 must not grant anonymous campaign/item reads or decrement quantities. [VERIFIED: REQUIREMENTS.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | `16.3.3` existing pin | Protected Server Components, Server Actions, and route cache invalidation. | The local Next docs prescribe server authentication/authorization for every Server Action and `revalidatePath` after mutations. [VERIFIED: package.json] [CITED: https://nextjs.org/docs/app/guides/forms] |
| `@supabase/supabase-js` | `2.112.4` existing pin | User-session database client for scoped queries/RPCs. | Continue the project lock rather than introducing an ORM or privileged client. RLS and grants remain the tenant boundary. [VERIFIED: package.json] [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| `@supabase/ssr` | `0.12.4` existing pin | Request-bound session cookies for Server Components and actions. | Reuse the Phase 1 client factories and authenticated session path. [VERIFIED: src/lib/supabase/server.ts] |
| Zod | `4.5.4` existing pin | Server-side command validation and typed form errors. | The existing action pattern uses `safeParse` and flattened field errors; repeat it for every campaign/item/PIX command. [VERIFIED: src/lib/organizations/validation.ts] [CITED: https://nextjs.org/docs/app/guides/forms] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@base-ui/react` | `1.8.0` existing pin | Existing primitive source for dialogs/menus/buttons. | Use its actual component APIs for the archive confirmation and avoid copied Radix-only props. [VERIFIED: package.json] [VERIFIED: node_modules/@base-ui/react/package.json] |
| `lucide-react` | `1.37.0` existing pin | Action icons in compact icon buttons. | Use established icons where an icon communicates the command clearly; retain accessible labels/tooltips. [VERIFIED: package.json] [VERIFIED: 02-UI-SPEC.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing App Router/Supabase/Zod stack | Separate REST backend, ORM, or new form package | Do not add another authorization, validation, deployment, or package-legitimacy surface in this phase. [VERIFIED: 02-CONTEXT.md] [VERIFIED: package.json] |

**Installation:** None. This phase should not run a package-manager command. [VERIFIED: package.json]

**Version verification:** npm registry checks on 2026-09-07 report current releases of Zod `4.5.4`, `@supabase/supabase-js` `2.116.0`, `@supabase/ssr` `0.12.6`, `lucide-react` `1.42.0`, and `@base-ui/react` `1.8.0`; preserve the existing project pins for this scoped phase rather than upgrading dependency versions. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
[Owner browser]
  | draft details, item/PIX/lifecycle commands (untrusted FormData and IDs)
  v
[Client wizard and dialogs]
  | form action / useActionState
  v
[Server Actions]
  | require user -> Zod parse -> no client-supplied organization/role
  v
[Campaign command boundary]
  | owner-scoped RPC/query
  v
[Postgres + RLS]
  | campaigns <-> campaign_items
  |       |                 |
  |       +-- update trigger +-- derived remaining/fulfillment state
  v
[campaign_audit_events] --> [SSR dashboard/detail] --> [Owner browser]

No anon grants or public projections in this phase.
```

The command boundary above follows Next's server-action security model and Supabase's requirement that grants and RLS policies both constrain exposed data. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server] [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Recommended Project Structure

```text
src/
├── app/espaco/                         # campaign card dashboard replaces Phase 1 body
├── app/espaco/campanhas/nova/          # Step 1 creates the persistent draft
├── app/espaco/campanhas/[campaignId]/  # setup/detail and owner audit activity
├── components/campaigns/               # wizard, cards, item form/list, lifecycle controls
├── lib/campaigns/actions.ts            # server actions only
├── lib/campaigns/validation.ts         # campaign/item/PIX/lifecycle schemas and pure helpers
├── lib/campaigns/queries.ts            # narrow owner-scoped DTO queries
├── types/database.types.ts             # regenerated mechanical Supabase types
supabase/
├── migrations/                          # campaign/item/audit schema, RLS, functions, triggers
└── tests/database/02_campaign_management.test.sql
tests/unit/campaign-validation.test.ts
```

This is a proposed extension of the existing `src/lib/<domain>/{actions,validation}` and `supabase/tests/database` conventions. [VERIFIED: codebase grep] [ASSUMED]

### Pattern 1: Draft Creation Is a Durable Boundary

**What:** Step 1 validates campaign identity/content, derives the owned organization server-side, creates exactly one `draft` campaign, then redirects to its setup route. Step 2 writes PIX configuration and items immediately after each successful command. [VERIFIED: 02-CONTEXT.md]

**When to use:** Always for the Phase 2 creation flow; do not hold an unsaved campaign solely in client state. [VERIFIED: 02-CONTEXT.md]

**Implementation rules:**

- Use an immutable UUID primary key and globally unique immutable slug; content edits cannot update either. [ASSUMED]
- Store an editable required campaign `attribution` field, initially populated from the organization name, rather than making a later organization rename rewrite campaign history. [ASSUMED]
- Permit a nullable PIX key on drafts; publish validation must require a valid key and at least one enabled item. [ASSUMED]
- Use `draft`, `published`, `unpublished`, `closed`, and `archived` as explicit status values, and expose one transition command per user action instead of a generic status field. [ASSUMED]

### Pattern 2: Command Boundary, Not Direct Client DML

**What:** Revoke direct application-role `INSERT`, `UPDATE`, and `DELETE` on `campaigns` and `campaign_items`. Give authenticated owners narrowly typed database commands for create, edit, transition, create-item, edit-item, and disable-item; Server Actions remain the UI's only entry point. [CITED: https://supabase.com/docs/guides/api/securing-your-api]

**When to use:** Every mutation that has tenant, identity, lifecycle, monetary, or future-donation invariants. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server]

**Implementation rules:**

- Derive/check ownership from the authenticated database identity and the Phase 1 private ownership helper; never trust hidden `organization_id`, `role`, `status`, `confirmed_quantity`, or actor inputs. [VERIFIED: 01-03-PLAN.md] [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server]
- Use security invoker by default. If a private security-definer helper is necessary for RLS recursion, use an empty `search_path`, schema-qualify all relations, revoke default `EXECUTE`, and grant only its intended role. [CITED: https://supabase.com/docs/guides/database/functions]
- Give no `anon` grants in Phase 2; Phase 3 owns public-safe projections. [VERIFIED: REQUIREMENTS.md]

### Pattern 3: Item Quantity and Price Are Domain Values

**What:** Store `needed_quantity integer check (needed_quantity > 0)`, `confirmed_quantity integer not null default 0 check (confirmed_quantity between 0 and needed_quantity)`, and `unit_price_cents integer check (unit_price_cents > 0)`. Derive `remaining_quantity = needed_quantity - confirmed_quantity` and fulfillment state for the dashboard. [VERIFIED: .planning/research/STACK.md] [ASSUMED]

**When to use:** On every item command and owner query. [ASSUMED]

**Implementation rules:**

- Format centavos as BRL only for display; never parse/store a JavaScript floating point price. [VERIFIED: .planning/research/STACK.md]
- Reject edits to donation-sensitive fields when `confirmed_quantity > 0`; Phase 4 must be the only later capability allowed to increment it atomically. [ASSUMED]
- Disable with a state/timestamp and retain the item row; never delete a record that needs future fulfillment/history context. [ASSUMED]

### Pattern 4: Database-Owned, Append-Only Audit

**What:** Create `campaign_audit_events` with campaign/org/actor IDs, event type, timestamp, and safe structural metadata. A private trigger function inserts a status event whenever `status` changes and a PIX-change event whenever the stored PIX key changes. [CITED: https://supabase.com/docs/guides/database/functions]

**When to use:** This phase's publication, unpublication, close, archive, and PIX-key updates. [VERIFIED: REQUIREMENTS.md]

**Implementation rules:**

- Allow owners to `SELECT` their campaign's events, but grant no direct client `INSERT`, `UPDATE`, or `DELETE` on the audit table. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]
- Do not duplicate a raw PIX key in `metadata`; store `pix_recipient_changed` and structural before/after status only. [ASSUMED]
- Render audit activity separately from Phase 4 donation activity. [VERIFIED: REQUIREMENTS.md]

### Pattern 5: Typed PIX Key Input

**What:** Present an explicit key type selector and one value field. Normalize and validate to the selected type before persistence. [CITED: https://www.bcb.gov.br/meubc/faqs/p/O-que-e-chave-pix]

**When to use:** Draft setup and every PIX-key edit. [VERIFIED: 02-CONTEXT.md]

**Implementation rules:**

- CPF is 11 unformatted digits with check-digit validation; CNPJ is 14 unformatted digits with check-digit validation. [CITED: https://liftchallenge.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/X_ManualOperacionaldoDICT.pdf]
- Phone uses E.164 and should accept Brazil's `+55` default; email is bounded to 77 characters; random key uses RFC 4122 UUID shape. [CITED: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/IV_RequisitosMinimosparaExperienciadoUsuario.pdf] [CITED: https://liftchallenge.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/X_ManualOperacionaldoDICT.pdf]
- Treat format validation as syntactic only. It does not establish that the key is registered or controlled by this owner because Phase 2 has no DICT/PSP verification integration. [CITED: https://www.bcb.gov.br/estabilidadefinanceira/dict]

### Anti-Patterns to Avoid

- **Client-only wizard draft:** It violates D-02 and loses the campaign identity on refresh/navigation; persist at Step 1. [VERIFIED: 02-CONTEXT.md]
- **A generic `update campaign` form that includes status, organization, slug, or quantity fields:** It creates mass-assignment and lifecycle-bypass paths; expose allow-listed commands. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server]
- **RLS policies without revoking default grants:** A role can still reach operations its grant allows; test grants and policies together. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]
- **Application-only audit inserts:** A missed code path can mutate status/PIX without evidence; use a trigger in the same transaction. [ASSUMED]
- **Radix examples pasted into current Base UI wrappers:** Existing `asChild`/`forceMount` use already fails type checking; use compatible Base UI APIs or repair the primitive intentionally. [VERIFIED: command output on 2026-09-07]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tenant authorization | Route-only ownership checks or browser-supplied organization IDs | Supabase grants + RLS + Phase 1 private ownership helper | Database enforcement protects alternate queries and Server Action mistakes. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| Form/mutation transport | A parallel JSON API for internal admin forms | Next Server Actions, `useActionState`, and `revalidatePath` | This matches the installed App Router pattern and gives one validation/auth boundary. [CITED: https://nextjs.org/docs/app/guides/forms] |
| Validation | HTML constraints or ad hoc string checks | Existing Zod schemas plus small, unit-tested CPF/CNPJ checksum helpers | Browser validation is not authoritative; typed PIX patterns need a single server source of truth. [CITED: https://nextjs.org/docs/app/guides/forms] [CITED: https://liftchallenge.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/X_ManualOperacionaldoDICT.pdf] |
| Lifecycle invariants | A free text status field | Database enum/check plus dedicated transition command | It prevents impossible or unaudited state changes. [ASSUMED] |
| Audit retention | UI-created log rows | Append-only audit table plus trigger | The event is recorded with the data change and direct client rewrites can be denied. [CITED: https://supabase.com/docs/guides/database/functions] |
| Price arithmetic | Decimal floats | Integer centavos | Binary floating point can misrepresent BRL values used later by PIX payloads. [VERIFIED: .planning/research/STACK.md] |

**Key insight:** The campaign database contract must be stricter than the wizard because later public and donation phases will depend on these identities, prices, item states, and audit facts. [ASSUMED]

## Common Pitfalls

### Pitfall 1: Building Phase 2 on an incomplete Phase 1 contract

**What goes wrong:** Campaign policies and typed queries rely on ownership helpers/types that have not reached the Phase 1 design. [VERIFIED: 01-03-PLAN.md]

**How to avoid:** Gate Phase 2 execution on Phase 1's private ownership helper, generated database types, owner/non-owner RLS tests, and a passing baseline. [VERIFIED: 01-03-PLAN.md]

**Warning signs:** `pnpm lint` currently invokes removed `next lint`; `pnpm typecheck` currently fails on Phase 1 component/type setup. [VERIFIED: command output on 2026-09-07]

### Pitfall 2: Treating a Server Action as authorization by itself

**What goes wrong:** A caller can invoke an action or RPC with arbitrary bound/hidden identifiers. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server]

**How to avoid:** Authenticate and authorize inside every action, derive organization membership server-side, and preserve database RLS as defense in depth. [CITED: https://nextjs.org/docs/app/guides/forms] [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Pitfall 3: Accepting any PIX-shaped text

**What goes wrong:** A typo can be persisted and later converted into a payment destination. [ASSUMED]

**How to avoid:** Require key type selection, canonicalize its value, validate documented format/check digits, and audit every change. [CITED: https://www.bcb.gov.br/meubc/faqs/p/O-que-e-chave-pix]

### Pitfall 4: Making archival a delete operation

**What goes wrong:** Deletion breaks the identity/history promise and removes facts later donation records need. [ASSUMED]

**How to avoid:** Archive as a retained status, retain all items/audit rows, and use an explicit confirmation dialog with the UI-contract copy. [VERIFIED: 02-UI-SPEC.md]

### Pitfall 5: Promoting drafts or disabled items through public policy early

**What goes wrong:** Phase 3 public pages can accidentally inherit broad `anon` reads before a deliberate public-safe projection exists. [VERIFIED: REQUIREMENTS.md]

**How to avoid:** Grant no anonymous access in Phase 2; Phase 3 adds published-only public views/queries. [VERIFIED: REQUIREMENTS.md]

### Pitfall 6: Failing to revalidate after mutations

**What goes wrong:** Dashboard cards/detail information remains stale after a save or lifecycle command. [CITED: https://nextjs.org/docs/app/api-reference/functions/revalidatePath]

**How to avoid:** Revalidate the exact dashboard and detail route paths only after the database command succeeds. [CITED: https://nextjs.org/docs/app/api-reference/functions/revalidatePath]

## Code Examples

### Owner-Scoped Server Action

```typescript
// Source: https://nextjs.org/docs/app/guides/forms
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'
import { campaignContentSchema } from './validation'

export async function updateCampaign(
  campaignId: string,
  _previous: unknown,
  formData: FormData,
) {
  await requireUser()
  const parsed = campaignContentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.rpc('update_campaign_content', {
    input_campaign_id: campaignId,
    input_title: parsed.data.title,
    input_description: parsed.data.description,
    input_attribution: parsed.data.attribution,
  })
  if (error) return { message: 'Failed to save changes. Please try again.' }

  revalidatePath('/espaco')
  revalidatePath(`/espaco/campanhas/${campaignId}`)
  return { message: null }
}
```

The RPC, not the bound `campaignId`, decides whether this user can update the row. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server] [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Append-Only Audit Trigger Shape

```sql
-- Source: https://supabase.com/docs/guides/database/functions
create function private.record_campaign_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.campaign_audit_events (
      campaign_id, organization_id, actor_user_id, event_type, metadata
    ) values (
      new.id, new.organization_id, auth.uid(), 'campaign_status_changed',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;

  if old.pix_key is distinct from new.pix_key then
    insert into public.campaign_audit_events (
      campaign_id, organization_id, actor_user_id, event_type
    ) values (
      new.id, new.organization_id, auth.uid(), 'pix_recipient_changed'
    );
  end if;
  return new;
end;
$$;
```

Keep the trigger function in the private schema, schema-qualify every relation, and revoke direct audit table writes from app roles. [CITED: https://supabase.com/docs/guides/database/functions]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` | React `useActionState` | Next's React 19 guidance | Use the existing setup-form pattern for pending and field-error state. [CITED: https://nextjs.org/docs/app/guides/upgrading/version-15] |
| `next lint` | Explicit ESLint CLI command using the flat config | Next.js 16 project behavior | Change the broken `lint` script to an explicit ESLint command before treating `verify:phase` as a gate. [VERIFIED: command output on 2026-09-07] [VERIFIED: eslint.config.mjs] |

**Deprecated/outdated:**

- `next lint`: the current package script fails by treating `lint` as a project directory, so it cannot validate this phase. [VERIFIED: command output on 2026-09-07]
- Radix `asChild` and `forceMount` snippets: they do not match the installed Base UI wrapper types. [VERIFIED: command output on 2026-09-07]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Campaign UUID and public slug are immutable after draft creation. | Pattern 1 | Supporting edited slugs would require redirect/history behavior before Phase 3 stable URLs. |
| A2 | Publishing requires a valid PIX key and at least one enabled item. | Pattern 1 | A looser definition may permit public campaigns that cannot accept a meaningful item donation. |
| A3 | Campaign attribution is an editable campaign snapshot prefilled from the organization name. | Pattern 1 | Reusing only organization name may change historical attribution; persisting it may introduce a field not intended by product. |
| A4 | `closed` and `archived` retain data and stop future donations; only their later public visibility differs. | Pattern 1 | Phase 3 public eligibility and Phase 4 availability rules could conflict. |
| A5 | `confirmed_quantity` belongs on Phase 2 items before Phase 4 donations exist. | Pattern 3 | An alternative ledger-only computation changes the future fulfillment and item-edit guard design. |
| A6 | A private trigger is the appropriate enforcement point for audit rows. | Pattern 4 | A required richer audit payload may instead need controlled commands or an event service. |

## Open Questions

1. **Can a campaign slug ever change?**
   - What we know: Phase 2 requires a public slug and Phase 3 requires a stable public URL. [VERIFIED: REQUIREMENTS.md]
   - What's unclear: Whether an organizer may correct/rename the slug after draft creation. [ASSUMED]
   - Recommendation: Lock it immutable for v1; add redirect/history behavior only as a later, explicit capability. [ASSUMED]

2. **What is the exact difference between closed and archived in public discovery?**
   - What we know: Phase 2 requires both controls, while Phase 3 exposes published campaigns. [VERIFIED: REQUIREMENTS.md]
   - What's unclear: Whether a closed campaign remains public as read-only history or becomes private like an archived one. [ASSUMED]
   - Recommendation: Define that before Phase 3; keep both states unavailable for new donations in Phase 4. [ASSUMED]

3. **Does the campaign need PIX recipient display name/city now?**
   - What we know: The current PIX setup requirement names only a recipient key, while a static QR has other merchant payload fields in the Banco Central manual. [VERIFIED: REQUIREMENTS.md] [CITED: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf]
   - What's unclear: Whether later payload merchant fields can derive safely from campaign attribution/organization data. [ASSUMED]
   - Recommendation: Keep Phase 2 to its required key; make explicit merchant-field sourcing a Phase 4 design decision. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next.js, unit tests | yes | `v24.14.0` | - [VERIFIED: command output on 2026-09-07] |
| pnpm | scripts and project-local CLIs | yes | `11.24.0` | - [VERIFIED: command output on 2026-09-07] |
| Docker | local Supabase database tests | yes | `29.6.2` | - [VERIFIED: command output on 2026-09-07] |
| Supabase CLI | migrations, generated types, pgTAP | project-local package present; sandbox invocation was blocked attempting telemetry under `~/.supabase` | `2.116.0` package pin | Run outside the restricted sandbox or configure its supported telemetry setting; no code fallback. [VERIFIED: package.json] [VERIFIED: command output on 2026-09-07] |

**Missing dependencies with no fallback:** None identified. [VERIFIED: command output on 2026-09-07]

**Missing dependencies with fallback:** None identified. [VERIFIED: command output on 2026-09-07]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner for pure TypeScript helpers; Supabase pgTAP suite for migrations/RLS. [VERIFIED: package.json] [VERIFIED: supabase/tests/database/01_account_ownership.test.sql] |
| Config file | `package.json`; database tests under `supabase/tests/database/`. [VERIFIED: package.json] |
| Quick run command | `pnpm test:unit` currently passes 7 tests. [VERIFIED: command output on 2026-09-07] |
| Full suite command | `pnpm verify:phase`; currently blocked by a broken lint script and existing TypeScript errors. [VERIFIED: package.json] [VERIFIED: command output on 2026-09-07] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAMP-01 | Draft identity/slug validation and owner-only create/edit. | unit + database RLS | `pnpm test:unit`; `pnpm verify:db` | no, Wave 0 |
| CAMP-02 | PIX type/value validation and a PIX-change audit row. | unit + database trigger | `pnpm test:unit`; `pnpm verify:db` | no, Wave 0 |
| CAMP-03 | Allowed lifecycle transitions and status audit events. | database | `pnpm verify:db` | no, Wave 0 |
| CAMP-04 | Content edits preserve id/slug and deny foreign access. | database + unit | `pnpm test:unit`; `pnpm verify:db` | no, Wave 0 |
| ITEM-01 | Positive centavos/quantity and owner-only item creation. | unit + database | `pnpm test:unit`; `pnpm verify:db` | no, Wave 0 |
| ITEM-02 | Item edits reject after confirmed quantity is nonzero. | database | `pnpm verify:db` | no, Wave 0 |
| ITEM-03 | Disable remains retained and unavailable. | database + unit | `pnpm test:unit`; `pnpm verify:db` | no, Wave 0 |
| ADMN-01 | Owner dashboard query returns only own card DTOs. | database + manual UI | `pnpm verify:db` | no, Wave 0 |
| ADMN-02 | Item remaining/fulfillment DTO is correct. | unit + database | `pnpm test:unit`; `pnpm verify:db` | no, Wave 0 |
| SAFE-06 | Audit insert occurs only from protected campaign changes and audit rows cannot be altered. | database allow/deny | `pnpm verify:db` | no, Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test:unit` plus the focused database test when local Supabase is available. [VERIFIED: package.json]
- **Per wave merge:** `pnpm verify:phase` after Wave 0 restores the lint/typecheck baseline. [VERIFIED: package.json] [VERIFIED: command output on 2026-09-07]
- **Phase gate:** Full suite green before `$gsd-verify-work`. [VERIFIED: .planning/config.json]

### Wave 0 Gaps

- [ ] `tests/unit/campaign-validation.test.ts` for slug, centavos, quantity, state, and typed PIX validation. [ASSUMED]
- [ ] `supabase/tests/database/02_campaign_management.test.sql` for table grants, RLS allow/deny, command input guards, lifecycle constraints, edit-after-confirmed rejection, audit trigger, and immutable audit rows. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]
- [ ] Replace `"lint": "next lint"` with an explicit ESLint CLI script using existing `eslint.config.mjs`. [VERIFIED: package.json] [VERIFIED: eslint.config.mjs] [VERIFIED: command output on 2026-09-07]
- [ ] Complete or reconcile the inherited Phase 1 TypeScript errors before declaring a Phase 2 full gate green; do not mask them with `--ignoreBuildErrors` or weakened compiler settings. [VERIFIED: command output on 2026-09-07]
- [ ] Regenerate `src/types/database.types.ts` from the applied Phase 1/2 local schema instead of hand-writing Supabase table/function types. [VERIFIED: 01-03-PLAN.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Reuse Phase 1 Supabase SSR session and call `requireUser` in every action. [VERIFIED: src/lib/auth/require-user.ts] [CITED: https://nextjs.org/docs/app/guides/forms] |
| V3 Session Management | yes | Reuse request-bound SSR cookie client; do not accept bearer tokens from forms. [VERIFIED: src/lib/supabase/server.ts] [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server] |
| V4 Access Control | yes | Least-privilege grants, RLS owner checks, no direct DML, and second-owner denial tests. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| V5 Input Validation | yes | Server-side Zod schemas, integer parsing, bounded text/slug fields, and type-specific PIX validation. [CITED: https://nextjs.org/docs/app/guides/forms] |
| V6 Cryptography | no | Do not hand-roll cryptography or claim PIX-key ownership/verification; Phase 2 stores configuration only. [VERIFIED: REQUIREMENTS.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Foreign campaign/item ID supplied to a Server Action/RPC | Elevation of privilege | Authenticate in the action; database command/RLS verifies owner membership and returns no foreign row. [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server] [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] |
| Direct PostgREST mutation bypasses UI validation | Tampering | Revoke direct app-role mutations and expose bounded commands only. [CITED: https://supabase.com/docs/guides/api/securing-your-api] |
| PIX key changed without trace | Repudiation | Trigger-written append-only audit event plus no audit update/delete grants. [CITED: https://supabase.com/docs/guides/database/functions] |
| Invalid/mistyped PIX key becomes a later payment target | Tampering | Explicit type selector, canonical format/checksum validation, and change audit; no false DICT verification claim. [CITED: https://www.bcb.gov.br/meubc/faqs/p/O-que-e-chave-pix] |
| Draft/item/audit data becomes anonymous-readable early | Information disclosure | No `anon` grants until Phase 3 defines public-safe projections and policies. [VERIFIED: REQUIREMENTS.md] |

## Sources

### Primary (HIGH confidence)

- Local repository `package.json`, source, migration, test files, UI spec, and Phase 1 plans - existing stack, conventions, commands, and current baseline. [VERIFIED: codebase grep]

### Secondary (MEDIUM confidence)

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - grants, policies, tests, and security-definer requirements. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) - invoker/definer defaults, pinned search paths, and function privileges. [CITED: https://supabase.com/docs/guides/database/functions]
- [Next.js Forms](https://nextjs.org/docs/app/guides/forms) and [use server](https://nextjs.org/docs/app/api-reference/directives/use-server) - action form inputs, validation, and per-action authorization. [CITED: https://nextjs.org/docs/app/guides/forms] [CITED: https://nextjs.org/docs/app/api-reference/directives/use-server]
- [Banco Central PIX key FAQ](https://www.bcb.gov.br/meubc/faqs/p/O-que-e-chave-pix), [current initiation manual](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf), and [PIX user-experience requirements](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/IV_RequisitosMinimosparaExperienciadoUsuario.pdf) - key categories, static QR prerequisites, and telephone convention. [CITED: https://www.bcb.gov.br/meubc/faqs/p/O-que-e-chave-pix]
- [Banco Central DICT operational manual](https://liftchallenge.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/X_ManualOperacionaldoDICT.pdf) - CPF/CNPJ, email, phone, and random-key format details; validate against the current DICT specification before public PIX launch. [CITED: https://liftchallenge.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/X_ManualOperacionaldoDICT.pdf]
- npm registry - current version checks for existing package names; no package is recommended for installation in this phase. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- No third-party/community source was used for a locked implementation decision. [VERIFIED: research-plan execution]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all recommendations reuse local dependencies and documented Next/Supabase primitives. [VERIFIED: package.json] [CITED: https://nextjs.org/docs/app/guides/forms]
- Architecture: MEDIUM - database/RLS/server-action design is documented, while lifecycle semantics and campaign identity policy need product confirmation. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] [ASSUMED]
- Pitfalls: HIGH - baseline failures are reproduced locally and security pitfalls are documented by primary framework/provider docs. [VERIFIED: command output on 2026-09-07] [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

**Research date:** 2026-09-07
**Valid until:** 2026-10-07 for framework/pattern guidance; recheck Banco Central PIX documentation before Phase 4 implementation. [ASSUMED]
