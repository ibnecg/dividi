# Phase 1: Account Ownership and Tenancy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-08-30T20:45:16-03:00
**Phase:** 1-Account Ownership and Tenancy
**Areas discussed:** Account creation policy, Organization setup flow, Private workspace shape, Tenant isolation behavior

---

## Account Creation Policy

| Question | Selected | Alternatives Considered |
|----------|----------|-------------------------|
| After email/password signup, when should a new owner be allowed into the private admin workspace? | Verify first | Pending access; No verify now; Other |
| What should the signup form collect in phase 1? | Email + password + owner name | Email + password only; Email + password + organization name; Other |
| What should happen if signup succeeds but the verification email is not confirmed yet? | Show verify-email screen | Let them sign in but block admin; Send them back to login; Other |
| For phase 1 authentication recovery, how much should we include? | Password reset only | No recovery yet; Password reset + email change; Other |

**User's choice:** Verify-first account access, owner name at signup, verify-email screen, and password reset.
**Notes:** Email change, MFA, and advanced recovery are outside phase 1.

---

## Organization Setup Flow

| Question | Selected | Alternatives Considered |
|----------|----------|-------------------------|
| When should a verified user create their first organization? | Required first step | Optional from empty admin; During signup; Other |
| What minimum organization fields should phase 1 collect? | Organization name only | Name + public display name; Name + contact email; Other |
| Should phase 1 allow one owner to create multiple organizations? | One org only | Multiple orgs; Data model supports multiple, UI creates one; Other |
| After the first organization is created, where should the app send the owner? | Admin home | Campaign creation; Organization settings; Other |

**User's choice:** Force first organization setup after verification and keep organization details minimal.
**Notes:** Public display/contact details and multi-organization UI are deferred.

---

## Private Workspace Shape

| Question | Selected | Alternatives Considered |
|----------|----------|-------------------------|
| What should the protected admin home show in phase 1, before campaign management exists? | Minimal workspace shell | Getting-started checklist; Organization profile page; Other |
| How much future navigation should phase 1 expose? | Only working routes | Disabled future nav; Full nav with coming-soon pages; Other |
| Where should logout live in the phase 1 admin experience? | Account menu | Visible top bar button; Settings area only; Other |
| What should an authenticated user without an organization see? | Forced setup page | Admin empty state; Account-only page; Other |

**User's choice:** Build a minimal, live-only admin shell with account-menu logout and forced organization setup.
**Notes:** Avoid placeholder pages for future campaign management.

---

## Tenant Isolation Behavior

| Question | Selected | Alternatives Considered |
|----------|----------|-------------------------|
| When a signed-in owner tries to access an organization they do not own, what should the product show? | Not found | Forbidden; Redirect home; Other |
| What should be the source of truth for tenant ownership in phase 1? | Membership table | Direct owner column; Both; Other |
| How should unauthorized database access behave under RLS? | Return no rows | Raise explicit errors; Server-only checks first; Other |
| Should phase 1 include explicit cross-tenant tests? | Yes, RLS allow/deny tests | App-level tests only; Manual verification for now; Other |

**User's choice:** Hide non-owned data using membership-backed RLS and test cross-tenant allow/deny cases directly.
**Notes:** Unauthorized product behavior should not confirm that another organization exists.

---

## the agent's Discretion

- Standard copy, form layout, validation wording, and exact route names remain open to the planner.

## Deferred Ideas

- None.
