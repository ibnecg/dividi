# Phase 2 External API and Source Coverage

## External API Integration Decision

Phase 2 reuses the existing Supabase Auth, PostgREST/RPC, Postgres migration, and generated-type surfaces. This is an external SDK/service integration even though no new provider or package is introduced, so the capability matrix below is the binding coverage contract. Banco Central and DICT material informs local syntax validation only; Phase 2 does not call a PIX, DICT, bank, or payment-provider API.

## Supabase Capability Matrix

| Surface | Capability | Phase 2 disposition | Planned caller / artifact | Verification |
|---|---|---|---|---|
| Auth | Trusted current-user lookup | Reuse | `requireUser()` in every protected page and campaign action | Unauthenticated redirect and authenticated integration checks |
| SSR | Cookie-aware server client | Reuse | `createClient()` from `src/lib/supabase/server.ts` | Typecheck, build, authenticated smoke |
| PostgREST | Owner-scoped campaign select | Implement | `listOwnerCampaigns`, `getOwnerCampaignSetup` | Two-owner SQL/integration tests |
| PostgREST | Owner-scoped item and audit select | Implement | `getOwnerCampaignSetup` | Own/foreign SQL tests and detail-page smoke |
| PostgREST | Direct campaign, item, or audit mutation | Exclude | None | pgTAP grant-denial assertions |
| RPC | Idempotent draft creation | Implement | `create_campaign_draft` via `createCampaignDraft` | Repeat-token and parallel-call assertions |
| RPC | Campaign content update | Implement | `update_campaign_content` via `updateCampaignContent` | Identity-preservation and foreign-owner denial tests |
| RPC | Typed PIX recipient update | Implement | `set_campaign_pix_recipient` via `setCampaignPixRecipient` | Four-type validation and audit assertions |
| RPC | Item create, edit, and disable | Implement | `create_campaign_item`, `update_campaign_item`, `disable_campaign_item` | Value-boundary, edit-lock, retention, and owner-denial tests |
| RPC | Publish, unpublish, close, and archive | Implement | Four dedicated lifecycle functions and actions | Transition-matrix and audit assertions |
| Database | Versioned campaign migrations | Implement | Four Phase 2 SQL migration files | Local reset, migration list, linked development `db push` |
| Database | Owner RLS and explicit grants | Implement | Campaign, item, and audit policies plus private owner helper | Own/foreign/anonymous allow-deny tests |
| Database | Append-only campaign audit | Implement | `campaign_audit_events` plus private trigger function | Status/PIX event and direct-write denial tests |
| Database | Generated TypeScript schema types | Implement | `src/types/database.types.ts` | Regeneration plus TypeScript compile |
| Service role | Browser or routine application use | Exclude | None | Source review and threat-model gate |
| Anonymous database reads | Campaign/item/audit access | Exclude | None | `anon` grant and policy assertions; Phase 3 owns public exposure |
| Realtime, Storage, Edge Functions | Product integration | Exclude | None | No Phase 2 requirement needs these capabilities |
| PIX / DICT / bank API | Key ownership or registration verification | Exclude | None | UI copy and tests describe validation as syntax-only |

## External Setup Contract

- Phase 1 must have completed through `01-05-SUMMARY.md`, including the owner-membership helper, generated database types, typed clients, and a green `pnpm verify:phase` baseline.
- Local Supabase requires a Docker-compatible daemon for reset, pgTAP, and integration checks.
- The linked Supabase project must be explicitly identified as the development project before `pnpm schema:push:dev` runs.
- CLI deployment credentials remain outside browser/runtime source and must never be printed by tasks or tests.

## Spec-less Edge Assumptions

All 24 unresolved edge-probe rows are preserved in the relevant PLAN.md `must_haves.assumptions`. They are not treated as silently resolved. The planned assumptions cover campaign empty/encoding/idempotency/concurrency behavior; campaign setup, lifecycle, and edit semantics; item boundaries, equality, empty collections, encoding, ordering, and monetary precision; dashboard empty/ordering behavior; and audit idempotency/content.

## Spec-less Prohibition Probe Result

The recall pass asked what each Phase 2 requirement could silently become that the product owner would reject. The precision pass dropped routine correctness items and canon access-control, injection, secret-handling, and general privacy controls already owned by the STRIDE registers and later security review.

Five bespoke constraints remain and are projected descriptor-less as flagged/unverified `must_haves.prohibitions` in the plans:

| Requirement | Kept prohibition | Status |
|---|---|---|
| CAMP-01 | Organization attribution must not be presented as platform-verified identity. | unresolved; judgment review required |
| CAMP-02 | PIX syntax validation must not be presented as ownership, registration, or payment-destination verification. | unresolved; judgment review required |
| CAMP-03 | Closing or archiving must not delete campaign, item, or audit history. | unresolved; judgment review required |
| CAMP-04 | Content editing must not silently replace campaign identity, slug, or history. | unresolved; judgment review required |
| ITEM-02 | Item editing must not rewrite facts already linked to confirmed donations. | unresolved; judgment review required |

Raw PIX values in audit metadata, foreign-tenant access, client-supplied ownership, direct database mutation, and privileged credential exposure are canon security/privacy concerns. They remain explicit threat mitigations and automated tests rather than duplicate prohibition rows.

## Multi-Source Coverage Audit

| Source | ID | Feature / constraint | Plan | Status | Notes |
|---|---|---|---|---|---|
| GOAL | - | Owners create, maintain, and control item-based campaigns from private administration | 02-01 through 02-06 | COVERED | Tracer proves draft creation; expansion slices complete administration and deployment. |
| REQ | CAMP-01 | Create title, description, attribution, and public slug | 02-01, 02-03 | COVERED | Durable draft plus normalized validation and wizard setup. |
| REQ | CAMP-02 | Configure a strict typed PIX recipient key | 02-03 | COVERED | Four supported key types, canonicalization, persistence, and audit. |
| REQ | CAMP-03 | Publish, unpublish, close, and archive | 02-05 | COVERED | Dedicated database commands, UI controls, and transition matrix. |
| REQ | CAMP-04 | Edit content while preserving identity/history | 02-03 | COVERED | Allow-listed update excludes organization, UUID, slug, status, and audit history. |
| REQ | ITEM-01 | Add item name, optional description, quantity, and BRL price | 02-04 | COVERED | Integer quantity/centavos domain with add form and retained row. |
| REQ | ITEM-02 | Edit before confirmed donations | 02-04 | COVERED | Database guard permits exactly zero confirmed quantity and rejects positive values. |
| REQ | ITEM-03 | Disable item from new donations | 02-04 | COVERED | Idempotent retained disable state and disabled UI. |
| REQ | ADMN-01 | View owner campaign dashboard | 02-02 | COVERED | Owner-only card query, exact empty state, and create route. |
| REQ | ADMN-02 | View items, remaining quantities, and fulfillment state | 02-04 | COVERED | Stable item order and derived remaining/fulfilled display. |
| REQ | SAFE-06 | Audit publication and PIX recipient changes | 02-03, 02-05 | COVERED | Database trigger writes immutable safe events for both change classes. |
| CONTEXT | D-01 | Multi-step wizard: details, then items/PIX | 02-01, 02-03, 02-04 | COVERED | Draft form is step 1; durable setup route completes step 2. |
| CONTEXT | D-02 | Step 1 creates a draft and later progression autosaves | 02-01, 02-03, 02-04 | COVERED | Every successful progression action persists before moving or refreshing. |
| CONTEXT | D-03 | Strict CPF/CNPJ/email/phone/random PIX validation | 02-03 | COVERED | Selected-type validation, checksum/canonicalization tests, and DB constraints. |
| CONTEXT | D-04 | Dashboard uses cards with title, status, and summary | 02-02 | COVERED | Card DTO and component implement the locked layout. |
| RESEARCH | - | Verify the completed Phase 1 tenancy/types/baseline first | 02-01 | COVERED | Cross-phase precondition fails closed before Phase 2 mutation. |
| RESEARCH | - | Reuse installed Next.js/Supabase/Zod/Base UI/Lucide stack; install nothing | all | COVERED | No package-manager install task exists; Next implementation tasks read local docs. |
| RESEARCH | - | Durable immutable UUID/slug and editable attribution snapshot | 02-01, 02-03 | COVERED | Draft schema and content command separate immutable/editable fields. |
| RESEARCH | - | Owner command boundary, RLS, grants, and no client tenant/role/status input | 02-01, 02-03, 02-04, 02-05 | COVERED | Every mutation is a narrow RPC deriving `auth.uid()`. |
| RESEARCH | - | Positive integer quantity and centavos; confirmed edit lock; retained disable | 02-04 | COVERED | Schema checks, commands, DTO derivation, and tests. |
| RESEARCH | - | Append-only trigger audit without raw PIX metadata | 02-03, 02-05 | COVERED | Trigger and allow/deny tests cover event creation and immutability. |
| RESEARCH | - | Typed PIX input is syntax-only, not DICT verification | 02-03 | COVERED | Validation helpers, UI copy, tests, and prohibition flag. |
| RESEARCH | - | Explicit lifecycle values and publish preconditions | 02-05 | COVERED | Dedicated commands enforce the documented transition matrix. |
| RESEARCH | - | No anonymous/public projection or fulfillment decrement | all | COVERED | `anon` receives no campaign domain access; Phase 3/4 work is absent. |
| RESEARCH | - | Revalidate exact dashboard/detail paths after successful mutation | 02-01, 02-03, 02-04, 02-05 | COVERED | Action acceptance criteria name both paths. |
| RESEARCH | - | Server-render protected DTOs; client code only for forms/dialog/pending state | 02-02 through 02-05 | COVERED | Pages query on the server and compose focused client controls. |
| RESEARCH | - | pgTAP, unit/integration tests, generated types, and linked schema push | 02-01 through 02-06 | COVERED | Local checks accompany slices; final blocking task pushes and verifies. |
| UI-SPEC | - | Approved card, wizard, copy, color, type, spacing, error, and archive-confirmation contract | 02-02 through 02-05 | COVERED | Relevant truths and task assertions carry every listed contract value. |

No source item is missing. Public campaign behavior, donor quantity mutation, PIX QR merchant fields, payment-provider verification, team roles, donor accounts, and other later-phase requirements are excluded by the roadmap or research scope and are not gaps.
