ALTER TABLE "campaigns" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;