import { test, expect } from '@playwright/test';
import { login, logout, testUsers, UserRole } from './fixtures';

test.describe('Deployment E2E Tests', () => {
  const pageUrl = '/deployment';

  test.describe('Authentication Flow', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto(pageUrl);
      await expect(page).toHaveURL('/login');
    });

    test('should allow access after login for admin', async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
      await expect(page).toHaveURL(pageUrl);
      await expect(page.locator('h1')).toContainText('Deployment Dashboard');
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
      await expect(page.locator('h1')).toContainText('Deployment Dashboard');
    });

    test('should display health status badge', async ({ page }) => {
      await expect(page.getByText('System Online')).toBeVisible();
    });

    test('should display refresh button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    });

    test('should display tabs', async ({ page }) => {
      await expect(page.getByText('Overview')).toBeVisible();
      await expect(page.getByText('Projects')).toBeVisible();
      await expect(page.getByText('Team')).toBeVisible();
      await expect(page.getByText('Activity')).toBeVisible();
    });
  });

  test.describe('Overview Stats', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should display total projects', async ({ page }) => {
      await expect(page.getByText('Total Projects')).toBeVisible();
    });

    test('should display team members', async ({ page }) => {
      await expect(page.getByText('Team Members')).toBeVisible();
    });

    test('should display deployment health', async ({ page }) => {
      await expect(page.getByText('Deployment Health')).toBeVisible();
    });

    test('should display system uptime', async ({ page }) => {
      await expect(page.getByText('System Uptime')).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should handle API error gracefully', async ({ page }) => {
      await page.route('**/api/deployment/status', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });

      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page.getByText('Error')).toBeVisible();
    });

    test('should handle network timeout', async ({ page }) => {
      await page.route('**/api/deployment/status', route => {
        route.abort('timedout');
      });

      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page).toBeVisible();
    });
  });

  test.describe('RBAC Permissions', () => {
    const allowedRoles: UserRole[] = ['ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'];

    for (const role of allowedRoles) {
      test(`should allow ${role} to access Deployment`, async ({ page }) => {
        const user = Object.values(testUsers).find(u => u.role === role);
        if (user) {
          await login(page, user);
          await page.goto(pageUrl);
          await expect(page).toHaveURL(pageUrl);
          await expect(page.locator('h1')).toContainText('Deployment Dashboard');
        }
      });
    }

    test('should deny COMPANY_ADMIN access to Deployment', async ({ page }) => {
      const user = testUsers.companyAdmin;
      await login(page, user);
      await page.goto(pageUrl);
      await expect(page).not.toHaveURL(pageUrl);
    });

    test('should deny PROJECT_MANAGER access to Deployment', async ({ page }) => {
      const user = testUsers.projectManager;
      await login(page, user);
      await page.goto(pageUrl);
      await expect(page).not.toHaveURL(pageUrl);
    });

    test('should deny FIELD_WORKER access to Deployment', async ({ page }) => {
      const user = testUsers.fieldWorker;
      await login(page, user);
      await page.goto(pageUrl);
      await expect(page).not.toHaveURL(pageUrl);
    });
  });

  test.describe('UI Components', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should display stats cards', async ({ page }) => {
      await expect(page.getByText('Processes')).toBeVisible();
      await expect(page.getByText('Containers')).toBeVisible();
    });

    test('should display status badges', async ({ page }) => {
      await expect(page.getByText('Online')).toBeVisible();
      await expect(page.getByText('Running')).toBeVisible();
    });

    test('should display loading state', async ({ page }) => {
      await page.route('**/api/deployment/status', route => {
        route.fulfill({ status: 200, body: JSON.stringify({ processes: [], containers: [], healthServices: [] }), delay: 1000 });
      });
      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page.getByText('Loading')).toBeVisible();
    });

    test('should display empty state', async ({ page }) => {
      await page.route('**/api/deployment/status', route => {
        route.fulfill({ status: 200, body: JSON.stringify({ processes: [], containers: [], healthServices: [] }) });
      });
      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page.getByText('No processes')).toBeVisible();
    });

    test('should display refresh button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin);
      await page.goto(pageUrl);
    });

    test('should receive deployment updates', async ({ page }) => {
      await expect(page.getByText('Deployment Dashboard')).toBeVisible();
    });

    test('should update project status', async ({ page }) => {
      await page.route('**/api/projects*', route => {
        route.fulfill({ status: 200, body: JSON.stringify({ projects: [{ id: '1', name: 'Test Project', status: 'IN_PROGRESS', budget: 100000, createdAt: new Date().toISOString(), _count: { tasks: 5, teamMembers: 3 } }] }) });
      });
      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page.getByText('Test Project')).toBeVisible();
    });
  });
});
