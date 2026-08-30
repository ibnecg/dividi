# Feature Research

**Domain:** Public, item-based donation campaigns with PIX payments in Brazil
**Researched:** 2026-08-30
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Organization account and single private owner | Organizers need a private place to create and administer campaigns; public donors must not need an account. | MEDIUM | Use organization ownership now. This establishes the tenant boundary for every campaign, item, and donation; do not imply staff collaboration yet. |
| Campaign lifecycle and public identity | A campaign needs a title, story, cover image, target, creator/organization attribution, draft/published state, and shareable stable URL before people can judge or circulate it. | MEDIUM | Public product norms emphasize a clear story, goal, imagery, and organizer editing. Include only content the owner deliberately publishes. |
| Public discovery and direct sharing | The brief requires discoverability; donors also commonly arrive through shared links. | MEDIUM | Ship a browse/search surface with published campaigns only, plus copy-link and native share where available. Sort by recent/published initially; personalized ranking is not an MVP need. |
| Item registry with remaining quantities | The project core value is choosing a concrete need rather than donating into an opaque general fund. | HIGH | Each item needs name, image optional, unit price, target quantity, remaining quantity, and a fulfilled/unavailable state. Do not oversell the accuracy: v1 remaining counts are based on recorded self-confirmations, not bank settlement. |
| Campaign-level custom amount | Many donors cannot or do not want to fund exactly one listed item. Comparable PIX donation flows offer both suggested and entered values. | MEDIUM | Require a positive BRL amount and clearly designate the result as an unrestricted campaign contribution. It must not reduce an item quantity unless the donor selected an item. |
| PIX payment surface: QR and Pix Copia e Cola | Brazil's central-bank guidance recognizes both QR scanning and copy-and-paste initiation; Brazilian fundraising products expose both. | MEDIUM | Generate a static PIX payload containing the selected fixed value or entered custom amount, show the QR, provide one-tap copy, and display the receiving name/key confirmation context. Static QR generation itself does not require the Pix API. |
| Explicit donor self-confirmation | With no payment-provider webhook, there is no automatic proof that the transfer happened. The donor needs a deliberate post-payment action. | MEDIUM | Show the confirmation control only after displaying the PIX instructions. Record `self_confirmed_at` and present the result as donor-reported, never "payment verified." Add an idempotency guard so reload/double-click cannot create duplicate confirmations. |
| Minimal optional donor attribution | Public fundraising pages commonly show supporter names/messages and organizers need enough context to follow up. | MEDIUM | Name, cellphone, and message remain optional as specified. Obtain consent before storing cellphone; allow public display only if the donor opts in. Anonymous should be the default public presentation when no display choice is made. |
| Visible progress and fulfilment state | Public campaigns routinely show the goal/progress/supporter activity; it builds the transparency donors expect. | MEDIUM | Show campaign totals/counts and item progress without exposing contact details. Do not use a real-time claim: update after a recorded confirmation and label the basis appropriately. |
| Private campaign and donation activity view | Owners need to see campaigns, items, confirmations, timestamps, amount, and donor-provided details in one place. | MEDIUM | This is the v1 admin panel. Scope all reads/writes by organization ownership, and retain a simple immutable activity trail for correction/audit. |
| Basic public safety and privacy controls | Discoverable campaigns create abuse and personal-data risks. Major public campaign pages include a report path and distinguish public information from donor data. | MEDIUM | Provide campaign reporting, a publish/unpublish/archive control, content/PII limits, and a privacy notice. Define a lightweight moderation queue or disable path before broad discovery. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fund-a-specific-item flow | Turns an abstract request into a concrete contribution: a donor can choose "one of 12 school kits" or "one mattress" and see what remains. | HIGH | This is Kundividi's v1 differentiator and should be the primary donation CTA. It depends on the item registry, fixed-value PIX payloads, and idempotent confirmation recording. |
| One campaign, two intentional donation paths | Lets donors either complete a named need or give any affordable amount, without forcing organizers to create artificial items. | MEDIUM | Make the distinction explicit in the UI and reporting: item donation vs unrestricted contribution. Do not allocate custom amounts across items automatically. |
| Per-item fulfillment visibility | Shows exactly which needs are still open and removes completed items from the donation choice. | MEDIUM | This is more useful than a single monetary thermometer for in-kind-style drives. Use quantity progress as the source of truth and derive any monetary equivalent only for display. |
| Honest self-confirmation status | Rather than pretending the platform has verified payment, make the donor-confirmed status and receiving PIX identity visible. | LOW | This is a trust differentiator in a low-cost v1. It reduces confusion and establishes a clean migration path to `verified` status later. |
| Share-ready campaign view | A polished public campaign URL with a clear image, title, item summary, and progress makes WhatsApp/social forwarding more credible. | MEDIUM | Ensure Open Graph metadata and mobile layout work; adding generated social cards, referral attribution, or paid promotion is later work. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Automated bank/provider payment confirmation in v1 | It would make totals independently verified. | Requires a PSP/Pix API relationship, webhook security, reconciliation, exception handling, and likely operating cost; it contradicts the stated low-cost v1 constraint. | Treat contributions as self-confirmed and label them accurately; design donation states so a future verified state can be added. |
| Platform wallet, escrow, or payout handling | It seems to make payments safer and easier to manage. | It changes Kundividi from campaign software into a payment intermediary with material compliance, fraud, support, and money-flow obligations. | Generate PIX to the organization-provided receiving key and clearly show the actual recipient before payment. |
| Fine-grained teams, roles, and invitations | Organizations often eventually need multiple editors. | Roles multiply authorization paths and audit requirements before a single-owner workflow is validated. | Enforce one organization owner in v1; capture team collaboration as a v2 requirement only after demand appears. |
| Peer-to-peer/team fundraising and referral leaderboards | Supporters can amplify campaigns. | Requires participant onboarding, unique attribution links, moderation, privacy decisions, and more complex accounting. | Ship a simple public share link; later test unique share links before building team pages. |
| Recurring donations, memberships, or subscriptions | They can improve long-term fundraising. | Static PIX plus self-confirmation has no reliable recurring collection or lifecycle management; reminders and cancellations add a separate product. | Support one-time custom amounts only. Revisit with a provider-backed payment rail. |
| Public donor comments/feed by default | Visible social proof can help campaigns. | It invites spam, harassment, and personal-data exposure, particularly on public discoverable pages. | Collect an optional message for the organizer; publish it only with explicit opt-in and moderation capability. |
| CSV/CRM integrations, automated receipts, and marketing automation | Mature fundraising systems offer exports and donor engagement automation. | In v1 the payment and donor data are self-reported and optional, so operational automation can create inaccurate records and privacy obligations. | Start with a private activity view and manual acknowledgements; add export only once users demonstrate a reporting need. |
| Algorithmic recommendations, paid boosting, or an open marketplace | Discovery is a stated requirement, and promotion could grow reach. | Ranking, abuse prevention, fairness, and paid-placement policy distract from proving the donation flow. | Use simple browse/search and owner-controlled sharing, with publish/report/moderation safeguards. |

## Feature Dependencies

```text
Organization ownership and authentication
    -> campaign create/edit/publish
        -> public campaign page and discovery
            -> shareable URL and social metadata
            -> item registry
                -> fixed-value PIX QR/Copia e Cola
                    -> donor self-confirmation
                        -> idempotent donation record
                            -> item remaining quantity and public progress
                            -> private activity view
            -> custom amount PIX flow
                -> donor self-confirmation

Public discovery -> reporting / moderation / unpublish controls
Optional donor contact and message -> consent and public-display choice
Verified payment status (future) -> PSP/Pix integration + webhook/reconciliation
```

### Dependency Notes

- **Ownership requires authentication:** it is the authorization boundary for all private admin data in a multi-tenant system.
- **Publishing requires moderation controls:** a public index without an abuse-report and removal route is an incomplete public-product workflow.
- **Item fulfillment requires idempotent confirmation recording:** increment/decrement only once per recorded donor action, otherwise repeated submissions can overstate funding or exhaust items incorrectly.
- **Progress requires classified donation records:** item and custom contributions must remain distinct so neither totals nor item remaining counts are corrupted.
- **Future verification requires a separate payment state:** model at least `self_confirmed` now; later integrate a provider/webhook to add `verified`, `failed`, and correction/refund handling without redefining old data.

## MVP Definition

### Launch With (v1)

- [ ] Organization owner account and organization-scoped admin - establishes safe multi-tenancy.
- [ ] Draft/publish/archive campaigns with title, story, cover image, goal, public URL, and simple discovery - makes campaigns credible, reachable, and controllable.
- [ ] Item registry with unit price, requested/remaining quantity, fulfillment state, and primary item donation CTA - validates Kundividi's core value.
- [ ] Custom campaign amount flow - prevents a fixed-item list from rejecting donors who want to give a different amount.
- [ ] Fixed-value/custom-value static PIX QR plus Pix Copia e Cola and recipient context - completes the Brazilian payment handoff.
- [ ] Self-confirmation with optional donor name, cellphone, and message; explicit self-reported status; duplicate protection - records the v1 outcome honestly.
- [ ] Public campaign/item progress and private owner activity list - gives donors transparency and organizers operational visibility.
- [ ] Mobile-first sharing, privacy notice, campaign reporting, and owner unpublish - required guardrails for a public, discoverable service.

### Add After Validation (v1.x)

- [ ] Owner-posted campaign updates and manual thank-you workflow - add after organizers demonstrate repeat campaign communication needs.
- [ ] Opt-in public donor wall / messages - add only with moderation capacity and a clear consent model.
- [ ] CSV export and basic date/campaign filters - add after activity volume makes the admin list inadequate.
- [ ] Saved draft templates and duplicate campaign - add after repeated campaign creation is observed.
- [ ] Simple share card generation - add when sharing is a demonstrated acquisition bottleneck.

### Future Consideration (v2+)

- [ ] PSP/Pix API integration, signed webhooks, reconciliation, and payment verification - only when the product can fund and operate the financial integration.
- [ ] Team roles, invitations, and activity audit - only after multi-person organizations are validated.
- [ ] Donor accounts, receipts, recurring giving, and CRM integrations - only after a reliable payment/donor record exists.
- [ ] Peer-to-peer pages, unique referral tracking, and leaderboards - only after the base campaign flow converts reliably.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Organization ownership and protected admin | HIGH | MEDIUM | P1 |
| Campaign creation, publishing, public detail page, and discovery | HIGH | MEDIUM | P1 |
| Item registry and fulfillment state | HIGH | HIGH | P1 |
| PIX QR + Copia e Cola for fixed/custom values | HIGH | MEDIUM | P1 |
| Donor self-confirmation and duplicate protection | HIGH | MEDIUM | P1 |
| Public progress and private activity view | HIGH | MEDIUM | P1 |
| Share flow and social metadata | HIGH | LOW | P1 |
| Report/unpublish/privacy safeguards | HIGH | MEDIUM | P1 |
| Campaign updates and manual thanks | MEDIUM | MEDIUM | P2 |
| CSV export and basic reporting filters | MEDIUM | LOW | P2 |
| Opt-in donor wall | MEDIUM | MEDIUM | P2 |
| Automated payment verification | HIGH | HIGH | P3 |
| Team roles and peer-to-peer fundraising | MEDIUM | HIGH | P3 |
| Recurring giving and CRM automation | MEDIUM | HIGH | P3 |

## Competitor Feature Analysis

| Feature | Vakinha | GoFundMe / donation platforms | Kundividi v1 approach |
|---------|---------|-------------------------------|-----------------------|
| Public campaign trust | Public story, goal, amount raised, supporter count, organizer identity, share action, and a report link. | Public campaign story/media/goals, updates, and sharing are standard. | Public campaign story, owner/organization identity, item/custom targets, visible self-reported progress, and report/unpublish path. |
| PIX payment handoff | QR code, copy-and-paste code, and campaign-associated PIX key; platform validates/centralizes its own flow. | Not PIX-specific; donation pages typically support payment forms and receipts. | QR + Copia e Cola generated for the organizer key. Show the recipient identity; do not claim platform-controlled reconciliation. |
| Donation transparency | Campaign-specific key and dashboard count contributions; recent receipts can be shared. | Campaign progress, donor management, receipts, updates, and reporting are common. | Immutable self-confirmed activity records, item remaining count, public progress basis, and private owner view. Receipts/export are deferred. |
| Organizer administration | Campaign management and donation panel. | Editing, dashboards, donation lists, thank-yous, updates, reporting, and integrations. | Minimal organization-scoped campaign/item/donation management. No teams, integrations, or automated outreach. |
| Growth mechanics | Share links and content guidance; also offers product-specific promotion features. | Social sharing, updates, and sometimes co-organizers/referral links. | Stable public URL, copy/native share, and metadata. No promotion marketplace or referral attribution. |

## Sources

- [Banco Central: How to make a PIX](https://www.bcb.gov.br/meubc/faqs/p/como-fazer-um-pix) (official, MEDIUM via web-search verification; updated 2025-05-29)
- [Banco Central: PIX initiation standards manual](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf) (official, MEDIUM via web-search verification; current result published 2025)
- [Banco Central: Pix Cobranca](https://www.bcb.gov.br/estabilidadefinanceira/pix-cobranca) (official, MEDIUM via web-search verification)
- [Vakinha: donating by PIX](https://www.vakinha.com.br/duvidas-frequentes/como-fazer-doacao-por-pix) (primary competitor documentation, MEDIUM; 2025-02-07)
- [Vakinha: public campaign example](https://www.vakinha.com.br/vaquinha/ajuda-no-pix?openModal=true) (primary product observation, MEDIUM)
- [Vakinha: campaign features and creator guidance](https://www.vakinha.com.br/blog/receber-doacao) (primary competitor documentation, MEDIUM; 2025-07-16)
- [GoFundMe: how fundraising works](https://support.gofundme.com/hc/en-us/articles/4405037344411-How-fundraising-works-on-GoFundMe) (primary competitor documentation, MEDIUM; 2026-04-20)
- [GoFundMe: managing and thanking donors](https://support.gofundme.com/hc/en-us/articles/205213077-Thanking-and-managing-donors) (primary competitor documentation, MEDIUM; 2026-07-30)
- [Donately fundraising features](https://www.donately.com/features) (primary competitor documentation, MEDIUM; accessed 2026-08-30)

## Research Limits

- This research validates product conventions and PIX initiation options, not a legal determination of payment, data-protection, consumer-protection, or charitable-fundraising obligations. Those need Brazil-specific legal/compliance review before public launch.
- The table-stakes classification is strong for campaign UX and PIX handoff. It is deliberately more conservative on donor messaging, receipts, and analytics because v1 does not possess independently verified payment or complete donor identity data.

---
*Feature research for: public PIX donation campaign management*
*Researched: 2026-08-30*
