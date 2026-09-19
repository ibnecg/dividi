import { pgTable, text, timestamp, primaryKey, numeric, integer, boolean } from 'drizzle-orm/pg-core';

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

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  pixKey: text('pix_key').notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
