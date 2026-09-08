---
phase: 02-organizer-campaign-management
plan: "01"
type: execute
status: completed
---

# Task 1: End-to-end durable draft creation through the private wizard

## What Was Accomplished
1. **Database Migration (`202609070001_campaign_drafts.sql`)**:
   - Created the `campaigns` table with `id`, `organization_id`, `title`, `description`, `attribution`, `slug`, `status`, and `creation_token`.
   - Enforced owner-only Row-Level Security via `private.is_organization_owner(uuid)`.
   - Created the `public.create_campaign_draft` RPC as a security definer function to handle normalized insertions with idempotency protection and owner discovery.

2. **Database Testing (`02_campaign_management.test.sql`)**:
   - Implemented pgTAP tests asserting structure, function existence, and proper behavior under various identities (Owner, Foreign Owner, Member, Anon).
   - Validated idempotency, empty input rejection, slug collisions, and direct DML denial.

3. **Application Backend (`src/lib/campaigns/actions.ts`)**:
   - Created the `createCampaignDraft` server action.
   - Employed Zod for schema validation conforming to exact limits and regex rules (e.g., lower-case ASCII alphanumeric and hyphens for slug).
   - Wrapped Supabase RPC call and handled failures without leaking database errors, using the exact copy `Failed to save changes. Please try again.`.

4. **User Interface (`src/app/espaco/campanhas/nova/page.tsx`)**:
   - Implemented a protected Next.js page featuring the wizard's first step.
   - Connected form inputs with `useActionState`, generating `creationToken` via `crypto.randomUUID()` on mount to enforce idempotency.
   - Added appropriate input types, limits, and inline field error display.

## Verification
- ✅ `pnpm verify:db` passes clean.
- ✅ `src/types/database.types.ts` mechanically generated successfully.
- ✅ `pnpm typecheck` successfully validates all strict typing.
- ✅ `pnpm build` creates an optimized production build cleanly without issues.
