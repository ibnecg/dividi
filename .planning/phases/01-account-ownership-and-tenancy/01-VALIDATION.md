---
phase: 01
slug: account-ownership-and-tenancy
# status lifecycle: draft (seeded by plan-phase) -> validated (set by validate-phase Section 6)
# audit-milestone Section 5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-30
---

# Phase 01 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test / pgTAP |
| **Config file** | none |
| **Quick run command** | `pnpm test:unit` |
| **Full suite command** | `pnpm verify:skeleton` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:unit`
- **After every plan wave:** Run `pnpm verify:skeleton`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01..05 | T-01-SC | Human verification | manual | none | no | green |
| 01-02-01 | 02 | 2 | AUTH-01 | - | Valid signup | integration| `pnpm verify:skeleton` | yes | green |
| 01-02-02 | 02 | 2 | AUTH-01, 04 | - | Edge cases | unit | `pnpm verify:unit` | yes | green |
| 01-03-01 | 03 | 3 | AUTH-04, 05 | - | RLS Isolation | db | `pnpm verify:db` | yes | green |
| 01-03-02 | 03 | 3 | AUTH-04, 05 | - | Schema generation | script | `pnpm verify:types` | no | green |
| 01-04-01 | 04 | 4 | - | - | Push schema | script | `pnpm schema:push:dev` | no | green |
| 01-04-02 | 04 | 4 | AUTH-02, 03 | - | Persistent session | integration| `pnpm verify:app` | yes | green |
| 01-05-01 | 05 | 5 | AUTH-01 | - | Enum safe password | unit | `pnpm verify:unit` | yes | green |
| 01-05-02 | 05 | 5 | AUTH-01..03 | - | Unify auth states | e2e | `pnpm verify:phase` | yes | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `tests/integration/auth.test.ts` - Integration tests for auth flows
- [x] `tests/integration/organization.test.ts` - Integration tests for organization isolation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | - | - | - |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** green

---

## Validation Audit 2026-09-08
| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |

