import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page (Landing)', () => {
  it('renders landing page hero, sections and action links', () => {
    render(<Home />);

    // Brand and hero
    expect(screen.getAllByText('Dividi').length).toBeGreaterThan(0);
    expect(screen.getByText(/Conectamos quem precisa de ajuda com quem quer ajudar/i)).toBeDefined();

    // Call to action buttons
    expect(screen.getByRole('link', { name: /Criar Campanha/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Quero Doar/i })).toBeDefined();

    // Mission and purpose
    expect(screen.getByText('Nosso Propósito')).toBeDefined();
    expect(screen.getByText('Transparência')).toBeDefined();
    expect(screen.getByText('Necessidade Real')).toBeDefined();
    expect(screen.getByText('Menos Desperdício')).toBeDefined();

    // How it works
    expect(screen.getByText('Como Funciona')).toBeDefined();
    expect(screen.getByText('Para quem precisa (Organizador)')).toBeDefined();
    expect(screen.getByText('Para quem quer doar (Doador)')).toBeDefined();

    // FAQ section
    expect(screen.getByText('Perguntas Frequentes')).toBeDefined();
    expect(screen.getByText('O uso da plataforma é gratuito?')).toBeDefined();
  });
});
