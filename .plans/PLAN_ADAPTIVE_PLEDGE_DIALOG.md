# Plano de Implementação: PledgeDialog Adaptativo e Responsivo

## Descrição do Objetivo

Corrigir a usabilidade, responsividade e fechamento do diálogo de doação ([`PledgeDialog`](file:///home/ibne/Code/dividi/src/components/pledge-dialog.tsx)).

### Problema Identificado
Atualmente, ao abrir o diálogo em telas menores (notebooks, tablets, smartphones) ou telas com fator de escala (DPI) elevado, o modal ultrapassa a altura da viewport (`100vh`).
Como o contêiner do modal utilizava `flex items-center justify-center p-4 overflow-y-auto` sem limite de altura no card interno (`max-h`), o alinhamento vertical flexbox centralizou o card excedente, empurrando o topo do diálogo (título e botão "Fechar" com o ícone `X`) para coordenadas negativas acima do topo da tela (`top < 0`).
Como navegadores não permitem rolagem para valores negativos de scroll (`scrollTop < 0`), o topo e o botão de fechamento tornam-se inalcançáveis. Além disso:
- O modal não possuía fechamento ao clicar no backdrop (área escura externa).
- A rolagem do fundo da página não era travada ao abrir o diálogo.
- O formulário e a tela de confirmação de sucesso continham muito conteúdo empilhado sem rolagem interna no corpo do modal.

### Solução Proposta
1. **Estrutura com Cabeçalho Fixo e Corpo Rolável**:
   - Cabeçalho (`shrink-0`) fixo com título, descrição e botão "Fechar" (`X`) sempre visíveis no topo do card, independente do tamanho da tela ou rolagem.
   - Corpo (`flex-1 overflow-y-auto overscroll-contain`) com rolagem suave independente.
2. **Prevenção de Truncamento Superior**:
   - Alinhamento seguro com `flex min-h-full items-center justify-center` e margens automáticas (`my-auto`) no card.
   - Limite de altura vertical no card: `max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)]`.
3. **Múltiplas Formas de Fechamento**:
   - Botão "Fechar" (`X`) fixo e acessível no cabeçalho com `aria-label="Fechar"`.
   - Clique no backdrop externo fecha o diálogo.
   - Tecla `Escape` fecha o diálogo e reseta o formulário via `handleClose()`.
4. **Bloqueio de Rolagem do Fundo (`Scroll Lock`)**:
   - `document.body.style.overflow = 'hidden'` enquanto o diálogo estiver aberto, restaurando ao fechar.

---

## Mudanças Propostas

### 1. Componente PledgeDialog

#### [MODIFY] [`src/components/pledge-dialog.tsx`](file:///home/ibne/Code/dividi/src/components/pledge-dialog.tsx)

- Atualizar o layout do overlay:
  ```tsx
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex min-h-full items-center justify-center"
    onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}
  >
  ```
- Estruturar o card do modal:
  ```tsx
  <div className="bg-background border border-border shadow-lg rounded-xl w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col relative animate-in fade-in zoom-in-95 duration-200 my-auto">
    {/* Cabeçalho Fixo */}
    <div className="flex items-start justify-between p-6 pb-4 border-b border-border/40 shrink-0">
      <div className="pr-4">
        <h2 id="dialog-title" className="text-xl font-semibold tracking-tight text-foreground">
          Doar {item.description}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Registre sua intenção de doação e efetue o pagamento com o código PIX exclusivo.
        </p>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="p-1 -mr-2 -mt-1 text-muted-foreground hover:text-foreground transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Corpo Rolável */}
    <div className="p-6 pt-4 overflow-y-auto flex-1 overscroll-contain">
      {isSuccess ? (
        // Conteúdo de Sucesso / QR Code
      ) : (
        // Formulário de Doação
      )}
    </div>
  </div>
  ```
- Bloqueio de scroll do body via `useEffect`:
  ```tsx
  React.useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);
  ```
- Tecla `Escape`: invocar `handleClose()` para garantir limpeza do formulário e estados.

---

### 2. Testes Automatizados

#### [MODIFY] [`src/components/pledge-dialog.test.tsx`](file:///home/ibne/Code/dividi/src/components/pledge-dialog.test.tsx)

- Adicionar testes:
  1. Fechamento ao clicar no backdrop externo (`fireEvent.click` no elemento com `role="dialog"`).
  2. Clique dentro do card do modal não fecha o diálogo.
  3. Bloqueio e restauração do overflow do `document.body`.
  4. Validação de que o botão "Fechar" e o cabeçalho continuam acessíveis.

---

## Plano de Verificação

### Testes Automatizados
```bash
pnpm test src/components/pledge-dialog.test.tsx
pnpm test
pnpm lint
```

### Validação Manual
1. Abrir a página de uma campanha (`/campaigns/[id]`).
2. Redimensionar a janela do navegador para uma altura reduzida (ex: 600px).
3. Clicar no botão "Doar":
   - O cabeçalho com o botão "Fechar" (`X`) e o título deve ficar visível e acessível no topo.
   - O formulário com o QR Code e inputs deve ser rolável internamente.
   - Clicar fora do card (na área escura) deve fechar o diálogo.
   - Clicar no botão "Fechar" deve fechar e resetar os campos.
   - Pressionar a tecla `Escape` deve fechar o diálogo.
