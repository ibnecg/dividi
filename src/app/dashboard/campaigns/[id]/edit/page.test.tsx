/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EditCampaignPage from './page';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { canUserManageCampaign } from '@/lib/organization/campaign-permissions';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@/lib/organization/campaign-permissions', () => ({
  canUserManageCampaign: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/components/campaign-form', () => ({
  CampaignForm: ({ campaignId, initialData }: any) => (
    <div data-testid="mock-campaign-form">
      <span>Campaign ID: {campaignId}</span>
      <span>Name: {initialData?.name}</span>
      <span>Item count: {initialData?.items?.length}</span>
    </div>
  ),
}));

vi.mock('@/components/campaign-status-toggle', () => ({
  CampaignStatusToggle: ({ campaignId, isActive }: any) => (
    <button data-testid="status-toggle">
      Toggle {campaignId} ({isActive ? 'Ativa' : 'Inativa'})
    </button>
  ),
}));

describe('EditCampaignPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked((db as any).where).mockReset().mockReturnThis();
    vi.mocked((db as any).limit).mockReset().mockReturnThis();
    vi.mocked(canUserManageCampaign).mockResolvedValue(true);
  });

  it('redirects to /login when user is not authenticated', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as any);

    await expect(
      EditCampaignPage({ params: Promise.resolve({ id: 'camp-123' }) })
    ).rejects.toThrow('NEXT_REDIRECT');
  });

  it('redirects to /dashboard/campaigns when campaign does not exist', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    vi.mocked((db as any).where).mockReturnValueOnce({
      limit: vi.fn().mockResolvedValueOnce([]),
    } as any);

    await expect(
      EditCampaignPage({ params: Promise.resolve({ id: 'non-existent' }) })
    ).rejects.toThrow('NEXT_REDIRECT');
  });

  it('redirects to /dashboard/campaigns when user does not have permission to manage campaign', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    vi.mocked((db as any).where).mockReturnValueOnce({
      limit: vi.fn().mockResolvedValueOnce([
        { id: 'camp-123', userId: 'different-owner-id', name: 'Outra Campanha' },
      ]),
    } as any);

    vi.mocked(canUserManageCampaign).mockResolvedValueOnce(false);

    await expect(
      EditCampaignPage({ params: Promise.resolve({ id: 'camp-123' }) })
    ).rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders edit page when user is another member in the same organization', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'member-user-2' } },
    } as any);

    const mockCampaign = {
      id: 'camp-123',
      organizationId: 'org-1',
      userId: 'creator-user-1',
      name: 'Campanha Compartilhada',
      description: 'Arrecadação da organização',
      pixKey: 'pix@chave.com',
      imageUrl: '',
      isActive: true,
    };

    vi.mocked((db as any).where)
      .mockReturnValueOnce({ limit: vi.fn().mockResolvedValueOnce([mockCampaign]) } as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(canUserManageCampaign).mockResolvedValueOnce(true);

    const jsx = await EditCampaignPage({ params: Promise.resolve({ id: 'camp-123' }) });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Editar Campanha' })).toBeDefined();
    expect(screen.getByText('Name: Campanha Compartilhada')).toBeDefined();
  });

  it('renders edit page and form with campaign and items data', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    const mockCampaign = {
      id: 'camp-123',
      userId: 'user-1',
      name: 'Campanha de Roupas',
      description: 'Arrecadação de agasalhos',
      pixKey: 'pix@chave.com',
      imageUrl: 'https://blob.url/capa.jpg',
      isActive: true,
    };

    const mockItems = [
      {
        id: 'item-1',
        campaignId: 'camp-123',
        description: 'Casaco',
        amount: '60.00',
        quantity: 5,
        imageUrl: 'https://blob.url/casaco.jpg',
      },
    ];

    vi.mocked((db as any).where)
      .mockReturnValueOnce({ limit: vi.fn().mockResolvedValueOnce([mockCampaign]) } as any)
      .mockResolvedValueOnce(mockItems as any);

    const jsx = await EditCampaignPage({ params: Promise.resolve({ id: 'camp-123' }) });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Editar Campanha' })).toBeDefined();
    expect(screen.getByText('Voltar para Campanhas')).toBeDefined();
    expect(screen.getByText('Ativa')).toBeDefined();
    expect(screen.getByTestId('mock-campaign-form')).toBeDefined();
    expect(screen.getByText('Campaign ID: camp-123')).toBeDefined();
    expect(screen.getByText('Name: Campanha de Roupas')).toBeDefined();
    expect(screen.getByText('Item count: 1')).toBeDefined();
    expect(screen.getByTestId('status-toggle')).toBeDefined();
  });
});
