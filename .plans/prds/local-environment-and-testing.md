---
version: 1.0.0
owner: kallklen
status: approved
last_updated: 2026-09-16
dependencies: []
llm_directives:
  model: "gpt-4-turbo"
  temperature: 0.2
  persona: >
    Você é um engenheiro de software sênior especialista em DevOps, Next.js e Arquitetura de Testes.
    Sua tarefa é analisar estes requisitos e preparar o ambiente local e a suite completa de testes
    com código limpo, tipado e determinístico. Você NÃO DEVE desviar das restrições técnicas ou
    requisitos funcionais sem aprovação explícita.
---

# PRD: Ambiente de Desenvolvimento Local e Suite de Testes

## 1. Overview & Goals

### 1.1 Product Summary

O Dividi é uma plataforma de gerenciamento de doações conectando pessoas e organizações a doadores através de campanhas e itens específicos com chave PIX. Para garantir a qualidade, velocidade de entrega e estabilidade da aplicação, os engenheiros precisam ser capazes de inicializar e executar o projeto inteiramente em ambiente local (offline-first), com todas as dependências de infraestrutura (banco de dados PostgreSQL, autenticação e upload de arquivos) simuladas ou containerizadas, além de uma suite completa de testes automatizados (unitários, de integração e ponta a ponta).

Atualmente, o projeto depende de serviços em nuvem (Neon PostgreSQL Serverless, Neon Auth e Vercel Blob Storage) e não possui testes automatizados configurados no repositório. Este documento especifica os requisitos para criar uma infraestrutura local reproduzível, mocks/adapters para dependências externas, seeds de dados e suites de testes robustas com Vitest e Playwright.

### 1.2 Business Goals

* **Goal-001**: Reduzir o tempo de setup local (onboarding) de um engenheiro para menos de 5 minutos utilizando um único comando de inicialização.
* **Goal-002**: Possibilitar a execução de testes automatizados unitários, de integração e E2E 100% locais e determinísticos, sem necessidade de credenciais de produção ou conexão com a internet.
* **Goal-003**: Aumentar a confiabilidade das entregas contínuas prevenindo regressões nas Server Actions, formulários de campanhas e controle de acesso a rotas protegidas.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code and configurations MUST comply.

* **Languages**: TypeScript 5 (Strict mode ativado, uso de `any` estritamente proibido)
* **Package Manager**: `pnpm` (Obrigatório conforme diretrizes do projeto; não utilizar `npm` ou `yarn`)
* **Frameworks & Core**: Next.js 16 (App Router com React 19)
* **Testing Frameworks**:
  * Unitários & Integração: Vitest com suporte a TypeScript path aliases (`@/*`), React Testing Library (`@testing-library/react`), `@testing-library/jest-dom` e ambiente JSDOM.
  * End-to-End (E2E): Playwright configurado para execução contra servidor local.
* **Database & ORM**: PostgreSQL 16 (via Docker Compose) e Drizzle ORM (`drizzle-orm`, `drizzle-kit`).
* **Environment Configuration**: Uso de `.env.example`, `.env.test` e suporte para execução com `dotenv`.
* **Security & Auth Isolation**:
  * A autenticação via Neon Auth / Better Auth (`@neondatabase/auth`, `@neondatabase/neon-js/auth`) DEVE possuir utilitários de mock/test fixtures para permitir simulação de sessões logadas e anônimas em testes.
  * O upload via Vercel Blob (`@vercel/blob/client`, `/api/upload`) DEVE possuir fallback ou mock para ambiente local/testes quando `BLOB_READ_WRITE_TOKEN` não estiver configurado.
* **Forbidden Libraries/Patterns**:
  * É estritamente proibido depender de chaves de API remotas de produção para rodar testes locais.
  * Proibido o uso de `any` ou type-casting inseguro nos testes e fixtures.
  * Proibido commits de credenciais ou arquivos `.env.local` / `.env.test.local`.

---

## 3. User Personas & Roles

* **Persona-SoftwareEngineer**: Desenvolvedor que implementa novas funcionalidades ou correções e precisa rodar o servidor local, executar testes unitários rápidos e validar regras de negócio antes de submeter código.
* **Persona-QAEngineer**: Engenheiro de qualidade responsável por criar e manter cenários de testes de integração e testes ponta a ponta (E2E) com Playwright.
* **Persona-CIPipeline**: Agente de integração contínua (GitHub Actions) que executa lint, checagem de tipos, testes unitários e testes E2E em ambiente isolado sem acesso a recursos externos pagos.

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **US-001**: Configuração de Infraestrutura Local com Docker Compose

* **As a**: Persona-SoftwareEngineer
* **I want to**: Subir um banco de dados PostgreSQL local via Docker Compose com um único comando
* **So that**: Eu não precise depender de uma instância ativa no Neon na nuvem para desenvolver ou rodar testes locais

**Acceptance Criteria**:

* **AC-001-A**: O repositório DEVE conter um arquivo `docker-compose.yml` definindo um serviço PostgreSQL 16 com persistência em volume local e porta padrão configurável.
* **AC-001-B**: O arquivo `.env.example` DEVE ser atualizado documentando todas as variáveis necessárias para desenvolvimento e testes locais (`DATABASE_URL=postgres://postgres:postgres@localhost:5432/dividi_dev`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `NEON_AUTH_COOKIE_SECRET`, etc.).
* **AC-001-C**: O sistema DEVE disponibilizar scripts no `package.json` para iniciar (`pnpm docker:up`) e encerrar (`pnpm docker:down`) os serviços locais.
* **AC-001-D**: O Drizzle Kit DEVE ser capaz de aplicar as migrações (`pnpm db:push` ou `pnpm db:migrate`) com sucesso contra a instância do PostgreSQL local.

### **US-002**: Seeding e Fixtures Determinísticas do Banco de Dados

* **As a**: Persona-SoftwareEngineer
* **I want to**: Executar um comando para popular o banco de dados local com dados iniciais consistentes
* **So that**: Eu possa testar a aplicação com organizações, usuários e campanhas existentes imediatamente

**Acceptance Criteria**:

* **AC-002-A**: O sistema DEVE disponibilizar o comando `pnpm db:seed` que executa um script TypeScript (`src/db/seed.ts`).
* **AC-002-B**: O script de seed DEVE criar atomicamente pelo menos 1 usuário de teste (`users`), 1 organização (`organizations`), 1 membro de organização (`organization_members`), e 2 campanhas de teste com itens associados (`campaigns`, `campaign_items`).
* **AC-002-C**: O script de seed DEVE ser idempotente e validar que não está sendo executado em ambiente de produção (`NODE_ENV === 'production'`).
* **AC-002-D**: O script de seed DEVE fornecer opção para limpar/resetar dados anteriores de teste antes de inserir novas fixtures.

### **US-003**: Isolamento e Mocks de Serviços Externos (Auth e Blob Storage)

* **As a**: Persona-SoftwareEngineer
* **I want to**: Executar a aplicação e os testes sem falhas de conexão quando serviços externos não estiverem provisionados
* **So that**: Os testes não quebrem por falta de conexão à internet ou ausência de tokens da Vercel/Neon

**Acceptance Criteria**:

* **AC-003-A**: O endpoint `/api/upload` DEVE detectar ambiente de teste ou ausência de `BLOB_READ_WRITE_TOKEN`, retornando um link estático/mock de imagem sem disparar exceção não tratada.
* **AC-003-B**: O sistema DEVE fornecer helpers de teste (`src/test/auth-mock.ts`) para simular sessões de usuário autenticado no servidor (`auth.getSession()`) e no cliente (`authClient.useSession()`).
* **AC-003-C**: O middleware/proxy de autenticação (`src/proxy.ts`) DEVE ser testável localmente simulando a presença ou ausência dos cookies de sessão (`better-auth.session_token`).

### **US-004**: Suite de Testes Unitários e de Integração (Vitest)

* **As a**: Persona-SoftwareEngineer
* **I want to**: Rodar testes unitários e de integração com execução ultrarrápida usando Vitest
* **So that**: Eu tenha feedback imediato sobre a integridade das funções de validação, componentes e Server Actions

**Acceptance Criteria**:

* **AC-004-A**: O projeto DEVE configurar Vitest com ambiente JSDOM, suporte a aliases `@/*` (definidos em `tsconfig.json`) e extensões de asserção do `@testing-library/jest-dom`.
* **AC-004-B**: O `package.json` DEVE conter os scripts `pnpm test` (execução única), `pnpm test:watch` (modo iterativo contínuo) e `pnpm test:coverage` (relatório de cobertura).
* **AC-004-C**: A suite de testes DEVE conter testes cobrindo os esquemas Zod (`src/lib/validations/campaign.ts`), validando formatos de chave PIX válidas e inválidas, limites de valores e itens.
* **AC-004-D**: A suite de testes DEVE conter testes de integração para as Server Actions (`src/app/dashboard/campaigns/actions.ts` e `src/app/dashboard/actions.ts`), validando respostas de sucesso, validação e erro de sessão não autenticada.
* **AC-004-E**: A suite de testes DEVE conter testes de componentes para os elementos principais da UI (`Sidebar`, botões e formulários) com React Testing Library.

### **US-005**: Suite de Testes End-to-End (Playwright)

* **As a**: Persona-QAEngineer
* **I want to**: Executar testes ponta a ponta simulando a navegação do usuário real no navegador
* **So that**: Fluxos críticos como login, navegação no dashboard e criação de campanha sejam validados visualmente e funcionalmente

**Acceptance Criteria**:

* **AC-005-A**: O projeto DEVE conter configuração do Playwright (`playwright.config.ts`) configurado para executar testes no navegador contra `http://localhost:3000`.
* **AC-005-B**: O `package.json` DEVE conter os scripts `pnpm test:e2e` e `pnpm test:e2e:ui`.
* **AC-005-C**: A suite E2E DEVE validar o redirecionamento de rotas protegidas (acesso a `/dashboard` sem sessão redireciona para `/login`).
* **AC-005-D**: A suite E2E DEVE validar a renderização da página inicial (`/`) e navegação para login/cadastro.
* **AC-005-E**: A suite E2E DEVE validar a submissão do formulário de criação de campanha em `/dashboard/campaigns/new` com sessão de teste injetada, verificando feedback visual de sucesso.

### **US-006**: Script de Onboarding e Validação Geral (Developer Experience)

* **As a**: Persona-SoftwareEngineer
* **I want to**: Ter um comando único de preparação local e um comando de checagem completa do projeto
* **So that**: Qualquer desenvolvedor possa configurar o ambiente e validar a aplicação com mínimo atrito

**Acceptance Criteria**:

* **AC-006-A**: O `package.json` DEVE disponibilizar o comando `pnpm setup:local` que orquestra a criação do `.env.local` (se ausente), subida do container Docker, aplicação das migrações do banco e execução do seed.
* **AC-006-B**: O `package.json` DEVE disponibilizar o comando `pnpm check:all` que executa em sequência: checagem de tipos (`tsc --noEmit`), lint (`pnpm lint`) e suite de testes (`pnpm test`).
* **AC-006-C**: O arquivo `README.md` DEVE ser enriquecido em `pt-BR` com instruções claras, passo a passo de como rodar o projeto localmente com Docker, aplicar migrações, popular seeds e rodar os testes.

---

## 5. Non-Functional Requirements (NFRs)

### Performance

* **NFR-Perf-001**: A suite completa de testes unitários e de integração (Vitest) DEVE ser executada em menos de 10 segundos em máquina de desenvolvimento padrão.
* **NFR-Perf-002**: A inicialização do banco de dados local via Docker Compose e aplicação das migrações DEVE ocorrer em menos de 15 segundos.

### Reliability & Determinism

* **NFR-Rel-001**: Os testes automatizados DEVEM ser 100% determinísticos; rodar a suite repetidas vezes com os mesmos dados de entrada não pode gerar falsos positivos ou falsos negativos (zero flakiness).
* **NFR-Rel-002**: A execução dos testes NÃO DEVE deixar processos órfãos em background ou portas bloqueadas após o encerramento.

### Security

* **NFR-Sec-001**: Todas as credenciais de banco e chaves de teste locais DEVEM ser restritas ao arquivo `.env.example` com valores dummy (ex: `postgres:postgres`), e arquivos com segredos reais DEVEM estar devidamente listados no `.gitignore`.
* **NFR-Sec-002**: O script de seed (`db:seed`) DEVE abortar imediatamente se `process.env.NODE_ENV === 'production'`, prevenindo perda de dados acidental em produção.

### Maintainability

* **NFR-Maint-001**: Todos os mocks, fixtures e utilitários de teste DEVEM ser organizados em diretórios dedicados (`src/test/` ou `tests/`) com tipagem TypeScript estrita e reutilizável.

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

* Implementação de emulador completo de branches do Neon Serverless localmente (utilizaremos PostgreSQL padrão via Docker).
* Gateway de pagamento real ou emulador bancário do Banco Central para liquidação de PIX (a chave PIX continuará sendo informativa na UI).
* Setup de infraestrutura em nuvem, pipelines externas de deploy contínuo ou monitoramento de produção (Datadog/Sentry).
* Migração de pacotes existentes para fora do ecossistema `pnpm`.

---

## 7. Success Metrics & Analytics

### Key Performance Indicators (KPIs)

* **KPI-001**: Tempo de onboarding local: Engenheiros novatos conseguem rodar a aplicação e os testes em menos de 5 minutos após clonar o repositório.
* **KPI-002**: Cobertura de testes: Mínimo de 80% de cobertura de código nas regras de negócio críticas (Server Actions e Schemas Zod).
* **KPI-003**: 100% de sucesso na execução dos testes unitários e E2E sem dependência de internet ou serviços externos pagos.

### Analytics Events

* **Analytics-Event-001**: Disparar log informativo de sucesso na conclusão do script de seed (`seed_completed_successfully`).
* **Analytics-Event-002**: Relatório consolidado de métricas gerado pelo Vitest e Playwright com total de testes executados e tempo decorrido.

---

## Appendix A: Cross-Reference Index

### User Stories

US-001, US-002, US-003, US-004, US-005, US-006

### Acceptance Criteria

AC-001-A, AC-001-B, AC-001-C, AC-001-D, AC-002-A, AC-002-B, AC-002-C, AC-002-D, AC-003-A, AC-003-B, AC-003-C, AC-004-A, AC-004-B, AC-004-C, AC-004-D, AC-004-E, AC-005-A, AC-005-B, AC-005-C, AC-005-D, AC-005-E, AC-006-A, AC-006-B, AC-006-C

### Non-Functional Requirements

NFR-Perf-001, NFR-Perf-002, NFR-Rel-001, NFR-Rel-002, NFR-Sec-001, NFR-Sec-002, NFR-Maint-001

### KPIs and Events

KPI-001, KPI-002, KPI-003, Analytics-Event-001, Analytics-Event-002

---

## Appendix B: Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-09-16 | kallklen | Criação inicial do PRD para ambiente local e suite de testes |
