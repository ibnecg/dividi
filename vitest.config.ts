import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['node_modules', 'e2e'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/components/ui/**', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  },
});
