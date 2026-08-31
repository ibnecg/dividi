# Walking Skeleton — Kundividi

**Phase:** 1
**Generated:** 2026-08-30

## Capability Proven End-to-End

> A verified owner can sign in, create exactly one organization through a caller-scoped Supabase RPC, and see that organization in an RLS-scoped private workspace after a full browser refresh.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.3.3 App Router with React 19.2.8 and TypeScript 7.0.2 | Runs as request-driven serverless UI on Vercel and keeps protected route decisions on the server. |
| Data layer | Supabase Postgres with versioned SQL migrations, generated database types, and pgTAP policy tests | Relational membership and RLS provide the durable tenant boundary without an always-on service. |
| Auth | Supabase email/password Auth with verified-email policy and `@supabase/ssr` PKCE cookies | Supabase owns credential recovery and cookie rotation; server boundaries validate the user instead of trusting browser session data. |
| Tenancy | `organization_members` owner rows plus reusable private membership lookup and RLS | Implements D-14 through D-16 and lets later organization-owned tables inherit the same policy boundary. |
| Organization bootstrap | Caller-scoped `create_organization(input_name)` RPC | The database derives `auth.uid()` and atomically creates the organization and owner membership without accepting role or tenant identifiers from the client. |
| Deployment target | Vercel-compatible Next.js application backed by hosted Supabase; local full-stack command `pnpm dev:local` | Preserves free-tier/serverless constraints and supplies a repeatable local development path. |
| Directory layout | App Router under `src/app`, boundary helpers under `src/lib`, generated UI under `src/components/ui`, migrations/tests under `supabase/` | Matches the Phase 1 research and creates conventions later phases can reuse. |

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, Node test runner, Supabase CLI)
- [ ] Routing — signup, confirmation, sign-in, setup, workspace, and recovery routes
- [ ] Database — organization and membership write through RPC plus RLS-scoped reads
- [ ] UI — signup and organization forms wired to server actions and Supabase
- [ ] Deployment — `pnpm dev:local` for local full-stack startup and `supabase db push` for the linked development project

## Out of Scope (Deferred to Later Slices)

- Campaign, item, donation, PIX, reporting, and publication controls are delivered by later roadmap phases.
- Team invitations, role management, organization switching, email change, MFA, and advanced account recovery remain outside Phase 1.
- Payment-provider verification, background workers, and service-role browser access are not part of the skeleton.

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without replacing its membership-backed authorization boundary:

- Phase 2: An owner creates and manages campaigns and requested items inside the private workspace.
- Phase 3: A visitor discovers and views public-safe published campaign data.
- Phase 4: A donor creates and self-confirms an exact PIX donation attempt.
- Phase 5: Public forms gain abuse controls and deployment limits are made operationally explicit.
