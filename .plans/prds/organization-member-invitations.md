---
version: 1.0.0
owner: kallklen
status: approved
last_updated: 2026-10-13
dependencies: []
llm_directives:
  model: 'gpt-4-turbo'
  temperature: 0.2
  persona: >
    Você é um engenheiro de software sênior. Sua tarefa é analisar estes
    requisitos e gerar um código limpo, eficiente e bem documentado que
    cumpra todas as restrições especificadas. Você NÃO DEVE desviar das
    restrições técnicas ou requisitos funcionais sem aprovação explícita.
---

# PRD: Convite de Membros de Organização (Limite de 3 Membros)

## 1. Overview & Goals

### 1.1 Product Summary

O sistema Dividi permite que organizações sem fins lucrativos e iniciativas comunitárias gerenciem campanhas de doações. Este documento define os requisitos funcionais e técnicos para permitir que um gestor de organização (usuário com papel de `owner`) convide novos membros para sua equipe na plataforma, com um limite máximo estrito de **3 membros por organização**.

O fluxo opera via links compartilháveis exclusivos (`/invite/[token]`) com botão de cópia direta no painel, suportando tanto usuários já cadastrados na plataforma quanto novos usuários que se cadastram diretamente ao aceitar o convite, vinculando-se à organização existente sem criar uma organização duplicada.

### 1.2 Business Goals

- **Goal-001**: Possibilitar a colaboração em equipe dentro da mesma organização, permitindo até 3 membros por organização.
- **Goal-002**: Garantir controle de capacidade simples e transparente para os gestores, evitando que o limite de 3 membros seja violado mesmo com convites pendentes simultâneos.
- **Goal-003**: Oferecer um fluxo de entrada sem atrito para os membros convidados por meio de links de convite diretos.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

- **Languages**: TypeScript 5+ (Strict mode, proibido `any`), pt-BR obrigatório para todas as mensagens de interface, validações e alertas.
- **Frameworks**: Next.js 16 (App Router), React 19, Tailwind CSS v4 (`@tailwindcss/postcss` com variáveis semânticas de `src/app/globals.css`).
- **Databases & ORM**: Neon Serverless PostgreSQL com Drizzle ORM (`drizzle-orm`, `@neondatabase/serverless`).
- **Authentication**: Neon Auth (`@neondatabase/auth` no servidor, `@neondatabase/neon-js/auth` no cliente).
- **Mutations**: Obrigatório o uso de Server Actions (`'use server'`). Não usar rotas REST ou `fetch()` direto do cliente para mutações de dados.
- **Transactions**: Operações atômicas com `db.transaction()` ou `db.batch()` ao vincular novos membros e atualizar o status do convite.
- **Design System**: Estrita conformidade com `DESIGN.md` e `globals.css` (tokens `bg-background`, `text-foreground`, `border-border`, etc.). Sem valores hexadecimais arbitrários.

---

## 3. User Personas & Roles

- **Persona-OrgManager**: Usuário autenticado que possui papel de proprietário/gestor (`role === 'owner'`) em sua organização. É o único autorizado a convidar novos membros, cancelar convites pendentes e remover membros.
- **Persona-InvitedUser**: Usuário convidado (pode ser um novo visitante ou alguém que já possui conta no Dividi) que acessa a plataforma por meio de um link de convite exclusivo para ingressar na organização como `member`.

---

## 4. Functional Requirements & User Stories

### **US-001**: Painel de Gestão de Membros (`/dashboard/members`)

- **As a**: Persona-OrgManager
- **I want to**: Visualizar os membros atuais da minha organização e a contagem de vagas utilizadas
- **So that**: Eu possa acompanhar quem tem acesso à organização e quantas vagas ainda estão disponíveis.

**Acceptance Criteria**:
- **AC-001-A**: System MUST disponibilizar a rota `/dashboard/members` protegida por autenticação.
- **AC-001-B**: System MUST exibir a contagem de vagas no formato "X de 3 vagas preenchidas", somando membros ativos + convites pendentes.
- **AC-001-C**: System MUST listar os membros atuais da organização com Nome, E-mail, Papel ("Proprietário" ou "Membro") e Data de Entrada.
- **AC-001-D**: System MUST incluir link de navegação "Membros" com o ícone `Users` na barra lateral (Sidebar) do Dashboard.

---

### **US-002**: Geração de Convite com Limite de 3 Membros

- **As a**: Persona-OrgManager
- **I want to**: Inserir o e-mail de um colega para convidá-lo para a organização
- **So that**: Ele receba acesso à organização para colaborar.

**Acceptance Criteria**:
- **AC-002-A**: System MUST validar que apenas usuários com `role === 'owner'` na organização podem emitir convites.
- **AC-002-B**: System MUST calcular atomicamente se `membrosAtivos + convitesPendentes < 3`. Se a soma for `>= 3`, a criação do convite DEVE ser bloqueada com a mensagem: *"A organização atingiu o limite de 3 membros (incluindo convites pendentes)."*
- **AC-002-C**: System MUST rejeitar a emissão de convite se o e-mail já for de um membro ativo da mesma organização.
- **AC-002-D**: System MUST rejeitar a emissão de convite se já houver um convite com status `pending` para o mesmo e-mail na mesma organização.
- **AC-002-E**: System MUST gerar um token criptografado seguro e definir validade de 7 dias para o convite.
- **AC-002-F**: System MUST desabilitar o formulário de convite na interface quando a organização estiver com 3 de 3 vagas preenchidas.

---

### **US-003**: Cópia e Compartilhamento de Link de Convite

- **As a**: Persona-OrgManager
- **I want to**: Copiar o link do convite gerado com um único clique
- **So that**: Eu possa enviar o link diretamente ao convidado via WhatsApp, e-mail ou mensagem.

**Acceptance Criteria**:
- **AC-003-A**: System MUST exibir a lista de convites pendentes com o e-mail convidado, data de expiração e status.
- **AC-003-B**: System MUST fornecer um botão "Copiar Link" para cada convite pendente, gerando a URL completa `${NEXT_PUBLIC_APP_URL}/invite/${token}`.
- **AC-003-C**: Clicar em "Copiar Link" MUST copiar a URL para a área de transferência do usuário e exibir feedback visual (ex: texto "Copiado!" temporário).

---

### **US-004**: Revogação de Convites Pendentes

- **As a**: Persona-OrgManager
- **I want to**: Cancelar/revogar um convite pendente
- **So that**: A vaga reservada seja liberada imediatamente para outro convidado.

**Acceptance Criteria**:
- **AC-004-A**: System MUST fornecer um botão "Revogar" ou "Cancelar" ao lado de cada convite pendente.
- **AC-004-B**: Ao confirmar a revogação, o status do convite DEVE ser alterado para `'revoked'`.
- **AC-004-C**: A vaga DEVE ser liberada imediatamente no contador de capacidade da organização.

---

### **US-005**: Remoção de Membros

- **As a**: Persona-OrgManager
- **I want to**: Remover um membro existente da organização
- **So that**: Eu possa gerenciar a equipe e liberar vaga quando alguém sair da organização.

**Acceptance Criteria**:
- **AC-005-A**: System MUST permitir que o gestor (`owner`) remova membros que tenham papel `member`.
- **AC-005-B**: System MUST impedir que o próprio `owner` se remova da organização.
- **AC-005-C**: A remoção DEVE excluir o registro correspondente em `organizationMembers` e atualizar imediatamente a interface.

---

### **US-006**: Aceite de Convite (`/invite/[token]`)

- **As a**: Persona-InvitedUser
- **I want to**: Acessar o link de convite e aceitá-lo (entrando com conta existente ou criando nova conta)
- **So that**: Eu me torne membro da organização no Dividi sem criar uma nova organização.

**Acceptance Criteria**:
- **AC-006-A**: System MUST validar o token do convite. Se o token não existir, estiver revogado ou expirado, DEVE exibir mensagem clara de erro.
- **AC-006-B**: System MUST verificar se a organização ainda possui `< 3` membros ativos. Se o limite foi atingido, DEVE exibir: *"Esta organização já atingiu o limite de 3 membros."*
- **AC-006-C**: Se o visitante já estiver autenticado na plataforma:
  - System MUST exibir os dados da organização e o botão "Aceitar Convite".
  - Ao aceitar, o usuário é adicionado a `organizationMembers` com `role: 'member'` e o convite é marcado como `'accepted'`.
- **AC-006-D**: Se o visitante NÃO estiver autenticado:
  - System MUST oferecer opção de login com retorno (`/login?callbackUrl=/invite/${token}`) caso já possua conta.
  - System MUST oferecer formulário de cadastro simplificado (Nome e Senha, com o E-mail fixado a partir do convite) para novos membros.
  - Ao concluir o cadastro, o novo usuário é vinculado à organização existente como `member` e redirecionado para `/dashboard`.

---

## 5. Data Model & Database Schema

### Tabela `organization_invitations`

```ts
export const organizationInvitations = pgTable('organization_invitations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  token: text('token').notNull().unique(),
  invitedByUserId: text('invited_by_user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'accepted', 'revoked', 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    orgStatusIdx: index('org_invitations_org_status_idx').on(table.organizationId, table.status),
    tokenIdx: index('org_invitations_token_idx').on(table.token),
    emailIdx: index('org_invitations_email_idx').on(table.email),
  };
});
```

---

## 6. Architecture & Implementation Details

### 6.1 Server Actions (`src/app/dashboard/members/actions.ts`)

- `getOrganizationMembersData()`: Obtém a sessão, valida pertencimento à organização, atualiza status de convites expirados e retorna membros, convites pendentes e capacidade.
- `inviteMemberAction({ email })`: Valida se o usuário é `owner`, verifica limite estrito (`ativos + pendentes < 3`), verifica duplicidade de e-mail e gera o convite.
- `revokeInvitationAction(invitationId)`: Altera status para `'revoked'`.
- `removeMemberAction(targetUserId)`: Remove membro garantindo que o `owner` não seja removido.

### 6.2 Server Actions de Aceite (`src/app/invite/[token]/actions.ts`)

- `getInvitationDetails(token)`: Validação pública do convite e capacidade.
- `acceptInvitationAction(token)`: Vincula o usuário autenticado à organização em transação atômica.

### 6.3 Interface e Componentes

- `src/components/dashboard/sidebar.tsx`: Adição do item "Membros" com ícone `Users`.
- `src/app/dashboard/members/page.tsx`: Página central com indicador de 3 vagas, lista de membros e convites pendentes.
- `src/components/dashboard/invite-member-form.tsx`: Formulário de convite com validação em tempo real.
- `src/components/dashboard/pending-invitations-list.tsx`: Tabela de convites pendentes com botão de cópia de link e revogação.
- `src/components/dashboard/members-list.tsx`: Tabela de membros com botão de remoção para o gestor.
- `src/app/invite/[token]/page.tsx`: Página de aceite com suporte a login ou criação de conta.

---

## 7. Non-Functional Requirements (NFRs)

- **NFR-Perf-001**: As Server Actions de validação e emissão de convite DEVEM responder em menos de 500ms em condições normais de rede.
- **NFR-Sec-001**: O token de convite DEVE ser gerado com entropia criptográfica (`crypto.randomBytes(32)`).
- **NFR-Sec-002**: Apenas usuários com `role === 'owner'` DEVEM ter permissão para criar convites, revogar convites ou remover membros.
- **NFR-Data-001**: A verificação da regra de limite (máximo de 3 membros) DEVE ser revalidada obrigatoriamente no servidor no momento exato do aceite do convite para evitar condições de corrida (race conditions).

---

## 8. Out of Scope (Não Incluído)

- Envio automatizado de e-mails via provedor externo (SMTP/Resend/SendGrid); a entrega é feita por link compartilhável.
- Papéis granulares complexos além de `owner` e `member` (ex: moderador, tesoureiro).
- Transferência de propriedade da organização (`owner` transfer).
- Múltiplas organizações por usuário em seletor de tenant (o usuário pertence à organização vinculada no cadastro ou no aceite).

---

## 9. Success Metrics (KPIs)

- **KPI-001**: 100% de adesão à regra de limite: nenhuma organização no banco de dados poderá possuir mais de 3 membros associados.
- **KPI-002**: Zero falhas em transações atômicas de aceite de convite.
- **KPI-003**: 100% de cobertura nos testes unitários das Server Actions de membros e aceite de convite.

---

## Appendix A: Cross-Reference Index

### User Stories
US-001, US-002, US-003, US-004, US-005, US-006

### Acceptance Criteria
AC-001-A, AC-001-B, AC-001-C, AC-001-D, AC-002-A, AC-002-B, AC-002-C, AC-002-D, AC-002-E, AC-002-F, AC-003-A, AC-003-B, AC-003-C, AC-004-A, AC-004-B, AC-004-C, AC-005-A, AC-005-B, AC-005-C, AC-006-A, AC-006-B, AC-006-C, AC-006-D

### Non-Functional Requirements
NFR-Perf-001, NFR-Sec-001, NFR-Sec-002, NFR-Data-001
