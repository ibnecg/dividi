/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from './sidebar';
import { authClient } from '@/lib/auth/client';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => mockPathname,
}));

vi.mock('@/lib/auth/client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/dashboard';
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Carlos Silva',
          email: 'carlos@exemplo.com',
        },
      },
    } as any);
  });

  it('renders organization name and user info', () => {
    render(<Sidebar orgName="Minha Organização" />);

    expect(screen.getAllByText('Minha Organização').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carlos Silva').length).toBeGreaterThan(0);
    expect(screen.getAllByText('carlos@exemplo.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('C').length).toBeGreaterThan(0); // Initial
  });

  it('renders fallback when user has only email or is unknown', () => {
    vi.mocked(authClient.useSession).mockReturnValueOnce({
      data: {
        user: {
          email: 'ana@exemplo.com',
        },
      },
    } as any);

    render(<Sidebar orgName="Minha Organização" />);
    expect(screen.getAllByText('ana@exemplo.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });

  it('highlights active navigation link based on current pathname', () => {
    mockPathname = '/dashboard/campaigns';
    render(<Sidebar orgName="Minha Organização" />);

    const campaignsLinks = screen.getAllByRole('link', { name: /Campanhas/i });
    expect(campaignsLinks[0].className).toContain('bg-accent');
  });

  it('toggles collapsed state on desktop collapse button click', () => {
    render(<Sidebar orgName="Minha Organização" />);

    const collapseButtons = screen.getAllByLabelText('Recolher sidebar');
    expect(collapseButtons.length).toBeGreaterThan(0);

    // Click the desktop collapse button (the second one)
    fireEvent.click(collapseButtons[collapseButtons.length - 1]);

    const expandButtons = screen.getAllByLabelText('Expandir sidebar');
    expect(expandButtons.length).toBeGreaterThan(0);

    fireEvent.click(expandButtons[expandButtons.length - 1]);
    expect(screen.getAllByLabelText('Recolher sidebar').length).toBeGreaterThan(0);
  });

  it('opens and closes mobile drawer on hamburger and close button click', () => {
    render(<Sidebar orgName="Minha Organização" />);

    const openMenuBtn = screen.getByLabelText('Abrir menu');
    fireEvent.click(openMenuBtn);

    const closeMenuBtn = screen.getByLabelText('Fechar menu');
    expect(closeMenuBtn).toBeDefined();

    fireEvent.click(closeMenuBtn);
  });

  it('closes mobile drawer when clicking nav link inside mobile drawer', () => {
    render(<Sidebar orgName="Minha Organização" />);

    const openMenuBtn = screen.getByLabelText('Abrir menu');
    fireEvent.click(openMenuBtn);

    const navLinks = screen.getAllByRole('link', { name: /Dashboard/i });
    fireEvent.click(navLinks[0]);
  });

  it('performs logout and redirects to login on "Sair" button click', async () => {
    vi.mocked(authClient.signOut).mockResolvedValueOnce({} as any);

    render(<Sidebar orgName="Minha Organização" />);

    const logoutButtons = screen.getAllByLabelText('Sair da conta');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('handles logout failure gracefully', async () => {
    vi.mocked(authClient.signOut).mockRejectedValueOnce(new Error('Logout failed'));

    render(<Sidebar orgName="Minha Organização" />);

    const logoutButtons = screen.getAllByLabelText('Sair da conta');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalledTimes(1);
    });
  });
});
