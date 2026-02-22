import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export async function addChangeOrdersTable(db: Database.Database) {
    logger.info('Adding change_orders table...');

    db.exec(`
        CREATE TABLE IF NOT EXISTS change_orders (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            companyId TEXT NOT NULL,
            pcoId TEXT,
            coNumber TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            originalCost REAL NOT NULL,
            revisedCost REAL NOT NULL,
            costDelta REAL NOT NULL,
            originalDays INTEGER NOT NULL,
            revisedDays INTEGER NOT NULL,
            daysDelta INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            approvedBy TEXT,
            approvedAt TEXT,
            executedAt TEXT,
            reasonForChange TEXT,
            impact TEXT,
            attachments TEXT,
            createdBy TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id),
            FOREIGN KEY (companyId) REFERENCES companies(id),
            FOREIGN KEY (pcoId) REFERENCES pcos(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(projectId);
        CREATE INDEX IF NOT EXISTS idx_change_orders_company ON change_orders(companyId);
        CREATE INDEX IF NOT EXISTS idx_change_orders_pco ON change_orders(pcoId);
        CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
    `);

    logger.info('✅ Change orders table created');
}
