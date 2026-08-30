# Domain Pitfalls: Donation Management with PIX

**Domain:** Public, multi-tenant donation campaigns using static PIX QR codes and donor self-confirmation
**Researched:** 2026-08-30
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Treating self-confirmation as payment verification

**Classification:** Product, data integrity, and fraud risk

**What goes wrong:** A donor can press "I paid" without making a PIX payment, press it twice, or make a payment with a different amount. If that action is represented as a settled donation, campaign totals and item availability become demonstrably false.

**Why it happens:** PIX is instant for the payer, so it is tempting to infer completion from a QR code or a confirmation button. With a static QR code, the application has no bank-side settlement signal. Even a transaction identifier in the QR payload is not a settlement webhook.

**How to avoid:** Model the v1 action as `self_confirmed`, never `paid` or `settled`. Store the generated payment intent snapshot, confirmation timestamp, selected item or custom amount, and the declared donor details separately from any future provider-verified state. Explain on the public flow and admin UI that the amount is donor-reported. Make future webhook reconciliation additive: it must transition a record to `verified`, not reinterpret historical records.

**Warning signs:** Admin labels say "paid"; aggregate totals have no status breakdown; a confirmation endpoint accepts only a campaign/item ID; a future payment-provider integration would require changing past rows; organizers report confirmed donations that never arrived.

**Phase to address:** Phase 1 - domain model and database invariants; Phase 2 - public donation flow and copy; Phase 4 - audit/reconciliation readiness.

---

### Pitfall 2: Over-allocating scarce items during concurrent confirmations

**Classification:** Data integrity and product risk

**What goes wrong:** Two donors view the final available item, both self-confirm, and both decrements succeed. Remaining quantity becomes negative, or two donors are promised the same unit. Browser retries and double-clicks cause the same effect even with a single donor.

**Why it happens:** The flow is commonly implemented as "read remaining quantity, then update" in application code. That read-modify-write sequence is not safe under concurrent serverless requests, and no in-memory lock survives Vercel function invocations.

**How to avoid:** Use a managed relational database transaction. Make confirmation idempotent with a server-created opaque payment-intent ID and a unique confirmation constraint. Reserve/decrement an item only through a conditional update that requires `remaining_quantity > 0`; record the resulting donation and inventory movement atomically. Decide the explicit business rule for unverified self-confirmations: for v1, count them as a claimed allocation only if the product accepts that false-positive risk, and give organizers a reversible correction workflow with an audit reason.

**Warning signs:** Client-side quantity checks; mutation retries can create duplicate donation rows; item counters are calculated by counting UI events; negative remaining quantities appear; reports cannot explain why an item reopened.

**Phase to address:** Phase 1 - schema, transaction, and idempotency design; Phase 2 - item confirmation endpoint; Phase 4 - correction/audit workflow.

---

### Pitfall 3: Generating a QR code that is valid-looking but wrong, mutable, or untraceable

**Classification:** Payment integrity, security, and product risk

**What goes wrong:** A malformed BR Code payload fails in banking apps, points to the wrong PIX key or amount, or changes after a campaign owner edits the key or item price. The donor sees a QR image but cannot verify which campaign/item configuration was used. An implementation may also assume it can create secure dynamic QR codes without a PIX participant/PSP integration.

**Why it happens:** QR rendering is visually convincing, and common libraries only render arbitrary text. They do not make that text a compliant PIX payload. Static PIX codes permit a mandatory key with optional value and transaction identifier, so application correlation is a separate responsibility. BCB documentation reserves dynamic QR generation for qualified PIX participants and their certified arrangements.

**How to avoid:** Implement and test the BR Code payload builder, including field lengths and CRC, against known-good fixtures and real banking-app manual tests. Build a new immutable payment-intent snapshot before rendering: campaign ID/version, item/custom amount in integer centavos, PIX key, merchant name/city, and an opaque internal reference. Do not use the internal reference as proof of payment. Version PIX key changes and retain the snapshot for every displayed/confirmed intent. Start with static QR codes; defer dynamic QR/webhook claims until a PSP contract and certificate flow exist.

**Warning signs:** QR content is built in the client; money is stored as floating point; changing a campaign key silently changes historical records; no golden tests verify the raw copy-and-paste string; the only test is that an image appears.

**Phase to address:** Phase 1 - money and intent model; Phase 2 - PIX payload generator, test fixtures, and public payment screen.

---

### Pitfall 4: Making public campaigns easy to impersonate or their PIX destination easy to substitute

**Classification:** Security, fraud, and trust risk

**What goes wrong:** A copied campaign, edited QR image, malicious redirect, or changed campaign PIX key directs donations to an attacker. A donor has little independent context to notice, especially when the public page presents only an image and a prominent call to action.

**Why it happens:** Public discoverability increases reach and makes campaign content indexable and shareable. PIX security guidance emphasizes that payers must confirm recipient name and amount, but an app cannot depend on users always detecting a mismatch.

**How to avoid:** Render QR and copy-and-paste payload server-side from the immutable intent, never accept a QR image or arbitrary payload upload. Display the amount, campaign name, and the expected beneficiary identity near the code, with a clear reminder to validate the recipient in the banking app. Require re-authentication and an audit event for PIX-key changes; show key-change history to the organization owner. Give public users a visible report-campaign path, define an operator response/runbook, and retain campaign publication provenance.

**Warning signs:** Owners can replace PIX information without an audit trail; QR payload arrives from the browser; shared campaign links contain editable destination parameters; the payment screen omits expected recipient/amount; there is no report or takedown process.

**Phase to address:** Phase 2 - public campaign/payment integrity; Phase 3 - admin change controls; Phase 4 - abuse response.

---

### Pitfall 5: Tenant isolation enforced in pages but not in data mutations

**Classification:** Security and data confidentiality risk

**What goes wrong:** An authenticated owner changes a campaign, item, donation, or PIX key belonging to another organization by substituting an ID in a route, form, server action, cache key, storage path, or background/admin query. A public route can also accidentally expose admin-only donor data.

**Why it happens:** Greenfield applications often have a correct navigation guard and then query records by `id` alone. UUIDs reduce guessing but do not authorize access. Multi-tenant context is accidentally taken from client input instead of the authenticated session.

**How to avoid:** Derive organization context only from the authenticated server-side session. Every private repository/query must scope by both `organization_id` and resource ID; make this a reusable data-access boundary, backed by database row-level security where the chosen provider supports it. Test every mutation and read with an owner from a second organization. Prefix any future cache, object-storage, and rate-limit keys with the organization ID. Keep public queries intentionally narrow and projection-based: no donor telephone, internal notes, or private activity fields.

**Warning signs:** `organizationId` comes from a form, URL, or request header; private queries use `findById`; authorization exists only in page middleware; admin API responses serialize complete donation records by default; no cross-tenant negative tests exist.

**Phase to address:** Phase 1 - authentication/authorization boundary and schema; Phase 3 - private admin CRUD; Phase 4 - security test suite.

---

### Pitfall 6: Exposing or retaining donor personal data without a deliberate LGPD design

**Classification:** Compliance, privacy, and security risk

**What goes wrong:** Optional donor names, telephone numbers, and messages leak into public activity feeds, static pages, search indexes, analytics, logs, support exports, or another organization. Data is collected by default despite not being needed to initiate PIX, and there is no workable path to access, correct, or delete it.

**Why it happens:** The fields look harmless and are useful to organizers, but names and personal telephone numbers are personal data. Public recognition, direct contact, fraud investigation, and donation reporting each have different purposes; bundling them behind one vague checkbox obscures both product choice and retention responsibility.

**How to avoid:** Apply data minimization: make name, phone, and message optional and do not require them for payment or confirmation. Separate consent for public display from collection for organizer contact; default to private. Publish a concise privacy notice identifying the processing purpose, controller/operator roles, contact channel, and retention/deletion rules. Create redacted operational logs, field-level access restrictions, export/deletion procedures, and a retention schedule. Do not put phone numbers or donor messages in URLs, client analytics, or email subject lines.

**Warning signs:** A public campaign page renders all confirmation data; phone values appear in logs or analytics; a single "agree" checkbox covers payment, contact, and public attribution; no retention owner or deletion path is documented.

**Phase to address:** Phase 1 - data classification and privacy decisions; Phase 2 - donor form and public activity projection; Phase 3 - private admin access; Phase 4 - retention and incident procedures.

---

### Pitfall 7: Leaving a public confirmation endpoint open to spam, duplicate claims, and abusive messages

**Classification:** Security, data integrity, and trust risk

**What goes wrong:** Attackers or bots create thousands of self-confirmed donations, exhaust an item target, scrape public discovery data, or submit abusive content that becomes visible to organizers or the public. The cost and log volume can be material on a free-tier deployment.

**Why it happens:** The donor flow must work without login, so teams skip abuse controls to remove friction. CAPTCHA alone is then mistaken for a durable control, while the mutation remains replayable and unbounded.

**How to avoid:** Require a short-lived, server-created payment intent before confirmation; allow a single idempotent confirmation per intent; expire unused intents. Apply layered rate limits by IP/device signal, campaign, and intent without using the limit as authorization. Enforce server-side length, character, and URL rules for messages; store untrusted text safely and default it to private/not publicly rendered. Add campaign publication quotas and a report/disable path. Use an accessible challenge only after suspicious behavior, rather than making it the sole anti-fraud mechanism.

**Warning signs:** The public endpoint accepts a raw item ID and amount; no rate-limit response exists; one IP can create unlimited claims; messages are immediately public; unusual spikes cannot be attributed to an intent/campaign/IP bucket.

**Phase to address:** Phase 2 - public mutation endpoint; Phase 3 - campaign moderation controls; Phase 4 - observability and abuse runbook.

---

### Pitfall 8: Designing around processes that the Vercel Hobby deployment cannot reliably run

**Classification:** Hosting, availability, and cost risk

**What goes wrong:** The product assumes an always-on server, local disk, in-memory queues, websocket-only updates, or frequent scheduled reconciliation. It then loses state across serverless invocations, silently misses time-sensitive work, or exceeds Hobby limits. Separately, Vercel documents Hobby as personal/non-commercial, so deploying an operational donation platform there may violate plan eligibility even if the code technically runs.

**Why it happens:** Local development hides serverless lifecycle constraints, and "free tier" is interpreted as a production service-level agreement. The self-confirmed v1 design does not require reconciliation, but generic payment architecture often introduces one by habit.

**How to avoid:** Keep v1 synchronous and request-driven: managed database for all durable state, transaction-based item updates, stateless functions, and polling/revalidation for admin refresh. Do not make correctness depend on cron; Hobby cron is daily-only and not precise. Instrument invocation/error/limit usage and document an upgrade trigger. Before public launch, confirm plan terms and expected usage with Vercel; budget a migration path to a compliant paid plan or alternate host rather than promising permanent free production hosting.

**Warning signs:** Job queues live in process memory; cron runs every few minutes in a design doc; a local SQLite database is used for production; a payment or expiry action has no user-driven fallback; runtime logs are the only audit record; launch assumes Hobby is suitable for organizational use.

**Phase to address:** Phase 1 - deployment architecture; Phase 2 - serverless-safe donation flow; Phase 4 - production readiness, monitoring, and hosting decision.

## Moderate Pitfalls

### Pitfall 9: Using currency floats and mutable aggregate counters as the source of truth

**Classification:** Data integrity

**What goes wrong:** Rounding errors make PIX amounts differ from item prices, while stored campaign totals drift after corrections or deletions.

**How to avoid:** Store Brazilian real values as integer centavos, validate positive amounts and explicit min/max bounds, and derive campaign totals from immutable donation/inventory events or update them in the same transaction. Keep the original amount snapshot even if an item price changes.

**Warning signs:** `number`/floating-point money in schemas; values such as `99.999999`; totals can be edited directly; item price changes rewrite donation history.

**Phase to address:** Phase 1 - schema and monetary rules.

---

### Pitfall 10: Confusing public discovery with public access to all campaign data

**Classification:** Product, privacy, and security

**What goes wrong:** Search and listing APIs disclose drafts, inactive campaigns, internal organizer contact details, donation notes, or full donor activity because the public and private data models are the same endpoint with a different screen.

**How to avoid:** Give campaigns an explicit publication state (`draft`, `published`, `paused`, `closed`, `disabled`) and use a dedicated public read model with an allowlist of fields. Treat public campaign slugs as stable identifiers, but do not use them as authorization tokens. Return `404` for private/unpublished resources without revealing their status to non-owners.

**Warning signs:** Public list queries join donation tables; a campaign becomes public merely because it has a slug; drafts appear in sitemaps; API responses use `select *`.

**Phase to address:** Phase 2 - public campaign read model; Phase 3 - campaign lifecycle management.

---

### Pitfall 11: No correction, dispute, or campaign-disable path

**Classification:** Product, data integrity, and fraud response

**What goes wrong:** An organizer enters the wrong PIX key, marks an incorrect claim, discovers fraud, or needs to close a campaign, but the only options are destructive database edits or silently changing history.

**How to avoid:** Build append-only audit events for key changes, publication changes, confirmation reversals, and inventory adjustments; require a reason and actor for corrections. Closing/pausing must stop new intent creation while preserving the public explanation and historic records. Ensure the admin view distinguishes requested, self-confirmed, corrected, and any future verified amounts.

**Warning signs:** No status transition history; rows are hard-deleted; an item can be reopened with no reason; campaign closure does not invalidate unconfirmed payment intents.

**Phase to address:** Phase 3 - admin operations; Phase 4 - abuse/dispute runbook.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Mark self-confirmations as paid | Simple totals and labels | False financial reporting; dangerous webhook migration | Never |
| Client-side QR payload generation | Fewer server calls | Tamperable destination/amount; no authoritative audit snapshot | Never |
| Read quantity then decrement | Easy CRUD code | Over-allocation under retries/concurrency | Never |
| One `donations` table with mutable status and no events | Fewer tables | No correction trail or explanation of totals | Only for a disposable prototype with no real campaigns |
| Store all donor fields in public campaign responses | Fast UI wiring | LGPD and safety exposure | Never |
| Depend on frequent Vercel Cron | Familiar background-work model | Unsupported/imprecise on Hobby; silent missed work | Never on Hobby |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| PIX BR Code | Render arbitrary string as QR and assume payment compatibility | Generate and retain a standards-compliant static payload, validate with fixtures, and manually test copy-and-paste in real banking apps. |
| PIX dynamic QR | Attempt direct dynamic generation without a PSP/participant arrangement | Keep v1 static; design a provider adapter only when a qualified PSP integration and certificates are in scope. |
| Future payment webhooks | Trust a client callback or create a new donation without correlation/idempotency | Verify provider signatures, map to the existing intent, make delivery idempotent, and preserve raw event/audit metadata safely. |
| Vercel Hobby | Use cron or function-local state for correctness | Put durable state in a managed database and make cron optional/best-effort only. |

## Performance and Availability Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| N+1 donation/activity queries on public listings | Slow campaign discovery; excess function/database use | Paginate, project only public fields, and index publication/status and campaign lookups | Noticeable as campaign count/activity grows; avoid from the first query |
| Recomputing all totals from client requests | Admin counters lag or time out | Transactional aggregate or bounded indexed aggregates with periodic consistency checks | At moderate campaign activity; a single campaign with many claims can expose it |
| No endpoint rate controls | Bot traffic, spam, function usage spikes | Intent-based idempotency plus campaign/IP rate limits and monitoring | Immediately, because a public endpoint can be abused before organic scale |

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Trusting `organizationId`, campaign owner ID, or role from the browser | Cross-tenant data mutation/IDOR | Derive tenant and actor from server session; tenant-scope every data access. |
| Treating UUIDs/slugs as authorization | Unauthorized read/write via leaked or guessed URLs | Enforce ownership/publication policy at the server and data layer. |
| Letting any owner change the PIX key without verification/audit | Donation diversion and uninvestigable disputes | Re-authentication, immutable key-change audit event, clear confirmation, and optional delayed activation. |
| Rendering donor messages as rich HTML | Stored XSS and public harm | Plain-text rendering, server-side sanitization/length limits, and private-by-default moderation. |
| Sending PII to telemetry/logging | Privacy breach and broad internal access | Redact/mask phone/name/message values; use opaque IDs in logs. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| Calling the final action "payment confirmed" | Donors and organizers assume bank verification | Say "I made this PIX payment" and show that the campaign records a self-confirmation. |
| Showing only a QR image | Donor cannot inspect destination or recover from camera failure | Show amount, beneficiary expectation, and a copy-and-paste payload with copy feedback. |
| Letting an item remain selectable after it is claimed out | Failed or misleading confirmations | Disable it from fresh intent creation atomically and show availability status. |
| Publishing donor identity/message by default | Unwanted exposure or harassment | Separate explicit attribution consent; default private. |
| Hiding campaign status | Donors send to a paused or questionable campaign | Prominent published/paused/closed states and a report path. |

## Looks Done But Isn't Checklist

- [ ] **PIX QR generation:** Raw payload fields, UTF-8/accent handling, amounts in centavos, field limits, and CRC are fixture-tested and accepted by representative banking apps.
- [ ] **Donor confirmation:** A repeat request, double-click, refresh, and concurrent final-item scenario produce one idempotent result and never negative inventory.
- [ ] **Donation status:** The UI and exports distinguish self-confirmed claims from provider-verified payments; no financial language overstates verification.
- [ ] **Public campaign page:** It displays only allowlisted data, the expected recipient/amount, and an accessible copy-and-paste code; it exposes no organizer-only or donor PII.
- [ ] **Admin authorization:** A second organization cannot read or mutate a campaign, item, donation, PIX key, or exported data via any route/action.
- [ ] **Privacy:** Phone/name/message are optional, attribution is separately opt-in, logs are redacted, and a retention/deletion owner exists.
- [ ] **Hosting:** Production uses managed durable storage; no correctness path depends on function memory, local files, or sub-daily Hobby cron.
- [ ] **Operations:** Campaign pause/disable, claim correction, PIX-key change, and abuse reports create reviewable audit events.

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| Self-confirmed claim presented as paid | Phase 1: domain model; Phase 2: donation UX | Status vocabulary test and UI review; no public/admin aggregate calls the state settled. |
| Item over-allocation/duplicate confirmation | Phase 1: transactional schema; Phase 2: endpoint | Concurrent integration test for the last item; replay test returns the same result. |
| Invalid/mutable PIX QR | Phase 2: PIX generator | Golden raw-payload tests plus manual bank-app QR and copy-and-paste test. |
| QR destination substitution/campaign impersonation | Phase 2: payment page; Phase 3: admin controls | Verify intent snapshot, recipient/amount display, key-change audit, and report flow. |
| Cross-tenant IDOR | Phase 1: auth boundary; Phase 3: admin CRUD | Matrix test every protected read/write using another organization owner. |
| LGPD privacy leakage | Phase 1: data policy; Phase 2: public projections | Inspect public responses/logging; test consent and deletion/export paths. |
| Public-endpoint spam/abuse | Phase 2: confirmation endpoint | Rate-limit, expiry, idempotency, and hostile-message tests. |
| Vercel Hobby incompatibility | Phase 1: architecture; Phase 4: launch readiness | Deployment review verifies managed state, no required frequent cron, and plan eligibility decision. |
| Irreversible mistakes | Phase 3: admin operations | Perform pause, correction, key-change, and disable drills with retained audit history. |

## Sources

- [Banco Central do Brasil: Manual de Padroes para Iniciacao do Pix](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf) (MEDIUM, official; current manual located through BCB search)
- [Banco Central do Brasil: Seguranca no Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca) (MEDIUM, official; accessed 2026-08-30)
- [ANPD: Guia dos Agentes de Tratamento e Encarregado](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/anonimizado___guia_de_agente_de_tratamento_e_encarregado_da_anpd_novo.pdf) (MEDIUM, official)
- [ANPD: Titular de Dados](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1) (MEDIUM, official; accessed 2026-08-30)
- [OWASP: Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html) (MEDIUM, verified guidance; accessed 2026-08-30)
- [OWASP: Insecure Direct Object Reference](https://owasp.org/www-community/attacks/insecure_direct_object_reference) (MEDIUM, verified guidance; accessed 2026-08-30)
- [Vercel: Hobby Plan](https://vercel.com/docs/plans/hobby) and [Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) (MEDIUM, official; pages updated 2026-01)

## Research Limits

- The self-confirmation state model is an explicit product-risk recommendation based on the absence of bank/provider settlement evidence in v1, not a claim that a static QR cannot carry an internal reference.
- This document identifies LGPD implementation concerns; it is not legal advice. Before launch, confirm controller/operator allocation, legal basis, retention, and incident procedures with Brazilian privacy counsel or a qualified DPO.
- Vercel pricing, plan eligibility, and limits change. Recheck the official terms immediately before launch; the current Hobby terms characterize the plan as for personal, non-commercial use.
