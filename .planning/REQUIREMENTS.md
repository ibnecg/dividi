# Requirements: Kundividi

**Defined:** 2026-08-30
**Core Value:** Campaign organizers can publish item-based donation campaigns where donors can quickly choose what to fund, pay by PIX QR code, and reduce remaining item quantities without manual coordination.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication and Tenancy

- [ ] **AUTH-01**: User can create an account with email and password.
- [ ] **AUTH-02**: User can log in and stay authenticated across browser refreshes.
- [ ] **AUTH-03**: User can log out from the admin experience.
- [ ] **AUTH-04**: User can create an organization after signing in.
- [ ] **AUTH-05**: User can access only organizations and campaigns that they own.

### Campaigns

- [ ] **CAMP-01**: Organization owner can create a campaign with title, description, organization attribution, and public slug.
- [ ] **CAMP-02**: Organization owner can configure the campaign PIX recipient key used for donation QR codes.
- [ ] **CAMP-03**: Organization owner can publish, unpublish, close, and archive a campaign.
- [ ] **CAMP-04**: Organization owner can edit campaign content while preserving campaign identity and donation history.
- [ ] **CAMP-05**: Published campaign exposes only public-safe campaign fields to unauthenticated visitors.

### Items

- [ ] **ITEM-01**: Organization owner can add an item with name, optional description, needed quantity, and unit price in BRL.
- [ ] **ITEM-02**: Organization owner can edit item details before the item receives confirmed donations.
- [ ] **ITEM-03**: Organization owner can disable an item so it can no longer be selected for new donations.
- [ ] **ITEM-04**: Public campaign page shows each available item's remaining quantity and unit price.
- [ ] **ITEM-05**: Item becomes unavailable for new donations when its confirmed quantity reaches the needed quantity.

### Public Discovery

- [ ] **DISC-01**: Visitor can browse published campaigns without signing in.
- [ ] **DISC-02**: Visitor can search or filter published campaigns using simple public campaign fields.
- [ ] **DISC-03**: Visitor can open a stable public campaign URL.
- [ ] **DISC-04**: Visitor can copy or share a public campaign link.
- [ ] **DISC-05**: Public campaign page presents campaign progress without exposing donor cellphone or private admin data.

### PIX Donation Flow

- [ ] **PIXD-01**: Donor can select an available campaign item and start a donation attempt for one unit of that item.
- [ ] **PIXD-02**: Donor can enter a custom BRL donation amount without selecting an item.
- [ ] **PIXD-03**: System creates a server-side donation attempt with an immutable amount, campaign, item-or-custom type, and PIX recipient snapshot.
- [ ] **PIXD-04**: System generates a static PIX BR Code payload and QR code for the donation attempt value.
- [ ] **PIXD-05**: Donor can copy the Pix Copia e Cola payload from the donation page.
- [ ] **PIXD-06**: Donation page clearly shows recipient and amount context before donor self-confirmation.

### Donation Confirmation

- [ ] **CONF-01**: Donor can self-confirm that they completed the PIX payment after viewing the QR/copy-and-paste payment instructions.
- [ ] **CONF-02**: Donor can optionally provide name, cellphone, and message during confirmation.
- [ ] **CONF-03**: System records confirmed donations as donor-reported, not bank-verified.
- [ ] **CONF-04**: Confirming an item donation atomically decreases the remaining available quantity exactly once.
- [ ] **CONF-05**: Repeated confirmation attempts for the same donation attempt are idempotent and do not duplicate donations or reduce quantity twice.
- [ ] **CONF-06**: Custom donation confirmation records the amount without changing any item quantity.

### Admin Panel

- [ ] **ADMN-01**: Organization owner can view a dashboard of their campaigns.
- [ ] **ADMN-02**: Organization owner can view campaign items, remaining quantities, and fulfillment state.
- [ ] **ADMN-03**: Organization owner can view confirmed donation activity with amount, type, timestamp, optional donor details, and message.
- [ ] **ADMN-04**: Organization owner can distinguish item donations from custom donations in the activity view.
- [ ] **ADMN-05**: Organization owner can see donation status labels that distinguish self-confirmed records from future verified payment states.

### Privacy, Safety, and Operations

- [ ] **SAFE-01**: Visitor can report a public campaign for abuse or incorrect content.
- [ ] **SAFE-02**: Public forms validate input length, amount limits, and required fields before creating donation attempts or reports.
- [ ] **SAFE-03**: System rate-limits public donation attempt and confirmation endpoints.
- [ ] **SAFE-04**: System stores donor cellphone only when the donor provides it intentionally during confirmation.
- [ ] **SAFE-05**: System keeps donor cellphone and private messages out of public campaign responses.
- [ ] **SAFE-06**: System records audit events for campaign publication changes and PIX recipient changes.
- [ ] **SAFE-07**: Deployment documentation states the limits and suitability risks of Vercel free-tier and Supabase free-tier hosting.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Payment Verification

- **PAYV-01**: System can integrate with a PIX/payment provider webhook to mark donations as provider-verified.
- **PAYV-02**: System can reconcile self-confirmed donations against provider-reported payment events.
- **PAYV-03**: System can support refund, failed-payment, and correction workflows.

### Collaboration

- **TEAM-01**: Organization owner can invite additional admins to an organization.
- **TEAM-02**: Organization owner can assign roles and permissions to team members.
- **TEAM-03**: System can audit which admin performed each organization action.

### Donor Engagement

- **DONT-01**: Donor can create an account and view past donations.
- **DONT-02**: Organization owner can send manual thank-you messages.
- **DONT-03**: Campaign can show opt-in public donor messages after moderation.
- **DONT-04**: Organization owner can export donation activity as CSV.

### Growth

- **GROW-01**: Campaign can publish updates to supporters.
- **GROW-02**: System can generate campaign share cards for social networks.
- **GROW-03**: System can track referral links for shared campaigns.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automated PIX provider verification in v1 | Adds provider contracts, webhook security, reconciliation, and likely paid infrastructure before the core self-confirmed flow is validated. |
| Platform wallet, escrow, or payout handling | Would turn the product into a payment intermediary with material compliance and operational obligations. |
| Team roles and invitations in v1 | Organization ownership is enough to validate multi-tenancy before adding role complexity. |
| Donor accounts in v1 | Donors must be able to donate without account creation to keep the public flow low-friction. |
| Public donor wall by default | Public donor messages create moderation and privacy risk; private owner activity is sufficient for v1. |
| Recurring donations | Static PIX plus self-confirmation does not provide reliable recurring payment lifecycle handling. |
| Paid campaign boosting or algorithmic ranking | Discovery starts with simple browse/search to avoid abuse and ranking-policy complexity. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| CAMP-01 | TBD | Pending |
| CAMP-02 | TBD | Pending |
| CAMP-03 | TBD | Pending |
| CAMP-04 | TBD | Pending |
| CAMP-05 | TBD | Pending |
| ITEM-01 | TBD | Pending |
| ITEM-02 | TBD | Pending |
| ITEM-03 | TBD | Pending |
| ITEM-04 | TBD | Pending |
| ITEM-05 | TBD | Pending |
| DISC-01 | TBD | Pending |
| DISC-02 | TBD | Pending |
| DISC-03 | TBD | Pending |
| DISC-04 | TBD | Pending |
| DISC-05 | TBD | Pending |
| PIXD-01 | TBD | Pending |
| PIXD-02 | TBD | Pending |
| PIXD-03 | TBD | Pending |
| PIXD-04 | TBD | Pending |
| PIXD-05 | TBD | Pending |
| PIXD-06 | TBD | Pending |
| CONF-01 | TBD | Pending |
| CONF-02 | TBD | Pending |
| CONF-03 | TBD | Pending |
| CONF-04 | TBD | Pending |
| CONF-05 | TBD | Pending |
| CONF-06 | TBD | Pending |
| ADMN-01 | TBD | Pending |
| ADMN-02 | TBD | Pending |
| ADMN-03 | TBD | Pending |
| ADMN-04 | TBD | Pending |
| ADMN-05 | TBD | Pending |
| SAFE-01 | TBD | Pending |
| SAFE-02 | TBD | Pending |
| SAFE-03 | TBD | Pending |
| SAFE-04 | TBD | Pending |
| SAFE-05 | TBD | Pending |
| SAFE-06 | TBD | Pending |
| SAFE-07 | TBD | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 0
- Unmapped: 43

---
*Requirements defined: 2026-08-30*
*Last updated: 2026-08-30 after initial definition*
