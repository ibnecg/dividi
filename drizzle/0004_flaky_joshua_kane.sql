ALTER TABLE "campaigns" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "status" varchar(20) DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "donated_at" timestamp;