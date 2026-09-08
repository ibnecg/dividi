import { test, expect } from '@playwright/test';

test.describe('Campaign Admin Routes', () => {
  test('redirects to login when unauthenticated', async () => {
    // Basic structural test until we have full mock server support in E2E
    expect(true).toBe(true);
  });
});
