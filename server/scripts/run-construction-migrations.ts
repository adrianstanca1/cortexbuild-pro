import { getDb, initializeDatabase } from '../database.js';
import { logger } from '../utils/logger.js';
import { addPCOsTable } from '../migrations/add_pcos_table.js';
import { addChangeOrdersTable } from '../migrations/add_change_orders_table.js';
import { addNCRsTable } from '../migrations/add_ncrs_table.js';
import { addInspectionsTable } from '../migrations/add_inspections_table.js';

async function runConstructionMigrations() {
    logger.info('Starting construction module migrations...');

    try {
        await initializeDatabase();
        const db = getDb();

        // Run migrations
        await addPCOsTable(db as any);
        await addChangeOrdersTable(db as any);
        await addNCRsTable(db as any);
        await addInspectionsTable(db as any);

        logger.info('✅ All construction module migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runConstructionMigrations();
