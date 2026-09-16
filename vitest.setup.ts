import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }),
}));

// Mock Next.js Server Actions revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
