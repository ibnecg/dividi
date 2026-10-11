import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from './page';

describe('DashboardPage', () => {
  it('renders dashboard welcome text', () => {
    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: 'Bem-vindo ao Dashboard' })).toBeDefined();
    expect(
      screen.getByText('Sua conta e organização foram criadas com sucesso.')
    ).toBeDefined();
  });
});
