ALTER TABLE "campaigns" ALTER COLUMN "pix_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "allow_pix" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "allow_in_person" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "in_person_address" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "in_person_days" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "in_person_hours" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "in_person_instructions" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "donation_type" varchar(20) DEFAULT 'pix' NOT NULL;