import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from './page';

vi.mock('./login-form', () => ({
  default: () => <div data-testid="mock-login-form">Mock Login Form</div>,
}));

describe('LoginPage', () => {
  it('renders login page with heading and LoginForm', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeDefined();
    expect(screen.getByText('Acesse sua conta na plataforma Dividi.')).toBeDefined();
    expect(screen.getByTestId('mock-login-form')).toBeDefined();
  });
});
