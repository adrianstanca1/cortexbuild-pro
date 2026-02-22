import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export async function addNCRsTable(db: Database.Database) {
    logger.info('Adding NCRs table...');

    db.exec(`
        CREATE TABLE IF NOT EXISTS ncrs (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            companyId TEXT NOT NULL,
            ncrNumber TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT,
            discoveredBy TEXT NOT NULL,
            discoveredDate TEXT NOT NULL,
            severity TEXT DEFAULT 'medium',
            category TEXT,
            status TEXT DEFAULT 'open',
            rootCause TEXT,
            correctiveAction TEXT,
            preventiveAction TEXT,
            assignedTo TEXT,
            dueDate TEXT,
            closedBy TEXT,
            closedAt TEXT,
            photos TEXT,
            attachments TEXT,
            createdBy TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id),
            FOREIGN KEY (companyId) REFERENCES companies(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_ncrs_project ON ncrs(projectId);
        CREATE INDEX IF NOT EXISTS idx_ncrs_company ON ncrs(companyId);
        CREATE INDEX IF NOT EXISTS idx_ncrs_status ON ncrs(status);
        CREATE INDEX IF NOT EXISTS idx_ncrs_severity ON ncrs(severity);
    `);

    logger.info('✅ NCRs table created');
}
