# Project Research Summary

**Project:** Kundividi  
**Domain:** Multi-tenant public donation campaigns with static PIX payments in Brazil  
**Researched:** 2026-08-30  
**Confidence:** MEDIUM

## Executive Summary

Kundividi is a public, item-based donation platform: organizations publish campaigns, donors select a specific need or enter an unrestricted amount, receive a PIX QR/copy-and-paste payload, and self-report payment. The recommended v1 is a TypeScript modular monolith: Next.js App Router on Vercel with Supabase Auth/Postgres/RLS. Keep public discovery, protected administration, PIX payload construction, and the inventory-critical donation flow in one application and one transactional database.

The product's key distinction is funding a concrete item with visible remaining quantity, alongside a clearly separate custom-amount path. Static PIX QR generation is appropriate for a low-cost v1, but it is payment instruction only. A donor action must be labelled and stored as `self_confirmed`, never bank-verified or settled; a PSP/webhook integration is a later product expansion.

The highest risks are false payment claims, concurrent over-allocation, tenant/PII leakage, QR destination tampering, anonymous endpoint abuse, and free-tier availability assumptions. Mitigate them through integer-centavo snapshots, server-created short-lived donation attempts, idempotent atomic Postgres RPCs, RLS plus server-side ownership checks, explicit public data projections, immutable audit events, and a synchronous request-driven design that does not depend on cron or function memory.

## Key Findings

### Recommended Stack

Use one Next.js App Router application, React, and TypeScript, deployed to Vercel and backed by Supabase Postgres/Auth. The v1 architecture should use Server Components for public reads, protected Server Actions for admin mutations, and narrow Route Handlers/RPCs for anonymous donation commands. Pin versions in the lockfile; Next.js 16 requires Node.js 20.9+ and TypeScript 5.1+.

**Core technologies:**
- **Next.js App Router 16.3.3 / React 19.2.8:** public SSR, private admin routes, server mutations, and small endpoints in one deployment.
- **TypeScript 7.0.2:** explicit tenant IDs, donation states, and centavo-based monetary types.
- **Supabase Postgres + Auth, `@supabase/supabase-js` 2.112.4, `@supabase/ssr` 0.12.4:** cookie sessions, migrations, relational transactions, and RLS as the tenant boundary.
- **Zod 4.5.4:** authoritative validation of every public/admin command; React Hook Form 7.87.0 only for substantial admin forms.
- **`qrcode` 1.5.4 plus an internal `pix-brcode` module:** render a server-generated static BR Code payload as QR and expose the same payload for copy/paste. The internal builder owns PIX validation, CRC16, snapshots, and fixtures.
- **Tailwind 4.3.3 and selected shadcn/ui source components:** responsive public/admin UI without a separate design-system runtime.

Vercel Hobby is suitable only for development/pilot use under its plan restrictions, not an assumed operational hosting plan. Supabase Free pausing after inactivity also prevents any availability promise. Production launch needs an explicit compliant hosting and database-plan decision.

### Expected Features

**Must have (table stakes):**
- Single-owner organization accounts and organization-scoped protected administration.
- Campaign creation, draft/publish/archive lifecycle, public identity, stable URL, simple discovery, sharing, and report/unpublish controls.
- Item registry with price, requested/remaining quantity, and fulfilled state.
- Separate item and unrestricted custom-amount donation paths.
- Static PIX QR plus Pix Copia e Cola, recipient/amount context, and explicit donor self-confirmation.
- Public progress and a private owner activity view, with optional donor name, phone, and message private by default.
- Privacy notice, consent separation, and basic public safety/moderation path.

**Should have (differentiators):**
- Item-first donation flow and per-item fulfilment visibility as the primary CTA.
- An honest, visible self-confirmed status that does not imply settlement.
- A mobile-ready, shareable campaign page with robust metadata.

**Defer (v2+):**
- PSP/dynamic PIX integration, signed webhooks, reconciliation, verified payment states, refunds, and receipts.
- Team roles/invitations, donor accounts, recurring giving, CRM/CSV automation, referral mechanics, paid discovery, and public donor feeds.

### Architecture Approach

Build a modular monolith with thin framework routes, feature services for domain transitions, and SQL migrations/RPCs that own database invariants. Separate public projections from private/admin data. `donation_attempts` is the short-lived reservation/payment-intent record; `donations` is an immutable one-to-one confirmed ledger. Item attempts reserve capacity, custom attempts do not. The item row and a transactional RPC are the only authority for capacity and confirmation.

**Major components:**
1. **Auth and tenancy:** Supabase SSR session handling, organization membership checks, and RLS-backed access.
2. **Campaign/admin domain:** organization, campaign, PIX receiver, item CRUD, publication lifecycle, private activity, corrections, and audit events.
3. **Public presentation/query domain:** published-only discovery, campaign detail, safe item availability, sharing, and report flow.
4. **Donation/reservation domain:** short-lived item reservations or custom intents, lazy expiry, idempotent confirmation, immutable ledger, and revalidation.
5. **PIX module:** deterministic BR Code builder from a frozen intent snapshot, CRC validation, QR-ready payload output.
6. **Database security boundary:** schema checks, indexes, RLS, constrained public RPCs, and concurrency-safe state transitions.

### Critical Pitfalls

1. **Representing self-confirmation as a verified payment** - keep a distinct `self_confirmed` state and status breakdowns; future provider verification must transition records additively.
2. **Over-allocating items through concurrent/repeated confirmation** - use server-created opaque intents, unique/idempotent confirmation, row locks/conditional updates, and an atomic ledger-plus-inventory transaction.
3. **Generating a visually valid but incorrect or mutable PIX code** - build payloads server-side from integer-centavo frozen snapshots; fixture-test CRC/field limits and manually test representative banking apps.
4. **Cross-tenant access or public PII/draft leakage** - derive tenant from the server session, enforce RLS and scoped queries, maintain public allowlist DTOs, and test second-organization denial paths.
5. **Abuse, impersonation, and irreversible operations** - rate-limit attempts/confirmations, show recipient and amount, audit PIX key changes, retain correction/disable events, and provide report/takedown handling.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation, Tenancy, and Domain Invariants
**Rationale:** Every private/admin feature and anonymous mutation depends on the data, authorization, money, privacy, and state contracts. This phase must establish them before UI breadth creates incompatible records.
**Delivers:** Next.js/Supabase foundation; SSR auth; organizations/single-owner membership; migrations; RLS/grants; integer-centavo types; campaign/item/donation-attempt/ledger schema; publication and donation state vocabulary; initial audit/event model; RLS and cross-tenant tests.
**Addresses:** Organization ownership, campaign lifecycle base, private data boundary, safe handling of optional donor data.
**Avoids:** Tenant IDOR, float money, treating `self_confirmed` as paid, public PII leakage, and Vercel-incompatible durable-state assumptions.

### Phase 2: Organizer Campaign and Item Management
**Rationale:** Public presentation and donation instructions need stable owner-authored, publishable campaign, item, and PIX-recipient data.
**Delivers:** Protected campaign creation/editing; item registry; PIX receiver management; draft/publish/pause/close/archive controls; private activity shell; mutation validation; PIX-key change confirmation and audit event.
**Addresses:** Campaign identity, item registry, lifecycle, and owner administration.
**Avoids:** Route-only authorization, mutable unaudited PIX details, and accidental public drafts.

### Phase 3: Public Discovery and Trustworthy Campaign Pages
**Rationale:** A read-only public slice validates published-only projections, mobile sharing, and privacy before money-related anonymous writes are introduced.
**Delivers:** Published-only browse/search and campaign detail; item availability/progress display; custom-amount entry; share/copy and metadata; recipient context; privacy notice; report-campaign path.
**Addresses:** Public discovery, direct sharing, visible item fulfilment, transparent status context, and public safety controls.
**Avoids:** Admin-query reuse, PII/draft exposure, deceptive availability, and impersonation with no report path.

### Phase 4: PIX Attempts, Reservations, and Confirmation
**Rationale:** This is the consistency-critical vertical slice and relies on the campaign/public contracts established earlier.
**Delivers:** Pure static BR Code builder with fixture tests; reserve-item and custom-intent endpoints; frozen PIX snapshots; QR/Copia e Cola UI; lazy expiry; idempotent atomic confirmation RPC; immutable donation ledger; quantity progression; receipt/result UI; admin activity data and public revalidation.
**Addresses:** Fixed/custom PIX payment handoff, self-confirmation, item fulfilment, public progress, and activity tracking.
**Avoids:** QR-as-payment assumptions, double submissions, negative inventory, client-side mutations, raw public writes, and invalid PIX payloads.

### Phase 5: Operational Hardening and Launch Readiness
**Rationale:** Discoverable anonymous payment surfaces need explicit abuse, privacy, audit, and hosting validation before release.
**Delivers:** Rate limits and quotas; message/field restrictions; correction/reversal, pause/disable, and report response workflows; observability with PII redaction; concurrency/replay/expiry/RLS/public-projection test suite; production hosting/database-plan decision and runbook.
**Addresses:** Public safety, moderation, campaign correction, operational transparency, and free-tier constraints.
**Avoids:** Spam claims, irrecoverable mistakes, privacy incidents, and an unsupported Hobby deployment.

### Phase Ordering Rationale

- Make authorization, state semantics, and immutable records first: neither a campaign dashboard nor a public donation flow can safely backfill them.
- Build publishable organizer data before public reads, and public reads before anonymous donation writes, so every public field is deliberate.
- Reserve/confirm after the PIX and campaign contracts are fixed; the transaction is a bounded domain core, not UI logic.
- Keep operational hardening as a release gate, but introduce testable guardrails from Phases 1 and 4 rather than postponing security design.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Confirm current Supabase RLS/RPC patterns and decide the privacy controller/operator, legal basis, retention, and deletion procedure with Brazilian counsel/DPO.
- **Phase 4:** Research current Banco Central BR Code fixtures, payload edge cases, and manual banking-app acceptance; define exact reservation duration and abuse-control implementation.
- **Phase 5:** Recheck current Vercel/Supabase plan eligibility and limits, and define the moderation/incident operating model before public launch.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Standard authenticated CRUD and lifecycle patterns once Phase 1 tenancy/RLS contracts are set.
- **Phase 3:** Standard server-rendered public catalog/detail, responsive sharing, and projection-based read patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Official product documentation and package registries were checked, but service pricing/terms and pre-1.0 SSR package behavior must be rechecked at launch. |
| Features | MEDIUM | Strong alignment among product brief, PIX guidance, and primary competitor observations; legal/compliance scope remains outside feature research. |
| Architecture | MEDIUM | Sound established Next.js/Supabase/Postgres patterns, with correctness centered on researched transactional/RLS rules. |
| Pitfalls | MEDIUM | Official PIX, ANPD, OWASP, and hosting guidance supports the major risks; exact operational/legal controls need project-specific validation. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Brazilian legal/compliance position:** validate LGPD roles, legal basis, retention/deletion, incident response, consumer/charitable-fundraising obligations, and required public disclosures before launch.
- **Hosting suitability:** Vercel Hobby's personal/non-commercial restriction and Supabase Free inactivity pause conflict with a continuously available organizational service; select a compliant paid or alternative production option.
- **PIX interoperability:** use official/golden BR Code fixtures and manual testing in representative banking apps, including accents, field limits, QR decoding, and copy/paste.
- **Self-confirmation policy:** specify the organizer correction/reversal process and communicate that item fulfilment is based on donor-reported claims, not settlement evidence.
- **Abuse controls:** choose measured rate-limit storage/thresholds, reservation TTL, campaign quota, moderation ownership, and reporting SLA during Phase 5 planning.

## Sources

### Primary (official guidance)
- Banco Central do Brasil PIX initiation standards and PIX FAQ - static BR Code requirements, static/dynamic distinction, QR payment conventions.
- Supabase Auth, RLS, and serverless connection documentation - tenant/security architecture.
- Next.js App Router and Vercel framework/function/plan documentation - deployment/runtime constraints.
- ANPD data-subject and treatment-agent guidance - LGPD implications.
- OWASP multi-tenant security and IDOR guidance - authorization testing and isolation risks.

### Secondary (product research)
- Vakinha, GoFundMe, and Donately documentation/product observations - campaign UX, sharing, progress, organizer administration, and public trust conventions.

---
*Research completed: 2026-08-30*  
*Ready for roadmap: yes*
