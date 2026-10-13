/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserOrganization, canUserManageCampaign } from './campaign-permissions';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Campaign Permissions & Organization Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserOrganization', () => {
    it('returns null if userId is not provided', async () => {
      const result = await getUserOrganization('');
      expect(result).toBeNull();
    });

    it('returns organization data when user is a member', async () => {
      const mockLimit = vi.fn().mockResolvedValueOnce([
        {
          organizationId: 'org-1',
          orgName: 'Minha ONG',
          role: 'member',
        },
      ]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await getUserOrganization('user-1');
      expect(result).toEqual({
        organizationId: 'org-1',
        orgName: 'Minha ONG',
        role: 'member',
      });
    });

    it('returns null if user is not found in organization_members', async () => {
      const mockLimit = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await getUserOrganization('user-alone');
      expect(result).toBeNull();
    });

    it('returns null and logs error if database query fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(db.select).mockImplementationOnce(() => {
        throw new Error('DB connection error');
      });

      const result = await getUserOrganization('user-err');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('canUserManageCampaign', () => {
    it('returns false if userId or campaignId is missing', async () => {
      expect(await canUserManageCampaign('', 'camp-1')).toBe(false);
      expect(await canUserManageCampaign('user-1', '')).toBe(false);
    });

    it('returns false if campaign is not found', async () => {
      const mockLimit = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await canUserManageCampaign('user-1', 'camp-missing');
      expect(result).toBe(false);
    });

    it('returns true if campaign belongs to the same organization as user', async () => {
      // 1. Fetch campaign
      const mockCampaignLimit = vi.fn().mockResolvedValueOnce([
        { id: 'camp-1', organizationId: 'org-1', userId: 'user-creator' },
      ]);
      const mockCampaignWhere = vi.fn().mockReturnValue({ limit: mockCampaignLimit });

      // 2. Fetch user's organization
      const mockOrgLimit = vi.fn().mockResolvedValueOnce([
        { organizationId: 'org-1', orgName: 'Minha ONG', role: 'member' },
      ]);
      const mockOrgWhere = vi.fn().mockReturnValue({ limit: mockOrgLimit });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockOrgWhere });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ where: mockCampaignWhere })
        .mockReturnValueOnce({ innerJoin: mockInnerJoin });

      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      // User 'user-collaborator' (not creator, but member in org-1) checks access to camp-1
      const result = await canUserManageCampaign('user-collaborator', 'camp-1');
      expect(result).toBe(true);
    });

    it('returns false if campaign belongs to a different organization', async () => {
      // 1. Fetch campaign
      const mockCampaignLimit = vi.fn().mockResolvedValueOnce([
        { id: 'camp-1', organizationId: 'org-1', userId: 'user-creator' },
      ]);
      const mockCampaignWhere = vi.fn().mockReturnValue({ limit: mockCampaignLimit });

      // 2. Fetch user's organization
      const mockOrgLimit = vi.fn().mockResolvedValueOnce([
        { organizationId: 'org-2', orgName: 'Outra ONG', role: 'member' },
      ]);
      const mockOrgWhere = vi.fn().mockReturnValue({ limit: mockOrgLimit });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockOrgWhere });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ where: mockCampaignWhere })
        .mockReturnValueOnce({ innerJoin: mockInnerJoin });

      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await canUserManageCampaign('user-outsider', 'camp-1');
      expect(result).toBe(false);
    });

    it('returns true for legacy campaign with null organizationId if user is in same org as creator', async () => {
      // 1. Fetch legacy campaign (organizationId is null)
      const mockCampaignLimit = vi.fn().mockResolvedValueOnce([
        { id: 'camp-legacy', organizationId: null, userId: 'user-creator' },
      ]);
      const mockCampaignWhere = vi.fn().mockReturnValue({ limit: mockCampaignLimit });

      // 2. Fetch caller user's organization
      const mockUserOrgLimit = vi.fn().mockResolvedValueOnce([
        { organizationId: 'org-shared', orgName: 'ONG Compartilhada', role: 'member' },
      ]);
      const mockUserOrgWhere = vi.fn().mockReturnValue({ limit: mockUserOrgLimit });
      const mockUserOrgInnerJoin = vi.fn().mockReturnValue({ where: mockUserOrgWhere });

      // 3. Fetch creator's organization
      const mockCreatorOrgLimit = vi.fn().mockResolvedValueOnce([
        { organizationId: 'org-shared' },
      ]);
      const mockCreatorOrgWhere = vi.fn().mockReturnValue({ limit: mockCreatorOrgLimit });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ where: mockCampaignWhere })
        .mockReturnValueOnce({ innerJoin: mockUserOrgInnerJoin })
        .mockReturnValueOnce({ where: mockCreatorOrgWhere });

      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await canUserManageCampaign('user-member', 'camp-legacy');
      expect(result).toBe(true);
    });

    it('returns false for legacy campaign with null organizationId if creator is from different org', async () => {
      // 1. Fetch legacy campaign (organizationId is null)
      const mockCampaignLimit = vi.fn().mockResolvedValueOnce([
        { id: 'camp-legacy', organizationId: null, userId: 'user-creator' },
      ]);
      const mockCampaignWhere = vi.fn().mockReturnValue({ limit: mockCampaignLimit });

      // 2. Fetch caller user's organization
      const mockUserOrgLimit = vi.fn().mockResolvedValueOnce([
        { organizationId: 'org-alpha', orgName: 'ONG Alpha', role: 'member' },
      ]);
      const mockUserOrgWhere = vi.fn().mockReturnValue({ limit: mockUserOrgLimit });
      const mockUserOrgInnerJoin = vi.fn().mockReturnValue({ where: mockUserOrgWhere });

      // 3. Fetch creator's organization
      const mockCreatorOrgLimit = vi.fn().mockResolvedValueOnce([
        { organizationId: 'org-beta' },
      ]);
      const mockCreatorOrgWhere = vi.fn().mockReturnValue({ limit: mockCreatorOrgLimit });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ where: mockCampaignWhere })
        .mockReturnValueOnce({ innerJoin: mockUserOrgInnerJoin })
        .mockReturnValueOnce({ where: mockCreatorOrgWhere });

      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await canUserManageCampaign('user-alpha', 'camp-legacy');
      expect(result).toBe(false);
    });
  });
});
