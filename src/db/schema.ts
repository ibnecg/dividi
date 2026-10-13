import { pgTable, text, timestamp, primaryKey, numeric, integer, boolean, varchar, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Matching the auth provider's user ID
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizationMembers = pgTable('organization_members', {
  userId: text('user_id').notNull().references(() => users.id),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  role: text('role').notNull(), // e.g., 'owner', 'member'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.organizationId] }),
  };
});

export const organizationInvitations = pgTable('organization_invitations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  token: text('token').notNull().unique(),
  invitedByUserId: text('invited_by_user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'accepted', 'revoked', 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    orgStatusIdx: index('org_invitations_org_status_idx').on(table.organizationId, table.status),
    tokenIdx: index('org_invitations_token_idx').on(table.token),
    emailIdx: index('org_invitations_email_idx').on(table.email),
  };
});

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  pixKey: text('pix_key'),
  allowPix: boolean('allow_pix').default(true).notNull(),
  allowInPerson: boolean('allow_in_person').default(false).notNull(),
  inPersonAddress: text('in_person_address'),
  inPersonDays: text('in_person_days'),
  inPersonHours: text('in_person_hours'),
  inPersonInstructions: text('in_person_instructions'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  requiresApproval: boolean('requires_approval').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const campaignItems = pgTable('campaign_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }), // Nullable for generic items
  quantity: integer('quantity').notNull().default(1),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const donations = pgTable('donations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignItemId: text('campaign_item_id').notNull().references(() => campaignItems.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  donorName: text('donor_name'),
  donorPhone: text('donor_phone'),
  message: text('message'),
  status: varchar('status', { length: 20 }).default('approved').notNull(), // 'approved', 'pending', 'reversed'
  donationType: varchar('donation_type', { length: 20 }).default('pix').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reversalReason: varchar('reversal_reason', { length: 20 }), // 'rejected', 'expired'
  amount: numeric('amount', { precision: 10, scale: 2 }),
  donatedAt: timestamp('donated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    statusExpiresIdx: index('donations_status_expires_at_idx').on(table.status, table.expiresAt),
    campaignItemIdIdx: index('donations_campaign_item_id_idx').on(table.campaignItemId),
  };
});
