import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';

// O mock de next-themes já foi configurado em vitest.setup.ts, 
// mas podemos sobrescrever implementações específicas por teste.
vi.mock('next-themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-themes')>();
  return {
    ...actual,
    useTheme: vi.fn(),
  };
});

describe('ThemeToggle', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - partial mock
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
  });

  it('renders dropdown variant by default', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /Alternar tema/i });
    expect(button).toBeDefined();
  });

  it('renders cycle variant', () => {
    render(<ThemeToggle variant="cycle" />);
    const button = screen.getByRole('button', { name: /Alternar tema/i });
    
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('renders segmented variant', () => {
    render(<ThemeToggle variant="segmented" />);
    
    // Segmented renderiza as três opções
    const lightOption = screen.getByTitle('Claro');
    const darkOption = screen.getByTitle('Escuro');
    const systemOption = screen.getByTitle('Sistema');
    
    expect(lightOption).toBeDefined();
    expect(darkOption).toBeDefined();
    expect(systemOption).toBeDefined();
    
    fireEvent.click(darkOption);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles themes correctly in cycle variant', () => {
    const { rerender } = render(<ThemeToggle variant="cycle" />);
    
    let button = screen.getByRole('button', { name: /Alternar tema/i });
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    // Simula estado 'dark'
    // @ts-expect-error - partial mock
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });
    rerender(<ThemeToggle variant="cycle" />);
    
    button = screen.getByRole('button', { name: /Alternar tema/i });
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
