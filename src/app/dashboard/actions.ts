'use server';

import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { organizationMembers, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserOrganizationName(): Promise<string> {
  const { data: session } = await auth.getSession();
  
  if (!session?.user?.id) {
    return 'Organização';
  }
  
  try {
    const member = await db.select({
      orgName: organizations.name,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, session.user.id))
    .limit(1);

    if (member && member.length > 0) {
      return member[0].orgName;
    }
  } catch (error) {
    console.error('Error fetching organization name:', error);
  }

  return 'Organização';
}
