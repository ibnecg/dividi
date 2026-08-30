# Architecture Research

**Domain:** Multi-tenant public donation campaigns with self-confirmed PIX payments
**Researched:** 2026-08-30
**Confidence:** MEDIUM

## Recommended Architecture

Build Kundividi as a modular monolith: one Next.js App Router application deployed to Vercel, backed by one Supabase project for Auth and Postgres. This is the correct boundary for v1. It keeps public browsing, organization administration, PIX payload generation, and the only consistency-critical operation (item confirmation) in one deployable system and one transactional database.

Do not introduce queues, workers, payment-provider adapters, a separate API service, or real-time infrastructure in v1. The product explicitly has no payment webhook, and Vercel Hobby functions are request-driven with finite included usage; Hobby cron is only daily and has coarse timing. Expiring a pending item reservation must therefore be handled lazily inside the next reservation/confirmation transaction, not by a required background job.

### System Overview

```
Browser
  |
  +--> Public routes: discovery, campaign, donation form, QR display
  |       |                         |
  |       |                         +--> POST /api/public/donations/*
  |       |                                  |
  |       v                                  v
  |   Server Components                 Donation domain service
  |       |                                  |
  +--> Admin routes: campaigns, items, activity
          |                                  |
          v                                  v
      Auth/tenancy guard --------------> Admin domain service
                                             |
                                  Supabase Auth + Postgres
                                  |          |          |
                           RLS policies   RPCs     immutable donation ledger
                                             |
                                      PIX payload builder
                                             |
                                  QR bitmap rendered in browser
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|---|---|---|
| Public presentation | Public campaign discovery, campaign detail, item availability, custom-value form, copy-and-paste payload, QR display | Public query service and public donation API only |
| Authentication and tenancy | Cookie session lifecycle; resolve the signed-in user; enforce membership/ownership for every protected read and mutation | Supabase Auth, RLS-backed admin queries, admin domain service |
| Organization/admin domain | Create/edit organizations, campaigns, PIX receiver details, campaign items, and activity views | Auth/tenancy, Postgres through authenticated client/RPC |
| Campaign publication domain | Own campaign lifecycle (`draft`, `published`, `closed`) and the public projection of only published campaigns/items | Admin domain, public query service |
| Donation/reservation domain | Create short-lived item reservations or custom donation intents, expire stale reservations lazily, and confirm exactly once | Public donation API, PostgreSQL RPC, immutable donation ledger |
| PIX generation | Validate/sanitize receiver data, build BR Code/PIX `copia e cola` payload from a frozen donation snapshot, calculate CRC, expose a QR-renderable string | Donation domain; no bank or PIX API in v1 |
| Database security | Referential integrity, money/quantity checks, RLS, indexes, and atomic confirmation functions | All domain services |

### Data Model Implications

Use integer minor units (`amount_cents`) for money and UUID primary keys. Do not derive authorization from a campaign identifier passed by the browser.

| Table/entity | Essential fields and constraints | Ownership/visibility |
|---|---|---|
| `profiles` | `id -> auth.users`, display metadata | User owns own profile |
| `organizations` | `id`, `name`, `slug`, `created_by` | Owner/admin only |
| `organization_members` | `organization_id`, `user_id`, `role`; unique pair | Enables present owner and future team roles |
| `campaigns` | `organization_id`, `slug`, `status`, title/content, PIX receiver snapshot/configuration, `published_at` | Organization members manage; public reads only published campaigns |
| `campaign_items` | `campaign_id`, name, `target_quantity > 0`, `unit_amount_cents > 0`, `confirmed_quantity >= 0` | Public reads safe fields only; organization members manage |
| `donation_attempts` | opaque public reference, campaign/item nullable, `kind` (`item`/`custom`), amount snapshot, PIX payload snapshot, `status`, `expires_at`, donor fields, confirmation timestamps | Public creation/confirmation only through constrained RPC/API; PII never on public list routes |
| `donations` | append-only confirmed ledger keyed one-to-one to `donation_attempts`, campaign/item snapshots, amount, optional donor details | Admin reads only, never update/delete in ordinary application paths |

Treat `donation_attempts` as the reservation record. An item attempt starts as `reserved` with a short `expires_at`; a custom attempt starts as `pending` and has no quantity effect. The displayed availability is `target_quantity - confirmed_quantity - active_reservations`, where active means `reserved` and not expired. A reservation stores snapshots of item name, amount, and PIX receiver/payload so later edits do not alter what a donor saw.

The campaign item primary row is the serialization point. Create an index for every tenant/RLS and public lookup path, including `organization_members(user_id, organization_id)`, `campaigns(slug)`/published discovery ordering, `campaign_items(campaign_id)`, and `donation_attempts(item_id, status, expires_at)`.

### Authorization Model

Use Supabase Auth with cookie-based server-side rendering and `@supabase/ssr`. Enable RLS on every exposed table, explicitly revoke unused grants, and write separate `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies. Organization policies must test membership via `auth.uid()`; public policies must expose only published campaign/item fields. Index the columns used by those policies.

Route protection is defense in depth, not the authorization boundary. A route/layout redirect improves UX, but every Server Action, Route Handler, query service, and RPC must independently resolve the current user and verify membership for the target organization. Keep the Supabase service-role key out of browsers and, ideally, avoid it for ordinary app operations entirely.

For anonymous donation writes, expose narrowly parameterized database functions (or have the Route Handler invoke the same functions) rather than granting anonymous users generic insert/update access to donation tables. A `SECURITY DEFINER` function must have a fixed `search_path`, validate that the campaign is published and the item belongs to it, accept only the allowed donor fields, and be granted only the minimum execute permission.

## Data Flow

### Direction of Trust and Data

```
Public browser --> public Next.js route/API --> constrained donation RPC --> Postgres
Admin browser  --> protected Next.js action   --> authenticated/RLS query --> Postgres
Postgres       --> result DTO                 --> Next.js server           --> browser

Never: browser --> service-role secret --> database
Never: public browser --> direct generic update of item quantities
Never: payment QR display --> assumed proof of payment
```

### Public Discovery and Campaign Read

1. A Server Component reads only the public projection of `published` campaigns and available item data.
2. Cache campaign discovery conservatively for low cost, but render donation availability dynamically or use short revalidation. A stale count may be shown as a UX hint only; the reservation RPC is authoritative.
3. The browser uses client components only for selection, custom amount validation, QR rendering, copying payload text, and form submission.

### Item Donation and PIX Generation

1. The donor selects an item. The public API validates the campaign/item route parameters and calls `reserve_item_donation`.
2. The RPC locks the item row, marks its expired reservations as expired, verifies the campaign is published and capacity remains, then inserts one short-lived `reserved` attempt with a random opaque reference and frozen price/PIX fields.
3. The server builds the BR Code payload from that frozen snapshot and returns only the attempt reference, amount, expiry, and payload. The browser turns the payload into a QR image and offers the same payload for copy/paste.
4. QR issuance does not confirm a donation. The UI must state that only the donor's explicit confirmation changes campaign progress.

### Confirmation: One Atomic Transaction

1. The donor submits the opaque attempt reference, an idempotency key, and optional name/cellphone/message to the public confirmation endpoint.
2. `confirm_donation` locks the attempt and, for an item, the same item row. It rejects expired/cancelled attempts and returns the existing result if already confirmed.
3. It transitions the attempt to `confirmed`, increments `campaign_items.confirmed_quantity`, and inserts exactly one immutable `donations` row in the same transaction. The item is unavailable when `confirmed_quantity + active_reservations >= target_quantity`.
4. The response invalidates the affected public campaign path and returns the receipt state. Repeated clicks/retries cannot add a second donation because the attempt has a unique ledger relation and confirmation transition is conditional.

This avoids the classic read-count-then-write race. PostgreSQL re-evaluates an `UPDATE` predicate after a concurrent row update at the usual Read Committed isolation level, but the RPC should still take row locks and perform all related writes transactionally because it owns a multi-table state transition.

### Custom-Amount Donation

Custom donations create a `pending` attempt with a validated positive `amount_cents` and a frozen PIX payload, but no item ID and no quantity reservation. Confirmation inserts one ledger row without touching `campaign_items`. Keep the custom amount limit and message/phone lengths server-validated to control abuse and accidental input errors.

## Recommended Project Structure

```
src/
├── app/
│   ├── (public)/                 # discovery and campaign routes
│   ├── (admin)/admin/            # authenticated organization administration
│   └── api/public/donations/     # reserve and confirm route handlers
├── features/
│   ├── auth/                     # session and route/data guards
│   ├── organizations/            # admin tenancy operations
│   ├── campaigns/                # lifecycle, item CRUD, public DTOs
│   ├── donations/                # request schemas, services, receipts
│   └── pix/                      # pure BR Code payload builder/parser tests
├── lib/
│   ├── supabase/                 # browser, server, and middleware clients
│   ├── validation/               # shared input schemas
│   └── money.ts                  # cent-value conversion and formatting
└── components/                   # route-independent UI components
supabase/
├── migrations/                   # schema, RLS, functions, indexes
└── tests/                        # pgTAP/RLS and RPC concurrency tests
```

Keep framework routes thin. They validate transport input, call a feature service, map domain errors to HTTP/UI states, and revalidate public paths. The domain layer owns permitted transitions; SQL migrations/RPCs own database invariants. This prevents admin and public routes from independently implementing donation logic.

## Patterns to Follow

### Transactional State Machine at the Database Boundary

**What:** Model attempts as explicit states (`reserved`, `pending`, `confirmed`, `expired`, `cancelled`) and permit transitions only through two RPCs: reserve and confirm.

**When to use:** Always for item capacity and donation confirmation. It is needed even without an actual PIX provider because visitors may submit simultaneously or retry.

**Trade-off:** SQL/RPC testing is more involved than a direct ORM update, but it concentrates correctness in the only place that can make concurrent writes atomic.

```sql
-- Sketch only: actual function also validates published campaign and expires old holds.
update campaign_items
set confirmed_quantity = confirmed_quantity + 1
where id = p_item_id
  and confirmed_quantity < target_quantity
returning id;
```

### Public Projection Separate from Admin Data

**What:** Shape public campaign queries/DTOs to contain only published campaign content, safe item data, and aggregate progress; do not reuse an admin query with fields hidden in React.

**When to use:** Every anonymous route and discovery page.

**Trade-off:** Some duplicated mapping code, in exchange for no accidental exposure of donor PII, draft campaigns, internal notes, or organization metadata.

### Pure, Deterministic PIX Builder

**What:** Build and validate the BR Code payload in a small pure server-side module, then render the returned string into a QR image. Snapshot the exact payload on the attempt.

**When to use:** Every amount-specific payment instruction.

**Trade-off:** This supports static PIX and self-confirmation cheaply, but cannot prove settlement. Payment-provider/webhook reconciliation is a later bounded integration, not an implication of QR generation.

## Vercel Free-Tier Constraints

| Concern | v1 approach | Do not do |
|---|---|---|
| Compute | Short Server Components, Route Handlers, and Server Actions; no long work per request | Generate QR images remotely or process media in a function |
| Background work | Lazy expiration in database transactions; manual/admin status changes | Depend on a queue, polling process, or sub-daily Hobby cron |
| Database connections | Prefer Supabase SSR/Data API clients; use Supavisor transaction pooling if using a direct Postgres client from serverless functions | Maintain a process-local connection pool or direct persistent connections per invocation |
| Caching | Cache public catalog content, dynamically validate capacity in RPC | Trust static page availability for transaction decisions |
| Secrets | Vercel environment variables; browser gets only public Supabase credentials | Put service-role/database secrets in client bundles or PIX management UI data unnecessarily |
| Abuse/cost | Schema validation, rate limits on anonymous reserve/confirm endpoints, small payloads, and no file uploads in v1 | Anonymous unlimited writes, image uploads, or email/SMS workflows |

Vercel's Hobby plan is intended for personal/small-scale projects and has finite included usage; verify its non-commercial-use restriction against the planned operation before production launch. The architecture stays migration-friendly: moving to a paid plan or adding a queue/webhook later changes adapters, not the campaign/donation state model.

## Build-Order Implications

1. **Foundation and tenant security:** Create Supabase schema/migrations, Auth SSR clients, `organizations`/`organization_members`, RLS policies, and tenant tests. All later private work depends on this boundary.
2. **Admin campaign lifecycle:** Build protected organization, campaign, item, PIX receiver configuration, and publication flows. Establish the data that public pages may safely project.
3. **Public discovery and campaign presentation:** Add published-only catalog/detail queries and responsive donor UX. Keep it read-only first so RLS/public DTO mistakes are found before money-related writes.
4. **PIX attempt and reservation:** Implement the pure BR Code builder, reserve/custom-attempt endpoint, expiration semantics, QR/copy UI, input validation, and abuse controls. Test against known-valid PIX payload fixtures.
5. **Atomic confirmation and activity:** Add idempotent confirmation RPC, immutable ledger, quantity progression, stale-reservation behavior, admin activity/read models, and path revalidation. Concurrency tests belong here and are release-blocking.
6. **Hardening and launch verification:** Test RLS for cross-organization access, public/draft leakage, duplicate confirmation, concurrent last-item reservation, expired reservation, and Vercel usage/error observability.

The order is deliberate: authentication/RLS and publication state define the permissions needed by every later query; donation state is built only after the campaign model is stable; confirmation is last because it depends on the reservation and ledger contracts. Do not build dashboard aggregates before the immutable ledger exists.

## Anti-Patterns

### Client-Side Quantity Decrement

**What people do:** Read remaining stock on the public page and decrement it in browser state or with a broad table update after confirmation.

**Why it is wrong:** Two donors can see the last item and both confirm; a malicious browser can modify the item/campaign identifier or quantity.

**Do this instead:** Route every reservation/confirmation through a constrained server endpoint and one transactional RPC that locks the item and has conditional state transitions.

### Authorization by Hidden UI or Route Layout Alone

**What people do:** Hide admin buttons or redirect in an admin layout, then call generic update actions.

**Why it is wrong:** Next.js has multiple entry points; direct Server Action/API calls can bypass UI assumptions, and a tenant ID supplied by the client is not authority.

**Do this instead:** Check the session and organization membership in every mutation/query service and enforce the same rule in RLS.

### Treating QR Creation as Payment Confirmation

**What people do:** Mark a donation confirmed when a QR code is generated or scanned.

**Why it is wrong:** A static PIX payload supplies payment instructions only; v1 has no bank/provider event to establish settlement.

**Do this instead:** Record a pending/reserved attempt, require explicit donor confirmation, label it clearly, and preserve the state model so a verified webhook can be introduced later.

### Required Expiry Worker on Hobby

**What people do:** Design reservations that only release when an always-on worker or frequent cron runs.

**Why it is wrong:** Vercel Hobby is not a reliable high-frequency scheduler; unavailable job execution can block item availability.

**Do this instead:** Expire holds lazily inside the lock-protected reserve/confirm operations. A future queue can optimize cleanup without changing correctness.

## Scaling Considerations

| Scale | Architecture adjustment |
|---|---|
| 0-1K active users | Single Vercel/Supabase deployment, server-rendered public pages, RPC transaction boundary, basic endpoint rate limits |
| 1K-100K active users | Add indexes from query telemetry, cache public discovery more aggressively, use Supavisor transaction pooling for direct DB access, and add provider-backed payment verification if operationally required |
| 100K+ active users | Separate read models/search and async notification/reconciliation adapters only after measured bottlenecks; keep the donation ledger and item-state transaction together in Postgres |

The first bottleneck is likely anonymous endpoint abuse or a hot campaign item's row-lock contention, not application-server CPU. Rate-limit reservation creation, keep lock transactions short, and present a retry/"just claimed" result when the last item is unavailable. The second is public discovery/query volume; solve it with cacheable public projections, not early microservices.

## Sources

- [Next.js App Router](https://nextjs.org/docs/app) and [authentication guidance](https://nextjs.org/docs/app/guides/authentication) (official; MEDIUM confidence via verified web research)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), and [serverless connection pooling](https://supabase.com/docs/guides/database/connecting-to-postgres) (official; MEDIUM confidence via verified web research)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [function limits](https://vercel.com/docs/functions/limitations), and [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) (official; MEDIUM confidence via verified web research)
- [PostgreSQL `UPDATE` documentation](https://www.postgresql.org/docs/current/sql-update.html) (official; MEDIUM confidence via verified web research)
- [Banco Central BR Code manual](https://www.bcb.gov.br/content/config/Documents/BR_Code_MANUAL_Version_2_May_2020.pdf) and [PIX initiation standards manual](https://liftchallenge.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf) (official; MEDIUM confidence via verified web research)

---
*Architecture research for: Kundividi*
*Researched: 2026-08-30*
