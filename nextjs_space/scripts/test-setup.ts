#!/usr/bin/env tsx

/**
 * CortexBuild Pro - API Integration Test
 * 
 * This script tests the API server setup and configuration
 * without requiring a running server or database connection.
 * 
 * It validates:
 * - Environment configuration
 * - API route structure
 * - Database models
 * - Authentication setup
 * - WebSocket configuration
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

function section(title: string) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
}

async function main() {
  console.log('🧪 CortexBuild Pro - API Integration Test\n');

  // Test 1: Environment Configuration
  section('1. Environment Configuration');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  test(
    'Environment file',
    envExists,
    envExists ? '.env file exists' : '.env file not found'
  );

  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    test(
      'DATABASE_URL',
      envContent.includes('DATABASE_URL='),
      envContent.includes('DATABASE_URL=') ? 'Configured' : 'Not configured'
    );
    
    test(
      'NEXTAUTH_SECRET',
      envContent.includes('NEXTAUTH_SECRET='),
      envContent.includes('NEXTAUTH_SECRET=') ? 'Configured' : 'Not configured'
    );
    
    test(
      'NEXTAUTH_URL',
      envContent.includes('NEXTAUTH_URL='),
      envContent.includes('NEXTAUTH_URL=') ? 'Configured' : 'Not configured'
    );
  }

  // Test 2: API Route Structure
  section('2. API Route Structure');
  
  const apiPath = path.join(process.cwd(), 'app', 'api');
  const apiExists = fs.existsSync(apiPath);
  test(
    'API directory',
    apiExists,
    apiExists ? 'app/api directory exists' : 'app/api directory not found'
  );

  if (apiExists) {
    const criticalRoutes = [
      'auth',
      'projects',
      'tasks',
      'documents',
      'health',
      'realtime'
    ];

    criticalRoutes.forEach(route => {
      const routePath = path.join(apiPath, route);
      const exists = fs.existsSync(routePath);
      test(
        `API route: ${route}`,
        exists,
        exists ? 'Exists' : 'Not found'
      );
    });
  }

  // Test 3: Database Schema
  section('3. Database Schema');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schemaExists = fs.existsSync(schemaPath);
  test(
    'Prisma schema',
    schemaExists,
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
      'Submittal'
    ];

    criticalModels.forEach(model => {
      const hasModel = schemaContent.includes(`model ${model}`);
      test(
        `Database model: ${model}`,
        hasModel,
        hasModel ? 'Defined' : 'Not found'
      );
    });
  }

  // Test 4: Core Libraries
  section('4. Core Libraries');
  
  const coreLibs = [
    'lib/db.ts',
    'lib/auth-options.ts',
    'lib/realtime-clients.ts',
    'lib/s3.ts',
    'lib/email-service.ts'
  ];

  coreLibs.forEach(lib => {
    const libPath = path.join(process.cwd(), lib);
    const exists = fs.existsSync(libPath);
    test(
      `Library: ${lib}`,
      exists,
      exists ? 'Exists' : 'Not found'
    );
  });

  // Test 5: Server Configuration
  section('5. Server Configuration');
  
  const serverFiles = [
    'production-server.js',
    'server/socket-io-server.ts',
    'next.config.js'
  ];

  serverFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    test(
      `Server file: ${file}`,
      exists,
      exists ? 'Exists' : 'Not found'
    );
  });

  // Test 6: Startup Scripts
  section('6. Startup Scripts');
  
  const scripts = [
    'start-dev.sh',
    'setup-database.sh',
    'validate-setup.sh'
  ];

  scripts.forEach(script => {
    const scriptPath = path.join(process.cwd(), script);
    const exists = fs.existsSync(scriptPath);
    
    if (exists) {
      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      test(
        `Script: ${script}`,
        isExecutable,
        isExecutable ? 'Executable' : 'Not executable (run: chmod +x)'
      );
    } else {
      test(
        `Script: ${script}`,
        false,
        'Not found'
      );
    }
  });

  // Test 7: Package Configuration
  section('7. Package Configuration');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageExists = fs.existsSync(packagePath);
  test(
    'package.json',
    packageExists,
    packageExists ? 'Exists' : 'Not found'
  );

  if (packageExists) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    test(
      'Prisma dependency',
      !!packageJson.devDependencies?.prisma,
      packageJson.devDependencies?.prisma ? 'Installed' : 'Not installed'
    );
    
    test(
      'Next.js dependency',
      !!packageJson.dependencies?.next,
      packageJson.dependencies?.next ? 'Installed' : 'Not installed'
    );
    
    test(
      'Socket.IO dependency',
      !!packageJson.dependencies?.['socket.io'],
      packageJson.dependencies?.['socket.io'] ? 'Installed' : 'Not installed'
    );
    
    test(
      'Prisma seed script',
      !!packageJson.prisma?.seed,
      packageJson.prisma?.seed ? 'Configured' : 'Not configured'
    );
  }

  // Summary
  section('Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`\nPassed: ${passed}/${total} (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('\n🎉 All tests passed! API server is properly configured.');
    console.log('\nNext steps:');
    console.log('1. Run ./setup-database.sh to initialize the database');
    console.log('2. Run ./start-dev.sh to start the development server');
    console.log('3. Access the application at http://localhost:3000');
  } else if (percentage >= 80) {
    console.log('\n⚠️  Most tests passed, but some components are missing.');
    console.log('Review the failed tests above and fix any issues.');
  } else {
    console.log('\n❌ Many tests failed. Please review the configuration.');
    console.log('Run ./validate-setup.sh for more detailed diagnostics.');
  }
  
  console.log('');
  
  // Exit with appropriate code
  process.exit(percentage >= 80 ? 0 : 1);
}

main().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
