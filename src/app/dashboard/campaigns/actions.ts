'use server';

import { db } from '@/db';
import { campaigns, campaignItems } from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { campaignSchema, type CampaignFormValues } from '@/lib/validations/campaign';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

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
          userId: session.user.id,
          name,
          description,
          pixKey,
          imageUrl: imageUrl || null,
        }),
        db.insert(campaignItems).values(itemsToInsert),
      ]);
    } else {
      await db.insert(campaigns).values({
        id: campaignId,
        userId: session.user.id,
        name,
        description,
        pixKey,
        imageUrl: imageUrl || null,
      });
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
    return { error: 'Falha ao salvar a campanha' };
  }

  revalidatePath('/dashboard/campaigns');
  redirect('/dashboard/campaigns');
}
