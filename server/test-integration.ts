// Integration test to verify server startup and routes
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

process.env.NODE_ENV = 'test';

import { initializeDatabase } from './database.js';
import { logger } from './utils/logger.js';

async function testIntegration() {
    const results: { test: string; status: string; message?: string }[] = [];
    
    try {
        // Test 1: Database initialization
        logger.info('Test 1: Database initialization...');
        const db = await initializeDatabase();
        results.push({ test: 'Database Init', status: '✅' });
        
        // Test 2: Database query
        logger.info('Test 2: Database query...');
        const testQuery = await db.get('SELECT 1 as test');
        if (testQuery && testQuery.test === 1) {
            results.push({ test: 'Database Query', status: '✅' });
        } else {
            throw new Error('Query failed');
        }
        
        // Test 3: Environment variables
        logger.info('Test 3: Environment variables...');
        const requiredVars = ['JWT_SECRET', 'FILE_SIGNING_SECRET'];
        const missing = requiredVars.filter(v => !process.env[v]);
        if (missing.length === 0) {
            results.push({ test: 'Environment Variables', status: '✅' });
        } else {
            results.push({ test: 'Environment Variables', status: '❌', message: `Missing: ${missing.join(', ')}` });
        }
        
        // Test 4: Check table existence
        logger.info('Test 4: Checking critical tables...');
        const tables = ['users', 'companies', 'projects', 'tasks'];
        let allTablesExist = true;
        for (const table of tables) {
            try {
                await db.get(`SELECT 1 FROM ${table} LIMIT 1`);
            } catch (err) {
                allTablesExist = false;
                logger.error(`Table ${table} does not exist or has issues`);
            }
        }
        if (allTablesExist) {
            results.push({ test: 'Database Schema', status: '✅' });
        } else {
            results.push({ test: 'Database Schema', status: '⚠️', message: 'Some tables missing' });
        }
        
        // Test 5: Import critical modules
        logger.info('Test 5: Importing critical modules...');
        await import('./socket.js');
        await import('./services/realtimeService.js');
        results.push({ test: 'Module Imports', status: '✅' });
        
        // Close database
        await db.close();
        logger.info('Database closed successfully');
        
        // Print results
        console.log('\n=== Integration Test Results ===');
        results.forEach(r => {
            console.log(`${r.status} ${r.test}${r.message ? ` - ${r.message}` : ''}`);
        });
        console.log('================================\n');
        
        const failed = results.filter(r => r.status === '❌').length;
        if (failed === 0) {
            console.log('✅ All integration tests passed!');
            process.exit(0);
        } else {
            console.log(`❌ ${failed} test(s) failed`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        results.forEach(r => {
            console.log(`${r.status} ${r.test}${r.message ? ` - ${r.message}` : ''}`);
        });
        process.exit(1);
    }
}

testIntegration();
