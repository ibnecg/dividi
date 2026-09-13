'use server';

import { db } from '@/db';
import { users, organizations, organizationMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function createLocalUserAndOrganization(
  userId: string,
  name: string,
  email: string,
  organizationName: string
) {
  try {
    // Verificamos se o usuário já existe localmente por precaução
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (existingUser.length > 0) {
      // Já criado, talvez tentar criar apenas a organização
      return { error: 'O usuário já possui registros locais.' };
    }

    const orgId = crypto.randomUUID();

    await db.batch([
      db.insert(users).values({
        id: userId,
        name,
        email,
      }).onConflictDoNothing(),
      db.insert(organizations).values({
        id: orgId,
        name: organizationName,
      }),
      db.insert(organizationMembers).values({
        userId,
        organizationId: orgId,
        role: 'owner',
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Database transaction failed:', error);
    return { error: 'Erro ao criar registros no banco de dados. A transação falhou.' };
  }
}
