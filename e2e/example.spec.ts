import { test, expect } from '@playwright/test';

test.describe('CortexBuild Pro', () => {
  test('homepage has title', async ({ page }) => {
    await page.goto('/');
    
    // Expect a title "to contain" a substring
    await expect(page).toHaveTitle(/CortexBuild|Construction|Dashboard/);
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
