import { db } from '@/db';
import { sql } from 'drizzle-orm';

export type DonationStatus = 'approved' | 'pending' | 'reversed';
export type DonationReversalReason = 'rejected' | 'expired';

export async function pledgeDonation(params: {
  campaignId: string;
  campaignItemId: string;
  quantity: number;
  customAmount?: number;
  donorName?: string;
  donorPhone?: string;
  message?: string;
}) {
  const result = await db.execute<{ id: string; status: DonationStatus; expires_at: Date | null }>(sql`
    WITH target AS (
      SELECT ci.id, ci.amount AS unit_price, c.requires_approval AS needs_approval
      FROM campaign_items ci JOIN campaigns c ON c.id = ci.campaign_id
      WHERE ci.id = ${params.campaignItemId} AND ci.campaign_id = ${params.campaignId} AND c.is_active
    ), decremented AS (
      UPDATE campaign_items ci SET quantity = ci.quantity - ${params.quantity}
      FROM target
      WHERE ci.id = target.id AND ci.quantity >= ${params.quantity}
        AND (target.unit_price IS NOT NULL OR ${params.customAmount ?? null}::numeric IS NOT NULL)
      RETURNING ci.id, target.unit_price, target.needs_approval
    )
    INSERT INTO donations (id, campaign_item_id, quantity, amount, status, expires_at, donor_name, donor_phone, message)
    SELECT gen_random_uuid(), d.id, ${params.quantity},
           COALESCE(d.unit_price * ${params.quantity}, ${params.customAmount ?? null}::numeric),
           CASE WHEN d.needs_approval THEN 'pending'::varchar ELSE 'approved'::varchar END,
           CASE WHEN d.needs_approval THEN now() + make_interval(hours => 72) END,
           ${params.donorName ?? null}, ${params.donorPhone ?? null}, ${params.message ?? null}
    FROM decremented
    RETURNING id, status, expires_at;
  `);

  return result.rows[0] ?? null;
}

export async function expireOverdueDonations(params: { campaignId?: string } = {}) {
  const result = await db.execute<{ campaign_id: string }>(sql`
    WITH expired AS (
      UPDATE donations d
      SET status = 'reversed', reversal_reason = 'expired', reviewed_at = now()
      FROM campaign_items ci
      WHERE d.campaign_item_id = ci.id
        AND d.status = 'pending' AND d.expires_at <= now()
        AND (${params.campaignId ?? null}::text IS NULL OR ci.campaign_id = ${params.campaignId ?? null})
      RETURNING d.campaign_item_id, d.quantity, ci.campaign_id
    ), totals AS (
      SELECT campaign_item_id, campaign_id, SUM(quantity)::int AS qty FROM expired GROUP BY 1, 2
    )
    UPDATE campaign_items ci SET quantity = ci.quantity + t.qty
    FROM totals t WHERE ci.id = t.campaign_item_id
    RETURNING t.campaign_id;
  `);

  return result.rows.map(r => r.campaign_id);
}

export async function approveDonation(params: { donationId: string; organizerId: string }) {
  const result = await db.execute<{ id: string; campaign_id: string }>(sql`
    UPDATE donations d
    SET status = 'approved', reviewed_at = now()
    FROM campaign_items ci
    JOIN campaigns c ON c.id = ci.campaign_id
    WHERE d.id = ${params.donationId}
      AND d.campaign_item_id = ci.id
      AND c.user_id = ${params.organizerId}
      AND d.status = 'pending' 
      AND d.expires_at > now()
    RETURNING d.id, c.id as campaign_id;
  `);

  return result.rows[0] ?? null;
}

export async function rejectDonation(params: { donationId: string; organizerId: string }) {
  const result = await db.execute<{ id: string; campaign_id: string }>(sql`
    WITH rejected AS (
      UPDATE donations d
      SET status = 'reversed', reversal_reason = 'rejected', reviewed_at = now()
      FROM campaign_items ci
      JOIN campaigns c ON c.id = ci.campaign_id
      WHERE d.id = ${params.donationId}
        AND d.campaign_item_id = ci.id
        AND c.user_id = ${params.organizerId}
        AND d.status = 'pending'
      RETURNING d.id, d.campaign_item_id, d.quantity, c.id as campaign_id
    )
    UPDATE campaign_items ci
    SET quantity = ci.quantity + r.quantity
    FROM rejected r
    WHERE ci.id = r.campaign_item_id
    RETURNING r.id, r.campaign_id;
  `);

  return result.rows[0] ?? null;
}
