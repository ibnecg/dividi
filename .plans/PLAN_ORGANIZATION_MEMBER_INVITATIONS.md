# Plano de Implementação: Convite de Membros para Organizações (Limite de 3 Membros)

## Descrição do Objetivo
Permitir que o gestor (proprietário/`owner`) de uma organização convide novos membros para sua equipe na plataforma Dividi, estabelecendo um limite máximo e estrito de **3 membros por organização** (contabilizando membros ativos + convites pendentes).

A funcionalidade inclui:
1. Geração de convite com link compartilhável seguro (`/invite/[token]`) e botão de cópia de link no painel.
2. Controle estrito de capacidade: a soma de membros ativos e convites pendentes nunca pode ultrapassar 3.
3. Gerenciamento no Dashboard (`/dashboard/members`): listagem de membros atuais, convites pendentes, cancelamento/revogação de convites e remoção de membros.
4. Fluxo de aceite de convite (`/invite/[token]`): suporte tanto para usuários já cadastrados na plataforma quanto para novos usuários que criarão sua conta diretamente através do convite.

---

## Decisões de Design Confirmadas

1. **Entrega de Convites**: Geração de link compartilhável (`/invite/[token]`) com botão "Copiar Link", permitindo compartilhamento via WhatsApp, e-mail ou mensagens diretas.
2. **Cálculo da Capacidade**: Membros ativos + convites pendentes contam no limite total de 3 vagas (garantindo que não sejam gerados mais convites do que vagas reais).
3. **Controle de Acesso**: Apenas usuários com `role === 'owner'` na organização podem convidar, revogar convites e remover membros.
4. **Vinculação de Novos Membros**: Usuários convidados que aceitarem o convite serão vinculados à organização existente com papel de `member`. Eles não passarão pelo fluxo de criação de nova organização.

---

## Mudanças Propostas

### 1. Banco de Dados e Esquema Drizzle

#### [MODIFY] `src/db/schema.ts`
- Adicionar a tabela `organization_invitations` com colunas:
  - `id`: `text('id').primaryKey()`
  - `organizationId`: `text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' })`
  - `email`: `text('email').notNull()`
  - `role`: `text('role').notNull().default('member')`
  - `token`: `text('token').notNull().unique()`
  - `invitedByUserId`: `text('invited_by_user_id').notNull().references(() => users.id)`
  - `status`: `varchar('status', { length: 20 }).default('pending').notNull()` (`'pending'`, `'accepted'`, `'revoked'`, `'expired'`)
  - `expiresAt`: `timestamp('expires_at', { withTimezone: true }).notNull()`
  - `createdAt`: `timestamp('created_at').defaultNow().notNull()`
- Adicionar índices para `(organizationId, status)`, `token` e `email`.

#### [NEW] `drizzle/0007_organization_invitations.sql`
- Script SQL da migração para a nova tabela e índices.

---

### 2. Validações com Zod

#### [NEW] `src/lib/validations/member.ts`
- `inviteMemberSchema`: validação de e-mail (obrigatório, formato válido, lowercase e trim) e role (padrão `'member'`).
- `acceptInviteSchema`: validação do token e dados opcionais de cadastro (nome e senha caso seja novo usuário).

#### [NEW] `src/lib/validations/member.test.ts`
- Testes unitários com Vitest para schemas de validação.

---

### 3. Server Actions do Dashboard (`/dashboard/members`)

#### [NEW] `src/app/dashboard/members/actions.ts`
- `getOrganizationMembersData()`: Busca membros da organização, convites pendentes e capacidade calculada.
- `inviteMemberAction({ email })`: Valida que o usuário é `owner`, verifica que `ativos + pendentes < 3`, checa duplicidade e insere o convite.
- `revokeInvitationAction(invitationId)`: Altera status para `'revoked'`.
- `removeMemberAction(targetUserId)`: Remove membro da organização (bloqueado para o próprio owner).

#### [NEW] `src/app/dashboard/members/actions.test.ts`
- Testes unitários para todas as ações do dashboard.

---

### 4. Ações e Página de Aceite de Convite (`/invite/[token]`)

#### [NEW] `src/app/invite/[token]/actions.ts`
- `getInvitationDetails(token)`: Valida token, status e limite de membros.
- `acceptInvitationAction(token)`: Vincula usuário autenticado à organização em transação atômica e marca o convite como aceito.

#### [NEW] `src/app/invite/[token]/actions.test.ts`
- Testes unitários para verificação e aceite de convites.

#### [NEW] `src/app/invite/[token]/page.tsx` & `src/app/invite/[token]/invite-card.tsx`
- Interface pública de aceite com opções de login ou cadastro inline para novos membros.

---

### 5. Navegação e Interface do Dashboard

#### [MODIFY] `src/components/dashboard/sidebar.tsx`
- Adicionar link de navegação "Membros" com o ícone `Users` de `lucide-react`.

#### [MODIFY] `src/components/dashboard/sidebar.test.tsx`
- Testar a presença e comportamento do link "Membros".

#### [NEW] `src/app/dashboard/members/page.tsx`
- Página principal de gestão de membros da organização.

#### [NEW] `src/components/dashboard/invite-member-form.tsx`
- Formulário com campo de e-mail e bloqueio automático quando atingir 3 de 3 vagas.

#### [NEW] `src/components/dashboard/pending-invitations-list.tsx`
- Lista de convites pendentes com botão de copiar link e botão de revogação.

#### [NEW] `src/components/dashboard/members-list.tsx`
- Lista de membros com exibição de papel e botão de remoção para o gestor.

---

## Verificação e Testes

```bash
# Executar suíte de testes com Vitest
pnpm test

# Validação de estrita conformidade de tipos TypeScript
pnpm tsc --noEmit

# Verificação de linting e regras de estilo
pnpm lint
```
