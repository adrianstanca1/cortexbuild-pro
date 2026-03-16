export default async function globalSetup() {
  console.log('Setting up E2E test environment...');

  // Export TEST_MODE for server-side authentication bypass
  process.env.TEST_MODE = 'true';
  console.log('TEST_MODE=true exported for server-side auth bypass');

  console.log('Note: Database setup skipped - remote database unreachable');
  console.log('E2E tests run against component structure without authentication');
  console.log('E2E test environment ready');
}
