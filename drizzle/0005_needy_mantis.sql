ALTER TABLE "donations" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "reversal_reason" varchar(20);--> statement-breakpoint
CREATE INDEX "donations_status_expires_at_idx" ON "donations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "donations_campaign_item_id_idx" ON "donations" USING btree ("campaign_item_id");