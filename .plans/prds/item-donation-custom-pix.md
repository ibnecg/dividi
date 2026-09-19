---
version: 1.0.0
owner: kallklen
status: draft
last_updated: 2026-09-19
dependencies:
  - ".plans/prds/public-campaigns.md"
  - ".plans/prds/campaign-items-quantity.md"
llm_directives:
  model: "gpt-4-turbo"
  temperature: 0.2
  persona: >
    You are an expert senior software engineer. Your task is to analyze these
    requirements and generate clean, efficient, and well-documented code that
    adheres to all specified constraints. You MUST NOT deviate from the technical
    constraints or functional requirements without explicit approval.
---

# PRD: Custom PIX Code Generation for Item Donation

## 1. Overview & Goals

### 1.1 Product Summary

The Custom PIX Code Generation feature enables donors on the Dividi platform to seamlessly contribute towards specific campaign items using Brazil's Instant Payment system (PIX). When a donor chooses to donate an item on a campaign details page, the system generates a custom, standard-compliant PIX "Copia e Cola" (BR Code / EMV QRCPS payload) incorporating the campaign's registered PIX key and the calculated monetary amount.

If the selected item has a predetermined unit cost, the donation value is automatically calculated based on the item price and the pledged quantity. If the item does not have a predefined price (e.g., open contribution or non-monetary items where monetary support is accepted), the dialog prompts the donor to specify the donation amount. Donors can easily copy the custom PIX code directly to their clipboard with one click to complete the payment in their banking application.

### 1.2 Business Goals

* **Goal-001**: Streamline the donation process by eliminating manual PIX amount entry and reducing donor drop-off.
* **Goal-002**: Ensure 100% compatibility with Central Bank of Brazil (Bacen) BR Code standards for all generated PIX "Copia e Cola" payloads.
* **Goal-003**: Provide flexible contribution mechanisms for both fixed-price items and open-value needs.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

* **Languages**: TypeScript 5.0+ (Strict mode enabled, `any` is strictly prohibited).
* **Frameworks**: Next.js 16 (App Router), React 19.
* **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) using semantic tokens declared in `src/app/globals.css` (e.g., `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-muted`). Never use raw arbitrary hex codes or raw Tailwind color scales.
* **Component Architecture**: CVA (`class-variance-authority`), `clsx`, and `tailwind-merge` via `@/lib/utils` (`cn`). UI primitives in `src/components/ui/`.
* **Icons**: `lucide-react` (e.g., `Copy`, `Check`, `QrCode`).
* **PIX Specification**: Payloads MUST conform to the Central Bank of Brazil (Bacen) EMV QRCPS-MPM (BR Code) standard:
  * Payload Format Indicator (ID 00): `01`
  * Point of Initiation Method (ID 01): `12` (Static QR with recurring/multiple use or predetermined amount)
  * Merchant Account Information (ID 26):
    * GUI (ID 00): `br.gov.bcb.pix`
    * Chave PIX (ID 01): Campaign `pixKey`
  * Merchant Category Code (ID 52): `0000`
  * Transaction Currency (ID 53): `986` (ISO 4217 for BRL)
  * Transaction Amount (ID 54): Decimal formatted with two places (e.g., `50.00`)
  * Country Code (ID 58): `BR`
  * Merchant Name (ID 59): Campaign name or receiver name (alphanumeric, max 25 chars, without accents)
  * Merchant City (ID 60): City name (alphanumeric, max 15 chars, default `BRASILIA` or sanitized campaign city)
  * Additional Data Field (ID 62): Reference label / txid (ID 05): `***` or alphanumeric identifier (max 25 chars)
  * CRC-16 (ID 63): 4 uppercase hexadecimal characters calculated using CCITT CRC-16 (polynomial `0x1021`, initial value `0xFFFF`).
* **Language Requirement**: Brazilian Portuguese (`pt-BR`) for all user-facing UI labels, placeholders, buttons, error messages, and dialog text.
* **Forbidden Libraries/Patterns**:
  * No heavy external banking SDKs or obscure unlicensed NPM packages for PIX generation; implement a lightweight, fully-typed pure TypeScript utility with zero runtime bloat.
  * No `any` types in TypeScript.
  * Do not bypass client-side clipboard fallback when `navigator.clipboard` is restricted.

---

## 3. User Personas & Roles

* **Persona-Donor**: A public visitor wishing to support a campaign by donating an item or contributing monetary funds directly via PIX.
* **Persona-Organizer**: A campaign creator whose registered PIX key receives the donor payments.

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **US-001**: Custom PIX Code Generation with Defined Item Amount

* **As a**: Persona-Donor
* **I want to**: Select an item with a defined price and receive a custom PIX code with the total value pre-calculated
* **So that**: I can pay the exact donation amount directly in my bank app without manually typing the value.

**Acceptance Criteria**:

* **AC-001-A**: When a donor opens the donation dialog for an item that has an `amount` greater than 0, the system MUST automatically calculate the total donation value based on the item price and selected quantity.
* **AC-001-B**: The system MUST generate a valid EMV BR Code ("PIX Copia e Cola") payload containing the campaign's `pixKey`, the calculated value formatted in BRL, and the correct CRC-16 checksum.
* **AC-001-C**: When the donor changes the pledged quantity in the dialog, the system MUST dynamically recalculate the total value and immediately regenerate the custom PIX code.
* **AC-001-D**: The calculated total amount MUST be displayed formatted as Brazilian Real currency (e.g., `R$ 50,00`).

### **US-002**: Custom Value Input for Items Without Defined Amount

* **As a**: Persona-Donor
* **I want to**: Enter a custom donation amount when an item has no predetermined price
* **So that**: I can contribute any monetary value I feel comfortable giving towards that item.

**Acceptance Criteria**:

* **AC-002-A**: If the selected item does not have a defined `amount` (or amount is 0/null), the dialog MUST display an explicit input field for the donor to specify the donation value in BRL.
* **AC-002-B**: The value input field MUST be validated to require a positive monetary value (minimum `R$ 1,00`).
* **AC-002-C**: As the donor inputs or adjusts the custom value, the system MUST validate the input and generate the updated custom PIX code with the specified value.
* **AC-002-D**: If the value input is empty or invalid, the system MUST display a clear validation message in `pt-BR` and prevent PIX code generation until a valid amount is provided.

### **US-003**: PIX Code Display and Copy-to-Clipboard Experience

* **As a**: Persona-Donor
* **I want to**: View and copy the custom PIX code with a single click inside the dialog
* **So that**: I can easily paste it into my banking application to complete the payment.

**Acceptance Criteria**:

* **AC-003-A**: The dialog MUST display the generated PIX "Copia e Cola" string in a dedicated read-only code display area.
* **AC-003-B**: The dialog MUST provide a "Copiar Código PIX" button with an accompanying copy icon (`Copy`).
* **AC-003-C**: Clicking the copy button MUST copy the PIX string to the system clipboard and provide instant visual feedback (e.g., icon change to `Check` and label changing to "Copiado!" for 2-3 seconds).
* **AC-003-D**: The dialog MUST include brief, clear user instructions in `pt-BR` explaining how to use the code ("Abra o app do seu banco, escolha Pix > Copia e Cola e cole o código").
* **AC-003-E**: If clipboard permissions fail or are unavailable, the system MUST allow the user to select and copy the text manually from an accessible input or textarea.

### **US-004**: Integrated Donation Pledge and Confirmation

* **As a**: Persona-Donor
* **I want to**: Register my pledge details alongside viewing the PIX payment code
* **So that**: The campaign organizers know I am making this donation and can track remaining item needs.

**Acceptance Criteria**:

* **AC-004-A**: The dialog MUST retain the ability for the donor to provide optional contact details (`donorName`, `donorPhone`, `message`) and record the pledge.
* **AC-004-B**: The dialog MUST allow the donor to copy the PIX code both before and after confirming the pledge.
* **AC-004-C**: When confirming the donation, the system MUST trigger the server action to register the pledge and decrement the item quantity as defined in the system requirements.

---

## 5. Non-Functional Requirements (NFRs)

System-wide quality attributes and constraints:

### Performance

* **NFR-Perf-001**: PIX code generation MUST execute synchronously on the client in < 15ms without noticeable input latency or UI freezes.

### Security

* **NFR-Sec-001**: All PIX payload text fields (merchant name, city, description) MUST be sanitized to remove special characters, diacritics/accents, and line breaks to prevent payload corruption or injection attacks.
* **NFR-Sec-002**: Amounts MUST be strictly formatted as positive numbers with two decimal places using dot separator (e.g., `12.50`), with a minimum of `1.00`.

### Reliability & Compliance

* **NFR-Rel-001**: All generated PIX strings MUST strictly adhere to the Bacen EMV QRCPS-MPM specification and pass standard CRC-16/CCITT-FALSE validation.

### Accessibility & UI

* **NFR-Access-001**: The copy button and inputs MUST have visible focus indicators (`focus-visible:ring-2 focus-visible:ring-ring`).
* **NFR-Access-002**: The dialog MUST support keyboard navigation (Esc to close, Tab to navigate between inputs and buttons).
* **NFR-Access-003**: The UI MUST strictly use semantic tokens from `src/app/globals.css` and maintain high contrast.

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

* Automated banking webhook integration or real-time payment confirmation via PSP APIs (e.g., confirming whether the donor actually executed the PIX transfer in their bank app).
* Direct integration with credit cards, boleto, or external payment gateways (Stripe, Mercado Pago, PagSeguro).
* Dynamic QR codes linked to centralized PSP certificates requiring mutual TLS (mTLS) or OAuth bank credentials.
* Automatic refund handling or escrow account management.

---

## 7. Success Metrics & Analytics

Define how success will be measured:

### Key Performance Indicators (KPIs)

* **KPI-001**: 100% validity rate of generated PIX strings when verified with standard Bacen QR Code parsers.
* **KPI-002**: > 80% copy rate of the PIX code among donors who open the donation dialog for monetarily valued items.

---

## Appendix A: Cross-Reference Index

### User Stories

US-001, US-002, US-003, US-004

### Acceptance Criteria

AC-001-A, AC-001-B, AC-001-C, AC-001-D, AC-002-A, AC-002-B, AC-002-C, AC-002-D, AC-003-A, AC-003-B, AC-003-C, AC-003-D, AC-003-E, AC-004-A, AC-004-B, AC-004-C

### Non-Functional Requirements

NFR-Perf-001, NFR-Sec-001, NFR-Sec-002, NFR-Rel-001, NFR-Access-001, NFR-Access-002, NFR-Access-003

### KPIs

KPI-001, KPI-002

---

## Appendix B: Change Log

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-09-19 | kallklen | Initial version of custom PIX code generation PRD |
