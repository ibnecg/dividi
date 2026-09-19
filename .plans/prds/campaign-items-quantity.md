---
version: 1.0.0
owner: product-owner-name
status: draft
last_updated: 2026-09-19
dependencies: []
llm_directives:
  model: "gpt-4-turbo"
  temperature: 0.2
  persona: >
    You are an expert senior software engineer. Your task is to analyze these
    requirements and generate clean, efficient, and well-documented code that
    adheres to all specified constraints. You MUST NOT deviate from the technical
    constraints or functional requirements without explicit approval.
---

# PRD: Campaign Items Quantity Management

## 1. Overview & Goals

### 1.1 Product Summary

This feature allows campaign organizers to specify the quantity of each item needed for their campaign. It also enables donors to select specific items to donate, optionally leaving their contact details and a message. The system will automatically track and decrement the needed quantity of items as donations are pledged, disabling the item once the target quantity is reached.

### 1.2 Business Goals

* **Goal-001**: Improve campaign management by allowing specific quantity targets for needed items.
* **Goal-002**: Enhance donor experience by showing real-time item needs and allowing them to leave optional contact information and messages.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

* **Languages**: TypeScript 5.0+ (Strict mode enabled, `any` is strictly prohibited)
* **Frameworks**: Next.js 16 (App Router with React 19), Tailwind CSS v4
* **Databases**: Neon Serverless PostgreSQL with Drizzle ORM
* **Data Models**: Will require updates to `campaignItems` schema and a new table for `donations`.
* **State Mutations**: All data mutations MUST use Next.js Server Actions.
* **Transactions**: Multi-entity database operations MUST be executed in atomic database transactions (`db.transaction()`).

---

## 3. User Personas & Roles

* **Persona-Organizer**: A user who creates and manages a campaign, defining the items and quantities needed.
* **Persona-Donor**: A public user visiting a campaign page who wants to pledge a donation for specific items.

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **LAW-001**: Define Item Quantities During Campaign Creation

* **As a**: Persona-Organizer
* **I want to**: Specify the quantity needed for each item when creating a campaign
* **So that**: Donors know exactly how many of each item are required.

**Acceptance Criteria**:

* **AC-001-A**: System MUST allow the organizer to input an integer quantity greater than 0 for each item in the campaign creation form.
* **AC-001-B**: System MUST save the specified item quantities in the database under `campaignItems`.
* **AC-001-C**: Form validation MUST require quantity to be a positive integer.

### **LAW-002**: Pledge Item Donation

* **As a**: Persona-Donor
* **I want to**: Select an item from the campaign page and inform that I am donating it, with optional contact info and a message
* **So that**: The organizer is notified of my pledge and the remaining quantity updates.

**Acceptance Criteria**:

* **AC-002-A**: System MUST display the remaining quantity needed for each item on the public campaign page.
* **AC-002-B**: System MUST allow the donor to select an item and pledge a specific quantity to donate (up to the remaining quantity).
* **AC-002-C**: System MUST provide optional fields for the donor's name, phone number, and a message.
* **AC-002-D**: System MUST record the pledged donation in the database.

### **LAW-003**: Automatic Quantity Tracking and Item Disabling

* **As a**: Persona-Organizer
* **I want to**: Have the system automatically decrease the remaining needed quantity of an item when someone pledges a donation
* **So that**: The campaign always reflects the current needs and prevents over-donation.

**Acceptance Criteria**:

* **AC-003-A**: System MUST decrement the remaining needed quantity of an item immediately after a donation is pledged.
* **AC-003-B**: This decrement operation MUST be handled within an atomic transaction alongside the donation record creation to prevent race conditions.
* **AC-003-C**: System MUST disable the item on the public campaign page when its remaining quantity reaches 0.
* **AC-003-D**: System MUST NOT allow a donor to pledge more than the currently remaining quantity of an item.

---

## 5. Non-Functional Requirements (NFRs)

### Performance

* **NFR-Perf-001**: Server actions for pledging a donation MUST complete in < 500ms to ensure a responsive donor experience.

### Concurrency

* **NFR-Conc-001**: System MUST handle concurrent donation pledges safely using database-level locking or atomic updates to prevent the remaining quantity from going below zero.

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

* Processing actual monetary transactions or shipping logistics for the donated items.
* Modifying item quantities after the campaign is created (in this phase).
* Allowing donors to edit or cancel their pledge after submission.

---

## 7. Success Metrics & Analytics

### Key Performance Indicators (KPIs)

* **KPI-001**: 100% data consistency for item quantities (no negative remaining quantities).

---

## Appendix A: Cross-Reference Index

### User Stories
LAW-001, LAW-002, LAW-003

### Acceptance Criteria
AC-001-A, AC-001-B, AC-001-C, AC-002-A, AC-002-B, AC-002-C, AC-002-D, AC-003-A, AC-003-B, AC-003-C, AC-003-D

### Non-Functional Requirements
NFR-Perf-001, NFR-Conc-001

### KPIs and Events
KPI-001

---

## Appendix B: Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-09-19 | Agent | Initial version |
