import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardLayout from './layout';
import { getUserOrganizationName } from './actions';

vi.mock('./actions', () => ({
  getUserOrganizationName: vi.fn(),
}));

vi.mock('@/components/dashboard/sidebar', () => ({
  default: ({ orgName }: { orgName: string }) => (
    <div data-testid="mock-sidebar">Sidebar: {orgName}</div>
  ),
}));

describe('DashboardLayout', () => {
  it('renders layout with fetched org name and children', async () => {
    vi.mocked(getUserOrganizationName).mockResolvedValueOnce('Instituto Solidário');

    const jsx = await DashboardLayout({
      children: <div data-testid="child-content">Conteúdo do Dashboard</div>,
    });
    render(jsx);

    expect(screen.getByTestId('mock-sidebar')).toBeDefined();
    expect(screen.getByText('Sidebar: Instituto Solidário')).toBeDefined();
    expect(screen.getByTestId('child-content')).toBeDefined();
  });
});
