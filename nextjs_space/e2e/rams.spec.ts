import { test, expect } from '@playwright/test';
import { login, logout, testUsers, UserRole } from './fixtures';

test.describe('RAMS E2E Tests', () => {
  const pageUrl = '/safety/rams';

  test.describe('Authentication Flow', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto(pageUrl);
      await expect(page).toHaveURL('/login');
    });

    test('should allow access after login for admin', async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
      await expect(page).toHaveURL(pageUrl);
      await expect(page.locator('h1')).toContainText('RAMS Generator');
    });

    test('should logout successfully', async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
      await logout(page);
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Page Load', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should load page with correct title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('RAMS Generator');
    });

    test('should display project name input', async ({ page }) => {
      await expect(page.locator('#name')).toBeVisible();
    });

    test('should display location input', async ({ page }) => {
      await expect(page.locator('#location')).toBeVisible();
    });

    test('should display description textarea', async ({ page }) => {
      await expect(page.getByLabel('Description')).toBeVisible();
    });

    test('should display date picker', async ({ page }) => {
      await expect(page.getByText('Select date')).toBeVisible();
    });

    test('should display tasks input', async ({ page }) => {
      await expect(page.getByLabel('Tasks')).toBeVisible();
    });

    test('should display Generate button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible();
    });

    test('should display Print button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should show error when project name is empty', async ({ page }) => {
      await page.getByRole('button', { name: 'Generate' }).click();
      await expect(page.getByText('Project name is required')).toBeVisible();
    });

    test('should accept valid project name', async ({ page }) => {
      await page.fill('#name', 'Construction Project');
      await expect(page.locator('#name')).toHaveValue('Construction Project');
    });

    test('should accept location', async ({ page }) => {
      await page.fill('#location', 'Site A');
      await expect(page.locator('#location')).toHaveValue('Site A');
    });

    test('should accept description', async ({ page }) => {
      await page.fill('#description', 'Building construction');
      await expect(page.locator('#description')).toHaveValue('Building construction');
    });

    test('should accept tasks', async ({ page }) => {
      await page.fill('#tasks', 'Excavation, Foundation, Framing');
      await expect(page.locator('#tasks')).toHaveValue('Excavation, Foundation, Framing');
    });

    test('should select date', async ({ page }) => {
      await page.getByText('Select date').click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should generate RAMS document', async ({ page }) => {
      await page.fill('#name', 'Test Project');
      await page.fill('#location', 'Test Location');
      await page.fill('#description', 'Test Description');
      await page.fill('#tasks', 'Task 1, Task 2');
      await page.getByRole('button', { name: 'Generate' }).click();

      await expect(page.getByText('RAMS document generated')).toBeVisible();
    });

    test('should display hazards section', async ({ page }) => {
      await page.fill('#name', 'Test Project');
      await page.fill('#location', 'Test Location');
      await page.fill('#description', 'Test Description');
      await page.fill('#tasks', 'Working at heights');
      await page.getByRole('button', { name: 'Generate' }).click();

      await expect(page.getByText('Hazards')).toBeVisible();
    });

    test('should display risk assessments', async ({ page }) => {
      await page.fill('#name', 'Test Project');
      await page.fill('#location', 'Test Location');
      await page.fill('#description', 'Test Description');
      await page.fill('#tasks', 'Working at heights');
      await page.getByRole('button', { name: 'Generate' }).click();

      await expect(page.getByText('Risk Assessment')).toBeVisible();
    });

    test('should print document', async ({ page }) => {
      await page.fill('#name', 'Test Project');
      await page.fill('#location', 'Test Location');
      await page.fill('#description', 'Test Description');
      await page.fill('#tasks', 'Working at heights');
      await page.getByRole('button', { name: 'Generate' }).click();

      await page.getByRole('button', { name: 'Print' }).click();
      await expect(page.getByText('Print')).toBeVisible();
    });

    test('should regenerate document', async ({ page }) => {
      await page.fill('#name', 'Test Project');
      await page.fill('#location', 'Test Location');
      await page.fill('#description', 'Test Description');
      await page.fill('#tasks', 'Working at heights');
      await page.getByRole('button', { name: 'Generate' }).click();

      await page.fill('#tasks', 'New tasks');
      await page.getByRole('button', { name: 'Generate' }).click();

      await expect(page.getByText('Regenerated')).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should handle API error gracefully', async ({ page }) => {
      await page.route('**/api/rams/generate', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });

      await page.fill('#name', 'Test Project');
      await page.getByRole('button', { name: 'Generate' }).click();

      await expect(page.getByText('Failed to generate')).toBeVisible();
    });

    test('should handle network timeout', async ({ page }) => {
      await page.route('**/api/rams/generate', route => {
        route.abort('timedout');
      });

      await page.fill('#name', 'Test Project');
      await page.getByRole('button', { name: 'Generate' }).click();

      await expect(page).toBeVisible();
    });
  });

  test.describe('RBAC Permissions', () => {
    const allowedRoles: UserRole[] = ['ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN'];

    for (const role of allowedRoles) {
      test(`should allow ${role} to access RAMS`, async ({ page }) => {
        const user = Object.values(testUsers).find(u => u.role === role);
        if (user) {
          await login(page, user);
          await page.goto(pageUrl);
          await expect(page).toHaveURL(pageUrl);
          await expect(page.locator('h1')).toContainText('RAMS Generator');
        }
      });
    }
  });

  test.describe('UI Components', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should display loading state', async ({ page }) => {
      await page.route('**/api/rams/generate', route => {
        route.fulfill({ status: 200, body: JSON.stringify({ html: '<div>test</div>' }), delay: 1000 });
      });

      await page.fill('#name', 'Test');
      await page.getByRole('button', { name: 'Generate' }).click();
      await expect(page.getByText('Generating')).toBeVisible();
    });

    test('should display generated content', async ({ page }) => {
      await page.route('**/api/rams/generate', route => {
        route.fulfill({ status: 200, body: JSON.stringify({ html: '<h2>Hazards</h2>' }) });
      });

      await page.fill('#name', 'Test Project');
      await page.getByRole('button', { name: 'Generate' }).click();
      await expect(page.getByText('Hazards')).toBeVisible();
    });

    test('should display success toast', async ({ page }) => {
      await page.route('**/api/rams/generate', route => {
        route.fulfill({ status: 200, body: JSON.stringify({ html: '<div>test</div>', id: '123' }) });
      });

      await page.fill('#name', 'Test Project');
      await page.getByRole('button', { name: 'Generate' }).click();
      await expect(page.getByText('generated and saved')).toBeVisible();
    });
  });
});
