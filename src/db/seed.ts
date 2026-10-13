import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import crypto from 'node:crypto';

if (process.env.NODE_ENV === 'production') {
  console.error('Seed script cannot be run in production');
  process.exit(1);
}

const runSeed = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('⏳ Running seed...');
  
  // Use postgres driver for local setup compatibility
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  // Optional clear data
  if (process.argv.includes('--clear')) {
    console.log('🧹 Clearing old data...');
    await db.delete(schema.campaignItems);
    await db.delete(schema.campaigns);
    await db.delete(schema.organizationInvitations);
    await db.delete(schema.organizationMembers);
    await db.delete(schema.organizations);
    await db.delete(schema.users);
  }

  // UUIDs
  const userId = crypto.randomUUID();
  const orgId = crypto.randomUUID();

  // Create User
  console.log('👤 Creating user...');
  await db.insert(schema.users).values({
    id: userId,
    name: 'Test User',
    email: 'test@example.com',
  }).onConflictDoNothing();

  // Create Organization
  console.log('🏢 Creating organization...');
  await db.insert(schema.organizations).values({
    id: orgId,
    name: 'Test Organization',
  }).onConflictDoNothing();

  // Create Organization Member
  console.log('🤝 Linking user to organization...');
  await db.insert(schema.organizationMembers).values({
    userId,
    organizationId: orgId,
    role: 'owner',
  }).onConflictDoNothing();

  // Create Campaigns
  console.log('📢 Creating campaigns...');
  const campaign1Id = crypto.randomUUID();
  const campaign2Id = crypto.randomUUID();

  await db.insert(schema.campaigns).values([
    {
      id: campaign1Id,
      organizationId: orgId,
      userId,
      name: 'Winter Clothes Drive',
      description: 'Collecting warm clothes for winter.',
      pixKey: 'pix-winter@example.com',
    },
    {
      id: campaign2Id,
      organizationId: orgId,
      userId,
      name: 'Food Bank Collection',
      description: 'Monthly food collection.',
      pixKey: 'pix-food@example.com',
    }
  ]).onConflictDoNothing();

  // Create Campaign Items
  console.log('📦 Creating campaign items...');
  await db.insert(schema.campaignItems).values([
    {
      campaignId: campaign1Id,
      description: 'Winter Jacket',
      amount: '50.00',
    },
    {
      campaignId: campaign1Id,
      description: 'Blanket',
      amount: '30.00',
    },
    {
      campaignId: campaign2Id,
      description: 'Rice (5kg)',
      amount: '25.00',
    },
    {
      campaignId: campaign2Id,
      description: 'Beans (1kg)',
      amount: '8.00',
    }
  ]).onConflictDoNothing();

  console.log('✅ seed_completed_successfully');
  process.exit(0);
};

runSeed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
