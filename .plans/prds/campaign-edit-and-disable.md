---
version: 1.0.0
owner: kallklen
status: draft
last_updated: 2026-09-19
dependencies:
  - ".plans/prds/campaign-creation.md"
  - ".plans/prds/public-campaigns.md"
llm_directives:
  model: "gpt-4-turbo"
  temperature: 0.2
  persona: >
    You are an expert senior software engineer. Your task is to analyze these
    requirements and generate clean, efficient, and well-documented code that
    adheres to all specified constraints. You MUST NOT deviate from the technical
    constraints or functional requirements without explicit approval.
---

# PRD: Campaign Editing and Deactivation

## 1. Overview & Goals

### 1.1 Product Summary

The Campaign Editing and Deactivation feature empowers campaign organizers to manage the lifecycle of their solidarity campaigns on Dividi. Organizers can modify campaign details (title, description, PIX key, cover image) and associated campaign items (descriptions, target quantities, monetary amounts, item photos).

Additionally, organizers can disable (deactivate) a campaign when the goals have been met, if the initiative is temporarily paused, or when donations should no longer be accepted. Deactivated campaigns are immediately excluded from the public campaigns discovery feed (`/campaigns`), while direct visits to a deactivated campaign's URL clearly inform donors of its closed status and disable new donation pledges. Organizers retain full visibility of deactivated campaigns in their private dashboard (`/dashboard/campaigns`) with the option to re-enable them at any time.

### 1.2 Business Goals

* **Goal-001**: Allow campaign organizers to keep their campaign information and needed items accurate and up to date.
* **Goal-002**: Enable organizers to gracefully conclude or pause campaigns without losing historical data or deleting the campaign record.
* **Goal-003**: Ensure donors only encounter active, actionable fundraising initiatives in the public catalog.
* **Goal-004**: Prevent unauthorized modifications by enforcing strict ownership verification on all mutation operations.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

* **Languages**: TypeScript 5.0+ (Strict mode enabled, `any` is strictly prohibited).
* **Frameworks**: Next.js 16 (App Router), React 19.
* **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) using semantic tokens defined in `src/app/globals.css` (e.g., `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-muted`, `bg-destructive`, `text-destructive`). Never use arbitrary hex colors or hardcoded Tailwind palette classes (e.g., `text-zinc-500`).
* **Component Architecture**: CVA (`class-variance-authority`), `clsx`, and `tailwind-merge` via `@/lib/utils` (`cn`). UI primitives located in `src/components/ui/`.
* **Icons**: `lucide-react` (e.g., `Edit`, `Power`, `PowerOff`, `AlertCircle`, `CheckCircle`, `Trash2`, `Plus`).
* **Database & ORM**: Neon Serverless PostgreSQL with Drizzle ORM (`drizzle-orm`, `pgTable`, `boolean`, `timestamp`).
  * Add `isActive: boolean('is_active').default(true).notNull()` to `campaigns` table in `src/db/schema.ts`.
  * Add `updatedAt: timestamp('updated_at').defaultNow().notNull()` to `campaigns` table.
* **Image Uploads**: Vercel Blob (`@vercel/blob/client` via `/api/upload`) with a strict 50 KB file size limit per image upload.
* **Form & Validation**: `react-hook-form`, `@hookform/resolvers/zod`, and `zod`. Re-validate all payloads on the server inside Server Actions.
* **Language Requirement**: Brazilian Portuguese (`pt-BR`) for all user-facing UI labels, placeholders, buttons, toast feedback, confirmation dialogs, and error messages.
* **Forbidden Libraries/Patterns**:
  * Do not use client-side `fetch()` for database mutations; Server Actions (`'use server'`) MUST be used.
  * No `any` types in TypeScript.
  * No destructive hard-deletions of campaigns when a user selects disable/deactivate; update `isActive = false`.

---

## 3. User Personas & Roles

* **Persona-Organizer**: An authenticated user who created a campaign and needs to update its content or toggle its availability status.
* **Persona-Donor**: A public visitor searching for causes to support on the public `/campaigns` page or via direct campaign links.

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **US-001**: Campaign Details and Items Editing

* **As a**: Persona-Organizer
* **I want to**: Edit my existing campaign's information and its item list
* **So that**: I can update descriptions, adjust needed item quantities, update PIX keys, or upload new images as campaign needs evolve.

**Acceptance Criteria**:

* **AC-001-A**: The system MUST provide an edit route at `/dashboard/campaigns/[id]/edit` accessible only to authenticated users who own the campaign (`campaign.userId === session.user.id`).
* **AC-001-B**: The edit page MUST pre-populate the campaign form with existing values for `name`, `description`, `pixKey`, `imageUrl`, and all associated `campaignItems` (description, amount, quantity, image).
* **AC-001-C**: The form MUST validate that required fields (`name` min 3 chars, `description` min 10 chars, `pixKey` min 5 chars, valid image URLs, item descriptions, and item quantities >= 1) satisfy the Zod schema.
* **AC-001-D**: The organizer MUST be able to add new items, modify existing items, and remove items before saving.
* **AC-001-E**: Submitting the form MUST execute a Server Action that updates the campaign and its items in an atomic database transaction.
* **AC-001-F**: Upon successful update, the system MUST revalidate `/dashboard/campaigns`, `/campaigns`, and `/campaigns/[id]`, and redirect the organizer to `/dashboard/campaigns` with a success feedback notification.

### **US-002**: Campaign Deactivation and Reactivation Toggle

* **As a**: Persona-Organizer
* **I want to**: Deactivate an active campaign or reactivate a previously deactivated campaign
* **So that**: I can temporarily or permanently stop receiving donations without deleting my campaign data.

**Acceptance Criteria**:

* **AC-002-A**: The system MUST provide a deactivation/reactivation control for each campaign owned by the user on the dashboard (`/dashboard/campaigns`) and on the campaign edit page.
* **AC-002-B**: Clicking "Desativar Campanha" MUST display a confirmation dialog explaining that the campaign will be hidden from the public feed and will stop accepting donations.
* **AC-002-C**: Confirming deactivation MUST execute a Server Action that sets `isActive = false` and updates `updatedAt` for the specified campaign, verifying that `session.user.id === campaign.userId`.
* **AC-002-D**: For deactivated campaigns, the dashboard MUST provide a "Reativar Campanha" action that sets `isActive = true`.
* **AC-002-E**: Toggling status MUST revalidate relevant paths (`/dashboard/campaigns`, `/campaigns`, `/campaigns/[id]`) and provide instant visual feedback in `pt-BR`.

### **US-003**: Public Listing Filtering for Active Campaigns

* **As a**: Persona-Donor
* **I want to**: View only active campaigns in the public campaigns catalog (`/campaigns`)
* **So that**: I do not spend time browsing or attempting to contribute to closed or discontinued campaigns.

**Acceptance Criteria**:

* **AC-003-A**: The public campaigns list query (`/campaigns`) MUST filter records using `where(eq(campaigns.isActive, true))`.
* **AC-003-B**: Deactivated campaigns (`isActive = false`) MUST NOT be returned or rendered anywhere in the public `/campaigns` feed.
* **AC-003-C**: If all campaigns are inactive or no active campaigns exist, the public page MUST display the empty state message: "Não há campanhas ativas no momento."

### **US-004**: Inactive Campaign Detail Page Handling

* **As a**: Persona-Donor
* **I want to**: Clearly understand when a directly linked campaign is inactive
* **So that**: I know that the campaign has concluded and that donations are no longer accepted.

**Acceptance Criteria**:

* **AC-004-A**: If a visitor accesses `/campaigns/[id]` for a deactivated campaign (`isActive = false`), the page MUST display a prominent status banner stating: "Esta campanha está desativada e não está recebendo novas doações."
* **AC-004-B**: On a deactivated campaign page, all donation triggers ("Doar", `PledgeDialog`) MUST be disabled or hidden, preventing new donation pledges or PIX code generation.
* **AC-004-C**: If the logged-in user is the organizer of the deactivated campaign, the system MUST show an informative notice with a direct link to `/dashboard/campaigns/[id]/edit` to reactivate or edit it.
* **AC-004-D**: Campaign information (title, description, cover photo) MAY remain visible in read-only mode for informational and transparency purposes.

### **US-005**: Organizer Dashboard Status Display and Management

* **As a**: Persona-Organizer
* **I want to**: See the status of all my campaigns (active and inactive) on my dashboard
* **So that**: I can easily identify which campaigns are live and manage their settings.

**Acceptance Criteria**:

* **AC-005-A**: In `/dashboard/campaigns`, each campaign card MUST display a badge indicating its status: "Ativa" (using standard badge styles) or "Inativa" (using muted/secondary badge styles).
* **AC-005-B**: Each campaign card MUST provide direct action buttons/options: "Editar" (navigating to `/dashboard/campaigns/[id]/edit`) and "Desativar" / "Reativar" (triggering the status toggle).
* **AC-005-C**: Organizers MUST be able to view and manage all campaigns they created regardless of `isActive` status.
* **AC-005-D**: Unauthorized users attempting to access `/dashboard/campaigns/[id]/edit` for a campaign they do not own MUST be redirected to `/dashboard/campaigns` with an unauthorized error message.

---

## 5. Non-Functional Requirements (NFRs)

### Performance

* **NFR-Perf-001**: Campaign update and status toggle Server Actions MUST complete execution in < 1000ms under standard database latency conditions.
* **NFR-Perf-002**: Image uploads during campaign edit MUST strictly enforce the 50 KB maximum size constraint.

### Security

* **NFR-Sec-001**: All mutation Server Actions (`updateCampaignAction`, `toggleCampaignStatusAction`) MUST verify authentication via `auth.getSession()` and enforce that `campaign.userId === session.user.id`.
* **NFR-Sec-002**: Server Actions MUST sanitize text inputs (`name`, `description`, item descriptions) to prevent XSS attacks and injection vectors.
* **NFR-Sec-003**: Direct URL manipulation to access edit pages of other organizers' campaigns MUST be blocked on the server before rendering the form.

### Reliability & Data Integrity

* **NFR-Rel-001**: Editing campaign details along with item changes (updates, additions, removals) MUST be executed inside an atomic database transaction (`db.transaction()` or `db.batch()`).
* **NFR-Rel-002**: Changes to campaign status or content MUST invalidate Next.js route caches using `revalidatePath` for `/dashboard/campaigns`, `/campaigns`, and `/campaigns/[id]`.

### Usability & Accessibility

* **NFR-Access-001**: All interactive buttons, status badges, and dialogs MUST maintain visible focus rings (`focus-visible:ring-2 focus-visible:ring-ring`) and accessible contrast per `DESIGN.md`.
* **NFR-Access-002**: The deactivation confirmation dialog MUST support full keyboard accessibility (Esc to cancel, Tab loop, Enter to confirm).

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

* Hard deletion of campaign records and foreign key cascading deletions from the database. Deactivation uses soft deactivation via `isActive = false` to preserve donor history and analytics.
* Automated expiration timers or scheduled automatic deactivation dates for campaigns.
* Role-based permissions within organizations (e.g. distinguishing editor vs admin roles for campaigns); ownership is determined by `userId`.
* Campaign revision history or changelog diffs visible to donors.

---

## 7. Success Metrics & Analytics

### Key Performance Indicators (KPIs)

* **KPI-001**: 0% incidence of deactivated campaigns leaking into public `/campaigns` feed queries.
* **KPI-002**: 100% of campaign updates completed within an atomic transaction with zero orphaned item records.
* **KPI-003**: 100% enforcement of ownership authorization preventing unauthorized updates or deactivations.

---

## Appendix A: Cross-Reference Index

### User Stories

US-001, US-002, US-003, US-004, US-005

### Acceptance Criteria

AC-001-A, AC-001-B, AC-001-C, AC-001-D, AC-001-E, AC-001-F, AC-002-A, AC-002-B, AC-002-C, AC-002-D, AC-002-E, AC-003-A, AC-003-B, AC-003-C, AC-004-A, AC-004-B, AC-004-C, AC-004-D, AC-005-A, AC-005-B, AC-005-C, AC-005-D

### Non-Functional Requirements

NFR-Perf-001, NFR-Perf-002, NFR-Sec-001, NFR-Sec-002, NFR-Sec-003, NFR-Rel-001, NFR-Rel-002, NFR-Access-001, NFR-Access-002

### KPIs

KPI-001, KPI-002, KPI-003

---

## Appendix B: Change Log

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-09-19 | kallklen | Initial specification for campaign editing and deactivation |
