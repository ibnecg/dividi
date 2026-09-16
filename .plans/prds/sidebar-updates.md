---
version: 1.0.0
owner: antigravity
status: done
last_updated: 2026-09-15
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

# PRD: Sidebar Updates (Campaigns & Responsiveness)

## 1. Overview & Goals

### 1.1 Product Summary

The dashboard sidebar needs to be updated to include navigation to the new Campaigns section. Additionally, the sidebar must be made responsive and collapsible to improve the user experience across different screen sizes (desktop and mobile).

### 1.2 Business Goals

- **Goal-001**: Allow users to navigate to the Campaigns page from anywhere in the dashboard.
- **Goal-002**: Improve screen real estate utilization on desktop by allowing the sidebar to collapse.
- **Goal-003**: Ensure the dashboard is fully accessible and usable on mobile devices.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

- **Languages**: TypeScript, React 19
- **Frameworks**: Next.js App Router (16+), Tailwind CSS 4+
- **UI Components**: shadcn/ui and Lucide React icons
- **Layout**: Implement via updates to the existing Next.js layout component (`layout.tsx`) and sidebar components in the `dashboard` directory.
- **Forbidden Libraries/Patterns**: Do not use third-party sidebar libraries; build using Tailwind CSS and Radix/shadcn primitives.

---

## 3. User Personas & Roles

- **Persona-User**: Standard authenticated user of the Dividi platform who needs to navigate to campaigns and use the dashboard on varying screen sizes.

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **LAW-51**: Campaigns Navigation in Sidebar

- **As a**: Persona-User
- **I want to**: See a link to the campaigns page in the sidebar
- **So that**: I can easily navigate to manage my campaigns.

**Acceptance Criteria**:

- **AC-51-A**: System MUST provide a "Campanhas" (Campaigns) navigation link in the sidebar.
- **AC-51-B**: Clicking the link MUST navigate the user to `/dashboard/campaigns`.
- **AC-51-C**: The link MUST visually indicate when the user is currently on the `/dashboard/campaigns` route.

### **LAW-52**: Responsive and Collapsible Sidebar

- **As a**: Persona-User
- **I want to**: Be able to collapse and expand the sidebar, and have it respond to my screen size
- **So that**: I can maximize my screen space when needed and access the menu on mobile devices.

**Acceptance Criteria**:

- **AC-52-A**: System MUST provide a toggle button to expand and collapse the sidebar on desktop.
- **AC-52-B**: System MUST collapse the sidebar to only show icons (and hide text) when collapsed on desktop.
- **AC-52-C**: System MUST adapt the sidebar to a mobile-friendly view (e.g., a drawer or sheet) on small screens (mobile breakpoints).
- **AC-52-D**: System MUST provide a hamburger menu button on mobile screens to open the sidebar.

---

## 5. Non-Functional Requirements (NFRs)

### Performance

- **NFR-Perf-001**: Sidebar animations (expanding/collapsing) MUST be smooth and use CSS transitions (e.g., `< 300ms`).

### Accessibility

- **NFR-Access-001**: The sidebar toggle button MUST be keyboard-navigable and have appropriate ARIA attributes (e.g., `aria-expanded`, `aria-label`).
- **NFR-Access-002**: The mobile sidebar (drawer/sheet) MUST trap focus when open.

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

- Complex multi-level navigation menus (dropdowns inside the sidebar).
- User customizable sidebar ordering.
- Organization switching from the sidebar.

---

## 7. Success Metrics & Analytics

### Key Performance Indicators (KPIs)

- **KPI-001**: 100% of dashboard pages render the updated responsive sidebar without breaking the layout.

---

## Appendix A: Cross-Reference Index

### User Stories

LAW-51, LAW-52

### Acceptance Criteria

AC-51-A, AC-51-B, AC-51-C, AC-52-A, AC-52-B, AC-52-C, AC-52-D

### Non-Functional Requirements

NFR-Perf-001, NFR-Access-001, NFR-Access-002
