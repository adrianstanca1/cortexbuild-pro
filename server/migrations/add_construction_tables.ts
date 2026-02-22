/**
 * Migration: Add Construction Module Tables
 * 
 * This script adds all database tables required for the construction module
 * including materials, change orders, submittals, progress photos, weather, and concrete tracking.
 * 
 * Run this after database initialization to add construction tables.
 */

import { initializeDatabase, getDb } from '../database.js';
import { logger } from '../utils/logger.js';

export async function addConstructionTables() {
    // Initialize database first
    await initializeDatabase();
    const db = getDb();
    logger.info('[Migration] Adding Construction Module tables...');

    try {
        // Inspections
        await db.exec(`
      CREATE TABLE IF NOT EXISTS inspections(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        date TEXT NOT NULL,
        inspector TEXT NOT NULL,
        findings TEXT,
        photos TEXT,
        passedCount INTEGER DEFAULT 0,
        failedCount INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'completed',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created inspections table');

        // Quality Issues
        await db.exec(`
      CREATE TABLE IF NOT EXISTS quality_issues(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        inspectionId VARCHAR(255),
        severity VARCHAR(50) NOT NULL,
        description TEXT,
        location TEXT,
        assignedTo VARCHAR(255),
        photos TEXT,
        status VARCHAR(50) DEFAULT 'open',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created quality_issues table');

        // Material Deliveries
        await db.exec(`
      CREATE TABLE IF NOT EXISTS material_deliveries(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        material TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit VARCHAR(50),
        supplier TEXT,
        deliveryDate TEXT NOT NULL,
        poNumber VARCHAR(100),
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created material_deliveries table');

        // Material Inventory
        await db.exec(`
      CREATE TABLE IF NOT EXISTS material_inventory(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        material TEXT NOT NULL,
        quantity REAL DEFAULT 0,
        onSite REAL DEFAULT 0,
        allocated REAL DEFAULT 0,
        available REAL DEFAULT 0,
        unit VARCHAR(50),
        location TEXT,
        lastUpdated TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created material_inventory table');

        // Material Requisitions
        await db.exec(`
      CREATE TABLE IF NOT EXISTS material_requisitions(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        requestedBy VARCHAR(255),
        material TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit VARCHAR(50),
        urgency VARCHAR(50) DEFAULT 'normal',
        neededBy TEXT,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created material_requisitions table');

        // Change Orders
        await db.exec(`
      CREATE TABLE IF NOT EXISTS change_orders(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        number VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        reason TEXT,
        costImpact REAL DEFAULT 0,
        scheduleDays INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        submittedBy VARCHAR(255),
        approvedBy VARCHAR(255),
        approvedAt TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created change_orders table');

        // Change Order Items
        await db.exec(`
      CREATE TABLE IF NOT EXISTS change_order_items(
        id VARCHAR(255) PRIMARY KEY,
        changeOrderId VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        quantity REAL,
        unit VARCHAR(50),
        unitCost REAL,
        total REAL,
        category VARCHAR(100),
        FOREIGN KEY(changeOrderId) REFERENCES change_orders(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created change_order_items table');

        // Submittals
        await db.exec(`
      CREATE TABLE IF NOT EXISTS submittals(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        number VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        type VARCHAR(100),
        specSection VARCHAR(100),
        submittedBy VARCHAR(255),
        dateSubmitted TEXT,
        dueDate TEXT,
        status VARCHAR(50) DEFAULT 'Submitted',
        reviewer VARCHAR(255),
        reviewedDate TEXT,
        documentUrl TEXT,
        revision INTEGER DEFAULT 1,
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created submittals table');

        // Submittal Revisions
        await db.exec(`
      CREATE TABLE IF NOT EXISTS submittal_revisions(
        id VARCHAR(255) PRIMARY KEY,
        submittalId VARCHAR(255) NOT NULL,
        revision INTEGER NOT NULL,
        dateSubmitted TEXT,
        submittedBy VARCHAR(255),
        status VARCHAR(50),
        reviewedBy VARCHAR(255),
        reviewedDate TEXT,
        comments TEXT,
        FOREIGN KEY(submittalId) REFERENCES submittals(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created submittal_revisions table');

        // Progress Photos
        await db.exec(`
      CREATE TABLE IF NOT EXISTS progress_photos(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        location TEXT,
        photoUrl TEXT NOT NULL,
        thumbnailUrl TEXT,
        photoType VARCHAR(50) DEFAULT 'standard',
        captureDate TEXT NOT NULL,
        tags TEXT,
        description TEXT,
        latitude REAL,
        longitude REAL,
        viewAngle VARCHAR(50),
        floor VARCHAR(50),
        zone VARCHAR(50),
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created progress_photos table');

        // Weather Delays
        await db.exec(`
      CREATE TABLE IF NOT EXISTS weather_delays(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        date TEXT NOT NULL,
        weatherType VARCHAR(100) NOT NULL,
        description TEXT,
        hoursLost REAL DEFAULT 0,
        costImpact REAL DEFAULT 0,
        affectedActivities TEXT,
        temperature REAL,
        windSpeed REAL,
        precipitation REAL,
        createdBy VARCHAR(255),
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created weather_delays table');

        // Concrete Pours
        await db.exec(`
      CREATE TABLE IF NOT EXISTS concrete_pours(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        pourDate TEXT NOT NULL,
        location TEXT NOT NULL,
        element TEXT,
        volume REAL NOT NULL,
        unit VARCHAR(50) DEFAULT 'CY',
        mixDesign VARCHAR(100),
        supplier TEXT,
        temperature REAL,
        slump REAL,
        airContent REAL,
        waterCementRatio REAL,
        truckCount INTEGER,
        startTime TEXT,
        endTime TEXT,
        weatherConditions TEXT,
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created concrete_pours table');

        // Concrete Tests
        await db.exec(`
      CREATE TABLE IF NOT EXISTS concrete_tests(
        id VARCHAR(255) PRIMARY KEY,
        pourId VARCHAR(255) NOT NULL,
        testDate TEXT NOT NULL,
        testAge INTEGER NOT NULL,
        strength REAL,
        targetStrength REAL,
        testType VARCHAR(100) DEFAULT 'Compression',
        passed BOOLEAN DEFAULT FALSE,
        labReportUrl TEXT,
        testLocation TEXT,
        sampleNumber VARCHAR(50),
        testedBy TEXT,
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(pourId) REFERENCES concrete_pours(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created concrete_tests table');

        // Subcontractor Insurance
        await db.exec(`
      CREATE TABLE IF NOT EXISTS subcontractor_insurance(
        id VARCHAR(255) PRIMARY KEY,
        subcontractorId VARCHAR(255) NOT NULL,
        policyType VARCHAR(100) NOT NULL,
        carrier TEXT NOT NULL,
        policyNumber VARCHAR(100),
        coverageAmount REAL,
        effectiveDate TEXT,
        expiryDate TEXT,
        certificateUrl TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `);
        logger.info('[Migration] ✓ Created subcontractor_insurance table');

        // Payment Applications
        await db.exec(`
      CREATE TABLE IF NOT EXISTS payment_applications(
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255) NOT NULL,
        subcontractorId VARCHAR(255),
        applicationNumber INTEGER NOT NULL,
        period TEXT,
        amountRequested REAL DEFAULT 0,
        previouslyApproved REAL DEFAULT 0,
        retainagePercent REAL DEFAULT 10,
        retainageAmount REAL DEFAULT 0,
        netPayment REAL DEFAULT 0,
        submittedDate TEXT,
        status VARCHAR(50) DEFAULT 'submitted',
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
        logger.info('[Migration] ✓ Created payment_applications table');

        logger.info('[Migration] ✅ Construction Module tables added successfully!');
        console.log('\n🎉 All construction tables created successfully!\n');

        return { success: true, message: 'Construction tables added' };
    } catch (error) {
        logger.error('[Migration] ❌ Failed to add construction tables:', error);
        throw error;
    }
}

// Allow running this migration standalone
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        try {
            await addConstructionTables();
            process.exit(0);
        } catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    })();
}
