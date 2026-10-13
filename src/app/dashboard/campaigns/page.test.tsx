/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CampaignsPage from './page';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { getUserOrganization } from '@/lib/organization/campaign-permissions';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@/lib/organization/campaign-permissions', () => ({
  getUserOrganization: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
  },
}));

vi.mock('@/components/campaign-status-toggle', () => ({
  CampaignStatusToggle: ({ campaignName, isActive }: any) => (
    <button data-testid="status-toggle">
      {isActive ? 'Desativar' : 'Ativar'} {campaignName}
    </button>
  ),
}));

describe('Dashboard CampaignsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserOrganization).mockResolvedValue({
      organizationId: 'org-1',
      orgName: 'Minha Organização',
      role: 'member',
    });
  });

  it('returns null if user session is not found', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as any);

    const jsx = await CampaignsPage();
    expect(jsx).toBeNull();
  });

  it('renders empty state when user organization has no campaigns', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    vi.mocked((db as any).where).mockResolvedValueOnce([] as any); // members query
    vi.mocked((db as any).orderBy).mockResolvedValueOnce([] as any); // campaigns query

    const jsx = await CampaignsPage();
    render(jsx!);

    expect(screen.getByText('Nenhuma campanha encontrada')).toBeDefined();
    expect(
      screen.getByText('Sua organização ainda não criou nenhuma campanha de arrecadação.')
    ).toBeDefined();
    expect(screen.getByRole('link', { name: /Criar a primeira campanha/i })).toBeDefined();
  });

  it('renders list of campaigns with status badge and edit link', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    const mockCampaigns = [
      {
        id: 'camp-1',
        name: 'Campanha de Livros',
        description: 'Doação de livros infantis',
        imageUrl: 'https://blob.url/livros.jpg',
        isActive: true,
        createdAt: new Date('2026-01-15T10:00:00Z'),
      },
      {
        id: 'camp-2',
        name: 'Campanha Antiga',
        description: 'Campanha que já foi encerrada',
        imageUrl: null,
        isActive: false,
        createdAt: new Date('2025-12-01T10:00:00Z'),
      },
    ];

    vi.mocked((db as any).where).mockResolvedValueOnce([{ userId: 'user-1' }] as any);
    vi.mocked((db as any).orderBy).mockResolvedValueOnce(mockCampaigns as any);

    const jsx = await CampaignsPage();
    render(jsx!);

    expect(screen.getByText('Campanha de Livros')).toBeDefined();
    expect(screen.getByText('Doação de livros infantis')).toBeDefined();
    expect(screen.getByText('Ativa')).toBeDefined();
    expect(screen.getByAltText('Campanha de Livros')).toBeDefined();

    expect(screen.getByText('Campanha Antiga')).toBeDefined();
    expect(screen.getByText('Inativa')).toBeDefined();

    const editLinks = screen.getAllByRole('link', { name: /Editar/i });
    expect(editLinks.length).toBe(2);
    expect(editLinks[0].getAttribute('href')).toBe('/dashboard/campaigns/camp-1/edit');
    expect(editLinks[1].getAttribute('href')).toBe('/dashboard/campaigns/camp-2/edit');
  });
});
