---
version: 1.0.0
owner: kallklen
status: done
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

# PRD: Home Page do Dividi

## 1. Overview & Goals

### 1.1 Product Summary

A Home Page do Dividi tem como objetivo apresentar o sistema de gerenciamento de doações para novos visitantes. A plataforma permite que pessoas e organizações criem campanhas informando exatamente os itens específicos que precisam, conectando-as com doadores dispostos a fornecer esses itens. A página inicial deve comunicar claramente essa proposta de valor, gerar confiança e guiar o usuário sobre como utilizar o sistema.

### 1.2 Business Goals

- **Goal-001**: Comunicar de forma clara e objetiva o que é o projeto Dividi e qual o seu propósito de impacto social.
- **Goal-002**: Instruir os visitantes, através de um passo a passo simples, sobre como podem interagir com a plataforma, seja criando campanhas ou doando itens.
- **Goal-003**: Maximizar a conversão de visitantes para criadores de campanhas ou doadores através de CTAs bem posicionados.

---

## 2. Technical Constraints & Environment

**CRITICAL**: These constraints are immutable. All generated code MUST comply.

- **Languages**: TypeScript 5.0+, HTML, todo o conteúdo escrito DEVE estar obrigatoriamente em Português do Brasil (pt-BR).
- **Frameworks**: Next.js 14+ (App Router), React 18+, Tailwind CSS.
- **Databases**: Neon Serverless PostgreSQL (para dados dinâmicos futuros).
- **Hosting**: Vercel.
- **Style Guides**: ESLint, Prettier.
- **Security Requirements**: Dados sensíveis e variáveis de ambiente não devem ser expostos no frontend.
- **Forbidden Libraries/Patterns**: Uso de `any` em TypeScript é proibido. Não utilizar placeholders genéricos ou Lorem Ipsum na versão final.

---

## 3. User Personas & Roles

Define all actors who interact with the system:

- **Persona-Visitante**: Usuário que acessa a página pela primeira vez. Busca entender se a plataforma é confiável e como ela pode ajudá-lo ou como ele pode ajudar o próximo.
- **Persona-Organizador**: Usuário ou entidade que possui uma necessidade real e deseja iniciar uma campanha de arrecadação de itens específicos.
- **Persona-Doador**: Indivíduo que tem itens para doar (ou capacidade de comprá-los) e busca campanhas onde sua doação terá impacto direto.

---

## 4. Functional Requirements / User Stories

**IMPORTANT**: Each user story and acceptance criterion MUST have a unique, machine-readable ID.

### **LAW-010**: Seção Hero (Apresentação Principal)

- **As a**: Persona-Visitante
- **I want to**: Visualizar uma mensagem principal clara e impactante
- **So that**: Eu possa entender imediatamente que o Dividi é um sistema de gerenciamento de doações de itens.

**Acceptance Criteria**:

- **AC-010-A**: O sistema MUST exibir o nome do projeto (Dividi) e um título principal (H1) que resuma o propósito.
- **AC-010-B**: O sistema MUST exibir um subtítulo explicativo focado em impacto social.
- **AC-010-C**: O sistema MUST apresentar dois botões de chamada para ação (CTAs) principais: "Criar Campanha" e "Quero Doar".

### **LAW-011**: Descrição do Projeto e Propósito (Missão)

- **As a**: Persona-Visitante
- **I want to**: Ler sobre a motivação por trás do projeto
- **So that**: Eu compreenda a importância da doação de itens específicos e sinta confiança na plataforma.

**Acceptance Criteria**:

- **AC-011-A**: O sistema MUST exibir uma seção dedicada explicando o que é o Dividi.
- **AC-011-B**: O sistema MUST destacar os benefícios do modelo de doação de itens específicos (transparência, necessidade real atendida, redução de desperdício).
- **AC-011-C**: O texto da seção MUST estar 100% em português do Brasil (pt-BR).

### **LAW-012**: Seção "Como Usar" (Passo a Passo)

- **As a**: Persona-Visitante
- **I want to**: Ver um guia rápido de como a plataforma funciona
- **So that**: Eu saiba exatamente quais os passos para criar uma campanha ou realizar uma doação.

**Acceptance Criteria**:

- **AC-012-A**: O sistema MUST exibir um fluxo visual com o passo a passo para o Persona-Organizador (Ex: 1. Crie sua conta, 2. Liste os itens necessários, 3. Receba doações).
- **AC-012-B**: O sistema MUST exibir um fluxo visual com o passo a passo para o Persona-Doador (Ex: 1. Encontre uma campanha, 2. Escolha o item para doar, 3. Faça a entrega).
- **AC-012-C**: O sistema MUST utilizar ícones ou ilustrações para tornar o passo a passo intuitivo.

### **LAW-013**: Seção de FAQ (Perguntas Frequentes)

- **As a**: Persona-Visitante
- **I want to**: Encontrar respostas para dúvidas comuns
- **So that**: Eu consiga sanar objeções antes de decidir criar uma campanha ou doar.

**Acceptance Criteria**:

- **AC-013-A**: O sistema MUST incluir um componente de accordion exibindo as principais perguntas (ex: É gratuito?, Como entrego a doação?).
- **AC-013-B**: O sistema MUST permitir expandir e colapsar cada pergunta de forma individual.

---

## 5. Non-Functional Requirements (NFRs)

System-wide quality attributes and constraints:

### Performance

- **NFR-Perf-001**: O tempo de carregamento da pintura do conteúdo principal (LCP - Largest Contentful Paint) MUST ser inferior a 1.2 segundos em redes 4G.
- **NFR-Perf-002**: Todas as imagens e ilustrações MUST estar em formatos otimizados (WebP) e com lazy loading apropriado.

### UX/UI & Design

- **NFR-Design-001**: A página MUST possuir um design moderno, amigável e acolhedor (uso de cores harmoniosas, micro-interações, hover effects).
- **NFR-Design-002**: O sistema MUST ser totalmente responsivo (Mobile-first).

### Accessibility

- **NFR-Access-001**: Todos os botões, links e inputs MUST ser navegáveis via teclado.
- **NFR-Access-002**: Todas as imagens MUST possuir o atributo `alt` descritivo.

---

## 6. Out of Scope (Non-Goals)

**CRITICAL**: Explicitly define what will NOT be built to prevent scope creep and agent hallucination.

- Implementação das páginas internas (Dashboard, Formulário de Criação de Campanha, Listagem de Campanhas, etc.) - O escopo é estrito à Home Page.
- Integrações reais de autenticação ou backend (apenas estruturação da interface frontend).
- Integração com gateways de pagamento ou transações financeiras (o foco é na doação de itens, não de valores).
- Desenvolvimento de ilustrações 3D complexas.

---

## 7. Success Metrics & Analytics

Define how success will be measured:

### Key Performance Indicators (KPIs)

- **KPI-001**: Bounce rate (taxa de rejeição) da página inferior a 40%.
- **KPI-002**: Taxa de clique (Click-Through Rate - CTR) nos CTAs principais superior a 15%.

### Analytics Events

- **Analytics-Event-001**: Disparar o evento `click_create_campaign` quando o CTA correspondente for acionado.
- **Analytics-Event-002**: Disparar o evento `click_donate_now` quando o CTA de doação for acionado.

---

## Appendix A: Cross-Reference Index

### User Stories

LAW-010, LAW-011, LAW-012, LAW-013

### Acceptance Criteria

AC-010-A, AC-010-B, AC-010-C, AC-011-A, AC-011-B, AC-011-C, AC-012-A, AC-012-B, AC-012-C, AC-013-A, AC-013-B

### Non-Functional Requirements

NFR-Perf-001, NFR-Perf-002, NFR-Design-001, NFR-Design-002, NFR-Access-001, NFR-Access-002

### KPIs and Events

KPI-001, KPI-002, Analytics-Event-001, Analytics-Event-002

---

## Appendix B: Change Log

| Version | Date       | Author   | Changes                          |
| ------- | ---------- | -------- | -------------------------------- |
| 1.0.0   | 2026-09-12 | AI Agent | Initial version of Home Page PRD |
