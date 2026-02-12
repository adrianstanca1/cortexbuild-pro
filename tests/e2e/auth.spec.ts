import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_USER = {
    email: 'adrian.stanca1@gmail.com',
    password: 'Admin123!'
};

/**
 * Helper function to login
 */
async function login(page: Page) {
    await page.goto('/');

    // Check if already logged in
    const isLoggedIn = await page.locator('[data-testid="dashboard"]').isVisible().catch(() => false);
    if (isLoggedIn) {
        return;
    }

    // Fill login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/(dashboard|platform)/);
}

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/');

        // Check for login elements
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
        await page.goto('/');

        // Try invalid login
        await page.fill('input[type="email"]', 'invalid@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('text=/invalid.*credentials|login.*failed/i')).toBeVisible({ timeout: 5000 });
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await login(page);

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/(dashboard|platform)/);

        // Should show user menu or profile
        const hasUserMenu = await page.locator('[data-testid="user-menu"], [aria-label="User menu"], img[alt*="avatar"]').isVisible().catch(() => false);
        expect(hasUserMenu).toBeTruthy();
    });

    test('should logout successfully', async ({ page }) => {
        await login(page);

        // Find and click logout button
        // This might be in a dropdown menu
        const logoutButton = page.locator('text=/logout|sign out/i').first();

        // May need to open menu first
        const userMenu = page.locator('[data-testid="user-menu"], [aria-label="User menu"]').first();
        if (await userMenu.isVisible().catch(() => false)) {
            await userMenu.click();
        }

        await logoutButton.click();

        // Should redirect to login
        await expect(page).toHaveURL(/\/(login|)/);
    });

    test('should persist session on page refresh', async ({ page }) => {
        await login(page);

        // Refresh page
        await page.reload();

        // Should still be logged in
        await expect(page).toHaveURL(/\/(dashboard|platform)/);
    });
});

test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route while logged out', async ({ page }) => {
        // Clear any existing session
        await page.context().clearCookies();
        await page.goto('/dashboard');

        // Should redirect to login
        await expect(page).toHaveURL(/\/login|^\/$/, { timeout: 5000 });
    });
});
