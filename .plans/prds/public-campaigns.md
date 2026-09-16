---
version: 1.0.0
owner: kallklen
status: approved
last_updated: 2026-09-16
dependencies: []
llm_directives:
  model: 'gpt-4-turbo'
  temperature: 0.2
  persona: >
    You are an expert senior software engineer. Your task is to analyze these
    requirements and generate clean, efficient, and well-documented code that
    adheres to all specified constraints. You MUST NOT deviate from the technical
    constraints or functional requirements without explicit approval.
---

# PRD: Public Campaigns Discovery

## 1. Overview & Goals

### 1.1 Product Summary

The Public Campaigns Discovery feature allows general public users (guests/donors) to find and view active donation campaigns created by organizations or individuals. It provides a public listing page to browse campaigns, a detailed view for specific campaigns including their required items, and a clear call-to-action (CTA) on the landing page to drive traffic to the listings.

### 1.2 Business Goals

- **Goal-001**: Enable public discovery of donation campaigns to increase visibility and potential donations.
- **Goal-002**: Provide clear, accessible information about campaign goals and specific items needed.
- **Goal-003**: Seamlessly guide visitors from the home page to the campaign discovery experience.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

- **Languages**: TypeScript 5.0+
- **Frameworks**: Next.js 16 (App Router), React 19
- **Databases**: Neon Serverless PostgreSQL, Drizzle ORM
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) with semantic CSS tokens from `src/app/globals.css`.
- **Component Architecture**: CVA, `clsx`, `tailwind-merge` (`@/lib/utils`), and shadcn-like primitives in `src/components/ui/`.
- **Language Requirement**: All user-facing UI text, buttons, and labels MUST be in Brazilian Portuguese (`pt-BR`).
- **Forbidden Libraries/Patterns**: Do not use `any` in TypeScript. Do not use client-side `fetch()` for data mutations if Server Actions can be used. Do not use raw Tailwind color scales (e.g. `text-zinc-500`), use semantic tokens (e.g. `text-muted-foreground`).

---

## 3. User Personas & Roles

Define all actors who interact with the system:

- **Persona-Guest**: A public visitor (potential donor) who wants to discover and read about active donation campaigns without needing to create an account.
- **Persona-User**: An authenticated user or organization member who has created campaigns (though they act as Persona-Guest when viewing public pages).

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **LAW-101**: Home Page Call to Action

- **As a**: Persona-Guest
- **I want to**: See a clear call-to-action on the landing page
- **So that**: I can easily navigate to the list of public campaigns to donate

**Acceptance Criteria**:

- **AC-101-A**: System MUST display a primary CTA button on the home page (`src/app/page.tsx`).
- **AC-101-B**: The CTA button text MUST be in pt-BR (e.g., "Ver Campanhas" or "Quero Doar").
- **AC-101-C**: The CTA button MUST navigate the user to the `/campaigns` route.

### **LAW-102**: Public Campaign List Page

- **As a**: Persona-Guest
- **I want to**: Browse a list of open campaigns
- **So that**: I can discover causes I want to support

**Acceptance Criteria**:

- **AC-102-A**: System MUST provide a public route at `/campaigns`.
- **AC-102-B**: System MUST fetch and display a list of all active campaigns from the database using Server Components.
- **AC-102-C**: Each campaign card MUST display the campaign's image (if available), name, and a truncated description.
- **AC-102-D**: Each campaign card MUST be clickable and navigate to the campaign details page (`/campaigns/[id]`).
- **AC-102-E**: System MUST display a clear empty state message in pt-BR if no campaigns are currently available.

### **LAW-103**: Public Campaign Details Page

- **As a**: Persona-Guest
- **I want to**: View detailed information about a specific campaign and its required items
- **So that**: I can understand the goal and see what items I can donate or contribute towards

**Acceptance Criteria**:

- **AC-103-A**: System MUST provide a public route at `/campaigns/[id]`.
- **AC-103-B**: System MUST display the full campaign details: name, description, cover image, and PIX key (if provided).
- **AC-103-C**: System MUST fetch and display all `campaignItems` associated with the campaign.
- **AC-103-D**: Each campaign item MUST display its description, estimated amount (formatted as BRL currency), and image (if available).
- **AC-103-E**: System MUST return a 404 Not Found page if the requested campaign ID does not exist.

---

## 5. Non-Functional Requirements (NFRs)

System-wide quality attributes and constraints:

### Performance

- **NFR-Perf-001**: Public pages (`/campaigns` and `/campaigns/[id]`) SHOULD be statically generated or leverage Next.js caching to ensure LCP < 1.5s.
- **NFR-Perf-002**: Database queries for public campaigns MUST NOT require authentication checks, minimizing latency.

### Accessibility & UI

- **NFR-Access-001**: All interactive elements (cards, buttons) MUST have visible keyboard focus indicators (`focus-visible:ring-2 focus-visible:ring-ring`).
- **NFR-Access-002**: The design MUST adhere to the minimalist, high-contrast aesthetic specified in DESIGN.md, using only semantic tokens.

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

- The actual donation payment processing or PIX generation logic (displaying the PIX key is in scope, processing is not).
- Filtering or complex search functionality for the campaign list (MVP will just list all campaigns).
- Pagination for the campaign list page (MVP will display all or a fixed recent limit).
- User authentication to view these public pages.

---

## 7. Success Metrics & Analytics

Define how success will be measured:

### Key Performance Indicators (KPIs)

- **KPI-001**: Number of views on the `/campaigns` page.
- **KPI-002**: Click-through rate (CTR) from the home page CTA to the campaign list.

---

## Appendix A: Cross-Reference Index

### User Stories

LAW-101, LAW-102, LAW-103

### Acceptance Criteria

AC-101-A, AC-101-B, AC-101-C, AC-102-A, AC-102-B, AC-102-C, AC-102-D, AC-102-E, AC-103-A, AC-103-B, AC-103-C, AC-103-D, AC-103-E

### Non-Functional Requirements

NFR-Perf-001, NFR-Perf-002, NFR-Access-001, NFR-Access-002

### KPIs

KPI-001, KPI-002
