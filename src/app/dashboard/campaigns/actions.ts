'use server';

import { db } from '@/db';
import { campaigns, campaignItems } from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { campaignSchema, type CampaignFormValues } from '@/lib/validations/campaign';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCampaignAction(data: CampaignFormValues) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado' };
  }

  const parsed = campaignSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Dados inválidos' };
  }

  const { name, description, pixKey, imageUrl, items } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [insertedCampaign] = await tx.insert(campaigns).values({
        userId: session.user.id,
        name,
        description,
        pixKey,
        imageUrl: imageUrl || null,
      }).returning({ id: campaigns.id });

      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          campaignId: insertedCampaign.id,
          description: item.description,
          amount: item.amount ? item.amount.toString() : null,
          imageUrl: item.imageUrl || null,
        }));
        await tx.insert(campaignItems).values(itemsToInsert);
      }
    });
  } catch {
    return { error: 'Falha ao salvar a campanha' };
  }

  revalidatePath('/dashboard/campaigns');
  redirect('/dashboard/campaigns');
}
