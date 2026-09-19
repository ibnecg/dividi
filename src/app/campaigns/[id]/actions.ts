'use server';

import { db } from '@/db';
import { campaignItems, donations } from '@/db/schema';
import { pledgeSchema, type PledgeFormValues } from '@/lib/validations/campaign';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function pledgeDonationAction(campaignId: string, data: PledgeFormValues) {
  const parsed = pledgeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Dados inválidos' };
  }

  const { campaignItemId, quantity, donorName, donorPhone, message } = parsed.data;

  try {
    const [updatedItem] = await db
      .update(campaignItems)
      .set({ quantity: sql`${campaignItems.quantity} - ${quantity}` })
      .where(sql`${campaignItems.id} = ${campaignItemId} AND ${campaignItems.quantity} >= ${quantity}`)
      .returning({ id: campaignItems.id });

    if (!updatedItem) {
      return { error: 'Quantidade indisponível ou item não encontrado' };
    }

    try {
      await db.insert(donations).values({
        campaignItemId,
        quantity,
        donorName: donorName || null,
        donorPhone: donorPhone || null,
        message: message || null,
      });
    } catch (insertError) {
      // Reverte a alteração de quantidade caso a inserção da doação falhe
      await db
        .update(campaignItems)
        .set({ quantity: sql`${campaignItems.quantity} + ${quantity}` })
        .where(eq(campaignItems.id, campaignItemId));
      throw insertError;
    }
  } catch (error: unknown) {
    const err = error as Error;
    return { error: err.message || 'Falha ao processar doação' };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}
