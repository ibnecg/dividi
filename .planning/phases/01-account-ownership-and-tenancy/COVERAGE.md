# Phase 1 External API and Source Coverage

## External API Integration Decision

Phase 1 integrates Supabase Auth, PostgREST/RPC, Postgres migrations, and the `@supabase/ssr` SDK. This is an external SDK/service surface, so the capability matrix below is the binding coverage contract for implementation and verification.

## Supabase Capability Matrix

| Surface | Capability | Phase 1 disposition | Planned caller / artifact | Verification |
|---|---|---|---|---|
| Auth | Email/password signup | Implement | `signUpAction` in `src/app/actions/auth.ts` | Local/hosted signup smoke plus validation tests |
| Auth | Email confirmation resend | Implement | `resendConfirmationAction` | Verify-email UI smoke; generic provider-safe result |
| Auth | PKCE confirmation exchange | Implement | `GET` in `src/app/auth/confirm/route.ts` | Safe redirect unit tests plus local email-link smoke |
| Auth | Password sign-in | Implement | `signInAction` | Sign-in, refresh, and invalid-credential smoke |
| Auth | Current trusted user lookup | Implement | `requireVerifiedUser` using `getUser()` or validated claims | Protected-route refresh and invalid-cookie smoke |
| Auth | Current-session signout | Implement | `signOutAction` | Account-menu logout and repeat-logout smoke |
| Auth | Password reset request | Implement | `requestPasswordResetAction` | Enumeration-neutral result for existing/unknown email |
| Auth | Password update | Implement | `updatePasswordAction` | Recovery-link and password update smoke |
| Auth | OAuth/social providers | Excluded | None | Outside D-01 through D-04 |
| Auth | MFA, email change, admin user API | Excluded | None | Explicitly deferred by D-04 |
| SSR | Browser client | Implement | `src/lib/supabase/client.ts` | Typecheck; publishable-key-only source assertion |
| SSR | Cookie-aware server client | Implement | `src/lib/supabase/server.ts` | Typecheck and full-refresh smoke |
| SSR | Request-boundary cookie refresh | Implement | `src/lib/supabase/proxy.ts`, `src/proxy.ts` | Refresh smoke and build |
| SSR | Route authorization inside proxy | Excluded | None | Authorization remains in protected server boundaries |
| PostgREST | RLS-scoped organization select | Implement | Admin routing and workspace server components | pgTAP own/foreign visibility plus not-found smoke |
| PostgREST | Direct organization mutation | Excluded | None | pgTAP denies direct client writes |
| PostgREST | Direct membership mutation | Excluded | None | pgTAP denies insert/update/delete for app roles |
| RPC | Atomic organization bootstrap | Implement | `create_organization(input_name)` | pgTAP unauthenticated, repeat, ownership, and concurrency-invariant tests |
| RPC | Client-supplied owner/role/org IDs | Excluded | None | Function signature and pgTAP grant assertions |
| Database | Versioned migration | Implement | `supabase/migrations/202608300001_account_ownership.sql` | Local reset, migration list, linked `db push` |
| Database | Generated TypeScript types | Implement | `src/types/database.types.ts` | Local schema type generation and TypeScript compile |
| Database | RLS policy tests | Implement | `supabase/tests/database/organization_rls.test.sql` | `pnpm exec supabase test db` |
| Service role | Browser or routine app usage | Excluded | None | Repository source assertion and threat review |
| Realtime, Storage, Edge Functions | Product integration | Excluded | None | No Phase 1 requirement needs these surfaces |

## External Setup Contract

- A Supabase project must exist with email/password authentication and email confirmation enabled.
- Local and hosted `/auth/confirm` URLs must be allow-listed for signup and password recovery.
- Application runtime receives only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- CLI schema deployment uses `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and `SUPABASE_DB_PASSWORD` outside browser/runtime source.
- A Docker-compatible daemon must be running for local Supabase and pgTAP checks.

## Spec-less Prohibition Probe Result

The recall pass asked what each AUTH requirement could silently become that the product owner would reject; the precision pass dropped routine correctness concerns and canon security/compliance controls already owned by the threat model, `$gsd-secure-phase`, and code review.

Two bespoke privacy constraints remain and are projected descriptor-less as flagged/unverified `must_haves.prohibitions` in Plan 01-02:

| Requirement | Kept prohibition | Status |
|---|---|---|
| AUTH-01 | Account creation must not expand into collection of organization contact, PIX, public-profile, or other owner data beyond name/email/password. | unresolved; judgment review required |
| AUTH-05 | Foreign-organization access must not reveal tenant existence through copy, status differentiation, identifiers, or partial private data. | unresolved; judgment review required |

Account/session cryptography, credential leakage, server-action tampering, open redirects, service-role exposure, anonymous writes, and general privacy compliance are canon controls. They are covered by each plan's STRIDE register plus later `$gsd-secure-phase`/code-review gates and are not duplicated as bespoke prohibitions.

## Multi-Source Coverage Audit

| Source | ID | Feature / constraint | Plan | Status | Notes |
|---|---|---|---|---|---|
| GOAL | — | Secure private owner workspace with no foreign organization data or controls | 01-02, 01-03, 01-04 | COVERED | Tracer proves own path; policy tests and not-found behavior prove isolation. |
| REQ | AUTH-01 | Create email/password account | 01-02, 01-05 | COVERED | Signup, confirmation, validation, and final auth-state coverage. |
| REQ | AUTH-02 | Login and persist through refresh | 01-04 | COVERED | SSR cookie refresh and protected-route smoke. |
| REQ | AUTH-03 | Logout from admin | 01-04 | COVERED | Account menu invokes server signout and redirects. |
| REQ | AUTH-04 | Create organization after sign-in | 01-02, 01-03 | COVERED | Caller-scoped atomic RPC plus idempotency/concurrency guarantees. |
| REQ | AUTH-05 | Access only owned organizations/campaign controls | 01-02, 01-03, 01-04 | COVERED | Membership RLS, foreign not-found, no Phase 1 campaign controls, reusable policy helper for Phase 2. |
| CONTEXT | D-01 | Verify email before private admin | 01-02 | COVERED | Protected server guard requires verified identity. |
| CONTEXT | D-02 | Signup collects name, email, password only | 01-02 | COVERED | Schema and form contract are explicit. |
| CONTEXT | D-03 | Verify-email screen with resend/sign-in recovery | 01-02 | COVERED | Tracer routes to the specified state. |
| CONTEXT | D-04 | Password reset only recovery flow | 01-05 | COVERED | Reset request/update implemented; other recovery omitted. |
| CONTEXT | D-05 | Organization required before workspace | 01-02, 01-04 | COVERED | Admin router forces setup without membership. |
| CONTEXT | D-06 | Setup collects organization name only | 01-02 | COVERED | RPC and UI accept one field. |
| CONTEXT | D-07 | One organization per owner UI | 01-02, 01-03 | COVERED | No selector plus database-backed guard. |
| CONTEXT | D-08 | Organization creation lands on admin home | 01-02 | COVERED | Action redirects to owned workspace. |
| CONTEXT | D-09 | Minimal private workspace | 01-04 | COVERED | Header, identity, organization, ready state only. |
| CONTEXT | D-10 | Show only working navigation | 01-04 | COVERED | No campaign/item/donation/settings links. |
| CONTEXT | D-11 | Logout in owner account menu | 01-04 | COVERED | Accessible avatar menu contains only owner identity and signout. |
| CONTEXT | D-12 | Authenticated user without org goes to setup | 01-02, 01-04 | COVERED | Server route decision tested by smoke flow. |
| CONTEXT | D-13 | Foreign organization produces not-found | 01-02, 01-03, 01-04 | COVERED | RLS empty result maps to neutral 404. |
| CONTEXT | D-14 | Membership table is ownership source | 01-02, 01-03 | COVERED | Costly schema contract is explicit and reused. |
| CONTEXT | D-15 | RLS returns no foreign rows | 01-02, 01-03 | COVERED | Policy and pgTAP denial cases. |
| CONTEXT | D-16 | Explicit RLS allow/deny tests | 01-03 | COVERED | Deterministic two-owner fixtures and assertions. |
| RESEARCH | — | Pinned Next.js/Supabase/Zod/Tailwind/pnpm stack | 01-01, 01-02 | COVERED | Suspicious/assumed packages gate before install. |
| RESEARCH | — | Separate browser/server SSR clients and cookie refresh proxy | 01-02, 01-04 | COVERED | Proxy refreshes only; server boundaries authorize. |
| RESEARCH | — | Constrained RPC and reusable private membership helper | 01-02, 01-03 | COVERED | Fully qualified security-definer functions and grants. |
| RESEARCH | — | Safe callback redirects and generic provider errors | 01-02, 01-05 | COVERED | Local-path helper is unit tested; raw errors stay server-side. |
| RESEARCH | — | Local migrations, generated types, pgTAP, linked schema push | 01-03 | COVERED | Blocking schema task follows migration edits. |
| RESEARCH | — | No service-role browser client, deprecated auth helpers, static auth caching, or direct membership writes | 01-02 through 01-05 | COVERED | Source assertions, RLS tests, and threat mitigations. |
| UI-SPEC | — | Approved b0/shadcn visual and interaction contract, 26 state considerations | 01-02, 01-04, 01-05 | COVERED | Plan must-haves distribute every covered consideration; none are unresolved. |

No source item is missing. Deferred requirements from later roadmap phases and explicit Phase 1 exclusions are not gaps.
