import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignUpPage from './page';

vi.mock('./signup-form', () => ({
  default: () => <div data-testid="mock-signup-form">Mock SignUp Form</div>,
}));

describe('SignUpPage', () => {
  it('renders signup page with heading and SignUpForm', () => {
    render(<SignUpPage />);

    expect(screen.getByRole('heading', { name: 'Criar Conta' })).toBeDefined();
    expect(
      screen.getByText('Cadastre-se e crie sua organização na plataforma Dividi.')
    ).toBeDefined();
    expect(screen.getByTestId('mock-signup-form')).toBeDefined();
  });
});
