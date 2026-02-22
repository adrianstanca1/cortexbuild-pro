import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export async function addPCOsTable(db: Database.Database) {
    logger.info('Adding PCOs table...');

    db.exec(`
        CREATE TABLE IF NOT EXISTS pcos (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            companyId TEXT NOT NULL,
            pcoNumber TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            requestedBy TEXT NOT NULL,
            requestDate TEXT NOT NULL,
            estimatedCost REAL,
            estimatedDays INTEGER,
            status TEXT DEFAULT 'draft',
            priority TEXT DEFAULT 'medium',
            category TEXT,
            attachments TEXT,
            createdBy TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id),
            FOREIGN KEY (companyId) REFERENCES companies(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_pcos_project ON pcos(projectId);
        CREATE INDEX IF NOT EXISTS idx_pcos_company ON pcos(companyId);
        CREATE INDEX IF NOT EXISTS idx_pcos_status ON pcos(status);
    `);

    logger.info('✅ PCOs table created');
}
