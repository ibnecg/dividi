<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Details: Dividi

- **System:** Dividi - Donation Management System (Sistema de Gerenciamento de Doações)
- **Description:** An open-source donation platform connecting people and non-profit organizations with donors. Instead of just soliciting monetary funds, organizers create campaigns requesting specific items they need (e.g., food, blankets, supplies) with estimated prices, or open donation items with a PIX key for direct contribution.
- **Production URL:** https://dividi-two.vercel.app
- **Language Requirement:** **Brazilian Portuguese (`pt-BR`)**. All UI text, form labels, placeholders, buttons, error messages, toast notifications, and user-facing content MUST be in pt-BR. Technical artifacts, commit messages, code symbols, and agent documentation can be in English.

---

## 1. Technical Stack & Environment

- **Framework:** Next.js 16 (App Router with React 19)
- **Language:** TypeScript 5 (Strict mode enabled, `any` is strictly prohibited)
- **Package Manager:** `pnpm` (Enforced; do not use `npm` or `yarn`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, using `@theme inline` with CSS variables in `src/app/globals.css`)
- **Component Architecture:** CVA (`class-variance-authority`), `clsx`, and `tailwind-merge` via `@/lib/utils` (`cn` helper). Reusable UI primitives live in `src/components/ui/` following Radix/shadcn principles.
- **Icons:** `lucide-react`
- **Database & ORM:** Neon Serverless PostgreSQL with Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`)
- **Authentication:** Neon Auth (`@neondatabase/auth` on the server, `@neondatabase/neon-js/auth` on the client)
- **File / Image Storage:** Vercel Blob (`@vercel/blob/client`, managed via `/api/upload`) with a 50 KB max file size limit
- **Forms & Validation:** `react-hook-form`, `@hookform/resolvers/zod`, `zod`
- **Hosting / Deployment:** Vercel (Edge & Serverless functions ready)

---

## 2. Project Directory Structure

```
dividi/
├── .agents/skills/        # Neon & development skills for AI agents
├── .plans/                # PRDs and functional specifications
│   ├── PRD.md             # Base Next.js, Neon, and Vercel architecture
│   ├── PRD_HOME_PAGE.md   # Landing page design and functional specs
│   ├── PRD_SIGNUP.md      # Dual user + organization creation flow
│   ├── PRD_SIGNIN.md      # User sign-in flow & credential validation
│   ├── PRD_AUTH_FLOW.md   # Route protection & middleware redirect specs
│   ├── PRD_SIDEBAR.md     # Persistent dashboard sidebar & logout specs
│   └── prds/
│       └── campaign-creation.md # Campaign & items creation PRD
├── drizzle/               # Drizzle migration files and SQL snapshots
├── public/                # Static public assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/[...path]/route.ts  # Neon Auth API endpoint handler
│   │   │   └── upload/route.ts          # Vercel Blob client upload handler (50kb limit)
│   │   ├── dashboard/     # Protected dashboard area
│   │   │   ├── campaigns/ # Campaign management & creation (/new)
│   │   │   ├── layout.tsx # Persistent layout with Sidebar
│   │   │   ├── actions.ts # Dashboard server actions (e.g. org queries)
│   │   │   └── page.tsx   # Dashboard main view
│   │   ├── login/         # Sign-in page & LoginForm
│   │   ├── signup/        # Sign-up page & SignUpForm
│   │   ├── globals.css    # Tailwind v4 theme tokens & CSS variables
│   │   ├── layout.tsx     # Root layout (Geist font, pt-BR html tag)
│   │   └── page.tsx       # Landing page (Hero, Mission, How it works, FAQ)
│   ├── components/
│   │   ├── dashboard/     # Dashboard domain components (e.g. sidebar.tsx)
│   │   ├── ui/            # Reusable UI primitives (accordion, button, card, input, label, textarea)
│   │   └── campaign-form.tsx # Multi-step dynamic campaign & items creation form
│   ├── db/
│   │   ├── index.ts       # Neon SQL driver & Drizzle client initialization
│   │   └── schema.ts      # Drizzle database tables & relations
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── client.ts  # Neon Auth client (`authClient`)
│   │   │   └── server.ts  # Neon Auth server (`auth`)
│   │   ├── validations/   # Zod validation schemas (e.g. campaign.ts)
│   │   └── utils.ts       # `cn` helper for merging Tailwind classes
│   └── proxy.ts           # Route protection proxy checking auth session cookies
├── drizzle.config.ts      # Drizzle Kit configuration
├── neon.ts                # Neon project configuration & branch policies
├── package.json           # Project dependencies and npm scripts
└── tsconfig.json          # TypeScript compiler configuration (paths: @/* -> ./src/*)
```

---

## 3. Core Architecture & Patterns

### 3.1 Data Mutations via Server Actions
- All form submissions and state mutations MUST use Next.js **Server Actions** (`'use server'`).
- Do NOT use client-side `fetch()` directly in mutation forms, except when interacting with external blob upload endpoints.
- Server Actions must re-validate input using Zod schemas on the server and check the active session via `auth.getSession()`.

### 3.2 Authentication & Route Protection
- Client authentication is performed via `authClient` (`@neondatabase/neon-js/auth`), supporting `authClient.signIn.email`, `authClient.signUp.email`, `authClient.useSession()`, and `authClient.signOut()`.
- Server authentication uses `auth.getSession()` (`@neondatabase/auth/next/server`).
- Route protection is implemented in `src/proxy.ts`:
  - Protected routes (`/dashboard/:path*`): Unauthenticated requests are redirected to `/login`.
  - Auth pages (`/login`, `/signup`): Authenticated users with active session cookies (`better-auth.session_token`, `neon-auth.session_token`) are automatically redirected to `/dashboard`.

### 3.3 Database & Multi-Tenant Organization Model
- Defined in `src/db/schema.ts`:
  - `users`: Stores user identity linked to the auth provider's user ID (`id`, `name`, `email`, `createdAt`).
  - `organizations`: Multi-tenant organization unit (`id`, `name`, `createdAt`).
  - `organizationMembers`: Junction table linking `users` to `organizations` with roles (`userId`, `organizationId`, `role`, `createdAt`).
  - `campaigns`: Campaigns owned by a user (`id`, `userId`, `name`, `description`, `pixKey`, `imageUrl`, `createdAt`).
  - `campaignItems`: Specific items or open donation options attached to a campaign (`id`, `campaignId`, `description`, `amount`, `imageUrl`, `createdAt`).
- **Atomic Operations:** Multi-record creations (like user + organization on signup, or campaign + items) MUST be executed in atomic database transactions (`db.transaction()` or `db.batch()`).

### 3.4 Image Uploads
- Image uploads use Vercel Blob client-side direct uploads via `/api/upload`.
- **Constraint (NFR-Perf-002):** Maximum image size is 50 KB (`maximumSizeInBytes: 50 * 1024`). Always enforce this constraint and inform the user if exceeded.

---

## 4. Design System & UI Rules (DESIGN.md)

- **Aesthetic:** Minimalist, stark high-contrast black and white palette. Avoid visual clutter, heavy drop shadows, or unnecessary gradients.
- **Tokens Only:** Strictly use semantic CSS tokens declared in `src/app/globals.css`. Never use arbitrary hex values (`bg-[#123123]`) or raw Tailwind color scales (e.g. `text-zinc-500`).
  - Background & Foreground: `bg-background`, `text-foreground`
  - Primary: `bg-primary`, `text-primary-foreground`
  - Muted: `bg-muted`, `text-muted-foreground`
  - Border: `border-border`
  - Focus Ring: `ring-ring`
  - Destructive: `text-destructive`, `bg-destructive`
- **Class Merging:** Always use `cn()` from `@/lib/utils` when combining conditional classes.
- **Component Primitives:** Reusable elements go into `src/components/ui/` and use `class-variance-authority` (CVA).
- **Form UX & Accessibility:**
  - Wrap all inputs in `<Label>`.
  - Provide real-time validation error feedback using `text-destructive`.
  - Maintain visible keyboard focus indicators (`focus-visible:ring-2 focus-visible:ring-ring`).

---

## 5. Development Workflow & Commands

Always use `pnpm`:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts Next.js development server |
| `pnpm build` | Builds production application |
| `pnpm start` | Runs production server |
| `pnpm lint` | Runs ESLint |
| `pnpm db:generate` | Generates Drizzle migration files from schema |
| `pnpm db:push` | Pushes schema changes directly to Neon PostgreSQL |
| `pnpm db:studio` | Launches Drizzle Studio GUI for inspecting database |

---

## 6. Environment Variables

| Variable | Description | Where Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon Serverless PostgreSQL connection string | Server / Drizzle Kit |
| `NEXT_PUBLIC_APP_URL` | Base application URL (e.g. `http://localhost:3000`) | Client & Server |
| `NEON_AUTH_BASE_URL` | Neon Auth endpoint URL (defaults to `/api/auth`) | Server |
| `NEON_AUTH_COOKIE_SECRET` | Secret key for auth cookie encryption (min 32 chars) | Server |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage access token | Server (`/api/upload`) |

---

## 7. Instructions for AI Agents

1. **Preserve Next.js Header:** Never remove or modify the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of this file.
2. **Strict pt-BR for User Interface:** Ensure all UI copies, labels, validation messages, button texts, and tooltips are in Brazilian Portuguese.
3. **Check PRDs Before Implementing:** Always read existing specs in `.plans/` (e.g., `campaign-creation.md`, `PRD_AUTH_FLOW.md`) before altering features or adding new capabilities.
4. **Use Server Actions for Mutations:** Do not write REST/Fetch API endpoints for data mutations that can be handled natively by Server Actions.
5. **Atomic Transactions:** Always wrap multi-entity database operations in Drizzle transactions (`db.transaction()`).
6. **No `any` in TypeScript:** Write fully typed code; infer types using Zod (`z.infer<...>`) or Drizzle schema types.

