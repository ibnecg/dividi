# Phase 1: Account Ownership and Tenancy - Context

**Gathered:** 2026-08-30T20:45:16-03:00
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the private ownership foundation for Kundividi: email/password account creation, verified access to the admin area, first organization creation, a minimal protected workspace, logout, password reset, and organization-level tenant isolation. It does not build campaign management, public discovery, PIX donation flows, donor confirmation, reports, team roles, or payment verification.

</domain>

<decisions>
## Implementation Decisions

### Account Creation Policy
- **D-01:** New owners must verify their email address before entering the private admin workspace.
- **D-02:** The signup form collects email, password, and owner name. Organization details are collected after email verification.
- **D-03:** After successful signup, the app shows a verify-email screen with guidance and recovery actions such as resend/sign-in options.
- **D-04:** Phase 1 includes password reset as the only authentication recovery flow. Email change, MFA, and advanced account recovery are deferred.

### Organization Setup Flow
- **D-05:** A verified signed-in user must create their first organization before entering the admin workspace.
- **D-06:** Phase 1 organization setup collects organization name only. Public display name, contact email, PIX details, and profile metadata are deferred to later campaign/admin phases.
- **D-07:** Phase 1 supports one organization per owner in the product UI. Future multi-organization support is a separate capability.
- **D-08:** After creating the organization, the owner lands on the admin home.

### Private Workspace Shape
- **D-09:** The protected admin home is a minimal workspace shell showing the organization name, owner identity, and only the private controls that work in phase 1.
- **D-10:** Navigation exposes only working routes in phase 1. Do not add disabled or coming-soon campaign/items/donations pages yet.
- **D-11:** Logout lives in an account menu that shows the owner name/email in the admin header.
- **D-12:** An authenticated user without an organization is redirected to the forced organization setup page.

### Tenant Isolation Behavior
- **D-13:** When a signed-in owner tries to access an organization they do not own, the product should present a not-found result rather than a forbidden message or ownership leak.
- **D-14:** Tenant ownership source of truth is an `organization_members` table with an owner role, even though v1 has only one owner. Direct owner-only columns should not be the primary authorization model. -- **Reversibility:** costly -- Changing this later would require schema and RLS policy migration across every tenant-owned table.
- **D-15:** Supabase RLS policies should return no rows for non-owned organization data, letting the app show not-found or empty states rather than surfacing cross-tenant access details.
- **D-16:** Phase 1 must include explicit RLS allow/deny tests proving an owner can access their own organization and cannot access another owner's organization.

### the agent's Discretion
- Standard copy, form layout, validation wording, and exact route names are open to the planner as long as they preserve the decisions above and the project stack constraints.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` -- Defines Phase 1 goal, success criteria, dependency position, and excluded later-phase work.
- `.planning/REQUIREMENTS.md` -- Defines AUTH-01 through AUTH-05 and maps them to Phase 1.
- `.planning/PROJECT.md` -- Defines the product context, v1 constraints, and organization-based multi-tenancy direction.

### Stack and Architecture Constraints
- `.planning/research/STACK.md` -- Locks the recommended Next.js App Router, Supabase Auth/Postgres/RLS, `@supabase/ssr`, TypeScript, Zod, pnpm, and Supabase CLI direction for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application scaffold exists yet. Phase 1 should establish the initial Next.js App Router, Supabase client/server helpers, migrations, and admin shell patterns rather than adapting existing app code.

### Established Patterns
- Planning artifacts already constrain the stack toward Next.js App Router, Supabase Auth, Supabase RLS, TypeScript, Zod validation, pnpm, and Supabase CLI migrations/tests.
- `organization_members` should be introduced now as the durable authorization pattern for tenant-owned data.

### Integration Points
- Initial app scaffold should include public auth routes, protected admin routes, organization setup route, Supabase session middleware/helpers, database migrations, and RLS tests.
- Later phases will attach campaign management and donation activity views to the admin home established here.

</code_context>

<specifics>
## Specific Ideas

No external UI references were provided. Keep the phase 1 admin experience minimal, functional, and ready to grow into the campaign dashboard in phase 2.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Account Ownership and Tenancy*
*Context gathered: 2026-08-30T20:45:16-03:00*
