---
phase: 02
slug: organizer-campaign-management
status: draft
threats_open: 20
asvs_level: 1
created: 2026-09-08
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Authenticated request to Server Component | Cookies identify the requester before private campaign data is selected. | Campaign data |
| Server query to PostgREST/RLS | DTO selection crosses the tenant boundary and must not accept a browser-selected organization. | Org and campaigns |
| DTO to browser HTML | Only fields intended for the private campaign card are rendered. | Safe DTO |
| Wizard to Server Actions | Untrusted campaign ID, content, key type, and key value cross from the browser. | Untrusted inputs |
| Server Actions to owner RPCs | Authenticated identity and normalized values cross into database-owned authorization. | Validated inputs |
| Campaign mutation to audit trigger | Sensitive recipient configuration creates retained evidence that must be safe and immutable. | Audit logs |
| Item forms to Server Actions | Untrusted campaign/item IDs, text, quantity, and money strings cross from the browser. | Untrusted inputs |
| Server Actions to item RPCs | Validated inputs cross into database ownership, locking, and immutable fulfillment rules. | Validated item rules |
| Item rows to later public/donation consumers | Stored prices, quantities, and disable state become future payment and availability facts. | Pricing facts |
| Lifecycle controls to Server Actions | Untrusted campaign IDs and repeated commands cross from the browser. | Untrusted commands |
| Lifecycle RPC to campaign/audit data | Status mutation and retained evidence must commit atomically under owner authorization. | Validated commands |
| Audit rows to browser DTO | Retained metadata crosses into UI and must exclude sensitive recipient/foreign data. | Safe audit metadata |
| Local repository to linked database | Versioned SQL crosses into an external mutable development service. | SQL migrations |
| CLI environment to Supabase | Access token, project reference, and database password authorize schema deployment. | Credentials |
| Linked schema to generated application types | External schema metadata becomes a trusted compile-time contract. | Generated types |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Elevation of privilege | `create_campaign_draft` | mitigate | `202609070001_campaign_drafts.sql:62` | closed |
| T-02-02 | Tampering | Draft identity and duplicate submission | mitigate | `202609070001_campaign_drafts.sql:35-36`, `actions.ts:9` | closed |
| T-02-03 | Information disclosure | Campaign select/error path | mitigate | `202609070001_campaign_drafts.sql:43`, `actions.ts:51` | closed |
| T-02-04 | Information disclosure | `listOwnerCampaigns` | mitigate | Require trusted user, accept no tenant parameter, rely on owner RLS, and prove two-owner isolation. | open |
| T-02-05 | Spoofing | Campaign detail links | mitigate | Links carry only campaign UUID; the destination must reauthorize independently and map foreign IDs to neutral absence. | open |
| T-02-06 | Denial of service | Dashboard card rendering | accept | Owner-only data and bounded text fields limit exposure; pagination is not required by any Phase 2 source artifact. | open |
| T-02-07 | Tampering | PIX recipient and content commands | mitigate | Strict selected-type validation, allow-listed RPC signatures, row locks, owner checks, and direct-DML denial. | open |
| T-02-08 | Repudiation | PIX recipient changes | mitigate | Same-transaction trigger events with database-derived actor and no client audit-write privilege. | open |
| T-02-09 | Information disclosure | Detail route and form errors | mitigate | Owner RLS, neutral not-found behavior, safe DTOs, and generic errors without raw database/key details. | open |
| T-02-10 | Spoofing | PIX syntax result | mitigate | Label validation as format-only and make no ownership, registration, or bank-verification claim. | open |
| T-02-11 | Tampering | Quantity and unit price | mitigate | Parse exact bounded integers, enforce database checks, revoke direct DML, and test boundary neighbors. | open |
| T-02-12 | Elevation of privilege | Item RPC identifiers | mitigate | Derive caller identity, join item to owner campaign in each command, lock rows, and test foreign/anonymous denial. | open |
| T-02-13 | Tampering | Donation-linked item edits | mitigate | Database command rejects edits when confirmed quantity is positive and tests atomic non-mutation. | open |
| T-02-14 | Repudiation | Disable command retries | accept | Disable is idempotent and retained `disabled_at` plus row identity shows resulting state; item auditing is not a Phase 2 requirement. | open |
| T-02-15 | Tampering | Campaign status transitions | mitigate | Four narrow RPCs, row locks, explicit transition matrix, publish prerequisites, and no direct status DML. | open |
| T-02-16 | Repudiation | Lifecycle audit | mitigate | Same-transaction trigger with auth-derived actor and immutable owner-visible events. | open |
| T-02-17 | Elevation of privilege | Campaign UUID commands | mitigate | Reauthorize in every action and RPC and test foreign/anonymous neutral denial. | open |
| T-02-18 | Information disclosure | Audit DTO | mitigate | Select/map only safe structural fields, owner RLS, neutral not-found, and no raw PIX metadata. | open |
| T-02-19 | Spoofing | Linked Supabase project | mitigate | Resolve and compare the explicit approved development project reference before any push; stop on ambiguity. | open |
| T-02-20 | Tampering | Migration deployment/order | mitigate | Require local green reset/tests, inspect pending list, push once, and verify all four migration IDs exactly once in order. | open |
| T-02-21 | Information disclosure | CLI credentials/output | mitigate | Keep credentials in environment-only setup, never echo values, and commit only generated public schema types. | open |
| T-02-22 | Tampering | Linked generated types | mitigate | Compare local and linked Phase 1/2 shapes and fail on drift or contract-bypass casts. | open |
| T-02-SC | Tampering | Package supply chain | accept | This plan installs no package and leaves package manifests and lockfiles unchanged. | open |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-08 | 23 | 3 | 20 | gsd-security-auditor |

---

## Sign-Off

- [ ] All threats have a disposition (mitigate / accept / transfer)
- [ ] Accepted risks documented in Accepted Risks Log
- [ ] `threats_open: 0` confirmed
- [ ] `status: verified` set in frontmatter

**Approval:** pending
