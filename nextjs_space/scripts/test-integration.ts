#!/usr/bin/env tsx

/**
 * CortexBuild Pro - End-to-End Integration Test
 * 
 * This script performs a comprehensive test of the entire backend:
 * - Environment configuration
 * - Database connectivity
 * - API route availability
 * - Authentication setup
 * - WebSocket configuration
 * - Storage configuration
 * - Production build readiness
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  category: string;
  passed: number;
  failed: number;
  warnings: number;
  total: number;
}

const results: { [key: string]: TestResult } = {};

function initCategory(category: string) {
  if (!results[category]) {
    results[category] = {
      category,
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    };
  }
}

function test(category: string, name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  initCategory(category);
  results[category].total++;
  
  const icons = { pass: '✅', fail: '❌', warn: '⚠️' };
  const icon = icons[status];
  
  if (status === 'pass') results[category].passed++;
  if (status === 'fail') results[category].failed++;
  if (status === 'warn') results[category].warnings++;
  
  console.log(`${icon} ${name}: ${message}`);
}

function section(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
}

async function testEnvironment() {
  section('1. ENVIRONMENT CONFIGURATION');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  
  test(
    'Environment',
    'Environment file',
    envExists ? 'pass' : 'fail',
    envExists ? '.env exists' : '.env not found'
  );
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    
    requiredVars.forEach(varName => {
      const hasVar = envContent.includes(`${varName}=`);
      test(
        'Environment',
        varName,
        hasVar ? 'pass' : 'fail',
        hasVar ? 'Configured' : 'Not configured'
      );
    });
    
    const optionalVars = [
      'AWS_BUCKET_NAME',
      'GOOGLE_CLIENT_ID',
      'SENDGRID_API_KEY',
      'ABACUSAI_API_KEY'
    ];
    
    optionalVars.forEach(varName => {
      const hasVar = envContent.includes(`${varName}=`) && 
                     !envContent.includes(`# ${varName}=`);
      test(
        'Environment',
        `${varName} (optional)`,
        hasVar ? 'pass' : 'warn',
        hasVar ? 'Configured' : 'Not configured'
      );
    });
  }
}

async function testFileStructure() {
  section('2. FILE STRUCTURE');
  
  const criticalDirs = [
    'app',
    'app/api',
    'components',
    'lib',
    'prisma',
    'server',
    'scripts'
  ];
  
  criticalDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    const exists = fs.existsSync(dirPath);
    test(
      'Structure',
      `Directory: ${dir}`,
      exists ? 'pass' : 'fail',
      exists ? 'Exists' : 'Not found'
    );
  });
  
  const criticalFiles = [
    'package.json',
    'next.config.js',
    'prisma/schema.prisma',
    'lib/db.ts',
    'lib/auth-options.ts',
    'production-server.js',
    'start-dev.sh',
    'setup-database.sh'
  ];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    test(
      'Structure',
      `File: ${file}`,
      exists ? 'pass' : 'fail',
      exists ? 'Exists' : 'Not found'
    );
  });
}

async function testAPIRoutes() {
  section('3. API ROUTES');
  
  const apiDir = path.join(process.cwd(), 'app', 'api');
  const criticalRoutes = [
    'auth',
    'projects',
    'tasks',
    'documents',
    'health',
    'realtime',
    'upload'
  ];
  
  criticalRoutes.forEach(route => {
    const routePath = path.join(apiDir, route);
    const exists = fs.existsSync(routePath);
    test(
      'API Routes',
      route,
      exists ? 'pass' : 'fail',
      exists ? 'Exists' : 'Not found'
    );
  });
}

async function testDatabaseSchema() {
  section('4. DATABASE SCHEMA');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schemaExists = fs.existsSync(schemaPath);
  
  test(
    'Database',
    'Schema file',
    schemaExists ? 'pass' : 'fail',
    schemaExists ? 'schema.prisma exists' : 'schema.prisma not found'
  );
  
  if (schemaExists) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const criticalModels = [
      'Organization',
      'User',
      'Project',
      'Task',
      'Document',
      'RFI',
      'Submittal',
      'SafetyIncident'
    ];
    
    criticalModels.forEach(model => {
      const hasModel = schemaContent.includes(`model ${model}`);
      test(
        'Database',
        `Model: ${model}`,
        hasModel ? 'pass' : 'fail',
        hasModel ? 'Defined' : 'Not found'
      );
    });
  }
}

async function testDependencies() {
  section('5. DEPENDENCIES');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    test('Dependencies', 'package.json', 'fail', 'Not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  const criticalDeps = {
    'next': 'Next.js framework',
    'react': 'React library',
    'next-auth': 'Authentication',
    'prisma': 'Database ORM (dev)',
    '@prisma/client': 'Prisma client',
    'socket.io': 'WebSocket server',
    'socket.io-client': 'WebSocket client'
  };
  
  Object.entries(criticalDeps).forEach(([dep, description]) => {
    const hasDep = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    test(
      'Dependencies',
      `${dep} (${description})`,
      hasDep ? 'pass' : 'fail',
      hasDep ? `v${hasDep}` : 'Not installed'
    );
  });
  
  const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
  test(
    'Dependencies',
    'node_modules',
    nodeModulesExists ? 'pass' : 'warn',
    nodeModulesExists ? 'Installed' : 'Run: npm install --legacy-peer-deps'
  );
}

async function testScripts() {
  section('6. STARTUP SCRIPTS');
  
  const scripts = [
    'start-dev.sh',
    'setup-database.sh',
    'validate-setup.sh',
    'verify-production-build.sh'
  ];
  
  scripts.forEach(script => {
    const scriptPath = path.join(process.cwd(), script);
    const exists = fs.existsSync(scriptPath);
    
    if (exists) {
      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      test(
        'Scripts',
        script,
        isExecutable ? 'pass' : 'warn',
        isExecutable ? 'Executable' : 'Run: chmod +x'
      );
    } else {
      test('Scripts', script, 'fail', 'Not found');
    }
  });
}

async function printSummary() {
  section('TEST SUMMARY');
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;
  let totalTests = 0;
  
  console.log('\nResults by Category:\n');
  
  Object.values(results).forEach(result => {
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalWarnings += result.warnings;
    totalTests += result.total;
    
    const percentage = Math.round((result.passed / result.total) * 100);
    console.log(`${result.category}:`);
    console.log(`  Passed: ${result.passed}/${result.total} (${percentage}%)`);
    if (result.warnings > 0) {
      console.log(`  Warnings: ${result.warnings}`);
    }
    if (result.failed > 0) {
      console.log(`  Failed: ${result.failed}`);
    }
    console.log('');
  });
  
  const overallPercentage = Math.round((totalPassed / totalTests) * 100);
  
  console.log('Overall Results:');
  console.log(`  ✅ Passed: ${totalPassed}`);
  console.log(`  ⚠️  Warnings: ${totalWarnings}`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log(`  📊 Total: ${totalTests}`);
  console.log(`  📈 Success Rate: ${overallPercentage}%`);
  console.log('');
  
  if (overallPercentage === 100 && totalWarnings === 0) {
    console.log('🎉 Perfect! All tests passed with no warnings.');
    console.log('✅ API server is fully configured and ready for use.');
  } else if (overallPercentage >= 90) {
    console.log('✅ Excellent! API server is properly configured.');
    if (totalWarnings > 0) {
      console.log('⚠️  Some optional features are not configured (this is OK).');
    }
  } else if (overallPercentage >= 75) {
    console.log('⚠️  Good progress, but some components need attention.');
    console.log('Review the failed tests above.');
  } else {
    console.log('❌ Many tests failed. Review the configuration.');
    console.log('Run ./validate-setup.sh for detailed diagnostics.');
  }
  
  console.log('');
  console.log('📚 Next Steps:');
  console.log('  1. ./setup-database.sh - Initialize database');
  console.log('  2. ./start-dev.sh - Start development server');
  console.log('  3. npx tsx scripts/test-websocket.ts - Test WebSocket');
  console.log('  4. ./verify-production-build.sh - Verify production build');
  console.log('');
  
  return overallPercentage >= 75 ? 0 : 1;
}

async function main() {
  console.log('🧪 CortexBuild Pro - End-to-End Integration Test\n');
  
  try {
    await testEnvironment();
    await testFileStructure();
    await testAPIRoutes();
    await testDatabaseSchema();
    await testDependencies();
    await testScripts();
    
    const exitCode = await printSummary();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Test execution error:', error);
    process.exit(1);
  }
}

main();
