/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CampaignForm } from './campaign-form';
import { createCampaignAction, updateCampaignAction } from '@/app/dashboard/campaigns/actions';
import { upload } from '@vercel/blob/client';

vi.mock('@/app/dashboard/campaigns/actions', () => ({
  createCampaignAction: vi.fn(),
  updateCampaignAction: vi.fn(),
}));

vi.mock('@vercel/blob/client', () => ({
  upload: vi.fn(),
}));

describe('CampaignForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders blank form in creation mode', () => {
    render(<CampaignForm />);

    expect(screen.getByText('Detalhes da Campanha')).toBeDefined();
    expect(screen.getByLabelText(/Nome da Campanha/i)).toBeDefined();
    expect(screen.getByLabelText(/Descrição/i)).toBeDefined();
    expect(screen.getByLabelText(/Chave PIX/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Salvar Campanha/i })).toBeDefined();
  });

  it('renders populated form in edit mode', () => {
    const initialData = {
      name: 'Campanha Agasalho',
      description: 'Campanha de arrecadação de agasalhos',
      pixKey: 'contato@ong.org',
      imageUrl: 'https://blob.url/capa.jpg',
      items: [
        {
          id: 'item-1',
          description: 'Cobertor Térmico',
          amount: 45.5,
          quantity: 10,
          imageUrl: 'https://blob.url/item.jpg',
        },
      ],
    };

    render(<CampaignForm campaignId="camp-123" initialData={initialData} />);

    expect(screen.getByText('Editar Detalhes da Campanha')).toBeDefined();
    expect((screen.getByLabelText(/Nome da Campanha/i) as HTMLInputElement).value).toBe('Campanha Agasalho');
    expect((screen.getByLabelText(/Descrição/i) as HTMLTextAreaElement).value).toBe('Campanha de arrecadação de agasalhos');
    expect((screen.getByLabelText(/Chave PIX/i) as HTMLInputElement).value).toBe('contato@ong.org');
    expect(screen.getByDisplayValue('Cobertor Térmico')).toBeDefined();
    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeDefined();
  });

  it('adds and removes campaign items dynamically', async () => {
    render(<CampaignForm />);

    const addItemButton = screen.getByRole('button', { name: /Adicionar Item/i });
    fireEvent.click(addItemButton);

    expect(screen.getByPlaceholderText(/Ex: Saco de Ração 15kg/i)).toBeDefined();

    // Click trash button to remove item
    const trashButtons = screen.getAllByRole('button');
    const deleteButton = trashButtons.find((btn) => btn.querySelector('svg.lucide-trash-2'));
    expect(deleteButton).toBeDefined();
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Ex: Saco de Ração 15kg/i)).toBeNull();
    });
  });

  it('uploads campaign cover image successfully', async () => {
    vi.mocked(upload).mockResolvedValueOnce({
      url: 'https://blob.url/nova-capa.jpg',
    } as any);

    const { container } = render(<CampaignForm />);

    const fileInput = container.querySelector('#campaignImage') as HTMLInputElement;
    const testFile = new File(['dummy-content'], 'imagem.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith('imagem.png', testFile, {
        access: 'private',
        handleUploadUrl: '/api/upload',
      });
      expect(screen.getByAltText('Capa da campanha')).toBeDefined();
    });
  });

  it('uploads item image successfully', async () => {
    vi.mocked(upload).mockResolvedValueOnce({
      url: 'https://blob.url/item-foto.jpg',
    } as any);

    const { container } = render(<CampaignForm />);

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));

    const fileInputs = container.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBe(3);
    const itemFileInput = fileInputs[fileInputs.length - 1] as HTMLInputElement;

    const testFile = new File(['dummy-content'], 'item.png', { type: 'image/png' });

    fireEvent.change(itemFileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith('item.png', testFile, {
        access: 'private',
        handleUploadUrl: '/api/upload',
      });
      expect(screen.getByAltText('Imagem do item')).toBeDefined();
    });
  });

  it('handles image upload failure with size error message', async () => {
    vi.mocked(upload).mockRejectedValueOnce(new Error('File too big'));

    const { container } = render(<CampaignForm />);

    const fileInput = container.querySelector('#campaignImage') as HTMLInputElement;
    const testFile = new File(['large-content'], 'large.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(
      await screen.findByText('Erro ao enviar a imagem. Verifique o tamanho (máx 50kb).')
    ).toBeDefined();
  });

  it('does nothing when file input change has empty files list', async () => {
    const { container } = render(<CampaignForm />);

    const fileInput = container.querySelector('#campaignImage') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(upload).not.toHaveBeenCalled();
  });

  it('submits form in create mode via createCampaignAction', async () => {
    vi.mocked(createCampaignAction).mockResolvedValueOnce({ success: true } as any);

    render(<CampaignForm />);

    fireEvent.change(screen.getByLabelText(/Nome da Campanha/i), {
      target: { value: 'Nova Campanha Solidária' },
    });
    fireEvent.change(screen.getByLabelText(/Descrição/i), {
      target: { value: 'Descrição detalhada com pelo menos dez caracteres' },
    });
    fireEvent.change(screen.getByLabelText(/Chave PIX/i), {
      target: { value: 'ong@pix.com.br' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Campanha/i }));

    await waitFor(() => {
      expect(createCampaignAction).toHaveBeenCalledTimes(1);
      expect(createCampaignAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nova Campanha Solidária',
          description: 'Descrição detalhada com pelo menos dez caracteres',
          pixKey: 'ong@pix.com.br',
        })
      );
    });
  });

  it('submits form in edit mode via updateCampaignAction', async () => {
    vi.mocked(updateCampaignAction).mockResolvedValueOnce({ success: true } as any);

    const initialData = {
      name: 'Campanha Existente',
      description: 'Descrição inicial com pelo menos dez caracteres',
      pixKey: 'pix@chave.com',
      imageUrl: '',
      items: [],
    };

    render(<CampaignForm campaignId="camp-456" initialData={initialData} />);

    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(updateCampaignAction).toHaveBeenCalledWith(
        'camp-456',
        expect.objectContaining({
          name: 'Campanha Existente',
        })
      );
    });
  });

  it('displays action error banner when create or update fails', async () => {
    vi.mocked(createCampaignAction).mockResolvedValueOnce({
      error: 'Não foi possível salvar a campanha no momento.',
    });

    render(<CampaignForm />);

    fireEvent.change(screen.getByLabelText(/Nome da Campanha/i), {
      target: { value: 'Campanha Falha' },
    });
    fireEvent.change(screen.getByLabelText(/Descrição/i), {
      target: { value: 'Descrição detalhada com pelo menos dez caracteres' },
    });
    fireEvent.change(screen.getByLabelText(/Chave PIX/i), {
      target: { value: 'ong@pix.com.br' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Campanha/i }));

    expect(
      await screen.findByText('Não foi possível salvar a campanha no momento.')
    ).toBeDefined();
  });

  it('renders CSV template download and import buttons', () => {
    render(<CampaignForm />);
    expect(screen.getByRole('button', { name: /Template CSV/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Importar CSV/i })).toBeDefined();
  });

  it('downloads CSV template when button is clicked', () => {
    const createObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    
    render(<CampaignForm />);
    const downloadBtn = screen.getByRole('button', { name: /Template CSV/i });
    fireEvent.click(downloadBtn);
    
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('shows error when uploading non-csv file', async () => {
    const { container } = render(<CampaignForm />);
    const fileInputs = container.querySelectorAll('input[type="file"]');
    const csvInput = fileInputs[1] as HTMLInputElement;
    
    const testFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(csvInput, { target: { files: [testFile] } });
    
    expect(
      await screen.findByText('Por favor, selecione um arquivo .csv válido.')
    ).toBeDefined();
  });

  it('shows error when csv is missing Descrição column', async () => {
    const { container } = render(<CampaignForm />);
    const fileInputs = container.querySelectorAll('input[type="file"]');
    const csvInput = fileInputs[1] as HTMLInputElement;
    
    const testFile = new File(['Nome,Valor\nTeste,10'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(csvInput, { target: { files: [testFile] } });
    
    expect(
      await screen.findByText('O CSV deve conter pelo menos a coluna "Descrição".')
    ).toBeDefined();
  });

  it('successfully parses csv and appends items', async () => {
    const { container } = render(<CampaignForm />);
    const fileInputs = container.querySelectorAll('input[type="file"]');
    const csvInput = fileInputs[1] as HTMLInputElement;
    
    const csvContent = 'Descrição,Valor,Quantidade\nItem 1,10.50,2\nItem 2,,1\n';
    const testFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
    fireEvent.change(csvInput, { target: { files: [testFile] } });
    
    expect(
      await screen.findByText('2 itens importados com sucesso!')
    ).toBeDefined();
    
    // Verify inputs were populated
    expect(await screen.findByDisplayValue('Item 1')).toBeDefined();
    expect(await screen.findByDisplayValue('10.5')).toBeDefined();
    expect(await screen.findByDisplayValue('Item 2')).toBeDefined();
  });
});
