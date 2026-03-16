import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export async function addInspectionsTable(db: Database.Database) {
    logger.info('Adding inspections table...');

    db.exec(`
        CREATE TABLE IF NOT EXISTS inspections (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            companyId TEXT NOT NULL,
            inspectionNumber TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            scheduledDate TEXT NOT NULL,
            inspector TEXT NOT NULL,
            status TEXT DEFAULT 'scheduled',
            location TEXT,
            checklist TEXT,
            findings TEXT,
            deficiencies TEXT,
            passFailStatus TEXT,
            notes TEXT,
            photos TEXT,
            attachments TEXT,
            completedAt TEXT,
            createdBy TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id),
            FOREIGN KEY (companyId) REFERENCES companies(id)
        );
        
        CREATE TABLE IF NOT EXISTS inspection_templates (
            id TEXT PRIMARY KEY,
            companyId TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            checklist TEXT NOT NULL,
            description TEXT,
            isActive INTEGER DEFAULT 1,
            createdBy TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (companyId) REFERENCES companies(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(projectId);
        CREATE INDEX IF NOT EXISTS idx_inspections_company ON inspections(companyId);
        CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
        CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(type);
        CREATE INDEX IF NOT EXISTS idx_inspection_templates_company ON inspection_templates(companyId);
    `);

    logger.info('✅ Inspections tables created');
}
