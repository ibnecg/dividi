/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './login-form';
import { authClient } from '@/lib/auth/client';

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
    signIn: {
      email: vi.fn(),
    },
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders inputs and submit button', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/E-mail/i)).toBeDefined();
    expect(screen.getByLabelText(/Senha/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeDefined();
  });

  it('shows validation error when fields are empty', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('Por favor, preencha todos os campos.')).toBeDefined();
    expect(authClient.signIn.email).not.toHaveBeenCalled();
  });

  it('shows error when authClient returns an error', async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'E-mail ou senha incorretos.' },
      data: null,
    } as any);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeDefined();
  });

  it('shows default error when authClient returns error without message', async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: {} as any,
      data: null,
    } as any);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeDefined();
  });

  it('shows error when auth succeeds but returns neither token nor user', async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: null,
      data: {} as any,
    } as any);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('Erro inesperado: Autenticação falhou.')).toBeDefined();
  });

  it('handles unexpected exceptions during sign in', async () => {
    vi.mocked(authClient.signIn.email).mockRejectedValueOnce(new Error('Network error'));

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('Ocorreu um erro inesperado.')).toBeDefined();
  });

  it('redirects to dashboard and refreshes on successful sign in', async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: null,
      data: { user: { id: 'u1' } },
    } as any);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'correctpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
