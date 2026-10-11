/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CampaignStatusToggle } from './campaign-status-toggle';
import { toggleCampaignStatusAction } from '@/app/dashboard/campaigns/actions';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('@/app/dashboard/campaigns/actions', () => ({
  toggleCampaignStatusAction: vi.fn(),
}));

describe('CampaignStatusToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Desativar button when campaign is active', () => {
    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={true}
        campaignName="Campanha de Inverno"
      />
    );

    expect(screen.getByRole('button', { name: /Desativar/i })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens confirmation modal when clicking Desativar and closes on Cancelar', () => {
    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={true}
        campaignName="Campanha de Inverno"
      />
    );

    const deactivateBtn = screen.getByRole('button', { name: /Desativar/i });
    fireEvent.click(deactivateBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByText(/Tem certeza que deseja desativar a campanha/i)).toBeDefined();
    expect(screen.getByText(/"Campanha de Inverno"/i)).toBeDefined();

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls toggleCampaignStatusAction on confirmation', async () => {
    vi.mocked(toggleCampaignStatusAction).mockResolvedValueOnce({
      success: true,
      isActive: false,
    } as any);

    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={true}
        campaignName="Campanha de Inverno"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Desativar/i }));
    const confirmBtn = screen.getByRole('button', { name: /Confirmar Desativação/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toggleCampaignStatusAction).toHaveBeenCalledWith('camp-1', false);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('renders Reativar button when campaign is inactive and re-activates on click', async () => {
    vi.mocked(toggleCampaignStatusAction).mockResolvedValueOnce({
      success: true,
      isActive: true,
    } as any);

    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={false}
        campaignName="Campanha Concluída"
      />
    );

    const reactivateBtn = screen.getByRole('button', { name: /Reativar/i });
    expect(reactivateBtn).toBeDefined();

    fireEvent.click(reactivateBtn);

    await waitFor(() => {
      expect(toggleCampaignStatusAction).toHaveBeenCalledWith('camp-1', true);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('closes dialog on Escape key press', () => {
    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={true}
        campaignName="Campanha de Inverno"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Desativar/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onStatusChange callback when provided upon successful status toggle', async () => {
    const onStatusChangeMock = vi.fn();
    vi.mocked(toggleCampaignStatusAction).mockResolvedValueOnce({
      success: true,
      isActive: false,
    } as any);

    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={true}
        campaignName="Campanha de Inverno"
        onStatusChange={onStatusChangeMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Desativar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Desativação/i }));

    await waitFor(() => {
      expect(onStatusChangeMock).toHaveBeenCalledWith(false);
    });
  });

  it('displays error message when toggleCampaignStatusAction returns error', async () => {
    vi.mocked(toggleCampaignStatusAction).mockResolvedValueOnce({
      error: 'Campanha não encontrada ou você não tem permissão.',
    } as any);

    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={true}
        campaignName="Campanha de Inverno"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Desativar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Desativação/i }));

    expect(
      await screen.findByText('Campanha não encontrada ou você não tem permissão.')
    ).toBeDefined();
  });

  it('displays default error message when action throws an exception', async () => {
    vi.mocked(toggleCampaignStatusAction).mockRejectedValueOnce(new Error('Network error'));

    render(
      <CampaignStatusToggle
        campaignId="camp-1"
        isActive={true}
        campaignName="Campanha de Inverno"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Desativar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Desativação/i }));

    expect(
      await screen.findByText('Erro ao alterar status da campanha.')
    ).toBeDefined();
  });
});

