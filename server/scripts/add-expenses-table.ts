import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

/**
 * Migration: Add expenses table
 * 
 * This migration adds a dedicated expenses table to support
 * financial tracking and reporting in the dashboard.
 */

const dbPath = process.env.NODE_ENV === 'production'
    ? '/tmp/buildpro_db.sqlite'
    : './buildpro_db.sqlite';

const db = new Database(dbPath);

try {
    console.log('Starting migration: Add expenses table...');

    // Check if table already exists
    const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='expenses'
  `).get();

    if (tableExists) {
        console.log('✅ Expenses table already exists, skipping migration');
        process.exit(0);
    }

    // Create expenses table
    db.exec(`
    CREATE TABLE IF NOT EXISTS expenses(
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT,
      category TEXT,
      amount REAL NOT NULL,
      description TEXT,
      vendor TEXT,
      date TEXT,
      paymentMethod TEXT,
      receiptUrl TEXT,
      status TEXT DEFAULT 'pending',
      approvedBy TEXT,
      createdBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies (id),
      FOREIGN KEY (projectId) REFERENCES projects (id)
    )
  `);

    console.log('✅ Successfully created expenses table');

    // Add some sample data
    const sampleExpenses = [
        {
            id: 'exp-1',
            companyId: 'c1',
            category: 'Equipment',
            amount: 1250.00,
            description: 'Concrete mixer rental',
            vendor: 'Equipment Rentals Inc',
            date: new Date().toISOString(),
            status: 'approved'
        },
        {
            id: 'exp-2',
            companyId: 'c1',
            category: 'Materials',
            amount: 850.50,
            description: 'Steel rebar - 500 units',
            vendor: 'BuildMart Supplies',
            date: new Date(Date.now() - 86400000).toISOString(), // yesterday
            status: 'pending'
        }
    ];

    const insertStmt = db.prepare(`
    INSERT INTO expenses (id, companyId, category, amount, description, vendor, date, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const expense of sampleExpenses) {
        insertStmt.run(
            expense.id,
            expense.companyId,
            expense.category,
            expense.amount,
            expense.description,
            expense.vendor,
            expense.date,
            expense.status,
            new Date().toISOString()
        );
        console.log(`✅ Added sample expense: ${expense.description}`);
    }

    console.log('✅ Migration completed successfully');
    db.close();
    process.exit(0);

} catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
}
