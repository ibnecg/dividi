---
phase: 01
slug: account-ownership-and-tenancy
status: verified
threats_open: 0
asvs_level: 1
created: 2026-09-07
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → Server Actions/Route Handler | FormData, redirect query values, and cookies are untrusted input. |
| Next.js server → Supabase Auth | Identity, confirmation, and session-cookie lifecycle cross into the external Auth service. |
| Authenticated PostgREST/RPC → Postgres | Caller JWT enters the database where RLS and function grants enforce tenancy. |
| Authenticated JWT → Postgres RLS | Caller identity is interpreted by policies and security-definer functions. |
| Generated database schema → TypeScript callers | Drift can make application assumptions diverge from deployed grants/functions. |
| CLI → linked Supabase project | A migration crosses from reviewed repository SQL into persistent hosted state. |
| Browser credentials/cookies → Next.js/Supabase Auth | Untrusted credentials and potentially stale cookies drive session changes. |
| RLS organization result → private UI | Only complete caller-owned data may render into the workspace shell. |
| Public recovery form → Supabase Auth | Email values can be used to probe account existence or abuse email delivery. |
| Email callback → authenticated recovery session | Provider codes and redirect destinations can be missing, replayed, or tampered with. |
| Client form state → rendered auth UI | Errors and retained values can disclose credentials/provider internals. |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Spoofing | package identity | mitigate | Compare registry package identity against locked stack | closed |
| T-01-02 | Information disclosure | install logs | accept | Log handling accepted risk | closed |
| T-01-03 | Spoofing | requireVerifiedUser, SSR cookies | mitigate | Use trusted getUser()/validated claims | closed |
| T-01-04 | Tampering / Elevation of privilege | createOrganizationAction | mitigate | Zod accepts only name; RPC derives auth.uid() | closed |
| T-01-05 | Information disclosure | foreign workspace route | mitigate | Membership RLS returns zero rows; notFound() | closed |
| T-01-06 | Elevation of privilege | organization_members | mitigate | Revoke direct app-role mutation, membership truth | closed |
| T-01-07 | Tampering | auth callback next | mitigate | Unit-tested safeLocalPath allow-list | closed |
| T-01-08 | Information disclosure | browser bundle and env | mitigate | Runtime source uses only publishable config | closed |
| T-01-09 | Tampering / Elevation of privilege | anonymous/client writes | mitigate | RLS, grants, and RPC execute policy deny | closed |
| T-01-10 | Elevation of privilege | membership writes | mitigate | Explicit table/function grants plus pgTAP denial | closed |
| T-01-11 | Information disclosure | organization RLS | mitigate | Two-owner fixtures prove own allow / empty results | closed |
| T-01-12 | Tampering | repeat/concurrent bootstrap | mitigate | Transaction advisory lock, idempotent row | closed |
| T-01-13 | Elevation of privilege | security-definer helpers | mitigate | Empty pinned search path, private schema | closed |
| T-01-14 | Tampering | generated schema contract | mitigate | Generate from reset migrations plus TS compile | closed |
| T-01-15 | Tampering | remote schema push | mitigate | Local reset/tests, explicit project ref check | closed |
| T-01-16 | Spoofing | sign-in/session refresh | mitigate | Supabase password auth plus verification | closed |
| T-01-17 | Information disclosure | cached/private workspace | mitigate | Dynamic authenticated routes, no stale rendering | closed |
| T-01-18 | Tampering | Server Actions | mitigate | Server Zod parsing and fresh identity/RLS query | closed |
| T-01-19 | Information disclosure | foreign organization | mitigate | RLS-empty result and identical neutral not-found | closed |
| T-01-20 | Information disclosure | CLI/runtime secrets | mitigate | CLI-only secret env vars, publishable app key | closed |
| T-01-21 | Information disclosure | password-reset request | mitigate | Fixed sent-if-present response | closed |
| T-01-22 | Spoofing / Tampering | recovery callback | mitigate | PKCE exchange, safe-local destination validation | closed |
| T-01-23 | Information disclosure | auth action/form state | mitigate | Never return passwords/raw provider errors | closed |
| T-01-24 | Denial of service | reset email requests | accept | Accept risk | closed |
| T-01-25 | Elevation of privilege | password update action | mitigate | Fresh server-side session validation | closed |
| T-01-26 | Information disclosure | foreign tenant UAT | mitigate | pgTAP and neutral-not-found smoke | closed |
| T-01-SC | Tampering | package surface/tools/UI | mitigate | Use only Plan 01-01 locked dependency set | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01-01 | T-01-02    | The gate handles public package metadata only; credentials are not present or printed during this plan. | gsd-security-auditor | 2026-09-07 |
| R-01-02 | T-01-24    | Phase 1 uses provider behavior and server validation; product rate limiting is explicitly Phase 5, while the UI disables duplicate in-flight submission. | gsd-security-auditor | 2026-09-07 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-07 | 27 | 27 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-07
