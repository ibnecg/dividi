'use server';

import { db } from '@/db';
import { campaignItems, donations } from '@/db/schema';
import { pledgeSchema, type PledgeFormValues } from '@/lib/validations/campaign';
import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function pledgeDonationAction(campaignId: string, data: PledgeFormValues) {
  const parsed = pledgeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Dados inválidos' };
  }

  const { campaignItemId, quantity, donorName, donorPhone, message } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [updatedItem] = await tx.update(campaignItems)
        .set({ quantity: sql`${campaignItems.quantity} - ${quantity}` })
        .where(sql`${campaignItems.id} = ${campaignItemId} AND ${campaignItems.quantity} >= ${quantity}`)
        .returning({ id: campaignItems.id });

      if (!updatedItem) {
        throw new Error('Quantidade indisponível ou item não encontrado');
      }

      await tx.insert(donations).values({
        campaignItemId,
        quantity,
        donorName: donorName || null,
        donorPhone: donorPhone || null,
        message: message || null,
      });
    });
  } catch (error: unknown) {
    const err = error as Error;
    return { error: err.message || 'Falha ao processar doação' };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}
