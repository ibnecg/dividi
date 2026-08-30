# Kundividi

## What This Is

Kundividi is a free, multi-tenant donation management system for creating and sharing public donation campaigns. Organization accounts can create campaigns, define needed items with quantities and prices, collect PIX donations through per-item QR codes or custom-value QR codes, and manage campaign activity through an admin panel.

The public donation page lets anyone discover campaigns, choose an item or custom donation amount, generate a PIX payment QR code, and optionally leave their name, cellphone, and a message after self-confirming the donation.

## Core Value

Campaign organizers can publish item-based donation campaigns where donors can quickly choose what to fund, pay by PIX QR code, and reduce remaining item quantities without manual coordination.

## Business Context

- **Customer**: Donation campaign organizers and donors in Brazil who use PIX.
- **Revenue model**: Free to use for v1.
- **Success metric**: Completed donation confirmations per active campaign.
- **Strategy notes**: Optimize for low operating cost and Vercel free-tier compatibility.

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] Organization account owners can create and manage donation campaigns.
- [ ] Campaign owners can add donation items with name, needed quantity, unit price, and campaign PIX key.
- [ ] Public users can discover campaigns and open a donation page without signing in.
- [ ] Donors can choose an available item and receive a PIX QR code for that item's price.
- [ ] Donors can enter a custom donation amount and receive a PIX QR code for that amount.
- [ ] Donors can self-confirm a PIX donation and optionally provide name, cellphone, and a message.
- [ ] Confirmed item donations decrease the remaining item quantity.
- [ ] Items become unavailable for new donations when their requested quantity has been fully donated.
- [ ] Campaign owners can view campaign, item, and donation activity in a private admin panel.

### Out of Scope

- Automated bank/payment-provider confirmation -- v1 uses donor self-confirmation to keep the product simple and compatible with free hosting.
- Team roles and permissions -- v1 uses organization-level ownership before adding finer-grained access control.
- Invite-only campaigns -- v1 campaigns are discoverable and public.
- Monetization and platform fees -- the initial product is free to use.

## Context

The system is intended for donation campaigns where organizers already have a PIX key and know the items they need. Each item has a target quantity and price. The application generates a custom PIX QR code for the selected item value, and after donor confirmation the system reduces the remaining item count.

Campaigns can also accept custom donations without selecting an item. In that flow, the donor specifies the amount, the system creates a PIX QR code for that value, and the donation is recorded as a custom donation after self-confirmation.

The admin experience is private and account-based. The donation experience is public. Multi-tenancy in v1 is organization-based: accounts create organizations, and campaigns belong to organizations.

## Constraints

- **Hosting**: Must run on a Vercel free account -- architecture must avoid always-on servers, background workers that require paid infrastructure, and expensive managed services.
- **Payment flow**: v1 uses self-confirmed PIX donations -- no banking webhook or payment-provider verification is required initially.
- **Access model**: Campaigns are public and discoverable -- public pages must be safe to expose while admin functions remain protected.
- **Cost**: Free to use -- technology choices should minimize recurring cost and operational maintenance.
- **Region/payment context**: PIX support is central -- QR code generation must follow Brazilian PIX payment conventions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use donor self-confirmation for v1 PIX donations | Fastest path to a usable product and avoids payment-provider dependencies on the free tier | -- Pending |
| Use organization-based multi-tenancy | Matches the user's v1 preference and leaves room for future team/role management | -- Pending |
| Make campaigns discoverable and public | Helps donors find campaigns without private links while keeping administration behind login | -- Pending |
| Target Vercel free-tier hosting | Explicit deployment constraint from the user | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-30 after initialization*
