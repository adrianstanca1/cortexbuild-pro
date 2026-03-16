import { initializeDatabase } from '../database.js';
import { trialService } from '../services/trialService.js';
import { logger } from '../utils/logger.js';

async function runWorker() {
    try {
        logger.info('Starting Trial System Worker...');

        // Ensure DB is connected
        await initializeDatabase();

        logger.info('Processing trial expiration warnings...');
        await trialService.sendExpirationWarnings();

        logger.info('Processing expired trials...');
        await trialService.expireEndedTrials();

        logger.info('Trial System Worker completed successfully.');
        process.exit(0);
    } catch (error) {
        logger.error('Trial System Worker failed:', error);
        process.exit(1);
    }
}

runWorker();
