import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  
  // Verify user is authenticated before allowing upload
  const session = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          maximumSizeInBytes: 50 * 1024, // 50kb as specified in NFR-Perf-002
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // We can do something when upload completes, like log it
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
