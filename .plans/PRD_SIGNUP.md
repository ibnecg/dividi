---
version: 1.0.0
owner: kallklen
status: approved
last_updated: 2026-09-12
dependencies: []
llm_directives:
  model: 'gpt-4-turbo'
  temperature: 0.2
  persona: >
    You are an expert senior software engineer. Your task is to analyze these
    requirements and generate clean, efficient, and well-documented code that
    adheres to all specified constraints. You MUST NOT deviate from the technical
    constraints or functional requirements without explicit approval.
---

# PRD: Fluxo de Cadastro (Sign-up)

## 1. Overview & Goals

### 1.1 Product Summary

O sistema Dividi é uma plataforma de gestão de campanhas de doação. Este PRD define o fluxo de cadastro inicial. No sistema, a relação base é de que uma Organização possui Usuários, e os Usuários podem criar Campanhas. No fluxo de cadastro, o usuário irá criar sua conta e, simultaneamente, criar uma organização à qual sua conta será vinculada, sendo designado como o proprietário ou primeiro membro dessa organização.

### 1.2 Business Goals

- **Goal-001**: Garantir uma experiência de integração (onboarding) simples e direta onde um novo usuário crie sua conta e a respectiva organização em uma única etapa.
- **Goal-002**: Assegurar a segurança e consistência dos dados ao vincular adequadamente o primeiro usuário criado à nova organização através de transações atômicas no banco de dados.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

- **Languages**: TypeScript 5.0+
- **Frameworks**: Next.js 14+ (App Router), React 18+
- **Databases**: Neon Serverless PostgreSQL
- **ORM/Query Builder**: Drizzle ORM
- **Hosting**: Vercel
- **Style Guides**: ESLint, Prettier, strict TypeScript configuration
- **Security Requirements**: Autenticação, sessões e senhas MUST ser gerenciadas utilizando o Neon Auth.
- **Forbidden Libraries/Patterns**: Não utilizar `any` no TypeScript. Não comitar arquivos `.env`. Evitar componentes cliente (Client Components) quando os Server Components forem suficientes para SEO e performance.

---

## 3. User Personas & Roles

Define all actors who interact with the system:

- **Persona-NewUser**: Um visitante que deseja se tornar administrador de uma organização para poder criar campanhas de doações na plataforma.

---

## 4. Functional Requirements

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **US-001**: Cadastro de Conta e Organização

- **As a**: Persona-NewUser
- **I want to**: Preencher meus dados pessoais e os dados da minha organização
- **So that**: Eu possa criar uma conta e uma organização na plataforma simultaneamente e em uma única etapa

**Acceptance Criteria**:

- **AC-001-A**: System MUST exibir um formulário solicitando dados do usuário (Nome, E-mail, Senha) e da organização (Nome da Organização).
- **AC-001-B**: System MUST impedir o envio do formulário e exibir mensagens de erro se campos obrigatórios não forem preenchidos ou o e-mail for inválido.
- **AC-001-C**: System MUST verificar se o e-mail fornecido já está em uso, bloqueando a continuação e informando o usuário.
- **AC-001-D**: System MUST utilizar o Neon Auth para lidar com a criação segura da conta e gerenciamento da senha.
- **AC-001-E**: System MUST criar os registros do usuário e da organização em uma única transação de banco de dados, vinculando o usuário à organização.

### **US-002**: Redirecionamento Pós-Cadastro

- **As a**: Persona-NewUser
- **I want to**: Ser autenticado e redirecionado para a plataforma imediatamente após cadastrar
- **So that**: Eu possa iniciar a criação de campanhas imediatamente sem ter que fazer login de novo

**Acceptance Criteria**:

- **AC-002-A**: System MUST utilizar o Neon Auth para autenticar automaticamente o usuário e estabelecer a sessão caso o cadastro anterior tenha sucesso.
- **AC-002-B**: System MUST redirecionar o usuário recém-autenticado para a página inicial (dashboard) do sistema.

### **US-003**: Ponto de Entrada (Sign-up Button) na Home Page

- **As a**: Persona-NewUser
- **I want to**: Visualizar e interagir com um botão de cadastro ("Criar Conta" ou "Sign-up") na barra de navegação da página inicial
- **So that**: Eu possa acessar rapidamente o fluxo de criação de conta e organização de qualquer lugar na Home Page.

**Acceptance Criteria**:

- **AC-003-A**: System MUST incluir um botão de destaque "Criar Conta" ou "Sign-up" na barra de navegação (header) visível na Home Page.
- **AC-003-B**: System MUST redirecionar o usuário para a rota do fluxo de cadastro ao interagir com o botão.

---

## 5. Non-Functional Requirements

System-wide quality attributes and constraints:

### Performance

- **NFR-Perf-001**: O processamento do cadastro, incluindo a transação de banco de dados de múltiplos registros, MUST ser concluído e responder em menos de 2 segundos.

### Security

- **NFR-Sec-001**: A validação de senha MUST exigir um mínimo de 8 caracteres.
- **NFR-Sec-002**: O sistema MUST estar protegido contra submissões automatizadas exageradas (ex: rate limiting nas rotas de API de cadastro).

---

## 6. Out of Scope

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

- **NÃO INCLUI** fluxos de convite para adicionar usuários subsequentes a uma organização já existente; este PRD foca apenas no primeiro usuário + criação da organização.
- **NÃO INCLUI** confirmação de conta via e-mail ou envio de "magic links" de login. O acesso pós-cadastro é liberado automaticamente de imediato.
- **NÃO INCLUI** suporte ao cadastro através de provedores sociais (Google, Facebook, Apple, etc.), focando primeiramente na autenticação tradicional (email e senha).

---

## 7. Success Metrics

Define how success will be measured:

### Key Performance Indicators (KPIs)

- **KPI-001**: Taxa de conversão do fluxo de cadastro (acessos à página vs submissões bem-sucedidas) superior a 80%.
- **KPI-002**: Taxa de erros de banco de dados (como quebras na transação na criação conjunta usuário/organização) menor que 1%.

---

## Appendix A: Cross-Reference Index

### User Stories

US-001, US-002, US-003

### Acceptance Criteria

AC-001-A, AC-001-B, AC-001-C, AC-001-D, AC-001-E, AC-002-A, AC-002-B, AC-003-A, AC-003-B

### Non-Functional Requirements

NFR-Perf-001, NFR-Sec-001, NFR-Sec-002

### KPIs and Events

KPI-001, KPI-002
