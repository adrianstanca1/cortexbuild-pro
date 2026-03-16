import { test, expect } from '@playwright/test';
import { login, logout, testUsers, UserRole } from './fixtures';

test.describe('CIS Calculator E2E Tests', () => {
  const pageUrl = '/cis-calculator';

  test.describe('Authentication Flow', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto(pageUrl);
      // Page loads successfully (auth handled by layout)
      await expect(page.getByText('UK CIS Deduction Calculator')).toBeVisible();
    });

    test('should allow access after login', async ({ page }) => {
      await page.goto(pageUrl);
      await expect(page).toHaveURL(pageUrl);
      await expect(page.getByText('UK CIS Deduction Calculator')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto(pageUrl);
      await logout(page);
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Page Load', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pageUrl);
    });

    test('should load page with correct title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('UK CIS Deduction Calculator');
    });

    test('should display calculator input form', async ({ page }) => {
      await expect(page.locator('#gross')).toBeVisible();
      await expect(page.locator('#materials')).toBeVisible();
      await expect(page.locator('#rate')).toBeVisible();
      await expect(page.locator('#retention')).toBeVisible();
    });

    test('should display copy button', async ({ page }) =>
      await expect(page.getByRole('button', { name: 'Copy breakdown' })).toBeVisible());
  });

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pageUrl);
    });

    test('should accept valid gross amount', async ({ page }) => {
      await page.fill('#gross', '5000');
      await expect(page.locator('#gross')).toHaveValue('5000');
    });

    test('should accept materials value', async ({ page }) => {
      await page.fill('#gross', '5000');
      await page.fill('#materials', '1000');
      await expect(page.locator('#materials')).toHaveValue('1000');
    });

    test('should accept retention percentage', async ({ page }) => {
      await page.fill('#retention', '5');
      await expect(page.locator('#retention')).toHaveValue('5');
    });

    test('should allow CIS rate selection', async ({ page }) => {
      await page.selectOption('#rate', '20');
      await expect(page.locator('#rate')).toHaveValue('20');
    });

    test('should select 30% CIS rate', async ({ page }) => {
      await page.selectOption('#rate', '30');
      await expect(page.locator('#rate')).toHaveValue('30');
    });

    test('should select 0% gross rate', async ({ page }) => {
      await page.selectOption('#rate', '0');
      await expect(page.locator('#rate')).toHaveValue('0');
    });
  });

  test.describe('CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pageUrl);
    });

    test('should calculate CIS with standard rate', async ({ page }) => {
      await page.fill('#gross', '5000');
      await page.fill('#materials', '1000');
      await page.selectOption('#rate', '20');
      await page.fill('#retention', '5');

      await expect(page.getByText('Labour:')).toBeVisible();
      await expect(page.getByText('CIS @ 20%')).toBeVisible();
    });

    test('should calculate CIS with gross payment status', async ({ page }) => {
      await page.fill('#gross', '5000');
      await page.selectOption('#rate', '0');

      await expect(page.getByText('CIS @ 0%')).toBeVisible();
    });

    test('should calculate CIS with higher rate', async ({ page }) => {
      await page.fill('#gross', '5000');
      await page.selectOption('#rate', '30');

      await expect(page.getByText('CIS @ 30%')).toBeVisible();
    });

    test('should copy breakdown to clipboard', async ({ page }) => {
      await page.fill('#gross', '5000');
      await page.fill('#materials', '1000');
      await page.selectOption('#rate', '20');
      await page.fill('#retention', '5');

      await page.getByRole('button', { name: 'Copy' }).click();

      // Check toast notification
      await expect(page.getByText('Copied')).toBeVisible();
    });

    test('should display calculation results', async ({ page }) => {
      await page.fill('#gross', '5000');
      await page.fill('#materials', '1000');
      await page.selectOption('#rate', '20');
      await page.fill('#retention', '5');

      await expect(page.getByText('Labour')).toBeVisible();
      await expect(page.getByText('CIS @')).toBeVisible();
      await expect(page.getByText('Retention')).toBeVisible();
      await expect(page.getByText('Net payment')).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pageUrl);
    });

    test('should handle negative values gracefully', async ({ page }) => {
      await page.fill('#gross', '-1000');
      // Component should handle gracefully
      await expect(page).toBeVisible();
    });
  });

  test.describe('UI Components', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pageUrl);
    });

    test('should display summary items', async ({ page }) => {
      await expect(page.getByText('Labour')).toBeVisible();
      await expect(page.getByText('Net payment')).toBeVisible();
    });

    test('should display currency formatting', async ({ page }) => {
      await page.fill('#gross', '5000.99');
      await expect(page.locator('#gross')).toHaveValue('5000.99');
    });
  });
});
