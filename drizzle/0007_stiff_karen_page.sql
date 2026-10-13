CREATE TABLE "organization_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_invitations_org_status_idx" ON "organization_invitations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "org_invitations_token_idx" ON "organization_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "org_invitations_email_idx" ON "organization_invitations" USING btree ("email");