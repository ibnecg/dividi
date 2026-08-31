---
phase: 1
slug: account-ownership-and-tenancy
status: draft
shadcn_initialized: false
preset: b0
created: 2026-08-30
---

# Phase 1 - UI Design Contract

> Visual and interaction contract for account ownership and tenancy. The supplied `b0` Next.js shadcn preset is the selected baseline; initialization is pending because `pnpm` is unavailable in the research environment.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui, initialized from the supplied `b0` preset when the Next.js scaffold is created |
| Preset | `b0` / `pnpm dlx shadcn@latest init --preset b0 --template next` |
| Component library | shadcn/ui generated primitives using Radix UI where supplied by the preset |
| Icon library | Lucide React only; never use text glyphs for account-menu or inline form-status icons |
| Font | Inter, then system-ui sans-serif fallback |
| Styling | Tailwind CSS 4 utilities and the generated shadcn CSS variables; do not add another UI framework |

Use the official shadcn Button, Input, Label, Card, Dropdown Menu, Avatar, and Skeleton primitives. Add Form only if its generated version is compatible with React Hook Form and Zod. Do not use visual blocks, templates, third-party registries, decorative illustrations, or disabled future-navigation items in this phase.

### Layout and Interaction

- Auth, verification, password-reset, and organization-setup pages use one centered form surface, `width: min(100% - 32px, 420px)`, with a white card, 1px neutral border, 8px radius, and 24px padding. At `768px` and above, increase card padding to 32px; do not change type sizes by viewport.
- The protected workspace is a quiet operational shell: a 64px header with organization name at left and the owner avatar/account menu at right. Constrain the inner header to 1200px and use 16px horizontal page padding on small screens, 32px from `768px` upward.
- The Phase 1 workspace body contains only the organization name, the signed-in owner identity, and a short ready-state. It does not show campaign, item, donation, settings, or coming-soon navigation.
- The account menu trigger is an avatar with an accessible label, opens on click/keyboard activation, shows the owner name and email as non-actionable header text, and contains only `Sign out`. Escape closes it and focus returns to the trigger.
- Every action is server-authoritative. Client validation improves feedback but never asserts account verification, session validity, organization ownership, or any tenant result.

---

## Spacing Scale

Declared values (multiples of 4 only):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gap; compact validation offset |
| sm | 8px | Label-to-input gap; stacked compact controls |
| md | 16px | Default form-field and inline layout gap |
| lg | 24px | Card padding on small screens; form section separation |
| xl | 32px | Desktop card padding; page layout gap |
| 2xl | 48px | Auth-page vertical separation from surrounding content |
| 3xl | 64px | Workspace page-level vertical spacing |

Exceptions: all pointer controls, including the avatar trigger and text buttons, have a minimum 44px by 44px target. Header height is 64px. Card radius is 8px.

---

## Typography

Use exactly these four sizes and two weights. Do not use a third weight.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.5 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

Use Display only for the public authentication and setup page title. Use Heading for the workspace title and all error/empty-state headings. Body text carries helper text, instructions, owner email, and status copy. Labels are never represented by placeholder text alone.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` | Page background and primary form surface |
| Secondary (30%) | `#F4F6F5` | Workspace background, header fill, muted informational areas, and card borders |
| Accent (10%) | `#007A55` | Primary CTAs, active input focus ring, and recovery links only |
| Destructive | `#B42318` | Validation-error text and icons; error alert border; never a primary or neutral action |

Use `#1F2933` for high-emphasis text and `#5F6C76` for body-muted text. Secondary borders use `#D9E0DC`. Accent reserved for `Criar conta`, `Entrar`, `Criar organização`, `Enviar link de redefinição`, `Definir nova senha`, active focus rings, and recovery links. Ordinary labels, icon buttons, cards, and static navigation remain neutral.

---

## Copywriting Contract

All user-facing product copy is Brazilian Portuguese. Use sentence case, direct verbs, and no exclamation marks. Never echo raw technical errors, Supabase errors, organization IDs, or foreign tenant details.

| Element | Copy |
|---------|------|
| Primary CTA | `Criar conta` on sign-up. Other form CTAs are `Entrar`, `Criar organização`, `Enviar link de redefinição`, and `Definir nova senha`; use only the CTA that completes the current form. |
| Sign-up title and helper | `Crie sua conta` / `Você vai confirmar seu e-mail antes de acessar o espaço da organização.` |
| Verify-email state | `Confirme seu e-mail` / `Enviamos um link de confirmação para {email}. Abra o e-mail para continuar.` Actions: `Reenviar e-mail` and `Ir para entrar`. |
| Organization setup empty state | `Crie sua organização` / `Para acessar seu espaço privado, informe o nome da sua organização.` CTA: `Criar organização`. |
| Workspace ready state | `Seu espaço está pronto` / `Este é o espaço privado da sua organização.` |
| Password-reset result | `Se existir uma conta para este e-mail, enviaremos um link de redefinição.` Always show this same result after a valid submission; never reveal whether the email is registered. |
| Field validation | Required: `Informe seu {campo}.` Invalid email: `Informe um e-mail válido.` Password rule: `Use pelo menos 8 caracteres.` Confirmed-password mismatch: `As senhas não coincidem.` |
| Auth/form error | `Não foi possível concluir esta ação. Revise os dados e tente novamente.` Preserve safe, entered form values; omit password values. |
| Not-found state | `Página não encontrada` / `Este endereço não está disponível.` Action: `Ir para meu espaço`. Do not mention organization ownership, permission, or the requested identifier. |
| Destructive confirmation | None. Phase 1 has no destructive data action. `Sair` ends the session immediately and routes to `Entrar`; it does not require a confirmation dialog. |

---

## Form and State Rules

- Sign-up fields are `Nome`, `E-mail`, and `Senha`, in that order. Organization data never appears on this form. Password inputs include a labelled show/hide toggle and never persist in a repopulated form after an error.
- Sign-in fields are `E-mail` and `Senha`, with the recovery link `Esqueci minha senha` below the password field and before the submit button. Invalid credentials return one generic form alert; do not identify which field failed.
- Password recovery accepts email only. Password update accepts `Nova senha` and `Confirmar nova senha`. Email change, MFA, profile editing, and account recovery beyond reset are absent.
- The organization setup form has one required `Nome da organização` field. It cannot accept or show owner ID, role, organization ID, contact details, PIX details, or public profile fields.
- Show inline validation beneath the associated field after blur or submit. Give the field `aria-invalid`, connect the message with `aria-describedby`, and move focus to the first invalid field after submit. A form-level alert appears above the fields only for non-field failures.
- During submission, retain layout and entered non-secret values, disable the submit button and duplicate-submission controls, set `aria-busy`, and replace only the CTA label with `Criando conta...`, `Entrando...`, `Criando organização...`, `Enviando...`, or `Salvando...` as applicable.
- Initial route decisions use an unobtrusive skeleton that matches the form card or header dimensions. Do not render a full-page spinner. If the server cannot load a protected route, show the documented generic error or not-found state rather than stale private content.
- On successful sign-up, route to the verify-email page. On confirmed sign-in, route users without an organization to setup and users with an organization to their workspace. On successful organization creation, route directly to that workspace. Do not let the user choose or switch organizations in Phase 1.
- Render organization name, owner name, email, and all validation text as plain text. Limit organization name input to 120 characters; permit natural wrapping in body content and ellipsize it to one line in the header, with the full value available through a native tooltip or accessible label.

---

## UI Considerations

Applicable state considerations resolved: 10 covered, 0 backstop, 0 unresolved.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | Sign-up, sign-in, recovery, password-update, and organization-setup forms | ✅ covered | Initial forms are intentionally blank; labels remain visible and required errors appear only after blur or submit. |
| loading | Auth and organization forms | ✅ covered | Submission uses the documented stable in-button progress label, disabled duplicate controls, `aria-busy`, and no layout shift. |
| error | Auth and organization forms | ✅ covered | Field errors appear beneath the applicable input, non-field failures use the documented generic alert, and secrets are never re-rendered. |
| partial | Auth and organization forms after a failed submission | ✅ covered | Safe entered values remain available for correction; password fields reset blank and focus moves to the first invalid field. |
| long-text | Form labels, helper text, validation messages, and organization name | ✅ covered | Text wraps within the card; long organization names ellipsize only in the fixed header and retain an accessible full name. |
| loading | Protected workspace route and account header | ✅ covered | A dimension-matched skeleton is shown while session and RLS-scoped organization data resolve; no private fallback content is rendered. |
| error | Protected workspace route | ✅ covered | Server failure renders the documented generic error state; a foreign or absent organization result renders the generic not-found state. |
| overflow | Workspace header and account menu | ✅ covered | The header keeps one line and truncates the organization name; the menu has a fixed minimum width, wraps owner email, and never extends past the viewport. |
| long-text | Not-found and workspace static content | ✅ covered | Copy wraps without clipping; action buttons keep their 44px minimum target and text may wrap to two lines on narrow screens. |
| zero-one-many | Organization selector | ✅ covered | The Phase 1 UI supports exactly one organization, so no organization collection or selector is rendered. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Button, Input, Label, Card, Dropdown Menu, Avatar, Skeleton; Form only if compatible with the generated project versions | not required - official registry; baseline selected 2026-08-30 |
| Third-party registries | none | not applicable |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
