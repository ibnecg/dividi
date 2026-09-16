import { test, expect } from '@playwright/test';

test.describe('Authentication and Route Protection', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    // Attempt to navigate to a protected route without being logged in
    await page.goto('/dashboard');

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should render the landing page', async ({ page }) => {
    await page.goto('/');

    // Check for some main elements of landing page
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /entrar/i })).toBeVisible();
  });
});
