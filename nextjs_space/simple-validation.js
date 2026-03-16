#!/usr/bin/env node

/**
 * Simple Validation Script for CortexBuild Pro
 * Verifies the existence of implemented features using Node.js fs module
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

const validateDirectory = (filePath) => {
  const fullPath = path.join(rootDir, filePath);
  return fs.existsSync(fullPath);
};

const runValidation = () => {
  console.log('🔍 CortexBuild Pro Simple Feature Validation\n');

  // Validate the 5 dashboard pages mentioned in roadmap
  const dashboardPages = [
    'app/(dashboard)/certifications',
    'app/(dashboard)/site-access',
    'app/(dashboard)/notifications',
    'app/(dashboard)/toolbox-talks',
    'app/(dashboard)/risk-assessments'
  ];

  console.log('📊 DASHBOARD PAGES VALIDATION');
  console.log('='.repeat(50));

  let dashboardPassed = 0;
  for (const pagePath of dashboardPages) {
    const pageName = pagePath.split('/').pop();
    const exists = validateDirectory(pagePath);

    console.log(`${exists ? '✅' : '❌'} ${pageName}`);
    if (exists) dashboardPassed++;
  }

  console.log(`\n📈 Dashboard Pages: ${dashboardPassed}/${dashboardPages.length} passed`);

  // Validate key API integrations
  const apiRoutes = [
    'app/api/ai',
    'app/api/notifications',
    'app/api/upload',
    'app/api/webhooks'
  ];

  console.log('\n\n🔌 API INTEGRATIONS VALIDATION');
  console.log('='.repeat(50));

  let apiPassed = 0;
  for (const apiPath of apiRoutes) {
    const apiName = apiPath.split('/').pop();
    const exists = validateDirectory(apiPath);

    console.log(`${exists ? '✅' : '❌'} ${apiName}`);
    if (exists) apiPassed++;
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
    'hooks/use-toast.ts'
  ];

  let corePassed = 0;
  for (const filePath of coreFiles) {
    const fileName = path.basename(filePath);
    const exists = validateDirectory(filePath);

    console.log(`${exists ? '✅' : '❌'} ${fileName}`);
    if (exists) corePassed++;
  }

  console.log(`\n📈 Core Files: ${corePassed}/${coreFiles.length} passed`);

  // Summary
  console.log('\n\n🎯 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  const totalPossible = dashboardPages.length + apiRoutes.length + coreFiles.length;
  const totalPassed = dashboardPassed + apiPassed + corePassed;

  console.log(`Overall: ${totalPassed}/${totalPossible} checks passed`);

  if (totalPassed === totalPossible) {
    console.log('🎉 All validations passed! Core features appear to be intact.');
    return true;
  } else {
    console.log('⚠️  Some validations failed. Please review the missing items above.');
    return false;
  }
};

const success = runValidation();
process.exit(success ? 0 : 1);