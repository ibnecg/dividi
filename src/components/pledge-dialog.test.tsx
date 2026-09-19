import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PledgeDialog } from './pledge-dialog';
import * as actions from '@/app/campaigns/[id]/actions';

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock pledgeDonationAction
vi.mock('@/app/campaigns/[id]/actions', () => ({
  pledgeDonationAction: vi.fn(),
}));

describe('PledgeDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fixedPriceItem = {
    id: 'item-1',
    description: 'Cesta Básica',
    amount: '80.00',
    quantity: 5,
  };

  const openPriceItem = {
    id: 'item-2',
    description: 'Doação Espontânea',
    amount: null,
    quantity: 10,
  };

  const campaignProps = {
    campaignId: 'camp-123',
    campaignName: 'Campanha de Solidariedade',
    campaignPixKey: 'pix@exemplo.com.br',
  };

  it('renders fixed-price item with precalculated total and PIX code', async () => {
    render(
      <PledgeDialog
        item={fixedPriceItem}
        {...campaignProps}
      />
    );

    // Dialog is initially closed, click 'Doar'
    fireEvent.click(screen.getByRole('button', { name: /doar/i }));

    expect(screen.getByText('Doar Cesta Básica')).toBeDefined();
    // Default quantity 1 * 80 = R$ 80,00
    expect(screen.getByText(/R\$\s*80,00/)).toBeDefined();

    // PIX section exists with copy button and textarea
    expect(screen.getByText('PIX Copia e Cola')).toBeDefined();
    expect(screen.getByRole('button', { name: /copiar código pix/i })).toBeDefined();

    // Check textarea contains pixKey and currency
    const textarea = screen.getByLabelText('Código PIX Copia e Cola') as HTMLTextAreaElement;
    expect(textarea.value).toContain('pix@exemplo.com.br');
    expect(textarea.value).toContain('540580.00');
  });

  it('updates total amount and PIX payload dynamically when quantity changes', async () => {
    render(
      <PledgeDialog
        item={fixedPriceItem}
        {...campaignProps}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /doar/i }));

    const qtyInput = screen.getByLabelText(/Quantidade/i);
    fireEvent.change(qtyInput, { target: { value: '3' } });

    // 3 * 80 = R$ 240,00
    await waitFor(() => {
      expect(screen.getByText(/R\$\s*240,00/)).toBeDefined();
    });

    const textarea = screen.getByLabelText('Código PIX Copia e Cola') as HTMLTextAreaElement;
    expect(textarea.value).toContain('5406240.00');
  });

  it('displays custom amount input for items without defined amount and validates minimum R$ 1,00', async () => {
    render(
      <PledgeDialog
        item={openPriceItem}
        {...campaignProps}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /doar/i }));

    // Input for custom amount is displayed
    const amountInput = screen.getByLabelText(/Valor da Doação/i);
    expect(amountInput).toBeDefined();

    // Set invalid amount 0,50 (< 1.00)
    fireEvent.change(amountInput, { target: { value: '0,50' } });

    await waitFor(() => {
      expect(screen.getByText('Informe um valor válido a partir de R$ 1,00')).toBeDefined();
    });

    // When invalid, PIX code is not generated
    expect(screen.queryByLabelText('Código PIX Copia e Cola')).toBeNull();
    expect(screen.getByText('Defina o valor da doação para gerar o código PIX.')).toBeDefined();

    // Set valid amount 35,00
    fireEvent.change(amountInput, { target: { value: '35,00' } });

    await waitFor(() => {
      expect(screen.getByText(/R\$\s*35,00/)).toBeDefined();
    });

    const textarea = screen.getByLabelText('Código PIX Copia e Cola') as HTMLTextAreaElement;
    expect(textarea.value).toContain('540535.00');
  });

  it('handles copy-to-clipboard with user feedback', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(
      <PledgeDialog
        item={fixedPriceItem}
        {...campaignProps}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /doar/i }));

    const copyButton = screen.getByRole('button', { name: /copiar código pix/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Copiado!')).toBeDefined();
    });
  });

  it('submits pledge and displays post-confirmation screen with copyable PIX code', async () => {
    vi.mocked(actions.pledgeDonationAction).mockResolvedValueOnce({ success: true });

    render(
      <PledgeDialog
        item={fixedPriceItem}
        {...campaignProps}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /doar/i }));

    // Fill optional donor details
    fireEvent.change(screen.getByLabelText(/Seu Nome/i), { target: { value: 'Carlos Silva' } });
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '(11) 99999-9999' } });
    fireEvent.change(screen.getByLabelText(/Mensagem/i), { target: { value: 'Força na campanha!' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /confirmar doação/i }));

    await waitFor(() => {
      expect(actions.pledgeDonationAction).toHaveBeenCalledWith(
        'camp-123',
        expect.objectContaining({
          campaignItemId: 'item-1',
          quantity: 1,
          donorName: 'Carlos Silva',
          donorPhone: '(11) 99999-9999',
          message: 'Força na campanha!',
        })
      );
    });

    // Success screen shown with PIX code still copyable
    await waitFor(() => {
      expect(screen.getByText('Doação registrada com sucesso!')).toBeDefined();
      expect(screen.getByText('PIX Copia e Cola')).toBeDefined();
      expect(screen.getByRole('button', { name: /concluir/i })).toBeDefined();
    });

    // Conclude closes dialog and triggers router.refresh()
    fireEvent.click(screen.getByRole('button', { name: /concluir/i }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('closes dialog on Escape key', async () => {
    render(
      <PledgeDialog
        item={fixedPriceItem}
        {...campaignProps}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /doar/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
