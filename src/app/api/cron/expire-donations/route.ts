import { expireOverdueDonations } from '@/lib/donations/service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const expiredCount = await expireOverdueDonations();
    return NextResponse.json({ success: true, expiredCount });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error expiring donations via cron:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
