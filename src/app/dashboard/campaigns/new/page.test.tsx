/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewCampaignPage from './page';
import { auth } from '@/lib/auth/server';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@/components/campaign-form', () => ({
  CampaignForm: () => <div data-testid="mock-campaign-form">Mock Campaign Form</div>,
}));

describe('NewCampaignPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when unauthenticated', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({ data: null } as any);

    await expect(NewCampaignPage()).rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders page and CampaignForm when authenticated', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
    } as any);

    const jsx = await NewCampaignPage();
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Criar Nova Campanha' })).toBeDefined();
    expect(
      screen.getByText('Preencha os detalhes abaixo para iniciar sua campanha de arrecadação.')
    ).toBeDefined();
    expect(screen.getByTestId('mock-campaign-form')).toBeDefined();
  });
});
