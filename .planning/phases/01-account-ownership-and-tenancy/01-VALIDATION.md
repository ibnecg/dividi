---
phase: 01
slug: account-ownership-and-tenancy
# status lifecycle: draft (seeded by plan-phase) -> validated (set by validate-phase Section 6)
# audit-milestone Section 5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: false
wave_0_complete: false
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
| 01-01-01 | 01 | 1 | AUTH-01..05 | T-01-SC | Human verification | manual | none | no | pending |
| 01-02-01 | 02 | 2 | AUTH-01 | - | Valid signup | integration| `pnpm verify:skeleton` | no | pending |
| 01-02-02 | 02 | 2 | AUTH-01, 04 | - | Edge cases | unit | `pnpm verify:unit` | yes | pending |
| 01-03-01 | 03 | 3 | AUTH-04, 05 | - | RLS Isolation | db | `pnpm verify:db` | yes | pending |
| 01-03-02 | 03 | 3 | AUTH-04, 05 | - | Schema generation | script | `pnpm verify:types` | no | pending |
| 01-04-01 | 04 | 4 | - | - | Push schema | script | `pnpm schema:push:dev` | no | pending |
| 01-04-02 | 04 | 4 | AUTH-02, 03 | - | Persistent session | integration| `pnpm verify:app` | no | pending |
| 01-05-01 | 05 | 5 | AUTH-01 | - | Enum safe password | unit | `pnpm verify:unit` | yes | pending |
| 01-05-02 | 05 | 5 | AUTH-01..03 | - | Unify auth states | e2e | `pnpm verify:phase` | no | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/integration/auth.test.ts` - Integration tests for auth flows
- [ ] `tests/integration/organization.test.ts` - Integration tests for organization isolation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Create account | AUTH-01 | Supabase docker daemon start error on orchestrator | Verify manually via hosted app |
| Login and persist | AUTH-02 | Supabase docker daemon start error on orchestrator | Verify manually via hosted app |
| Logout | AUTH-03 | Supabase docker daemon start error on orchestrator | Verify manually via hosted app |
| Create organization | AUTH-04 | Supabase docker daemon start error on orchestrator | Verify manually via hosted app |
| Access only owned | AUTH-05 | Supabase docker daemon start error on orchestrator | Verify manually via hosted app |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Validation Audit 2026-09-08
| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 0 |
| Escalated | 5 |
