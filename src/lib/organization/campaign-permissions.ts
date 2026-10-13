import { db } from '@/db';
import { campaigns, organizationMembers, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface UserOrganizationData {
  organizationId: string;
  orgName: string;
  role: string;
}

/**
 * Retorna os dados da organização ativa e o papel de um determinado usuário.
 */
export async function getUserOrganization(userId: string): Promise<UserOrganizationData | null> {
  if (!userId) return null;

  try {
    const member = await db
      .select({
        organizationId: organizationMembers.organizationId,
        orgName: organizations.name,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    return member[0] ?? null;
  } catch (error) {
    console.error('Erro ao buscar organização do usuário:', error);
    return null;
  }
}

/**
 * Valida se um usuário tem permissão para gerenciar (editar, alternar status) uma campanha.
 * Qualquer membro ativo da organização proprietária da campanha possui permissão integral.
 */
export async function canUserManageCampaign(userId: string, campaignId: string): Promise<boolean> {
  if (!userId || !campaignId) return false;

  try {
    const [campaign] = await db
      .select({
        id: campaigns.id,
        organizationId: campaigns.organizationId,
        userId: campaigns.userId,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) return false;

    const userOrg = await getUserOrganization(userId);
    if (!userOrg) {
      return campaign.userId === userId;
    }

    // Se a campanha possui organizationId gravado
    if (campaign.organizationId) {
      return campaign.organizationId === userOrg.organizationId;
    }

    // Fallback retroativo para campanhas legadas com organizationId nulo:
    if (campaign.userId === userId) return true;

    const [creatorOrg] = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, campaign.userId))
      .limit(1);

    return creatorOrg?.organizationId === userOrg.organizationId;
  } catch (error) {
    console.error('Erro ao verificar permissão de gerenciamento da campanha:', error);
    return false;
  }
}
