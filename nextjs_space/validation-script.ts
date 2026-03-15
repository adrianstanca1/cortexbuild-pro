#!/usr/bin/env ts-node

/**
 * Validation Script for CortexBuild Pro
 * Verifies the existence and basic structure of implemented features
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const rootDir = __dirname;

interface FeatureValidation {
  name: string;
  exists: boolean;
  details: string[];
  errors: string[];
}

const validateDirectory = (path: string): FeatureValidation => {
  const fullPath = join(rootDir, path);
  const exists = existsSync(fullPath);

  const result: FeatureValidation = {
    name: path.split('/').pop() || path,
    exists: exists,
    details: [],
    errors: []
  };

  if (!exists) {
    result.errors.push(`Directory not found: ${path}`);
    return result;
  }

  try {
    const items = readdirSync(fullPath);
    result.details.push(`Contains ${items.length} items`);

    // Check for key files
    const hasPageTSX = items.includes('page.tsx');
    const hasLayoutTSX = items.includes('layout.tsx');

    if (hasPageTSX) result.details.push('✓ Contains page.tsx');
    else result.errors.push('✗ Missing page.tsx');

    if (hasLayoutTSX) result.details.push('✓ Contains layout.tsx');
    else result.details.push('○ No layout.tsx (optional)');

  } catch (error: unknown) {
    result.errors.push(`Error reading directory: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
};

const validateAPIRoute = (path: string): FeatureValidation => {
  const fullPath = join(rootDir, 'app', 'api', path);
  const exists = existsSync(fullPath);

  const result: FeatureValidation = {
    name: `API/${path}`,
    exists: exists,
    details: [],
    errors: []
  };

  if (!exists) {
    result.errors.push(`API route not found: /api/${path}`);
    return result;
  }

  try {
    const items = readdirSync(fullPath);
    result.details.push(`Contains ${items.length} items`);

    // Check for route file
    const hasRouteTS = items.includes('route.ts');
    const hasPageTS = items.includes('page.ts');

    if (hasRouteTS || hasPageTS) {
      result.details.push('✓ Contains route handler');
    } else {
      result.errors.push('✗ Missing route handler (route.ts or page.ts)');
    }

  } catch (error: unknown) {
    result.errors.push(`Error reading API directory: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
};

const runValidation = () => {
  console.log('🔍 CortexBuild Pro Feature Validation\n');

  // Validate the 5 dashboard pages mentioned in roadmap
  const dashboardPages = [
    'certifications',
    'site-access',
    'notifications',
    'toolbox-talks',
    'risk-assessments'
  ];

  console.log('📊 DASHBOARD PAGES VALIDATION');
  console.log('='.repeat(50));

  let dashboardPassed = 0;
  for (const page of dashboardPages) {
    const validation = validateDirectory(`app/(dashboard)/${page}`);

    console.log(`\n${validation.exists ? '✅' : '❌'} ${validation.name}`);
    if (validation.details.length > 0) {
      validation.details.forEach(detail => console.log(`  ${detail}`));
    }
    if (validation.errors.length > 0) {
      validation.errors.forEach(error => console.log(`  ${error}`));
    } else {
      dashboardPassed++;
    }
  }

  console.log(`\n📈 Dashboard Pages: ${dashboardPassed}/${dashboardPages.length} passed`);

  // Validate key API integrations mentioned in roadmap
  const apiRoutes = [
    'ai',           // OpenAI
    'notifications', // Likely Twilio/SendGrid
    'upload',       // Likely AWS S3
    'webhooks'      // Webhook integrations
  ];

  console.log('\n\n🔌 API INTEGRATIONS VALIDATION');
  console.log('='.repeat(50));

  let apiPassed = 0;
  for (const route of apiRoutes) {
    const validation = validateAPIRoute(route);

    console.log(`\n${validation.exists ? '✅' : '❌'} ${validation.name}`);
    if (validation.details.length > 0) {
      validation.details.forEach(detail => console.log(`  ${detail}`));
    }
    if (validation.errors.length > 0) {
      validation.errors.forEach(error => console.log(`  ${error}`));
    } else {
      apiPassed++;
    }
  }

  console.log(`\n📈 API Integrations: ${apiPassed}/${apiRoutes.length} passed`);

  // Validate core files
  console.log('\n\n📁 CORE FILES VALIDATION');
  console.log('='.repeat(50));

  const coreFiles = [
    'app/layout.tsx',
    'app/(dashboard)/layout.tsx',
    'lib/db.ts',
    'lib/types.ts',
    'hooks/use-toast.ts' // The one we kept after deduplication
  ];

  let corePassed = 0;
  for (const file of coreFiles) {
    const exists = existsSync(join(rootDir, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (exists) corePassed++;
  }

  console.log(`\n📈 Core Files: ${corePassed}/${coreFiles.length} passed`);

  // Summary
  console.log('\n\n🎯 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  const totalPossible = dashboardPages.length + apiRoutes.length + coreFiles.length;
  const totalPassed = dashboardPassed + apiPassed + corePassed;

  console.log(f`Overall: ${totalPassed}/${totalPossible} checks passed`);

  if (totalPassed === totalPossible) {
    console.log('🎉 All validations passed! Features appear to be intact.');
    process.exit(0);
  } else {
    console.log('⚠️  Some validations failed. Please review the errors above.');
    process.exit(1);
  }
};

// Helper for template literals in console.log
const f = (strings: TemplateStringsArray, ...values: any[]) => {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) result += values[i];
  }
  return result;
};

runValidation();