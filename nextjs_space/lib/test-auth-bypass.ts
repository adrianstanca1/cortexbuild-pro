/**
 * Test mode authentication bypass
 * Skips auth checks during E2E testing when TEST_MODE=true
 */

export function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true' || process.env.NEXT_PUBLIC_TEST_MODE === 'true';
}

export function getSessionBypass() {
  if (!isTestMode()) {
    return null;
  }

  // Return mock session for E2E testing
  return {
    user: {
      id: 'test-user-001',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
      organizationId: 'test-org-001',
    },
  };
}
