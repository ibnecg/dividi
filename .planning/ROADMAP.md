# Roadmap: Kundividi

## Overview

Kundividi progresses from secure single-owner organization access to a publishable campaign workflow, then to privacy-safe public discovery, a complete self-confirmed PIX donation loop, and finally the controls needed to operate a discoverable anonymous service responsibly. The plan preserves the central promise: organizers can show concrete needs, donors can fund an item or custom amount through PIX, and confirmed item contributions update fulfillment without manual coordination.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Account Ownership and Tenancy** - Owners can securely create, access, and isolate their organizations.
- [ ] **Phase 2: Organizer Campaign Management** - Owners create campaigns, maintain items and PIX details, and control campaign lifecycle.
- [ ] **Phase 3: Public Discovery and Campaign Trust** - Visitors find, evaluate, and share published campaigns without private-data exposure.
- [ ] **Phase 4: PIX Donation and Confirmation** - Donors receive correct PIX instructions, self-confirm contributions, and update item fulfillment safely.
- [ ] **Phase 5: Public Safety and Launch Readiness** - The public service resists basic abuse and documents free-tier operating limits.

## Phase Details

### Phase 1: Account Ownership and Tenancy
**Goal**: Organization owners can securely access their own private workspace and no other organization's data or campaign controls.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. A user can create an email/password account, log in, remain signed in after a browser refresh, and log out from private administration.
  2. A signed-in user can create an organization and enter its protected workspace.
  3. An organization owner cannot view or change another organization's campaigns or administrative data.
**Plans**: 5 plans

Plans:
- [ ] 01-01-PLAN.md — Verify suspicious and assumed package identities before installation.
- [ ] 01-02-PLAN.md — Build the verified-account-to-RLS-workspace walking skeleton.
- [ ] 01-03-PLAN.md — Prove tenancy RLS, grants, idempotency, and generated schema types.
- [ ] 01-04-PLAN.md — Push the schema and complete persistent login, workspace, and logout.
- [ ] 01-05-PLAN.md — Complete password recovery and all auth UI states.
**UI hint**: yes

### Phase 2: Organizer Campaign Management
**Goal**: Organization owners can create, maintain, and control item-based donation campaigns from a private administration experience.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04, ITEM-01, ITEM-02, ITEM-03, ADMN-01, ADMN-02, SAFE-06
**Success Criteria** (what must be TRUE):
  1. An owner can create a campaign with its public identity, description, attribution, and PIX recipient key, then later edit its content without losing its identity or history.
  2. An owner can add items with a BRL unit price and requested quantity, edit items before donations, and disable an item from new donations.
  3. An owner can see their campaign dashboard and each campaign's items, remaining quantities, and fulfillment state.
  4. An owner can publish, unpublish, close, or archive a campaign, and changes to publication status or PIX recipient are retained as audit activity.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Public Discovery and Campaign Trust
**Goal**: Visitors can find, inspect, and share published campaigns while public pages expose only deliberate, trustworthy information.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: CAMP-05, ITEM-04, DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, SAFE-05
**Success Criteria** (what must be TRUE):
  1. A visitor can browse and simply search or filter published campaigns without signing in.
  2. A visitor can open a stable public campaign URL and copy or share its link.
  3. A public campaign page shows available items with their remaining quantity and unit price, plus campaign progress.
  4. Public campaign responses never reveal donor cellphone numbers, private messages, draft data, or private administration data.
**Plans**: TBD
**UI hint**: yes

### Phase 4: PIX Donation and Confirmation
**Goal**: Donors can make a clear self-confirmed PIX contribution and organizers receive accurate, private donation activity and item fulfillment updates.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: ITEM-05, PIXD-01, PIXD-02, PIXD-03, PIXD-04, PIXD-05, PIXD-06, CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06, ADMN-03, ADMN-04, ADMN-05, SAFE-04
**Success Criteria** (what must be TRUE):
  1. A donor can select an available item for one unit or enter a custom BRL amount and receive a server-created donation attempt with an immutable recipient and amount snapshot.
  2. Before confirming, a donor sees the recipient and amount, a static PIX QR code, and a copyable Pix Copia e Cola payload for that exact attempt.
  3. A donor can self-confirm payment and optionally provide their name, cellphone, and message; the record is visibly treated as donor-reported rather than bank-verified, and cellphone is retained only when intentionally supplied.
  4. Repeating or concurrently submitting the same confirmation creates only one donation; an item donation reduces its remaining quantity once and becomes unavailable at fulfillment, while a custom donation leaves item quantities unchanged.
  5. The campaign owner can view private confirmed-donation activity with timestamp, amount, type, optional donor details and message, and a status that distinguishes self-confirmed from future verified states.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Public Safety and Launch Readiness
**Goal**: Public donation surfaces have practical abuse controls and operators have an explicit understanding of the free-tier deployment limits.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-07
**Success Criteria** (what must be TRUE):
  1. A visitor can report a public campaign for abuse or incorrect content.
  2. Public report and donation forms reject missing, oversized, or out-of-range inputs before creating records.
  3. Public donation-attempt and confirmation endpoints reject excessive repeated requests according to defined rate limits.
  4. Deployment documentation clearly states the limits and suitability risks of Vercel free-tier and Supabase free-tier hosting.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Account Ownership and Tenancy | 0/5 | Not started | - |
| 2. Organizer Campaign Management | 0/TBD | Not started | - |
| 3. Public Discovery and Campaign Trust | 0/TBD | Not started | - |
| 4. PIX Donation and Confirmation | 0/TBD | Not started | - |
| 5. Public Safety and Launch Readiness | 0/TBD | Not started | - |
