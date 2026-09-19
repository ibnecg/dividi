import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

function createMockRequest(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(url);
  for (const [key, value] of Object.entries(cookies)) {
    req.cookies.set(key, value);
  }
  return req;
}

describe('proxy middleware', () => {
  it('redirects to /login when unauthenticated user accesses /dashboard', async () => {
    const req = createMockRequest('http://localhost:3000/dashboard');
    const response = await proxy(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('redirects to /login when unauthenticated user accesses nested /dashboard/campaigns', async () => {
    const req = createMockRequest('http://localhost:3000/dashboard/campaigns/new');
    const response = await proxy(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('allows authenticated user to access /dashboard with better-auth.session_token', async () => {
    const req = createMockRequest('http://localhost:3000/dashboard', {
      'better-auth.session_token': 'mock-session-value',
    });
    const response = await proxy(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated user to access /dashboard with neon-auth.session_token', async () => {
    const req = createMockRequest('http://localhost:3000/dashboard', {
      'neon-auth.session_token': 'mock-session-value',
    });
    const response = await proxy(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated user with __Secure- cookie prefix', async () => {
    const req = createMockRequest('http://localhost:3000/dashboard', {
      '__Secure-better-auth.session_token': 'mock-session-value',
    });
    const response = await proxy(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects authenticated user accessing /login to /dashboard', async () => {
    const req = createMockRequest('http://localhost:3000/login', {
      'better-auth.session_token': 'mock-session-value',
    });
    const response = await proxy(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('redirects authenticated user accessing /signup to /dashboard', async () => {
    const req = createMockRequest('http://localhost:3000/signup', {
      'neon-auth.session_token': 'mock-session-value',
    });
    const response = await proxy(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('allows unauthenticated user to access /login', async () => {
    const req = createMockRequest('http://localhost:3000/login');
    const response = await proxy(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows unauthenticated user to access /signup', async () => {
    const req = createMockRequest('http://localhost:3000/signup');
    const response = await proxy(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows request to public route /campaigns', async () => {
    const req = createMockRequest('http://localhost:3000/campaigns');
    const response = await proxy(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
