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

test.describe('Financial Features - Expenses', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should display expenses dashboard', async ({ page }) => {
        // Navigate to expenses
        await page.click('text=/expenses/i');

        // Check for expense dashboard elements
        await expect(page.locator('text=/pending approval|my spending/i')).toBeVisible();

        // Check for filter tabs
        await expect(page.locator('text=/all.*claims/i, button:has-text("All")')).toBeVisible();
    });

    test('should open add expense modal', async ({ page }) => {
        await page.click('text=/expenses/i');

        // Click add expense button (might be "Snap Receipt" or "+ Add")
        const addButton = page.locator('text=/snap receipt|add expense|new expense/i').first();
        await addButton.click();

        // Modal should be visible
        await expect(page.locator('text=/submit.*claim|create.*expense/i')).toBeVisible();

        // Check form fields
        await expect(page.locator('input[name="description"], input[placeholder*="description"]')).toBeVisible();
        await expect(page.locator('input[name="amount"], input[placeholder*="amount"]')).toBeVisible();
    });

    test('should create new expense', async ({ page }) => {
        await page.click('text=/expenses/i');

        // Open modal
        const addButton = page.locator('text=/snap receipt|add expense|new expense/i').first();
        await addButton.click();

        // Fill form
        const timestamp = Date.now();
        await page.fill('input[name="description"], input[placeholder*="description"]', `E2E Test Expense ${timestamp}`);

        // Select category
        const categorySelect = page.locator('select[name="category"]').first();
        if (await categorySelect.isVisible()) {
            await categorySelect.selectOption('Food');
        }

        // Fill amount
        await page.fill('input[name="amount"], input[type="number"]', '25.50');

        // Submit
        await page.click('button:has-text("Submit"), button:has-text("Create")');

        // Should show success message
        await expect(page.locator('text=/success|submitted|created/i')).toBeVisible({ timeout: 5000 });

        // Should close modal
        await expect(page.locator('text=/submit.*claim|create.*expense/i')).not.toBeVisible({ timeout: 5000 });

        // New expense should appear in list
        await expect(page.locator(`text=/E2E Test Expense ${timestamp}/i`)).toBeVisible();
    });

    test('should filter expenses', async ({ page }) => {
        await page.click('text=/expenses/i');

        // Click "My Claims" filter
        await page.click('button:has-text("My Claims")');

        // Filter should be active (visual indication)
        const myClaimsButton = page.locator('button:has-text("My Claims")');
        await expect(myClaimsButton).toHaveClass(/active|selected|bg-indigo/);

        // Click "All" filter
        await page.click('button:has-text("All")');

        // All button should be active
        const allButton = page.locator('button:has-text("All")');
        await expect(allButton).toHaveClass(/active|selected|bg-indigo/);
    });
});

test.describe('Financial Features - API Integration', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should fetch expenses from API', async ({ page }) => {
        await page.goto('/');

        // Intercept API call
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/expenses') && response.status() === 200
        );

        // Navigate to expenses
        await page.click('text=/expenses/i');

        // Wait for API response
        const response = await responsePromise;
        const data = await response.json();

        // Should return array
        expect(Array.isArray(data) || (data && Array.isArray(data.expenses))).toBeTruthy();
    });

    test('should create expense via API', async ({ page }) => {
        await page.goto('/');
        await page.click('text=/expenses/i');

        // Listen for POST request
        const requestPromise = page.waitForRequest(
            request => request.url().includes('/api/expenses') && request.method() === 'POST'
        );

        // Create expense
        const addButton = page.locator('text=/snap receipt|add expense|new expense/i').first();
        await addButton.click();

        const timestamp = Date.now();
        await page.fill('input[name="description"]', `API Test ${timestamp}`);
        await page.fill('input[name="amount"]', '10.00');
        await page.click('button:has-text("Submit"), button:has-text("Create")');

        // Verify request was made
        const request = await requestPromise;
        const postData = request.postDataJSON();

        expect(postData.description).toContain('API Test');
        expect(postData.amount).toBeDefined();
    });
});
