---
version: 1.0.0
owner: kallklen
status: done
last_updated: 2026-09-12
dependencies: [PRD_SIGNUP.md, PRD_HOME_PAGE.md]
llm_directives:
  model: 'gpt-4-turbo'
  temperature: 0.2
  persona: >
    You are an expert senior software engineer. Your task is to analyze these
    requirements and generate clean, efficient, and well-documented code that
    adheres to all specified constraints. You MUST NOT deviate from the technical
    constraints or functional requirements without explicit approval.
---

# PRD: Fluxo de Autenticação (Sign-in)

## 1. Overview & Goals

### 1.1 Product Summary

O sistema Dividi é uma plataforma de gestão de campanhas de doação. Este PRD define o fluxo de login (sign-in) para os usuários existentes. O usuário poderá acessar a sua conta previamente criada através de um botão de acesso (Sign-in) disponibilizado na página inicial, informando suas credenciais de e-mail e senha.

### 1.2 Business Goals

- **Goal-001**: Fornecer uma experiência de login rápida, segura e intuitiva.
- **Goal-002**: Garantir o controle de acesso e sessão seguros dos usuários ao sistema.

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

- **Persona-User**: Um usuário já cadastrado que deseja entrar em sua conta para gerenciar suas campanhas de doações na plataforma.

---

## 4. Functional Requirements

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **US-004**: Ponto de Entrada (Sign-in Button) na Home Page

- **As a**: Persona-User
- **I want to**: Visualizar e interagir com um botão de login ("Entrar" ou "Sign-in") na barra de navegação da página inicial
- **So that**: Eu possa acessar rapidamente a tela de autenticação.

**Acceptance Criteria**:

- **AC-004-A**: System MUST exibir um botão "Entrar" (ou "Sign-in") na barra de navegação (header) visível na Home Page, ao lado ou próximo do botão de cadastro.
- **AC-004-B**: System MUST redirecionar o usuário para a rota `/login` (ou equivalente) ao clicar no botão.

### **US-005**: Autenticação de Usuário

- **As a**: Persona-User
- **I want to**: Inserir meu e-mail e senha e submeter o formulário
- **So that**: Eu possa me autenticar com segurança e acessar a plataforma.

**Acceptance Criteria**:

- **AC-005-A**: System MUST exibir um formulário com campos para e-mail e senha.
- **AC-005-B**: System MUST utilizar o Neon Auth para validar as credenciais informadas.
- **AC-005-C**: System MUST exibir uma mensagem de erro clara (ex: "E-mail ou senha incorretos") se as credenciais forem inválidas.
- **AC-005-D**: System MUST exibir validações nos campos se estiverem vazios ou em formato inválido antes da submissão.

### **US-006**: Redirecionamento Pós-Login

- **As a**: Persona-User
- **I want to**: Ser redirecionado para o dashboard imediatamente após o login com sucesso
- **So that**: Eu possa visualizar e gerenciar minhas campanhas.

**Acceptance Criteria**:

- **AC-006-A**: System MUST redirecionar o usuário para a rota autenticada principal (dashboard) após sucesso na autenticação.
- **AC-006-B**: System MUST estabelecer e gerenciar a sessão do usuário de forma segura através do Neon Auth.

---

## 5. Non-Functional Requirements

System-wide quality attributes and constraints:

### Performance

- **NFR-Perf-001**: O processamento do login e verificação de credenciais MUST ser concluído e responder em menos de 1 segundo (p95).

### Security

- **NFR-Sec-001**: O sistema MUST implementar proteções contra ataques de força bruta no formulário de login (rate limiting).
- **NFR-Sec-002**: A sessão do usuário MUST usar cookies HTTP-only, secure, e SameSite estritos.

---

## 6. Out of Scope

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

- **NÃO INCLUI** fluxos de redefinição ou recuperação de senha ("Esqueci minha senha"). Isso será tratado em um PRD separado.
- **NÃO INCLUI** autenticação em duas etapas (2FA) na primeira versão.
- **NÃO INCLUI** Single Sign-On (SSO) com provedores de rede social (Google, Apple, Facebook, etc.).

---

## 7. Success Metrics

Define how success will be measured:

### Key Performance Indicators (KPIs)

- **KPI-001**: Taxa de falhas e erros não relacionados a credenciais incorretas (como timeouts no serviço de autenticação) menor que 1%.
- **KPI-002**: Tempo médio para concluir o login inferior a 1,5 segundos.

---

## Appendix A: Cross-Reference Index

### User Stories

US-004, US-005, US-006

### Acceptance Criteria

AC-004-A, AC-004-B, AC-005-A, AC-005-B, AC-005-C, AC-005-D, AC-006-A, AC-006-B

### Non-Functional Requirements

NFR-Perf-001, NFR-Sec-001, NFR-Sec-002

### KPIs and Events

KPI-001, KPI-002
