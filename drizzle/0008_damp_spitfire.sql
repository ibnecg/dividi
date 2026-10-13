ALTER TABLE "campaigns" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_organization_id_idx" ON "campaigns" USING btree ("organization_id");--> statement-breakpoint
UPDATE "campaigns" SET "organization_id" = (
  SELECT "organization_id" FROM "organization_members" WHERE "organization_members"."user_id" = "campaigns"."user_id" LIMIT 1
) WHERE "organization_id" IS NULL;