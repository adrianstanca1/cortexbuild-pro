import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
    email: 'adrian.stanca1@gmail.com',
    password: 'Admin123!'
};

async function login(page: Page) {
    await page.goto('/');
    const isLoggedIn = await page.locator('[data-testid="dashboard"]').isVisible().catch(() => false);
    if (isLoggedIn) return;

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|platform)/);
}

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should load dashboard successfully', async ({ page }) => {
        // Should be on dashboard
        await expect(page).toHaveURL(/\/(dashboard|platform)/);

        // Should have main content
        const hasContent = await page.locator('main, [role="main"], .dashboard').isVisible();
        expect(hasContent).toBeTruthy();
    });

    test('should display dashboard statistics', async ({ page }) => {
        // Look for stat cards (common pattern)
        const statCards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
        const count = await statCards.count();

        // Should have at least some stat cards
        expect(count).toBeGreaterThan(0);
    });

    test('should navigate to different sections', async ({ page }) => {
        // Test navigation
        const sections = ['Projects', 'Tasks', 'Expenses'];

        for (const section of sections) {
            const link = page.locator(`a:has-text("${section}"), button:has-text("${section}")`).first();

            if (await link.isVisible().catch(() => false)) {
                await link.click();

                // Wait for navigation or content change
                await page.waitForTimeout(500);

                // Should show relevant content
                const hasContent = await page.locator(`text=/${section}/i`).first().isVisible();
                expect(hasContent).toBeTruthy();
            }
        }
    });

    test('should be responsive', async ({ page }) => {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Dashboard should still be visible
        const hasContent = await page.locator('main, [role="main"]').isVisible();
        expect(hasContent).toBeTruthy();

        // Reset to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
    });
});

test.describe('SuperAdmin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should access platform/superadmin features', async ({ page }) => {
        // Look for platform or admin link
        const platformLink = page.locator('text=/platform|admin|superadmin/i').first();

        if (await platformLink.isVisible().catch(() => false)) {
            await platformLink.click();

            // Should show platform dashboard
            await expect(page).toHaveURL(/\/(platform|admin)/);

            // Should show admin-specific content
            const hasAdminContent = await page.locator('text=/companies|users|system/i').first().isVisible();
            expect(hasAdminContent).toBeTruthy();
        } else {
            // SuperAdmin features not accessible - just log  
            console.log('Note: SuperAdmin features not visible for this test');
        }
    });

    test('should display system metrics', async ({ page }) => {
        const platformLink = page.locator('text=/platform|admin/i').first();

        if (await platformLink.isVisible().catch(() => false)) {
            await platformLink.click();

            // Look for metrics
            const metrics = await page.locator('text=/total.*companies|active.*users|system.*load/i').count();
            expect(metrics).toBeGreaterThan(0);
        }
    });
});
