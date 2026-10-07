'use server';

import { auth } from '@/lib/auth/server';
import { approveDonation, rejectDonation, expireOverdueDonations } from '@/lib/donations/service';
import { donationIdSchema } from '@/lib/validations/campaign';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { sql, eq, and, gt } from 'drizzle-orm';
import { donations, campaignItems, campaigns } from '@/db/schema';

export async function approveDonationAction(donationId: string) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return { error: 'Usuário não autenticado' };

  const parsed = donationIdSchema.safeParse(donationId);
  if (!parsed.success) return { error: 'Doação inválida' };

  try {
    // Run sweep first
    await expireOverdueDonations();

    const result = await approveDonation({
      donationId: parsed.data,
      organizerId: session.user.id,
    });

    if (!result) {
      return { error: 'Esta doação não está mais pendente (pode ter expirado ou já ter sido revisada)' };
    }

    revalidatePath('/dashboard/donations');
    revalidatePath('/dashboard', 'layout');
    revalidatePath(`/campaigns/${result.campaign_id}`);
    
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message || 'Falha ao aprovar doação' };
  }
}

export async function rejectDonationAction(donationId: string) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return { error: 'Usuário não autenticado' };

  const parsed = donationIdSchema.safeParse(donationId);
  if (!parsed.success) return { error: 'Doação inválida' };

  try {
    await expireOverdueDonations();

    const result = await rejectDonation({
      donationId: parsed.data,
      organizerId: session.user.id,
    });

    if (!result) {
      return { error: 'Esta doação não está mais pendente (pode ter expirado ou já ter sido revisada)' };
    }

    revalidatePath('/dashboard/donations');
    revalidatePath('/dashboard', 'layout');
    revalidatePath(`/campaigns/${result.campaign_id}`);

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message || 'Falha ao reprovar doação' };
  }
}

export async function getPendingDonationsCount() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return 0;

  await expireOverdueDonations();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(donations)
    .innerJoin(campaignItems, eq(donations.campaignItemId, campaignItems.id))
    .innerJoin(campaigns, eq(campaignItems.campaignId, campaigns.id))
    .where(
      and(
        eq(campaigns.userId, session.user.id),
        eq(donations.status, 'pending'),
        gt(donations.expiresAt, new Date())
      )
    );

  return Number(result?.count || 0);
}
