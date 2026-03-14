import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

export async function up() {
  const db = getDb();
  
  logger.info('Creating document management tables...');

  // Documents table with enhanced fields
  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      name TEXT NOT NULL,
      originalName TEXT,
      type VARCHAR(100) NOT NULL,
      mimeType VARCHAR(255),
      size BIGINT,
      path TEXT NOT NULL,
      url TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      category VARCHAR(100),
      tags TEXT,
      description TEXT,
      extractedText TEXT,
      ocrData TEXT,
      ocrConfidence REAL,
      ocrProcessedAt TEXT,
      currentVersion INTEGER DEFAULT 1,
      isLatestVersion BOOLEAN DEFAULT TRUE,
      parentDocumentId VARCHAR(255),
      createdBy VARCHAR(255),
      createdByName TEXT,
      updatedBy VARCHAR(255),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      deletedBy VARCHAR(255),
      isDeleted BOOLEAN DEFAULT FALSE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(parentDocumentId) REFERENCES documents(id) ON DELETE SET NULL
    )
  `);

  // Document versions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id VARCHAR(255) PRIMARY KEY,
      documentId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      versionNumber INTEGER NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      size BIGINT,
      mimeType VARCHAR(255),
      changeDescription TEXT,
      createdBy VARCHAR(255),
      createdByName TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Document approvals workflow
  await db.exec(`
    CREATE TABLE IF NOT EXISTS document_approvals (
      id VARCHAR(255) PRIMARY KEY,
      documentId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      workflowId VARCHAR(255),
      approverId VARCHAR(255) NOT NULL,
      approverName TEXT,
      approverRole TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      orderIndex INTEGER DEFAULT 0,
      comments TEXT,
      signedAt TEXT,
      signatureData TEXT,
      dueDate TEXT,
      remindedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Approval workflows definition
  await db.exec(`
    CREATE TABLE IF NOT EXISTS approval_workflows (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      documentTypes TEXT,
      isActive BOOLEAN DEFAULT TRUE,
      steps TEXT NOT NULL,
      createdBy VARCHAR(255),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Digital signatures
  await db.exec(`
    CREATE TABLE IF NOT EXISTS digital_signatures (
      id VARCHAR(255) PRIMARY KEY,
      documentId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      userName TEXT,
      signatureType VARCHAR(50) DEFAULT 'electronic',
      signatureData TEXT,
      certificateId VARCHAR(255),
      certificateData TEXT,
      signedAt TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      verificationHash TEXT,
      isValid BOOLEAN DEFAULT TRUE,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Document templates
  await db.exec(`
    CREATE TABLE IF NOT EXISTS document_templates (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category VARCHAR(100),
      templateType VARCHAR(50) DEFAULT 'docx',
      content TEXT,
      variables TEXT,
      sampleData TEXT,
      isSystemTemplate BOOLEAN DEFAULT FALSE,
      isActive BOOLEAN DEFAULT TRUE,
      createdBy VARCHAR(255),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Generated documents from templates
  await db.exec(`
    CREATE TABLE IF NOT EXISTS generated_documents (
      id VARCHAR(255) PRIMARY KEY,
      templateId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      name TEXT NOT NULL,
      documentId VARCHAR(255),
      data TEXT,
      status VARCHAR(50) DEFAULT 'generating',
      generatedAt TEXT,
      errorMessage TEXT,
      FOREIGN KEY(templateId) REFERENCES document_templates(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE SET NULL
    )
  `);

  // Document search index
  await db.exec(`
    CREATE TABLE IF NOT EXISTS document_search_index (
      id VARCHAR(255) PRIMARY KEY,
      documentId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      content TEXT,
      tokens TEXT,
      metadata TEXT,
      indexedAt TEXT NOT NULL,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Document shares
  await db.exec(`
    CREATE TABLE IF NOT EXISTS document_shares (
      id VARCHAR(255) PRIMARY KEY,
      documentId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      sharedBy VARCHAR(255) NOT NULL,
      sharedWithEmail TEXT,
      sharedWithUserId VARCHAR(255),
      accessLevel VARCHAR(50) DEFAULT 'view',
      expiresAt TEXT,
      accessToken TEXT UNIQUE,
      accessCount INTEGER DEFAULT 0,
      lastAccessedAt TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Document audit log
  await db.exec(`
    CREATE TABLE IF NOT EXISTS document_audit_log (
      id VARCHAR(255) PRIMARY KEY,
      documentId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      userId VARCHAR(255),
      userName TEXT,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  await db.exec('CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(companyId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(projectId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parentDocumentId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(isDeleted)');
  
  await db.exec('CREATE INDEX IF NOT EXISTS idx_doc_versions_document ON document_versions(documentId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_doc_approvals_document ON document_approvals(documentId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_doc_approvals_status ON document_approvals(status)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_signatures_document ON digital_signatures(documentId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_search_index_document ON document_search_index(documentId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_search_index_company ON document_search_index(companyId)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_doc_audit_document ON document_audit_log(documentId)');

  logger.info('Document management tables created successfully');
}

export async function down() {
  const db = getDb();
  
  await db.exec('DROP TABLE IF EXISTS document_audit_log');
  await db.exec('DROP TABLE IF EXISTS document_shares');
  await db.exec('DROP TABLE IF EXISTS document_search_index');
  await db.exec('DROP TABLE IF EXISTS generated_documents');
  await db.exec('DROP TABLE IF EXISTS document_templates');
  await db.exec('DROP TABLE IF EXISTS digital_signatures');
  await db.exec('DROP TABLE IF EXISTS approval_workflows');
  await db.exec('DROP TABLE IF EXISTS document_approvals');
  await db.exec('DROP TABLE IF EXISTS document_versions');
  await db.exec('DROP TABLE IF EXISTS documents');
  
  logger.info('Document management tables dropped');
}
