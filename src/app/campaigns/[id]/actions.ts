'use server';

import { pledgeSchema, type PledgeFormValues } from '@/lib/validations/campaign';
import { revalidatePath } from 'next/cache';
import { expireOverdueDonations, pledgeDonation } from '@/lib/donations/service';

export async function pledgeDonationAction(campaignId: string, data: PledgeFormValues) {
  const parsed = pledgeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Dados inválidos' };
  }

  const { campaignItemId, quantity, amount, donorName, donorPhone, message } = parsed.data;

  try {
    await expireOverdueDonations({ campaignId });

    const result = await pledgeDonation({
      campaignId,
      campaignItemId,
      quantity,
      customAmount: amount,
      donorName,
      donorPhone,
      message,
    });

    if (!result) {
      return { error: 'Quantidade indisponível ou item não encontrado' };
    }

    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, status: result.status, expiresAt: result.expires_at };
  } catch (error: unknown) {
    console.error('Falha ao processar doação:', error);
    return { error: 'Falha ao processar doação' };
  }
}
