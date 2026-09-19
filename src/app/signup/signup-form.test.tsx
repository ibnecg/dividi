/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpForm from './signup-form';
import { authClient } from '@/lib/auth/client';
import { createLocalUserAndOrganization } from './actions';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock('@/lib/auth/client', () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}));

vi.mock('./actions', () => ({
  createLocalUserAndOrganization: vi.fn(),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all inputs and submit button', () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText(/Seu Nome Completo/i)).toBeDefined();
    expect(screen.getByLabelText(/E-mail/i)).toBeDefined();
    expect(screen.getByLabelText(/Senha/i)).toBeDefined();
    expect(screen.getByLabelText(/Nome da Organização/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Criar Conta e Organização/i })).toBeDefined();
  });

  it('validates empty required fields', async () => {
    render(<SignUpForm />);

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    expect(await screen.findByText('Todos os campos são obrigatórios.')).toBeDefined();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it('validates password length under 8 characters', async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Seu Nome Completo/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/Nome da Organização/i), { target: { value: 'Minha ONG' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    expect(await screen.findByText('A senha deve ter pelo menos 8 caracteres.')).toBeDefined();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it('displays error if authClient fails to create account', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      error: { message: 'E-mail já está em uso.' },
      data: null,
    } as any);

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Seu Nome Completo/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha12345' } });
    fireEvent.change(screen.getByLabelText(/Nome da Organização/i), { target: { value: 'Minha ONG' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    expect(await screen.findByText('E-mail já está em uso.')).toBeDefined();
  });

  it('displays default auth error when message is missing', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      error: {} as any,
      data: null,
    } as any);

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Seu Nome Completo/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha12345' } });
    fireEvent.change(screen.getByLabelText(/Nome da Organização/i), { target: { value: 'Minha ONG' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    expect(await screen.findByText('Erro ao criar conta no sistema de autenticação.')).toBeDefined();
  });

  it('displays error if auth succeeds but returns no user', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      error: null,
      data: {} as any,
    } as any);

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Seu Nome Completo/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha12345' } });
    fireEvent.change(screen.getByLabelText(/Nome da Organização/i), { target: { value: 'Minha ONG' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    expect(await screen.findByText('Erro inesperado: Usuário não retornado após cadastro.')).toBeDefined();
  });

  it('displays error if createLocalUserAndOrganization fails', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      error: null,
      data: { user: { id: 'u123' } },
    } as any);

    vi.mocked(createLocalUserAndOrganization).mockResolvedValueOnce({
      error: 'Erro na transação local.',
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Seu Nome Completo/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha12345' } });
    fireEvent.change(screen.getByLabelText(/Nome da Organização/i), { target: { value: 'Minha ONG' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    expect(await screen.findByText('Erro na transação local.')).toBeDefined();
  });

  it('handles unexpected exceptions', async () => {
    vi.mocked(authClient.signUp.email).mockRejectedValueOnce(new Error('Fatal error'));

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Seu Nome Completo/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha12345' } });
    fireEvent.change(screen.getByLabelText(/Nome da Organização/i), { target: { value: 'Minha ONG' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    expect(await screen.findByText('Ocorreu um erro inesperado.')).toBeDefined();
  });

  it('redirects to dashboard on full success', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      error: null,
      data: { user: { id: 'u123' } },
    } as any);

    vi.mocked(createLocalUserAndOrganization).mockResolvedValueOnce({
      success: true,
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Seu Nome Completo/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha12345' } });
    fireEvent.change(screen.getByLabelText(/Nome da Organização/i), { target: { value: 'Minha ONG' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Organização/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
