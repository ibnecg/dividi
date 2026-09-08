# Phase 2: Organizer Campaign Management - Context

**Gathered:** 2026-09-07T22:05:00-03:00
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the core campaign management capabilities for organization owners. It includes creating a campaign, configuring its PIX payment key, and defining the specific items (with quantities and prices) that donors can fund. It also includes the admin dashboard for viewing campaigns and items, as well as the ability to publish, unpublish, close, and archive campaigns.

</domain>

<decisions>
## Implementation Decisions

### Campaign Setup Flow
- **D-01:** The campaign creation uses a Multi-step Wizard (Campaign details first, then Items/PIX key).
- **D-02:** The campaign is created immediately on step 1 as a Draft, auto-saving as the user progresses through the wizard.

### PIX Key Configuration
- **D-03:** PIX Key validation is strict: enforce CPF/CNPJ, Email, Phone, or Random Key patterns rather than allowing free-form text.

### Dashboard Layout
- **D-04:** Campaigns are displayed on the admin dashboard as Cards, showing title, status, and maybe a small summary.

### the agent's Discretion
None

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` — Defines Phase 2 goal, success criteria, dependency position, and excluded later-phase work.
- `.planning/REQUIREMENTS.md` — Defines CAMP-01 through CAMP-04, ITEM-01 through ITEM-03, and ADMN-01 through ADMN-02, and maps them to Phase 2.
- `.planning/PROJECT.md` — Defines the product context, v1 constraints.

### Stack and Architecture Constraints
- `.planning/research/STACK.md` — Locks the recommended Next.js App Router, Supabase Auth/Postgres/RLS, `@supabase/ssr`, TypeScript, Zod, pnpm, and Supabase CLI direction for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None specifically available yet (Phase 1 might be in progress), but the app structure, database schemas (like `organizations` and `organization_members`), and basic RLS should be established.

### Established Patterns
- Next.js App Router with Server Components/Server Actions.
- Supabase RLS and `organization_members` for tenant isolation.

### Integration Points
- Campaign and Item management will integrate into the authenticated Admin interface created in Phase 1.

</code_context>

<specifics>
## Specific Ideas

No specific UI references — follow the established design language and use the chosen Dashboard Layout (Cards) and Setup Flow (Wizard).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-Organizer Campaign Management*
*Context gathered: 2026-09-07T22:05:00-03:00*
