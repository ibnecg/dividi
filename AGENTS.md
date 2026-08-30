<!-- GSD:project-start source:PROJECT.md -->

## Project

**Kundividi**

Kundividi is a free, multi-tenant donation management system for creating and sharing public donation campaigns. Organization accounts can create campaigns, define needed items with quantities and prices, collect PIX donations through per-item QR codes or custom-value QR codes, and manage campaign activity through an admin panel.

The public donation page lets anyone discover campaigns, choose an item or custom donation amount, generate a PIX payment QR code, and optionally leave their name, cellphone, and a message after self-confirming the donation.

**Core Value:** Campaign organizers can publish item-based donation campaigns where donors can quickly choose what to fund, pay by PIX QR code, and reduce remaining item quantities without manual coordination.

### Constraints

- **Hosting**: Must run on a Vercel free account -- architecture must avoid always-on servers, background workers that require paid infrastructure, and expensive managed services.
- **Payment flow**: v1 uses self-confirmed PIX donations -- no banking webhook or payment-provider verification is required initially.
- **Access model**: Campaigns are public and discoverable -- public pages must be safe to expose while admin functions remain protected.
- **Cost**: Free to use -- technology choices should minimize recurring cost and operational maintenance.
- **Region/payment context**: PIX support is central -- QR code generation must follow Brazilian PIX payment conventions.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Decision

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|---|---:|---|---|---|
| Next.js App Router | 16.3.3 | Public pages, private admin UI, mutations, and server endpoints | Vercel maintains Next.js and deploys it with zero configuration. App Router gives one repository Server Components for public discovery, Server Actions for authenticated mutations, and Route Handlers for the PIX QR endpoint; no separate Express API or always-on server is required. | MEDIUM |
| React / React DOM | 19.2.8 | Component runtime | This is the stable React line paired with current Next.js. Keep campaign pages server-rendered; make only selection, copying, QR display, and form controls client components. | MEDIUM |
| TypeScript | 7.0.2 | Domain types and build-time validation | Model money, organization IDs, donation states, and PIX input explicitly. It reduces accidental cross-tenant access and prevents UI values being treated as trusted payment values. Next.js 16 requires TypeScript 5.1+; pin the current stable version in the lockfile. | MEDIUM |
| Supabase Postgres + Auth | Hosted service | Relational data, email/password sessions, RLS, migrations | A campaign, its items, donations, and organization ownership need relational transactions. Supabase combines Postgres and cookie-compatible auth without introducing separate database, identity, and API vendors. RLS is the tenant boundary even if a server action is later accidentally exposed. | MEDIUM |
| `@supabase/supabase-js` | 2.112.4 | Typed PostgREST/Auth client | The official isomorphic client works in browser and server contexts. Generate database types from the schema and use the browser client only for data deliberately made public by RLS. | MEDIUM |
| `@supabase/ssr` | 0.12.4 | Cookie session lifecycle in Next.js | This is the official replacement for deprecated Supabase Auth Helpers. It makes the same authenticated session available to Server Components, Route Handlers, and the browser while rotating cookie refresh tokens. | MEDIUM |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---|---:|---|---|---|
| Tailwind CSS | 4.3.3 | Styling | Use for the application design system and responsive public/admin layouts. It fits the zero-runtime, Vercel-friendly application model. | MEDIUM |
| shadcn/ui | Current CLI, generated source | Accessible control primitives | Use selected generated components for the admin panel: dialog, dropdown menu, table, sheet, tabs, and form controls. It is copied source, not a runtime UI dependency, so customize it locally. | MEDIUM |
| Zod | 4.5.4 | Boundary validation | Parse every Server Action and Route Handler input: slugs, quantities, BRL centavos, PIX key, donor details, and confirmation payload. Use the same schemas on client forms only for early feedback; server parsing remains authoritative. | MEDIUM |
| React Hook Form | 7.87.0 | Client form state | Use only for multi-field campaign/item/admin forms. Do not use it for simple public item-selection controls that React state can handle directly. | MEDIUM |
| `@hookform/resolvers` | 5.9.1 | Zod bridge for React Hook Form | Use `zodResolver` where React Hook Form is present, preserving one validation schema per command. | MEDIUM |
| `qrcode` | 1.5.4 | Convert BR Code payload text into QR SVG/data URL | Render the QR image from a server-generated payload. Treat this library as image encoding only; it does not implement PIX rules. Prefer SVG output for crisp, low-bandwidth display and keep the copyable payload visible. | MEDIUM |

### PIX Implementation: Required Variant

### Data and Authorization Rules

- Use UUID primary keys and a server-generated public `slug` on `campaigns`; never use
- Model `organizations`, `organization_members` (v1 owner only), `campaigns`,
- Enable RLS and explicit grants on every exposed table. `anon` may only select fields
- Keep `SUPABASE_SERVICE_ROLE_KEY` out of browser code. If a privileged operation is
- Confirming an item donation must call a Postgres function/RPC that locks or atomically

### Development Tools

| Tool | Purpose | Notes | Confidence |
|---|---|---|---|
| pnpm | Package manager and reproducible lockfile | Use `pnpm-lock.yaml` and `--frozen-lockfile` in CI. It keeps Vercel builds deterministic without changing the runtime architecture. | MEDIUM |
| Supabase CLI | Migrations, local Postgres, generated types, RLS tests | Store SQL migrations in the repository and run policy allow/deny tests with `supabase test db`. Do not make dashboard-only schema changes. | MEDIUM |
| ESLint flat config | Static analysis | Next.js 16 no longer runs lint during `next build`; run `pnpm lint` separately in CI and locally. | MEDIUM |

## Installation

## Vercel Free-Tier Design Constraints

| Constraint | Stack Decision |
|---|---|
| Hobby use is personal/non-commercial | Treat Hobby as development, pilot, or personal-project hosting only. Budget a plan change before formal commercial operation or organizational service delivery. |
| Functions scale to zero and have quota/duration limits | Use Server Components, Server Actions, and short Route Handlers. PIX payload generation, QR rendering, and donation confirmation are CPU-light synchronous requests. |
| Hobby cron is daily at most and imprecise | No function may depend on cron for correctness. Campaign availability, item inventory, and confirmations must be request-time/database-driven. |
| No durable server filesystem | Store relational data in Supabase. Do not write QR images, receipts, uploads, or background-job state to local function disk. Generate QR content on demand. |
| Supabase Free pauses after 7 days inactive | Choose a non-pausing paid database before campaigns need guaranteed availability. Do not mask this with undocumented keep-alive traffic. |
| Public endpoints invite abusive QR/confirmation requests | Keep commands server-validated, add database-backed abuse limits or a compatible external rate limiter when abuse is observed, and make retry/idempotency explicit. |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| Supabase Postgres/Auth/RLS | Neon + Better Auth + Drizzle | Choose this when a team specifically needs database portability and accepts operating distinct database, auth, authorization, and migration layers. It is unnecessary assembly for this greenfield v1. |
| Supabase direct typed client | Prisma | Choose Prisma when complex server-only ORM workflows and a dedicated connection strategy justify its extra layer. This app benefits more from Supabase RLS and generated database types than another data access abstraction. |
| Next.js App Router | Separate React SPA plus Express/Nest API | Choose it only when another client (native app, partner API, extensive workers) becomes a first-class product. For one Vercel web app it duplicates deployment, auth, and validation surfaces. |
| Static BR Code builder + `qrcode` | PSP-generated dynamic PIX QR | Adopt once payment receipt verification, one-time charges, refunds, or reliable reconciliation are requirements. It requires a PSP contract/API, webhook handling, and its own security/retry work. |
| Static BR Code builder + official test vectors | Community PIX payload package | A package can be considered later only after inspecting its code, tests, maintenance, and BR Code conformance. Current search found a recently published wrapper that documents a CRC repair for an underlying dependency, an unacceptable source of silent payment failures. |

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| `@supabase/auth-helpers-nextjs` | It is deprecated and consolidated into `@supabase/ssr`. | `@supabase/ssr` with `@supabase/supabase-js`. |
| Next.js Pages Router for new work | It creates a second, older data-loading/mutation model without helping this product. | App Router with Server Components, Server Actions, and Route Handlers. |
| `next lint` or assuming `next build` lints | Next.js 16 removed automatic build linting. | An explicit ESLint flat-config script in CI. |
| Static site export | Private pages, cookies, Server Actions, Route Handlers, and live campaign data require a server runtime. | Normal Next.js deployment on Vercel. |
| JavaScript `number`/float math for BRL | Decimal representation can produce mismatched PIX values and totals. | Integer centavos in commands/domain logic, PostgreSQL `numeric` or integer-centavos storage, and formatted display values. |
| Client-side inventory decrements or direct anonymous donation writes | A public client can race, replay, or alter values. | Server-validated action plus atomic Postgres RPC and narrowly scoped RLS. |
| Service-role key in a browser bundle | It bypasses RLS and exposes all tenant data. | Publishable key with RLS; service role only in server-only code where unavoidable. |
| Vercel cron/background workers for donation correctness | Hobby cron is daily-only/imprecise and serverless execution is not a queue. | Request-time transactional updates; introduce a managed queue only when a later requirement genuinely needs asynchronous work. |

## Version Compatibility

| Package A | Compatible With | Notes |
|---|---|---|
| `next@16.3.3` | React 19 / TypeScript 5.1+ / Node.js 20.9+ | Use the Next.js-managed App Router React integration. Do not set custom webpack configuration unless needed; Next 16 uses Turbopack by default. |
| `@supabase/ssr@0.12.4` | `@supabase/supabase-js@2.112.4` | Use the official cookie-session pattern for Next.js. The package remains pre-1.0, so pin it rather than accepting uncontrolled minor upgrades. |
| `react-hook-form@7.87.0` | Zod 4 + `@hookform/resolvers@5.9.1` | Use the Zod resolver and keep the schema source of truth independent of the UI. |
| Internal BR Code builder | `qrcode@1.5.4` | Builder outputs text; `qrcode` converts text to an image. Test the builder separately with Banco Central examples and test QR decode/copy-paste behavior end-to-end. |

## Sources

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) - Next.js 16 requirements, App Router defaults, and lint behavior.
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) - serverless SSR, ISR, Route Handlers, and zero-config deployment.
- [Next.js npm package](https://www.npmjs.com/package/next?activeTab=versions) - version 16.3.3 checked 2026-08-30.
- [Supabase SSR package selection](https://supabase.com/docs/guides/auth/choosing-a-server-package) and [Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) - official `@supabase/ssr` architecture.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - grants, policies, service-role risk, and policy testing.
- [Supabase pricing](https://supabase.com/pricing) - Free plan capacity and one-week inactivity pause.
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [function limits](https://vercel.com/docs/functions/limitations), and [Cron pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) - Hobby usage, function and cron constraints.
- [Banco Central PIX initiation standards](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf) - BR Code, static QR fields, static builder outside Pix API, and dynamic QR distinction.
- [Banco Central PIX FAQ](https://www.bcb.gov.br/meubc/faqs/s/pix) - registered PIX key requirement for QR receiving.
- [Current package registries](https://www.npmjs.com/package/@supabase/supabase-js), [SSR](https://www.npmjs.com/package/@supabase/ssr), [Zod](https://www.npmjs.com/package/zod?activeTab=versions), [React Hook Form](https://www.npmjs.com/package/react-hook-form?activeTab=versions), [Resolvers](https://www.npmjs.com/package/@hookform/resolvers?activeTab=versions), [Tailwind](https://www.npmjs.com/package/tailwindcss), and [qrcode](https://www.npmjs.com/package/qrcode) - versions checked 2026-08-30.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `$gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `$gsd-debug` for investigation and bug fixing
- `$gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `$gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
