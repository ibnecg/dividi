---
phase: 02
slug: organizer-campaign-management
# status lifecycle: draft (seeded by plan-phase) -> validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-07
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest / Playwright / TypeScript checks |
| **Config file** | `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`, `eslint.config.mjs` |
| **Quick run command** | `pnpm test -- --run` |
| **Full suite command** | `pnpm lint && pnpm typecheck && pnpm test -- --run && pnpm exec playwright test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run`
- **After every plan wave:** Run `pnpm lint && pnpm typecheck && pnpm test -- --run`
- **Before `$gsd-verify-work`:** Full suite plus relevant Playwright coverage must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-W0-01 | W0 | 0 | SAFE-06 | T-02-BASELINE | Baseline quality gates execute without inherited lint/type failures hiding Phase 2 regressions | static | `pnpm lint && pnpm typecheck && pnpm test -- --run` | W0 | pending |
| 02-01-01 | 01 | 1 | CAMP-01, CAMP-02 | T-02-OWNER | Only the authenticated organization owner can create or edit campaigns | unit/integration | `pnpm test -- --run` | W0 | pending |
| 02-01-02 | 01 | 1 | CAMP-03, SAFE-06 | T-02-AUDIT | Campaign status and PIX recipient changes create immutable audit activity | unit/integration | `pnpm test -- --run` | W0 | pending |
| 02-02-01 | 02 | 1 | ITEM-01, ITEM-02, ITEM-03 | T-02-ITEMS | Item prices are integer centavos and disabled items cannot be selected for new donations | unit/integration | `pnpm test -- --run` | W0 | pending |
| 02-03-01 | 03 | 2 | ADMN-01, ADMN-02 | T-02-ADMIN | Private admin routes expose only campaigns and items for the active organization owner | e2e | `pnpm exec playwright test` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Repair the broken `pnpm lint` baseline identified in `02-RESEARCH.md`.
- [ ] Resolve inherited TypeScript failures that would prevent a green Phase 2 full gate.
- [ ] Add or extend Vitest setup for server actions/data commands that mutate campaign and item state.
- [ ] Add Playwright coverage for the private organizer campaign workflow once UI routes exist.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Closed versus archived public behavior | CAMP-04 | Public donor behavior is finalized in Phase 3, so Phase 2 can only record state transitions and admin visibility | Confirm admin can set both states and audit records persist; defer public donor behavior to Phase 3 plans |
| Final PIX display payload semantics | CAMP-01, SAFE-06 | Phase 4 finalizes donor payment handoff details | Confirm Phase 2 stores a validated recipient key and records PIX-key changes; defer rendered payload verification to Phase 4 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
