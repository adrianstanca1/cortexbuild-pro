// Simple test to verify server can start without errors
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

process.env.NODE_ENV = 'test';

import { initializeDatabase } from './database.js';
import { logger } from './utils/logger.js';

async function testStartup() {
    try {
        logger.info('Testing database initialization...');
        const db = await initializeDatabase();
        logger.info('Database initialized successfully!');
        
        // Test a simple query
        const result = await db.get('SELECT 1 as test');
        logger.info('Database query test:', result);
        
        // Close database
        await db.close();
        logger.info('Database closed successfully');
        
        console.log('✅ All startup tests passed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Startup test failed:', error);
        process.exit(1);
    }
}

testStartup();
