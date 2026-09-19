CREATE TABLE "campaign_items" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2),
	"quantity" integer DEFAULT 1 NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"pix_key" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"donor_name" text,
	"donor_phone" text,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_items" ADD CONSTRAINT "campaign_items_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_item_id_campaign_items_id_fk" FOREIGN KEY ("campaign_item_id") REFERENCES "public"."campaign_items"("id") ON DELETE cascade ON UPDATE no action;