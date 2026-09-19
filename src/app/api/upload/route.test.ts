/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { auth } from '@/lib/auth/server';
import { handleUpload } from '@vercel/blob/client';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@vercel/blob/client', () => ({
  handleUpload: vi.fn(),
}));

describe('Upload API Route - POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it('returns 401 Unauthorized if user is not authenticated', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: null,
    } as any);

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({ type: 'blob.generate-client-token' }),
    });

    const res = await POST(request);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns mock image payload in dev mode when BLOB_READ_WRITE_TOKEN is not set', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
    } as any);

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        type: 'blob.generate-client-token',
        clientPayload: 'custom-payload',
      }),
    });

    const res = await POST(request);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.type).toBe('blob');
    expect(json.url).toContain('https://placehold.co');
    expect(json.clientPayload).toBe('custom-payload');
  });

  it('delegates to handleUpload when BLOB_READ_WRITE_TOKEN is set', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'mock-blob-token';

    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
    } as any);

    const mockResponse = { type: 'blob.generate-client-token', clientToken: 'generated-token' };
    vi.mocked(handleUpload).mockImplementation(async (options: any) => {
      // Execute the onBeforeGenerateToken and onUploadCompleted callbacks for coverage
      const tokenConfig = await options.onBeforeGenerateToken();
      expect(tokenConfig.maximumSizeInBytes).toBe(50 * 1024);
      expect(tokenConfig.allowedContentTypes).toContain('image/jpeg');

      await options.onUploadCompleted({ blob: { url: 'https://blob.url' }, tokenPayload: 'payload' });

      return mockResponse as any;
    });

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({ type: 'blob.generate-client-token' }),
    });

    const res = await POST(request);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(mockResponse);
    expect(handleUpload).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when handleUpload throws an error', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'mock-blob-token';

    vi.mocked(auth.getSession).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
    } as any);

    vi.mocked(handleUpload).mockRejectedValueOnce(new Error('Vercel Blob failure'));

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({ type: 'blob.generate-client-token' }),
    });

    const res = await POST(request);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Vercel Blob failure');
  });
});
