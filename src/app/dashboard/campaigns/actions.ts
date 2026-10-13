'use server';

import { db } from '@/db';
import { campaigns, campaignItems } from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { campaignSchema, type CampaignFormValues } from '@/lib/validations/campaign';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { getUserOrganization, canUserManageCampaign } from '@/lib/organization/campaign-permissions';

export async function createCampaignAction(data: CampaignFormValues) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  const parsed = campaignSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Dados inválidos' };
  }

  const userOrg = await getUserOrganization(session.user.id);
  if (!userOrg) {
    return { error: 'Organização não encontrada para este usuário' };
  }

  const { name, description, pixKey, imageUrl, requiresDonationApproval, items, allowPix, allowInPerson, inPersonAddress, inPersonDays, inPersonHours, inPersonInstructions } = parsed.data;

  try {
    const campaignId = crypto.randomUUID();

    if (items && items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        campaignId,
        description: item.description,
        amount: item.amount ? item.amount.toString() : null,
        quantity: item.quantity,
        imageUrl: item.imageUrl || null,
      }));
      
      await db.batch([
        db.insert(campaigns).values({
          id: campaignId,
          organizationId: userOrg.organizationId,
          userId: session.user.id,
          name,
          description,
          allowPix,
          allowInPerson,
          pixKey: pixKey || null,
          inPersonAddress: inPersonAddress || null,
          inPersonDays: inPersonDays || null,
          inPersonHours: inPersonHours || null,
          inPersonInstructions: inPersonInstructions || null,
          imageUrl: imageUrl || null,
          requiresApproval: requiresDonationApproval,
        }),
        db.insert(campaignItems).values(itemsToInsert),
      ]);
    } else {
      await db.insert(campaigns).values({
        id: campaignId,
        organizationId: userOrg.organizationId,
        userId: session.user.id,
        name,
        description,
        allowPix,
        allowInPerson,
        pixKey: pixKey || null,
        inPersonAddress: inPersonAddress || null,
        inPersonDays: inPersonDays || null,
        inPersonHours: inPersonHours || null,
        inPersonInstructions: inPersonInstructions || null,
        imageUrl: imageUrl || null,
        requiresApproval: requiresDonationApproval,
      });
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
    return { error: 'Falha ao salvar a campanha' };
  }

  revalidatePath('/dashboard/campaigns');
  revalidatePath('/campaigns');
  redirect('/dashboard/campaigns');
}

export async function updateCampaignAction(campaignId: string, data: CampaignFormValues) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  if (!campaignId) {
    return { error: 'ID da campanha não informado' };
  }

  const [existingCampaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!existingCampaign) {
    return { error: 'Campanha não encontrada' };
  }

  const canManage = await canUserManageCampaign(session.user.id, campaignId);
  if (!canManage) {
    return { error: 'Você não tem permissão para editar esta campanha' };
  }

  const parsed = campaignSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Dados inválidos' };
  }

  const { name, description, pixKey, imageUrl, requiresDonationApproval, items, allowPix, allowInPerson, inPersonAddress, inPersonDays, inPersonHours, inPersonInstructions } = parsed.data;

  try {
    const currentItems = await db
      .select()
      .from(campaignItems)
      .where(eq(campaignItems.campaignId, campaignId));

    const submittedItemIds = new Set(
      (items || []).map((i) => i.id).filter((id): id is string => Boolean(id))
    );

    // Items to delete
    const itemsToDelete = currentItems.filter((item) => !submittedItemIds.has(item.id));

    // Statements to batch execute
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batchStatements: any[] = [
      db
        .update(campaigns)
        .set({
          name,
          description,
          allowPix,
          allowInPerson,
          pixKey: pixKey || null,
          inPersonAddress: inPersonAddress || null,
          inPersonDays: inPersonDays || null,
          inPersonHours: inPersonHours || null,
          inPersonInstructions: inPersonInstructions || null,
          imageUrl: imageUrl || null,
          requiresApproval: requiresDonationApproval,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId)),
    ];

    if (itemsToDelete.length > 0) {
      batchStatements.push(
        db.delete(campaignItems).where(
          inArray(
            campaignItems.id,
            itemsToDelete.map((i) => i.id)
          )
        )
      );
    }

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.id && currentItems.some((ci) => ci.id === item.id)) {
          batchStatements.push(
            db
              .update(campaignItems)
              .set({
                description: item.description,
                amount: item.amount ? item.amount.toString() : null,
                quantity: item.quantity,
                imageUrl: item.imageUrl || null,
              })
              .where(eq(campaignItems.id, item.id))
          );
        } else {
          batchStatements.push(
            db.insert(campaignItems).values({
              campaignId,
              description: item.description,
              amount: item.amount ? item.amount.toString() : null,
              quantity: item.quantity,
              imageUrl: item.imageUrl || null,
            })
          );
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(batchStatements as any);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return { error: 'Falha ao atualizar a campanha' };
  }

  revalidatePath('/dashboard/campaigns');
  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${campaignId}`);
  redirect('/dashboard/campaigns');
}

export async function toggleCampaignStatusAction(campaignId: string, targetStatus?: boolean) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  if (!campaignId) {
    return { error: 'ID da campanha não informado' };
  }

  const [existingCampaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!existingCampaign) {
    return { error: 'Campanha não encontrada' };
  }

  const canManage = await canUserManageCampaign(session.user.id, campaignId);
  if (!canManage) {
    return { error: 'Você não tem permissão para alterar esta campanha' };
  }

  const newStatus = targetStatus !== undefined ? targetStatus : !existingCampaign.isActive;

  try {
    await db
      .update(campaigns)
      .set({
        isActive: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));
  } catch (error) {
    console.error('Error toggling campaign status:', error);
    return { error: 'Falha ao alterar o status da campanha' };
  }

  revalidatePath('/dashboard/campaigns');
  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${campaignId}`);

  return { success: true, isActive: newStatus };
}
