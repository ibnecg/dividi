---
version: 1.0.0
owner: kallklen
status: approved
last_updated: 2026-09-13
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

# PRD: Criação de Campanha de Doação

## 1. Overview & Goals

### 1.1 Product Summary

O sistema Dividi permite que um usuário autenticado crie uma campanha de doação para arrecadar fundos. A campanha terá um nome, descrição, imagem representativa, lista de itens específicos que precisam ser doados (com descrição, valor e imagem) e uma chave PIX para o recebimento dos valores. Isso facilita e centraliza a captação de recursos.

### 1.2 Business Goals

- **Goal-001**: Facilitar a criação de campanhas de doação para os usuários finais de forma rápida, segura e intuitiva.
- **Goal-002**: Aumentar a clareza e a transparência para os doadores, permitindo que contribuam para itens específicos cadastrados na campanha ou que decidam doar um valor livre (item genérico).

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

- **Languages**: TypeScript, HTML, CSS (pt-BR para mensagens de sistema/UI)
- **Frameworks**: Next.js (App Router), Tailwind CSS v4, React Hook Form, Zod
- **Databases/Storage**: PostgreSQL (Drizzle ORM) e Vercel Blob para armazenamento de imagens
- **Style Guides**: Seguir estritamente o que está definido no arquivo `DESIGN.md` do projeto, utilizando os tokens, componentes Shadcn-ui e padrões de micro-interações definidos nele.
- **Security Requirements**: Apenas usuários logados (via Better Auth) podem criar campanhas. Validação de dados de formulário tanto no cliente (React Hook Form) quanto no servidor (Server Actions).
- **Forbidden Libraries/Patterns**:
  - Não utilizar Fetch API diretamente nos formulários de mutação; utilizar Server Actions em vez disso.

---

## 3. User Personas & Roles

- **Persona-CampaignCreator**: Usuário cadastrado e logado na plataforma que deseja criar uma campanha para arrecadar doações.
- **Persona-Donor**: Usuário que visita a campanha (logado ou anônimo) e pretende fazer a doação para a causa.

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **LAW-001**: Criação da Campanha

- **As a**: Persona-CampaignCreator
- **I want to**: Criar uma campanha preenchendo os dados principais e a chave PIX
- **So that**: Eu possa iniciar a arrecadação de doações para o meu propósito

**Acceptance Criteria**:

- **AC-001-A**: O sistema DEVE exigir que o usuário esteja logado para acessar a rota de criação de campanha.
- **AC-001-B**: O formulário DEVE possuir campos obrigatórios para: Nome da Campanha, Descrição e Chave PIX.
- **AC-001-C**: O formulário PODE possuir um campo opcional para Imagem da Campanha.
- **AC-001-D**: O sistema DEVE validar se a Chave PIX informada possui um formato válido no frontend e backend (CPF, CNPJ, Celular, E-mail ou Chave Aleatória).

### **LAW-002**: Cadastro de Itens da Campanha

- **As a**: Persona-CampaignCreator
- **I want to**: Adicionar itens específicos à minha campanha com um valor estipulado
- **So that**: Os doadores saibam exatamente os custos do que eu preciso adquirir com as doações

**Acceptance Criteria**:

- **AC-002-A**: O sistema DEVE permitir a inclusão de um ou mais itens à campanha na mesma tela de criação ou fluxo.
- **AC-002-B**: Cada item com valor específico DEVE ter um campo obrigatório para Descrição e um campo numérico obrigatório para Valor.
- **AC-002-C**: O sistema PODE permitir associar uma Imagem (URL ou upload) para cada item cadastrado (opcional).
- **AC-002-D**: O sistema DEVE permitir remover ou editar os itens adicionados antes de salvar definitivamente a campanha.

### **LAW-003**: Adição de Item de Valor Genérico

- **As a**: Persona-CampaignCreator
- **I want to**: Adicionar uma opção de doação genérica
- **So that**: O doador possa escolher doar qualquer quantia, ao invés de escolher um item específico tabelado

**Acceptance Criteria**:

- **AC-003-A**: O sistema DEVE oferecer uma funcionalidade para adicionar um item sem valor fixo atrelado.
- **AC-003-B**: Este item genérico DEVE permitir a inserção de uma Descrição personalizada (ex: "Doe o quanto o coração mandar").
- **AC-003-C**: O item genérico NÃO DEVE validar ou exigir a definição de valor monetário durante sua criação pelo criador da campanha.

---

## 5. Non-Functional Requirements (NFRs)

### Performance

- **NFR-Perf-001**: A submissão da criação de campanha e seus itens no banco de dados DEVE ser concluída em menos de 1000ms, suportando processamento em transação (rollback em caso de falha de qualquer item).
- **NFR-Perf-002**: As imagens enviadas (upload) para a campanha e para os itens DEVEM ter um limite de tamanho máximo de 50kb cada.

### Security

- **NFR-Sec-001**: Todos os endpoints ou Server Actions associados à criação da campanha DEVEM verificar a autenticação e associar a nova campanha ao `userId` de forma segura, impedindo que o usuário envie um ID forjado.
- **NFR-Sec-002**: A API (Server Action) DEVE higienizar (sanitize) as strings de nome e descrição para prevenir injeção de HTML e ataques XSS.

### Usability (Design)

- **NFR-Usab-001**: O formulário DEVE apresentar feedback de erro em tempo real sob os campos inválidos, priorizando a usabilidade através de componentes modernos (ex. inputs com anéis de foco, animações suaves).

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

- Integração direta com instituições financeiras ou gateways de pagamento (como Mercado Pago, Stripe) para processamento ou liquidação das transações do PIX. O aplicativo serve como vitrine para exibir a Chave PIX, não atua no processamento financeiro na versão inicial.
- Aprovação manual de campanhas (Moderação). Na versão inicial, as campanhas serão publicadas assim que salvas, sem precisar da aprovação de administradores.
- Notificações via e-mail automáticas ao criar a campanha.

---

## 7. Success Metrics & Analytics

### Key Performance Indicators (KPIs)

- **KPI-001**: Taxa de conclusão do formulário: Pelo menos 85% dos usuários que iniciam a criação de uma campanha a salvam com sucesso.

### Analytics Events

- **Analytics-Event-001**: Disparar evento `campaign_draft_started` ao entrar na página de criação.
- **Analytics-Event-002**: Disparar evento `campaign_created` quando a campanha e seus itens forem gravados no banco de dados com sucesso.

---

## Appendix A: Cross-Reference Index

### User Stories

LAW-001, LAW-002, LAW-003

### Acceptance Criteria

AC-001-A, AC-001-B, AC-001-C, AC-001-D, AC-002-A, AC-002-B, AC-002-C, AC-002-D, AC-003-A, AC-003-B, AC-003-C

### Non-Functional Requirements

NFR-Perf-001, NFR-Perf-002, NFR-Sec-001, NFR-Sec-002, NFR-Usab-001

### KPIs and Events

KPI-001, Analytics-Event-001, Analytics-Event-002
