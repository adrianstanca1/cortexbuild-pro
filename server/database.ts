import { createRequire } from 'module';
const dbRequire = createRequire(import.meta.url);
const { Pool } = dbRequire('pg');
const mysql = dbRequire('mysql2/promise');
const dotenv = dbRequire('dotenv');
import { logger } from './utils/logger.js';

dotenv.config();

// Interface for our DB adapter to support both SQLite and Postgres
export interface IDatabase {
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  run(sql: string, params?: any[]): Promise<any>;
  exec(sql: string): Promise<void>;
  getType(): 'sqlite' | 'postgres' | 'mysql';
  close(): Promise<void>;
  transaction<T>(fn: (db: IDatabase) => Promise<T>): Promise<T>;
  getPoolStats(): any;
}

let dbInstance: IDatabase;
let initPromise: Promise<IDatabase> | null = null;

class SqliteAdapter implements IDatabase {
  private db: any; // Type as any to avoid importing sqlite types at top level
  constructor(db: any) {
    this.db = db;
  }
  async all<T = any>(sql: string, params?: any[]) {
    return this.db.all(sql, params);
  }
  async get<T = any>(sql: string, params?: any[]) {
    return this.db.get(sql, params);
  }
  async run(sql: string, params?: any[]) {
    return this.db.run(sql, params);
  }
  async exec(sql: string) {
    return this.db.exec(sql);
  }
  getType(): 'sqlite' {
    return 'sqlite';
  }
  async close() {
    if (this.db) await this.db.close();
  }
  async transaction<T>(fn: (db: IDatabase) => Promise<T>): Promise<T> {
    await this.db.run('BEGIN TRANSACTION');
    try {
      const result = await fn(this);
      await this.db.run('COMMIT');
      return result;
    } catch (e) {
      await this.db.run('ROLLBACK');
      throw e;
    }
  }
  getPoolStats() {
    return { type: 'sqlite', status: 'connected' };
  }
}

class PostgresAdapter implements IDatabase {
  private pool: any;
  constructor(connectionString: string) {
    const isLocal = process.env.NODE_ENV !== 'production';
    if (isLocal) {
      logger.info('Using Local Database Configuration');
    }
    this.pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false, strict: false },
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Timeout after 10s if can't get connection
    });

    // Handle pool errors
    this.pool.on('error', (err: any) => {
      logger.error('Unexpected pool error:', err);
    });
  }

  // Convert ? to $1, $2, etc. for Postgres compatibility
  private normalizeSql(sql: string): string {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        // Retry on connection errors
        const retryableCodes = [
          'ECONNRESET',
          'ECONNREFUSED',
          'ETIMEDOUT',
          'ENOTFOUND',
          '57P01', // PostgreSQL admin shutdown
          '57P02', // PostgreSQL crash shutdown
          '57P03', // PostgreSQL cannot connect now
        ];
        if (retryableCodes.includes(err.code)) {
          logger.warn(`PostgreSQL transient error (${err.code}), retrying ${i + 1}/${retries}...`);
          await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
          continue;
        }
        logger.error('PostgreSQL non-retryable error:', {
          code: err.code,
          message: err.message
        });
        throw err;
      }
    }
    logger.error(`PostgreSQL exhausted all ${retries} retries. Final error:`, lastError);
    throw lastError;
  }

  async all<T = any>(sql: string, params?: any[]) {
    return this.withRetry(async () => {
      const res = await this.pool.query(this.normalizeSql(sql), params);
      return res.rows;
    });
  }

  async get<T = any>(sql: string, params?: any[]) {
    return this.withRetry(async () => {
      const res = await this.pool.query(this.normalizeSql(sql), params);
      return res.rows[0];
    });
  }

  async run(sql: string, params?: any[]) {
    return this.withRetry(async () => {
      const res = await this.pool.query(this.normalizeSql(sql), params);
      return { changes: res.rowCount };
    });
  }

  async exec(sql: string) {
    return this.withRetry(async () => {
      await this.pool.query(sql);
    });
  }
  getType(): 'postgres' {
    return 'postgres';
  }
  async close() {
    if (this.pool) await this.pool.end();
  }
  async transaction<T>(fn: (db: IDatabase) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const adapter = Object.create(this);
      adapter.pool = { query: (q: string, p: any) => client.query(q, p) };
      const result = await fn(adapter);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  getPoolStats() {
    return {
      type: 'postgres',
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount
    };
  }
}

class MysqlAdapter implements IDatabase {
  private pool: any;
  constructor(config: any) {
    this.pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port || 3306,
      waitForConnections: true,
      connectionLimit: 25, // Increased from 15 for better concurrency
      queueLimit: 50, // Limit queue to prevent memory issues
      multipleStatements: true,
      connectTimeout: 20000, // 20s for slower networks
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ssl: { rejectUnauthorized: false },
      // Performance enhancements
      dateStrings: false,
      supportBigNumbers: true,
      bigNumberStrings: false,
      charset: 'utf8mb4',
      timezone: '+00:00'
    });
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        // Retry on connection lost or transient errors
        const retryableCodes = [
          'PROTOCOL_CONNECTION_LOST',
          'ECONNRESET',
          'ETIMEDOUT',
          'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
        ];
        if (retryableCodes.includes(err.code) || err.fatal) {
          logger.warn(`MySQL transient error (${err.code}), retrying ${i + 1}/${retries}...`, {
            fatal: err.fatal,
            code: err.code
          });
          await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Exponential backoffish
          continue;
        }

        // Log critical errors that aren't retryable
        logger.error('MySQL non-retryable error:', {
          code: err.code,
          message: err.message,
          sqlState: err.sqlState
        });
        throw err;
      }
    }
    logger.error(`MySQL exhausted all ${retries} retries. Final error:`, lastError);
    throw lastError;
  }

  async all<T = any>(sql: string, params?: any[]) {
    return this.withRetry(async () => {
      const [rows] = await this.pool.query(sql, params);
      return rows as T[];
    });
  }

  async get<T = any>(sql: string, params?: any[]) {
    return this.withRetry(async () => {
      const [rows] = await this.pool.query(sql, params);
      const result = rows as T[];
      return result[0];
    });
  }

  async run(sql: string, params?: any[]) {
    return this.withRetry(async () => {
      const [res] = await this.pool.query(sql, params);
      return { changes: res.affectedRows, lastID: res.insertId };
    });
  }

  async exec(sql: string) {
    return this.withRetry(async () => {
      await this.pool.query(sql);
    });
  }
  getType(): 'mysql' {
    return 'mysql';
  }
  async close() {
    if (this.pool) await this.pool.end();
  }
  async transaction<T>(fn: (db: IDatabase) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    try {
      const adapter: any = {
        all: (sql: string, params: any[]) => connection.query(sql, params).then(([r]: any) => r),
        get: (sql: string, params: any[]) => connection.query(sql, params).then(([r]: any) => r[0]),
        run: (sql: string, params: any[]) =>
          connection.query(sql, params).then(([r]: any) => ({ changes: r.affectedRows, lastID: r.insertId })),
        exec: (sql: string) => connection.query(sql),
        getType: () => 'mysql',
        close: async () => { },
        transaction: (f: any) => f(adapter)
      };
      const result = await fn(adapter);
      await connection.commit();
      return result;
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }
  getPoolStats() {
    // Note: mysql2 pool object doesn't expose internal counts as easily as pg,
    // but these are the standard private property accessible in some versions or via connectionLimit
    return {
      type: 'mysql',
      allConnections: this.pool._allConnections?.length || 0,
      freeConnections: this.pool._freeConnections?.length || 0,
      connectionLimit: this.pool.config?.connectionLimit || 0,
      queueSize: this.pool._connectionQueue?.length || 0
    };
  }
}

export async function initializeDatabase() {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const isLocalMode = process.env.USE_LOCAL_DB === 'true';
    const dbType = isLocalMode ? 'sqlite' : process.env.DATABASE_TYPE || 'postgres';
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    try {
      if (dbType === 'mysql') {
        logger.info(`Initializing MySQL connection...`);
        const dbConfig = {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          port: Number(process.env.DB_PORT) || 3306
        };

        if (!dbConfig.host && connectionString && connectionString.startsWith('mysql')) {
          try {
            // Simple parsing if URL is provided
            const url = new URL(connectionString);
            dbConfig.host = url.hostname;
            dbConfig.user = url.username;
            dbConfig.password = url.password;
            dbConfig.database = url.pathname.substring(1);
            dbConfig.port = Number(url.port) || 3306;
          } catch (e) {
            logger.warn('Failed to parse MySQL connection string');
          }
        }

        logger.info('Using MySQL DB config:', { ...dbConfig, password: '***' });
        dbInstance = new MysqlAdapter(dbConfig);
      } else if (connectionString && dbType !== 'sqlite') {
        logger.info(`Initializing PostgreSQL connection...`);
        // Adjust for production SSL if needed
        const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
        if (isProd) logger.info('Using SSL for Postgres connection');

        dbInstance = new PostgresAdapter(connectionString);
      } else {
        // SQLite Fallback
        const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
        const isTest = process.env.NODE_ENV === 'test';
        const sqlite3 = dbRequire('sqlite3');
        const { open } = dbRequire('sqlite');
        const path = dbRequire('path');
        const { fileURLToPath } = dbRequire('url');

        // Derive __dirname for ESM
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const dbPath = isTest ? ':memory:' : path.resolve(__dirname, '../buildpro_db.sqlite');

        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        await db.exec('PRAGMA foreign_keys = ON;');
        dbInstance = new SqliteAdapter(db);
      }
    } catch (error) {
      logger.error('Database Initialization Failed:', error);
      throw error;
    }

    // Initialize schema
    await initializeSchema(dbInstance);
    return dbInstance;
  })();

  return initPromise;
}

export async function ensureDbInitialized(): Promise<IDatabase> {
  return initializeDatabase();
}

export function getDb(): IDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

async function initializeSchema(db: IDatabase) {
  logger.info('Initializing database schema...');

  const addColumnSafe = async (table: string, column: string, type: string) => {
    try {
      if (db.getType() === 'mysql') {
        const columns = await db.all(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
        if (columns.length === 0) {
          await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
          logger.info(`Migration: Added ${column} to ${table}`);
        }
      } else if (db.getType() === 'sqlite') {
        const info = await db.all(`PRAGMA table_info(${table})`);
        if (!info.find((c: any) => c.name === column)) {
          await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
          logger.info(`Migration: Added ${column} to ${table}`);
        }
      } else if (db.getType() === 'postgres') {
        await db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
      }
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('duplicate') && !e.message.toLowerCase().includes('already exists')) {
        logger.error(`Migration Failed for ${table}.${column}:`, e.message);
      }
    }
  };

  const renameColumnSafe = async (table: string, oldColumn: string, newColumn: string) => {
    try {
      if (db.getType() === 'mysql') {
        const tableCheck = await db.all(`SHOW TABLES LIKE ?`, [table]);
        if (tableCheck.length === 0) return; // Table doesn't exist yet

        const columns = await db.all(`SHOW COLUMNS FROM ${table} LIKE ?`, [oldColumn]);
        const newColumns = await db.all(`SHOW COLUMNS FROM ${table} LIKE ?`, [newColumn]);
        if (columns.length > 0 && newColumns.length === 0) {
          await db.exec(`ALTER TABLE ${table} RENAME COLUMN ${oldColumn} TO ${newColumn}`);
          logger.info(`Migration: Renamed ${oldColumn} to ${newColumn} in ${table}`);
        }
      } else if (db.getType() === 'sqlite') {
        const info = await db.all(`PRAGMA table_info(${table})`);
        if (info.find((c: any) => c.name === oldColumn) && !info.find((c: any) => c.name === newColumn)) {
          await db.exec(`ALTER TABLE ${table} RENAME COLUMN ${oldColumn} TO ${newColumn}`);
          logger.info(`Migration: Renamed ${oldColumn} to ${newColumn} in ${table}`);
        }
      } else if (db.getType() === 'postgres') {
        try {
          await db.exec(`ALTER TABLE ${table} RENAME COLUMN ${oldColumn} TO ${newColumn}`);
          logger.info(`Migration: Renamed ${oldColumn} to ${newColumn} in ${table}`);
        } catch (e: any) {
          if (!e.message.toLowerCase().includes('does not exist') && !e.message.toLowerCase().includes('already exists')) {
            throw e;
          }
        }
      }
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('does not exist') && !e.message.toLowerCase().includes('already exists')) {
        logger.error(`Rename Failed for ${table}.${oldColumn}:`, e.message);
      }
    }
  };

  const createIndexSafe = async (table: string, index: string, columns: string) => {
    try {
      if (db.getType() === 'mysql') {
        try {
          await db.exec(`CREATE INDEX ${index} ON ${table}(${columns})`);
          logger.info(`Migration: Created index ${index} on ${table}`);
        } catch (e: any) {
          if (e.code !== 'ER_DUP_KEYNAME') throw e;
        }
      } else {
        await db.exec(`CREATE INDEX IF NOT EXISTS ${index} ON ${table}(${columns})`);
        logger.info(`Migration: Created index ${index} on ${table}`);
      }
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('already exists') && !e.message.toLowerCase().includes('duplicate')) {
        logger.error(`Migration Failed for index ${index} on ${table}:`, e.message);
      }
    }
  };

  // Companies table
  const textDefault = db.getType() === 'mysql' ? 'VARCHAR(255)' : 'TEXT';
  await db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      slug VARCHAR(255) UNIQUE,
      legalName TEXT,
      status ${textDefault} DEFAULT 'ACTIVE',
      plan ${textDefault} DEFAULT 'FREE_BETA',
      logo TEXT,
      address TEXT,
      industry TEXT,
      region ${textDefault} DEFAULT 'US',
      timezone ${textDefault} DEFAULT 'UTC',
      currency ${textDefault} DEFAULT 'USD',
      subscriptionTier ${textDefault} DEFAULT 'FREE_BETA',
      maxProjects INTEGER DEFAULT 1000,
      maxUsers INTEGER DEFAULT 1000,
      securityProfile TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      lastActivityAt TEXT,
      isActive BOOLEAN DEFAULT TRUE,
      subscription TEXT,
      features TEXT,
      settings TEXT,
      users INTEGER DEFAULT 0,
      projects INTEGER DEFAULT 0,
      mrr REAL DEFAULT 0,
      joinedDate TEXT,
      description TEXT,
      website TEXT,
      email TEXT,
      phone TEXT,
      city TEXT,
      state TEXT,
      zipCode TEXT,
      country TEXT
    )
  `);

  // Tenant Usage Logs (Resource tracking)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_usage_logs (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      resourceType VARCHAR(100) NOT NULL,
      amount REAL DEFAULT 0,
      createdAt TEXT NOT NULL,
      metadata TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Schema migration for companies table
  await addColumnSafe('companies', 'slug', 'VARCHAR(255) UNIQUE');
  await addColumnSafe('companies', 'legalName', 'TEXT');
  await addColumnSafe('companies', 'industry', 'TEXT');
  await addColumnSafe('companies', 'region', "VARCHAR(255) DEFAULT 'US'");
  await addColumnSafe('companies', 'timezone', "VARCHAR(255) DEFAULT 'UTC'");
  await addColumnSafe('companies', 'currency', "VARCHAR(255) DEFAULT 'USD'");
  await addColumnSafe('companies', 'securityProfile', "TEXT");
  await addColumnSafe('companies', 'metadata', "TEXT");
  await addColumnSafe('companies', 'lastActivityAt', 'TEXT');
  await addColumnSafe('companies', 'subscriptionTier', "VARCHAR(255) DEFAULT 'FREE_BETA'");
  await addColumnSafe('companies', 'isActive', "BOOLEAN DEFAULT TRUE");
  await addColumnSafe('companies', 'plan', "VARCHAR(255) DEFAULT 'FREE_BETA'");
  
  // Trial system columns
  await addColumnSafe('companies', 'trialStartedAt', 'TEXT');
  await addColumnSafe('companies', 'trialEndsAt', 'TEXT');
  
  // Storage quota columns
  await addColumnSafe('companies', 'storageQuotaBytes', 'BIGINT DEFAULT 5368709120');
  await addColumnSafe('companies', 'storageUsedBytes', 'BIGINT DEFAULT 0');
  await addColumnSafe('companies', 'databaseQuotaBytes', 'BIGINT DEFAULT 5368709120');
  await addColumnSafe('companies', 'databaseUsedBytes', 'BIGINT DEFAULT 0');
  
  if (db.getType() === 'mysql') {
    await db.exec(`ALTER TABLE companies MODIFY COLUMN createdAt VARCHAR(255)`);
    await db.exec(`ALTER TABLE companies MODIFY COLUMN updatedAt VARCHAR(255)`);
  }

  const q = process.env.DATABASE_TYPE === 'mysql' ? '`' : '"';

  // System Settings (Consolidated)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      ${q}key${q} VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      updatedBy TEXT
    )
  `);

  await addColumnSafe('system_settings', 'updatedBy', 'TEXT');

  // Feature Flags
  await db.exec(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      name VARCHAR(255) PRIMARY KEY,
      displayname TEXT NOT NULL,
      description TEXT,
      category VARCHAR(255) DEFAULT 'GENERAL',
      enabled BOOLEAN DEFAULT FALSE,
      requiresfeatures TEXT,
      updatedAt TEXT NOT NULL
    )
  `);

  const flagCount = await db.get('SELECT COUNT(*) as count FROM feature_flags');
  if (flagCount.count === 0) {
    const flags = [
      ['ai_chat', 'AI Chat Assistant', 'Centralized AI chat for all internal project communication', 'AI', 1],
      ['predictive_analytics', 'Predictive Analytics', 'ML-driven project delay and risk predictions', 'ANALYTICS', 1],
      ['client_portal', 'Client External Portal', 'Allow sharing project dashboard with external clients', 'PORTAL', 1],
      ['security_audit_logs', 'Advanced Audit Trails', 'Deep tracking of every user action across sessions', 'SECURITY', 0],
      ['multi_region_sync', 'Global Region Sync', 'Cross-region data synchronization for enterprise clients', 'INFRA', 0]
    ];
    for (const [name, display, desc, cat, enabled] of flags) {
      await db.run(
        'INSERT INTO feature_flags (name, displayname, description, category, enabled, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [name, display, desc, cat, enabled, new Date().toISOString()]
      );
    }
  }

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users(
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    resetTokenHash TEXT,
    resetExpiresAt TEXT,
    companyId VARCHAR(255),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE SET NULL
  )
  `);

  // Schema migration for users table
  await addColumnSafe('users', 'status', "VARCHAR(50) DEFAULT 'active'");
  await addColumnSafe('users', 'resetTokenHash', 'TEXT');
  await addColumnSafe('users', 'resetExpiresAt', 'TEXT');
  await addColumnSafe('users', 'two_factor_secret', 'TEXT');
  await addColumnSafe('users', 'two_factor_enabled', 'BOOLEAN DEFAULT FALSE');
  await addColumnSafe('users', 'isActive', 'BOOLEAN DEFAULT TRUE');
  if (db.getType() === 'mysql') {
    await db.exec(`ALTER TABLE users MODIFY COLUMN createdAt VARCHAR(255)`);
    await db.exec(`ALTER TABLE users MODIFY COLUMN updatedAt VARCHAR(255)`);
  }

  // Push Subscriptions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions(
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    endpoint VARCHAR(512) UNIQUE NOT NULL,
    \`keys\` TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )
    `);

  // OAuth Providers table for Google OAuth integration
  await db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_providers(
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    providerId VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    accessToken TEXT,
    refreshToken TEXT,
    tokenExpiry TEXT,
    profile TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    UNIQUE(provider, providerId),
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )
    `);

  // Email Verification table for SendGrid email verification flow
  await db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications(
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    expiresAt TEXT NOT NULL,
    verifiedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )
    `);

  // Memberships table (RBAC)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS memberships(
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      permissions TEXT,
      status VARCHAR(50) DEFAULT 'active',
      joinedAt TEXT,
      invitedBy VARCHAR(255),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Permissions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS permissions(
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    )
    `);

  // Roles table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS roles(
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      permissions TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
    `);

  // Role Permissions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions(
      roleId VARCHAR(255) NOT NULL,
      permissionId VARCHAR(255) NOT NULL,
      PRIMARY KEY(roleId, permissionId),
      FOREIGN KEY(permissionId) REFERENCES permissions(id) ON DELETE CASCADE
    )
    `);

  // Projects table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      code VARCHAR(100),
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      type VARCHAR(100),
      status VARCHAR(50),
      health VARCHAR(50),
      progress REAL,
      budget REAL,
      spent REAL,
      startDate TEXT,
      endDate TEXT,
      manager TEXT,
      image TEXT,
      teamSize INTEGER,
      weatherLocation TEXT,
      aiAnalysis TEXT,
      zones TEXT,
      phases TEXT,
      timelineOptimizations TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Shared Links table (NEW for Client Portal)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shared_links(
      id VARCHAR(255) PRIMARY KEY,
      projectId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      password TEXT,
      expiresAt TEXT NOT NULL,
      createdBy VARCHAR(255) NOT NULL,
      createdAt TEXT NOT NULL,
      lastAccessedAt TEXT,
      accessCount INTEGER DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Tasks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks(
      id VARCHAR(255) PRIMARY KEY,
      projectId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL,
      priority VARCHAR(50) NOT NULL,
      assignedTo TEXT,
      assigneeId VARCHAR(255),
      assigneeName TEXT,
      assigneeType VARCHAR(50),
      dueDate TEXT,
      startDate TEXT,
      duration INTEGER,
      dependencies TEXT,
      progress INTEGER DEFAULT 0,
      color TEXT,
      createdBy VARCHAR(255),
      latitude REAL,
      longitude REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Tasks Schema Migration
  await addColumnSafe('tasks', 'startDate', 'TEXT');
  await addColumnSafe('tasks', 'duration', 'INTEGER');
  await addColumnSafe('tasks', 'dependencies', 'TEXT');
  await addColumnSafe('tasks', 'progress', 'INTEGER DEFAULT 0');
  await addColumnSafe('tasks', 'color', 'TEXT');

  // Team
  await db.exec(`
    CREATE TABLE IF NOT EXISTS team(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      initials TEXT,
      email TEXT,
      role TEXT NOT NULL,
      phone TEXT,
      skills TEXT,
      certifications TEXT,
      status TEXT,
      projectId TEXT,
      projectName TEXT,
      availability TEXT,
      location TEXT,
      avatar TEXT,
      color TEXT,
      bio TEXT,
      performanceRating REAL,
      completedProjects INTEGER,
      joinDate TEXT,
      hourlyRate REAL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Documents
  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      projectName TEXT,
      name TEXT NOT NULL,
      type VARCHAR(100) NOT NULL,
      size TEXT,
      date TEXT,
      status VARCHAR(50),
      url TEXT,
      linkedTaskIds TEXT,
      currentVersion INTEGER,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Clients
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      contactPerson TEXT,
      role TEXT,
      email TEXT,
      phone TEXT,
      projects TEXT,
      activeProjects INTEGER DEFAULT 0,
      totalValue REAL,
      status TEXT,
      tier TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Inventory
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER,
      unit TEXT,
      location TEXT,
      reorderLevel INTEGER,
      status TEXT,
      supplier TEXT,
      unitCost REAL,
      totalValue REAL,
      lastRestocked TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Equipment
  await db.exec(`
    CREATE TABLE IF NOT EXISTS equipment(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      model TEXT,
      serialNumber TEXT,
      status TEXT,
      location TEXT,
      assignedTo TEXT,
      purchaseDate TEXT,
      nextMaintenance TEXT,
      utilizationRate INTEGER,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // RFIs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rfis(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      number TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      raisedBy TEXT,
      assignedTo TEXT,
      priority TEXT,
      status TEXT,
      dueDate TEXT,
      createdAt TEXT,
      response TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Punch Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS punch_items(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      title TEXT,
      location TEXT,
      description TEXT,
      priority TEXT,
      assignedTo TEXT,
      status TEXT,
      dueDate TEXT,
      createdAt TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Punch Items Schema Migration
  await addColumnSafe('punch_items', 'title', 'TEXT');

  // Daily Logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_logs(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      date TEXT,
      weather TEXT,
      temperature TEXT,
      workforce INTEGER,
      activities TEXT,
      equipment TEXT,
      delays TEXT,
      safetyIssues TEXT,
      notes TEXT,
      createdBy TEXT,
      status VARCHAR(255) DEFAULT 'Draft',
      signedBy TEXT,
      signedAt TEXT,
      attachments TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Daily Logs Schema Migration
  await addColumnSafe('daily_logs', 'temperature', 'TEXT');
  await addColumnSafe('daily_logs', 'workforce', 'INTEGER');
  await addColumnSafe('daily_logs', 'activities', 'TEXT');
  await addColumnSafe('daily_logs', 'equipment', 'TEXT');
  await addColumnSafe('daily_logs', 'delays', 'TEXT');
  await addColumnSafe('daily_logs', 'safetyIssues', 'TEXT');
  await addColumnSafe('daily_logs', 'createdBy', 'VARCHAR(255)');
  await addColumnSafe('daily_logs', 'status', "VARCHAR(255) DEFAULT 'Draft'");
  await addColumnSafe('daily_logs', 'attachments', 'TEXT');
  await addColumnSafe('daily_logs', 'signedAt', 'TEXT');
  await addColumnSafe('daily_logs', 'updatedAt', 'TEXT');

  try {
    // Check if author column exists before attempting update
    const columns = await db.all(`SHOW COLUMNS FROM daily_logs LIKE 'author'`);
    if (columns.length > 0) {
      await db.run(`UPDATE daily_logs SET createdBy = author WHERE createdBy IS NULL AND author IS NOT NULL`);
    }
  } catch (e) {
    logger.debug('Skipping daily_logs author migration');
  }

  await addColumnSafe('daily_logs', 'status', "VARCHAR(255) DEFAULT 'Draft'");
  await addColumnSafe('daily_logs', 'signedBy', 'TEXT');
  await addColumnSafe('daily_logs', 'signedAt', 'TEXT');
  await addColumnSafe('daily_logs', 'attachments', 'TEXT');
  await addColumnSafe('daily_logs', 'createdAt', 'TEXT');
  await addColumnSafe('daily_logs', 'updatedAt', 'TEXT');

  // Dayworks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dayworks(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      date TEXT,
      description TEXT,
      labor TEXT,
      materials TEXT,
      totalLaborCost REAL,
      totalMaterialCost REAL,
      grandTotal REAL,
      status TEXT,
      attachments TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Dayworks Schema Migration
  await addColumnSafe('dayworks', 'totalLaborCost', 'REAL');
  await addColumnSafe('dayworks', 'totalMaterialCost', 'REAL');
  await addColumnSafe('dayworks', 'createdAt', 'TEXT');
  await addColumnSafe('dayworks', 'updatedAt', 'TEXT');

  // Team & Clients Schema Migration
  await addColumnSafe('team', 'initials', 'TEXT');
  await addColumnSafe('team', 'projectName', 'TEXT');
  await addColumnSafe('team', 'color', 'TEXT');
  await addColumnSafe('team', 'bio', 'TEXT');
  await addColumnSafe('team', 'performanceRating', 'REAL');
  await addColumnSafe('team', 'completedProjects', 'INTEGER');
  await addColumnSafe('team', 'joinDate', 'TEXT');

  await addColumnSafe('clients', 'contactPerson', 'TEXT');
  await addColumnSafe('clients', 'role', 'TEXT');
  await addColumnSafe('clients', 'activeProjects', 'INTEGER DEFAULT 0');
  await addColumnSafe('clients', 'tier', 'TEXT');

  // Safety Incidents
  await db.exec(`
    CREATE TABLE IF NOT EXISTS safety_incidents(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId TEXT,
      projectName TEXT,
      type TEXT,
      title TEXT,
      severity TEXT,
      date TEXT,
      location TEXT,
      description TEXT,
      personInvolved TEXT,
      actionTaken TEXT,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Safety & Project Risk Schema Migration
  await addColumnSafe('safety_incidents', 'projectName', 'TEXT');
  await addColumnSafe('safety_incidents', 'createdAt', 'TEXT');
  await addColumnSafe('safety_incidents', 'updatedAt', 'TEXT');
  // Equipment & Mixed Migration
  await addColumnSafe('equipment', 'projectId', 'VARCHAR(255)');
  await addColumnSafe('equipment', 'projectName', 'TEXT');
  await addColumnSafe('equipment', 'lastService', 'TEXT');
  await addColumnSafe('equipment', 'image', 'TEXT');

  // Safety Hazards
  await db.exec(`
    CREATE TABLE IF NOT EXISTS safety_hazards(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId TEXT,
      type TEXT,
      severity TEXT,
      riskScore REAL,
      description TEXT,
      recommendation TEXT,
      regulation TEXT,
      box_2d TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Timesheets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS timesheets(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      userId TEXT,
      userName TEXT,
      date TEXT,
      projectId TEXT,
      projectName TEXT,
      hoursWorked REAL,
      startTime TEXT,
      endTime TEXT,
      task TEXT,
      status TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  await addColumnSafe('timesheets', 'startTime', 'TEXT');
  await addColumnSafe('timesheets', 'endTime', 'TEXT');

  // Channels
  await db.exec(`
    CREATE TABLE IF NOT EXISTS channels(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      type VARCHAR(255) DEFAULT 'general',
      name TEXT NOT NULL,
      description TEXT,
      isPrivate BOOLEAN,
      memberIds TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      unreadCount INTEGER DEFAULT 0,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  await addColumnSafe('channels', 'type', "VARCHAR(255) DEFAULT 'general'");
  await addColumnSafe('channels', 'projectId', 'VARCHAR(255)');
  await addColumnSafe('channels', 'unreadCount', 'INTEGER DEFAULT 0');

  // Team Messages
  await db.exec(`
    CREATE TABLE IF NOT EXISTS team_messages(
      id VARCHAR(255) PRIMARY KEY,
      channelId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      userName TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      avatar TEXT,
      attachments TEXT,
      FOREIGN KEY(channelId) REFERENCES channels(id) ON DELETE CASCADE
    )
    `);

  // Transactions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      date TEXT,
      status TEXT,
      costCodeId TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Purchase Orders
  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId TEXT,
      poNumber VARCHAR(255) UNIQUE NOT NULL,
      vendor TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      requestedBy TEXT,
      approvers TEXT,
      dateCreated TEXT,
      dateRequired TEXT,
      notes TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Defects
  await db.exec(`
    CREATE TABLE IF NOT EXISTS defects(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT,
      status TEXT,
      reportedBy TEXT,
      assignedTo TEXT,
      location TEXT,
      box_2d TEXT,
      createdAt TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Project Risks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS project_risks(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      riskLevel TEXT,
      predictedDelayDays INTEGER,
      factors TEXT,
      recommendations TEXT,
      createdAt TEXT NOT NULL,
      trend TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
    `);

  await addColumnSafe('project_risks', 'companyId', 'VARCHAR(255)');

  // ML Models
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ml_models(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      accuracy FLOAT DEFAULT 0.0,
      trainedSamples INTEGER DEFAULT 0,
      lastTrained TEXT,
      status VARCHAR(255) DEFAULT 'idle',
      version VARCHAR(255) DEFAULT '1.0.0',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
    `);

  // ML Predictions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ml_predictions(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      modelId VARCHAR(255) NOT NULL,
      createdAt TEXT NOT NULL,
      input TEXT,
      output TEXT,
      confidence FLOAT,
      actualValue FLOAT,
      FOREIGN KEY(modelId) REFERENCES ml_models(id) ON DELETE CASCADE
    )
    `);

  // Audit Logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      userName TEXT,
      action VARCHAR(255) NOT NULL,
      resource TEXT,
      resourceId TEXT,
      changes TEXT,
      status TEXT,
      createdAt VARCHAR(255) NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      severity VARCHAR(255) DEFAULT 'info',
      requestId VARCHAR(255)
    )
  `);

  if (db.getType() === 'mysql') {
    await db.exec(`ALTER TABLE audit_logs MODIFY COLUMN action VARCHAR(255) NOT NULL`);
    await db.exec(`ALTER TABLE audit_logs MODIFY COLUMN createdAt VARCHAR(255) NOT NULL`);
  }

  // Access Logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS access_logs(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      userId VARCHAR(255),
      userName TEXT,
      event VARCHAR(255) NOT NULL,
      ipAddress TEXT,
      status TEXT,
      createdAt VARCHAR(255) NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  if (db.getType() === 'mysql') {
    await db.exec(`ALTER TABLE access_logs MODIFY COLUMN event VARCHAR(255) NOT NULL`);
    await db.exec(`ALTER TABLE access_logs MODIFY COLUMN createdAt VARCHAR(255) NOT NULL`);
  }

  // Migration for audit_logs (rename older timestamp column)
  await renameColumnSafe('audit_logs', 'timestamp', 'createdAt');

  // Idempotent migrations for timestamp -> createdAt
  const tablesToMigrate = ['ml_predictions', 'team_messages', 'project_risks', 'security_events'];
  for (const table of tablesToMigrate) {
    await renameColumnSafe(table, 'timestamp', 'createdAt');
  }

  // Support Tickets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      subject TEXT NOT NULL,
      status VARCHAR(255) NOT NULL DEFAULT 'OPEN',
      priority VARCHAR(255) NOT NULL DEFAULT 'MEDIUM',
      category TEXT,
      lastMessageAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

  // Ticket Messages
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_messages(
      id VARCHAR(255) PRIMARY KEY,
      ticketId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      isInternal BOOLEAN DEFAULT FALSE,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(ticketId) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

  // ==========================================
  // ENTERPRISE MULTI-TENANCY (Phase 14)
  // ==========================================

  // Tenant Registry (Platform DB)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_registry(
      companyId VARCHAR(255) PRIMARY KEY,
      tenantId VARCHAR(255) UNIQUE NOT NULL,
      dbConnectionString TEXT,
      status VARCHAR(50) NOT NULL,
      region VARCHAR(50) DEFAULT 'us-east-1',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Migration for tenant_registry (harmonize snake_case to camelCase)
  await renameColumnSafe('tenant_registry', 'company_id', 'companyId');
  await renameColumnSafe('tenant_registry', 'tenant_id', 'tenantId');
  await renameColumnSafe('tenant_registry', 'db_connection_string', 'dbConnectionString');
  await renameColumnSafe('tenant_registry', 'created_at', 'createdAt');
  await renameColumnSafe('tenant_registry', 'updated_at', 'updatedAt');

  // User Invitations table (Provisioning)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS userinvitations(
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      companyid VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      invitedby VARCHAR(255),
      token VARCHAR(255) UNIQUE NOT NULL,
      expiresat TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      metadata TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyid) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Invitations (Platform DB - keep for legacy or separate usage)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invitations(
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      tokenHash VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      expiresAt TEXT NOT NULL,
      acceptedAt TEXT,
      createdBy VARCHAR(255),
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Invitations & Audit Logs Migration
  await addColumnSafe('invitations', 'expiresAt', 'TEXT');
  await addColumnSafe('invitations', 'acceptedAt', 'TEXT');
  await addColumnSafe('invitations', 'sentAt', 'TEXT');
  await addColumnSafe('invitations', 'companyId', 'VARCHAR(255) NOT NULL');
  await addColumnSafe('invitations', 'role', 'VARCHAR(50)');
  await addColumnSafe('invitations', 'status', 'VARCHAR(50)');
  await addColumnSafe('invitations', 'tokenHash', 'VARCHAR(255)');
  await addColumnSafe('invitations', 'token', 'VARCHAR(255)');
  await addColumnSafe('invitations', 'invitedBy', 'VARCHAR(255)');
  await addColumnSafe('invitations', 'createdAt', 'TEXT');
  await addColumnSafe('invitations', 'updatedAt', 'TEXT');
  await addColumnSafe('invitations', 'metadata', 'TEXT');

  await addColumnSafe('audit_logs', 'details', 'TEXT');
  await addColumnSafe('audit_logs', 'severity', "VARCHAR(255) DEFAULT 'info'");
  await addColumnSafe('audit_logs', 'requestId', 'VARCHAR(255)');

  // Legacy Schema Compatibility Migrations
  await addColumnSafe('invitations', 'created_at', 'TEXT');
  await addColumnSafe('invitations', 'expires_at', 'TEXT');
  await addColumnSafe('invitations', 'company_id', 'VARCHAR(255)');
  await addColumnSafe('invitations', 'token_hash', 'VARCHAR(255)');
  await addColumnSafe('invitations', 'created_by', 'VARCHAR(255)');

  // AI Assets (Innovation)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_assets(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      userId VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      url TEXT,
      prompt TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

  // Vendors (Supply Chain)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vendors(
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      contact TEXT,
      email TEXT,
      phone TEXT,
      rating REAL,
      status TEXT,
      companyId VARCHAR(255),
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Vendors schema migration
  await addColumnSafe('vendors', 'companyId', 'VARCHAR(255)');

  // Cost Codes (Financials)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cost_codes(
      id VARCHAR(255) PRIMARY KEY,
      projectId VARCHAR(255),
      companyId VARCHAR(255),
      code TEXT,
      description TEXT,
      budget REAL,
      spent REAL DEFAULT 0,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Cost Codes schema migration
  await addColumnSafe('cost_codes', 'companyId', 'VARCHAR(255)');

  // Invoices
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoices(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      number TEXT,
      vendorId VARCHAR(255),
      amount REAL,
      date TEXT,
      dueDate TEXT,
      status TEXT,
      costCodeId VARCHAR(255),
      items TEXT,
      files TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
    `);

  // Expense Claims
  await db.exec(`
    CREATE TABLE IF NOT EXISTS expense_claims(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      userId VARCHAR(255),
      description TEXT,
      amount REAL,
      date TEXT,
      category TEXT,
      status TEXT,
      costCodeId VARCHAR(255),
      vendorId VARCHAR(255),
      receiptUrl TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
    `);

  // Notifications
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      link TEXT,
      isRead BOOLEAN DEFAULT FALSE,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Comments table for collaboration
  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      entityType TEXT NOT NULL,
      entityId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      userName TEXT,
      parentId VARCHAR(255),
      content TEXT NOT NULL,
      mentions TEXT,
      attachments TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Activity feed table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS activity_feed(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      userId VARCHAR(255) NOT NULL,
      userName TEXT,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId VARCHAR(255) NOT NULL,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Notification preferences table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences(
      userId VARCHAR(255) PRIMARY KEY,
      emailMentions BOOLEAN DEFAULT TRUE,
      emailAssignments BOOLEAN DEFAULT TRUE,
      emailComments BOOLEAN DEFAULT TRUE,
      emailDigestFrequency VARCHAR(255) DEFAULT 'daily',
      suspended BOOLEAN DEFAULT FALSE
    )
    `);

  // Company Storage Buckets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS company_storage(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) UNIQUE NOT NULL,
      bucketName TEXT NOT NULL,
      bucketType VARCHAR(255) DEFAULT 'local',
      storageQuota BIGINT DEFAULT 10737418240,
      storageUsed BIGINT DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Platform System Events (Phase 11)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_events(
      id VARCHAR(255) PRIMARY KEY,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      metadata TEXT,
      isRead BOOLEAN DEFAULT FALSE,
      createdAt TEXT NOT NULL
    )
    `);

  // Ensure at least one system event exists to verify connectivity
  const eventCount = await db.get('SELECT COUNT(*) as count FROM system_events');
  if (eventCount.count === 0) {
    await db.run(
      `INSERT INTO system_events(id, type, level, message, source, metadata, isRead, createdAt)
  VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'init-event-1',
        'SYSTEM_INIT',
        'INFO',
        'CortexBuild Pro System Initialized',
        'SYSTEM',
        JSON.stringify({ version: '1.0.0' }),
        0,
        new Date().toISOString()
      ]
    );
  }

  // Automation Jobs (SuperAdmin scheduled tasks)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS automation_jobs(
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    schedule TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    lastRun TEXT,
    nextRun TEXT,
    config TEXT,
    createdBy TEXT,
    createdAt TEXT NOT NULL
  )
    `);

  // Platform API Keys (SuperAdmin API access)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS platform_api_keys(
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      ${q}key${q} VARCHAR(255) UNIQUE NOT NULL,
      permissions TEXT,
      createdBy TEXT,
      createdAt TEXT NOT NULL,
      expiresAt TEXT,
      lastUsedAt TEXT
    )
    `);

  // Webhooks (Platform Automation)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS webhooks(
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT,
      status VARCHAR(50) DEFAULT 'active',
      lastTriggered TEXT,
      createdAt TEXT NOT NULL
    )
    `);

  // Subscriptions (Billing tracking)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      plan TEXT NOT NULL,
      status VARCHAR(255) DEFAULT 'active',
      mrr REAL DEFAULT 0,
      billingCycle VARCHAR(255) DEFAULT 'monthly',
      startDate TEXT NOT NULL,
      endDate TEXT,
      trialEndsAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Company Usage Tracking
  await db.exec(`
    CREATE TABLE IF NOT EXISTS company_usage(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      month VARCHAR(50) NOT NULL,
      apiCalls INTEGER DEFAULT 0,
      storageBytes BIGINT DEFAULT 0,
      activeUsers INTEGER DEFAULT 0,
      UNIQUE(companyId, month),
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Security Events (Failed logins, suspicious activity)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS security_events(
      id VARCHAR(255) PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      ipAddress TEXT,
      email TEXT,
      userId TEXT,
      createdAt TEXT NOT NULL,
      metadata TEXT
    )
    `);

  // Impersonation Sessions (Phase 7 Security)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS impersonation_sessions(
      id VARCHAR(255) PRIMARY KEY,
      adminId VARCHAR(255) NOT NULL,
      targetUserId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      reason TEXT,
      token VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      completedAt TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      FOREIGN KEY(adminId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(targetUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // IP Blacklist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ip_blacklist(
      id VARCHAR(255) PRIMARY KEY,
      ipAddress VARCHAR(255) UNIQUE NOT NULL,
      reason TEXT,
      createdBy TEXT,
      createdAt TEXT NOT NULL
    )
    `);

  // External Integrations table (Phase 13)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS integrations(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      lastSyncedAt TEXT,
      settings TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Task assignments for resource allocation (Phase 9C)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_assignments(
      id VARCHAR(255) PRIMARY KEY,
      taskId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      userName TEXT,
      role TEXT,
      allocatedHours REAL,
      actualHours REAL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )
    `);

  // Automations Table (Phase 14)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS automations(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      triggerType TEXT NOT NULL,
      actionType TEXT NOT NULL,
      configuration TEXT,
      enabled BOOLEAN DEFAULT TRUE,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Safety Audit Checklists (Site Compliance)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS safety_checklists(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255),
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      inspector TEXT,
      status VARCHAR(255) DEFAULT 'In Progress',
      score REAL,
      signedBy TEXT,
      signedAt TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE SET NULL
    )
    `);

  // Safety Checklist Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS safety_checklist_items(
      id VARCHAR(255) PRIMARY KEY,
      checklistId VARCHAR(255) NOT NULL,
      category TEXT NOT NULL,
      text TEXT NOT NULL,
      status VARCHAR(255) DEFAULT 'PENDING',
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(checklistId) REFERENCES safety_checklists(id) ON DELETE CASCADE
    )
    `);

  // Feature Definitions (Platform Catalog)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS featuredefinitions(
      name VARCHAR(255) PRIMARY KEY,
      displayName TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      defaultEnabled BOOLEAN DEFAULT FALSE,
      requiresFeatures TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
    `);

  // Company Features (Tenant Entitlements)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS companyfeatures(
      companyId VARCHAR(255) NOT NULL,
      featureName VARCHAR(255) NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      config TEXT,
      createdBy VARCHAR(255),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY(companyId, featureName),
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(featureName) REFERENCES featuredefinitions(name) ON DELETE CASCADE
    )
    `);

  // Company Limits (Quotas)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS companylimits(
      companyId VARCHAR(255) NOT NULL,
      limitType VARCHAR(255) NOT NULL,
      limitValue INTEGER NOT NULL,
      currentUsage INTEGER DEFAULT 0,
      softLimitThreshold REAL DEFAULT 0.80,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY(companyId, limitType),
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Impersonation Sessions (Phase 7)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS impersonation_sessions(
      id VARCHAR(255) PRIMARY KEY,
      adminId VARCHAR(255) NOT NULL,
      targetUserId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      reason TEXT,
      token VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(255) DEFAULT 'active',
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      completedAt TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      FOREIGN KEY(adminId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(targetUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Initialize default maintenance mode (OFF) if not exists
  const maintenanceSetting = await db.get(`SELECT ${q}key${q} FROM system_settings WHERE ${q}key${q} = ?`, [
    'maintenance_mode'
  ]);
  if (!maintenanceSetting) {
    await db.run(`INSERT INTO system_settings(${q}key${q}, value, updatedAt, updatedBy) VALUES(?, ?, ?, ?)`, [
      'maintenance_mode',
      'false',
      new Date().toISOString(),
      'system'
    ]);
  }

  // #- Modular System & Marketplace (Phase 12) #-

  // Marketplace Modules
  await db.exec(`
    CREATE TABLE IF NOT EXISTS modules(
      id VARCHAR(255) PRIMARY KEY,
      developerId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      category VARCHAR(255) NOT NULL,
      version VARCHAR(50) NOT NULL,
      price REAL DEFAULT 0,
      isFree BOOLEAN DEFAULT TRUE,
      status VARCHAR(255) DEFAULT 'published',
      publishedAt VARCHAR(255),
      updatedAt VARCHAR(255),
      downloads INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      reviewsCount INTEGER DEFAULT 0,
      icon TEXT,
      repositoryUrl TEXT,
      documentationUrl TEXT,
      FOREIGN KEY(developerId) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

  if (db.getType() === 'mysql') {
    await db.exec(`ALTER TABLE modules MODIFY COLUMN category VARCHAR(255) NOT NULL`);
    await db.exec(`ALTER TABLE modules MODIFY COLUMN version VARCHAR(50) NOT NULL`);
    await db.exec(`ALTER TABLE modules MODIFY COLUMN publishedAt VARCHAR(255)`);
    await db.exec(`ALTER TABLE modules MODIFY COLUMN updatedAt VARCHAR(255)`);
  }

  // Module Installations
  await db.exec(`
    CREATE TABLE IF NOT EXISTS module_installations(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      moduleId VARCHAR(255) NOT NULL,
      config TEXT,
      isActive BOOLEAN DEFAULT TRUE,
      installedAt VARCHAR(255) NOT NULL,
      updatedAt VARCHAR(255) NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(moduleId) REFERENCES modules(id) ON DELETE CASCADE,
      UNIQUE(companyId, moduleId)
    )
    `);

  if (db.getType() === 'mysql') {
    await db.exec(`ALTER TABLE module_installations MODIFY COLUMN installedAt VARCHAR(255) NOT NULL`);
    await db.exec(`ALTER TABLE module_installations MODIFY COLUMN updatedAt VARCHAR(255) NOT NULL`);
  }

  // Optional Permissions (Granular Overrides)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS optional_permissions(
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      permission TEXT NOT NULL,
      grantedBy VARCHAR(255) NOT NULL,
      grantedAt TEXT NOT NULL,
      expiresAt TEXT,
      constraints TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Emergency Access (Break-glass)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS emergency_access(
      id VARCHAR(255) PRIMARY KEY,
      adminId VARCHAR(255) NOT NULL,
      targetCompanyId VARCHAR(255) NOT NULL,
      justification TEXT NOT NULL,
      grantedAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      FOREIGN KEY(adminId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(targetCompanyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // User Dashboards (custom layouts per user)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_dashboards(
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT 'My Dashboard',
      layout TEXT NOT NULL,
      isDefault BOOLEAN DEFAULT FALSE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

  // Dashboard Widgets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_widgets(
      id VARCHAR(255) PRIMARY KEY,
      dashboardId VARCHAR(255) NOT NULL,
      widgetType TEXT NOT NULL,
      moduleId VARCHAR(255),
      title TEXT NOT NULL,
      config TEXT,
      position_x INTEGER NOT NULL DEFAULT 0,
      position_y INTEGER NOT NULL DEFAULT 0,
      width INTEGER NOT NULL DEFAULT 4,
      height INTEGER NOT NULL DEFAULT 2,
      isVisible BOOLEAN DEFAULT TRUE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(dashboardId) REFERENCES user_dashboards(id) ON DELETE CASCADE,
      FOREIGN KEY(moduleId) REFERENCES modules(id) ON DELETE SET NULL
    )
    `);

  // Module Categories
  await db.exec(`
    CREATE TABLE IF NOT EXISTS module_categories(
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      sortOrder INTEGER DEFAULT 0
    )
  `);

  // #- Performance Indices (Enhancement) #-
  await createIndexSafe('modules', 'idx_modules_category', 'category');
  await createIndexSafe('modules', 'idx_modules_status', 'status');
  await createIndexSafe('module_installations', 'idx_module_installations_company', 'companyId');
  await createIndexSafe('dashboard_widgets', 'idx_dashboard_widgets_dashboard', 'dashboardId');

  // Core Table Indices
  await createIndexSafe('audit_logs', 'idx_audit_logs_company', 'companyId');
  await createIndexSafe('audit_logs', 'idx_audit_logs_createdat', 'createdAt');
  await createIndexSafe('access_logs', 'idx_access_logs_company', 'companyId');
  await createIndexSafe('access_logs', 'idx_access_logs_createdat', 'createdAt');
  await createIndexSafe('userinvitations', 'idx_userinvitations_company', 'companyid');
  await createIndexSafe('userinvitations', 'idx_userinvitations_email', 'email');

  // Performance optimization indexes
  await createIndexSafe('users', 'idx_users_company_id', 'companyId');
  await createIndexSafe('users', 'idx_users_email', 'email');
  await createIndexSafe('users', 'idx_users_is_active', 'isActive');
  await createIndexSafe('projects', 'idx_projects_company_id', 'companyId');
  await createIndexSafe('projects', 'idx_projects_status', 'status');
  await createIndexSafe('memberships', 'idx_memberships_user_id', 'userId');
  await createIndexSafe('memberships', 'idx_memberships_company_id', 'companyId');
  await createIndexSafe('memberships', 'idx_memberships_status', 'status');
  await createIndexSafe('audit_logs', 'idx_audit_logs_user_id', 'userId');
  await createIndexSafe('audit_logs', 'idx_audit_logs_action', 'action');
  await createIndexSafe('companies', 'idx_companies_status', 'status');

  // User Sessions for IP tracking
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions(
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      ipAddress VARCHAR(255) NOT NULL,
      userAgent TEXT,
      createdAt TEXT NOT NULL,
      lastAccessAt VARCHAR(255) NOT NULL,
      isActive INTEGER DEFAULT 1,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

  if (db.getType() === 'mysql') {
    await db.exec(`ALTER TABLE user_sessions MODIFY COLUMN lastAccessAt VARCHAR(255) NOT NULL`);
  }

  await createIndexSafe('user_sessions', 'idx_user_sessions_user_id', 'userId');
  await createIndexSafe('user_sessions', 'idx_user_sessions_is_active', 'isActive');
  await createIndexSafe('user_sessions', 'idx_user_sessions_last_access', 'lastAccessAt');

  // ==========================================
  // CONSTRUCTION FEATURES
  // ==========================================

  // Material Deliveries
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_deliveries (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      material TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      supplier TEXT,
      deliveryDate TEXT,
      poNumber TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Material Inventory
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_inventory (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      material TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      onSite REAL DEFAULT 0,
      allocated REAL DEFAULT 0,
      available REAL DEFAULT 0,
      unit TEXT,
      location TEXT,
      lastUpdated TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Material Requisitions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_requisitions (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      requestedBy VARCHAR(255),
      material TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      urgency TEXT,
      neededBy TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Weather Delays
  await db.exec(`
    CREATE TABLE IF NOT EXISTS weather_delays (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      date TEXT,
      weatherType TEXT,
      description TEXT,
      hoursLost REAL,
      costImpact REAL,
      affectedActivities TEXT, -- JSON array
      temperature REAL,
      windSpeed REAL,
      precipitation REAL,
      createdBy VARCHAR(255),
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Progress Photos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS progress_photos (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      location TEXT,
      photoUrl TEXT NOT NULL,
      thumbnailUrl TEXT,
      photoType TEXT,
      captureDate TEXT,
      tags TEXT, -- JSON
      description TEXT,
      latitude REAL,
      longitude REAL,
      viewAngle REAL,
      floor TEXT,
      zone TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Concrete Pours
  await db.exec(`
    CREATE TABLE IF NOT EXISTS concrete_pours (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      pourDate TEXT,
      location TEXT,
      element TEXT,
      volume REAL,
      unit TEXT,
      mixDesign TEXT,
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
      status TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Concrete Tests
  await db.exec(`
    CREATE TABLE IF NOT EXISTS concrete_tests (
      id VARCHAR(255) PRIMARY KEY,
      pourId VARCHAR(255) NOT NULL,
      testDate TEXT,
      testAge INTEGER,
      strength REAL,
      targetStrength REAL,
      testType TEXT,
      passed BOOLEAN,
      labReportUrl TEXT,
      testLocation TEXT,
      sampleNumber TEXT,
      testedBy TEXT,
      notes TEXT,
      createdAt TEXT,
      FOREIGN KEY(pourId) REFERENCES concrete_pours(id) ON DELETE CASCADE
    )
  `);

  // Subcontractor Insurance
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subcontractor_insurance (
      id VARCHAR(255) PRIMARY KEY,
      subcontractorId VARCHAR(255) NOT NULL,
      policyType TEXT,
      carrier TEXT,
      policyNumber TEXT,
      coverageAmount REAL,
      effectiveDate TEXT,
      expiryDate TEXT,
      certificateUrl TEXT,
      createdAt TEXT,
      FOREIGN KEY(subcontractorId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Payment Applications
  await db.exec(`
    CREATE TABLE IF NOT EXISTS payment_applications (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      subcontractorId VARCHAR(255),
      applicationNumber TEXT,
      period TEXT,
      amountRequested REAL,
      previouslyApproved REAL,
      retainagePercent REAL,
      retainageAmount REAL,
      netPayment REAL,
      submittedDate TEXT,
      notes TEXT,
      status TEXT,
      updatedAt TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // PCOs (Potential Change Orders)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pcos (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      pcoNumber TEXT,
      title TEXT,
      description TEXT,
      requestedBy VARCHAR(255),
      requestDate TEXT,
      estimatedCost REAL,
      estimatedDays INTEGER,
      status TEXT,
      priority TEXT,
      category TEXT,
      attachments TEXT,
      createdBy VARCHAR(255),
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Change Orders
  await db.exec(`
    CREATE TABLE IF NOT EXISTS change_orders (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      pcoId VARCHAR(255),
      coNumber TEXT,
      title TEXT,
      description TEXT,
      originalCost REAL,
      revisedCost REAL,
      costDelta REAL,
      originalDays INTEGER,
      revisedDays INTEGER,
      daysDelta INTEGER,
      status TEXT,
      approvedBy VARCHAR(255),
      approvedAt TEXT,
      executedAt TEXT,
      reasonForChange TEXT,
      impact TEXT, -- JSON
      attachments TEXT, -- JSON
      createdBy VARCHAR(255),
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Change Order Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS change_order_items (
      id VARCHAR(255) PRIMARY KEY,
      changeOrderId VARCHAR(255) NOT NULL,
      description TEXT,
      quantity REAL,
      unit TEXT,
      unitPrice REAL,
      totalPrice REAL,
      FOREIGN KEY(changeOrderId) REFERENCES change_orders(id) ON DELETE CASCADE
    )
  `);


  // NCRs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ncrs (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      ncrNumber TEXT,
      title TEXT,
      description TEXT,
      location TEXT,
      discoveredBy VARCHAR(255),
      discoveredDate TEXT,
      severity TEXT,
      category TEXT,
      status TEXT,
      rootCause TEXT,
      correctiveAction TEXT,
      preventiveAction TEXT,
      assignedTo VARCHAR(255),
      dueDate TEXT,
      closedBy VARCHAR(255),
      closedAt TEXT,
      photos TEXT, -- JSON
      attachments TEXT, -- JSON
      createdBy VARCHAR(255),
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Inspections
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      inspectionNumber TEXT,
      title TEXT,
      type TEXT,
      scheduledDate TEXT,
      inspector VARCHAR(255),
      status TEXT,
      location TEXT,
      checklist TEXT, -- JSON
      findings TEXT, -- JSON
      deficiencies TEXT, -- JSON
      passFailStatus TEXT,
      notes TEXT,
      photos TEXT, -- JSON
      attachments TEXT, -- JSON
      completedAt TEXT,
      createdBy VARCHAR(255),
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Inspection Templates
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inspection_templates (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      name TEXT,
      type TEXT,
      checklist TEXT, -- JSON
      description TEXT,
      isActive BOOLEAN DEFAULT TRUE,
      createdBy VARCHAR(255),
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Submittals
  await db.exec(`
    CREATE TABLE IF NOT EXISTS submittals (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      number TEXT,
      title TEXT,
      type TEXT,
      specSection TEXT,
      submittedBy VARCHAR(255),
      dateSubmitted TEXT,
      dueDate TEXT,
      status TEXT,
      reviewer VARCHAR(255),
      reviewedDate TEXT,
      notes TEXT,
      documentUrl TEXT,
      revision INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Submittal Revisions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS submittal_revisions (
      id VARCHAR(255) PRIMARY KEY,
      submittalId VARCHAR(255) NOT NULL,
      revision INTEGER,
      dateSubmitted TEXT,
      submittedBy VARCHAR(255),
      status TEXT,
      reviewedBy VARCHAR(255),
      reviewedDate TEXT,
      comments TEXT,
      documentUrl TEXT,
      FOREIGN KEY(submittalId) REFERENCES submittals(id) ON DELETE CASCADE
    )
  `);

  // Quality Issues
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quality_issues (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      inspectionId VARCHAR(255),
      severity TEXT,
      description TEXT,
      location TEXT,
      assignedTo VARCHAR(255),
      status TEXT,
      photos TEXT, -- JSON array
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Hazards Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS hazards(
      id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255) NOT NULL,
      company_id VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      severity VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(255),
      detected_by VARCHAR(255),
      detection_method VARCHAR(100),
      image_url TEXT,
      coordinates TEXT,
      status VARCHAR(50) DEFAULT 'open',
      resolution TEXT,
      resolved_by VARCHAR(255),
      resolved_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Resource Allocations Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS resource_allocations(
      id VARCHAR(255) PRIMARY KEY,
      task_id VARCHAR(255) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      start_date VARCHAR(50) NOT NULL,
      end_date VARCHAR(50) NOT NULL,
      allocation_percentage INTEGER DEFAULT 100,
      status VARCHAR(50) DEFAULT 'allocated',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Provisioning Jobs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS provisioning_jobs(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      currentStep VARCHAR(50) NOT NULL,
      stepDetails TEXT,
      error TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
    `);

  // Final MySQL Type Harmonization (Phase 15 - Robust compatibility)
  if (db.getType() === 'mysql') {
    try {
      const dbName = process.env.DB_NAME || 'cortexbuildpro';
      const tables = await db.all("SHOW TABLES");
      const tableKey = `Tables_in_${dbName}`;

      for (const row of tables) {
        const tableName = row[tableKey] || Object.values(row)[0];
        const columns = await db.all(`SHOW COLUMNS FROM ${tableName}`);
        for (const col of columns) {
          if (col.Field === 'createdAt' || col.Field === 'updatedAt') {
            if (col.Type.toLowerCase().includes('timestamp') || col.Type.toLowerCase().includes('datetime')) {
              await db.exec(`ALTER TABLE ${tableName} MODIFY COLUMN ${col.Field} VARCHAR(255)`);
              logger.info(`Migration: Harmonized ${col.Field} in ${tableName} to VARCHAR(255)`);
            }
          }
        }
      }
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('already exists')) {
        logger.error('MySQL Harmonization Failed:', e.message);
      }
    }
  }

  // ==========================================
  // Enhanced Project Fields (Real-time & Organization Features)
  // ==========================================
  await addColumnSafe('projects', 'tags', 'TEXT'); // JSON array of tags
  await addColumnSafe('projects', 'priority', textDefault); // high, medium, low
  await addColumnSafe('projects', 'riskScore', 'REAL'); // 0-100
  await addColumnSafe('projects', 'lastActivity', 'TEXT'); // ISO timestamp
  await addColumnSafe('projects', 'archived', 'INTEGER DEFAULT 0'); // Boolean flag
  await addColumnSafe('projects', 'archivedAt', 'TEXT'); // ISO timestamp
  await addColumnSafe('projects', 'archivedBy', 'VARCHAR(255)'); // User ID
  await addColumnSafe('projects', 'activeCollaborators', 'TEXT'); // JSON array of user IDs
  await addColumnSafe('projects', 'recentComments', 'TEXT'); // JSON array of recent comments
  await addColumnSafe('projects', 'customFields', 'TEXT'); // JSON object for custom data

  // Create indexes for new fields
  await createIndexSafe('projects', 'idx_projects_priority', 'priority');
  await createIndexSafe('projects', 'idx_projects_archived', 'archived');
  await createIndexSafe('projects', 'idx_projects_lastActivity', 'lastActivity');

  // ─── Live Map & Location Tracking Tables ──────────────────────────────────

  // Location logs - GPS history for each user
  await db.exec(`
    CREATE TABLE IF NOT EXISTS location_logs(
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      accuracy DOUBLE PRECISION,
      altitude DOUBLE PRECISION,
      heading DOUBLE PRECISION,
      speed DOUBLE PRECISION,
      recordedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Site maps - AI-generated from PDF drawings
  await db.exec(`
    CREATE TABLE IF NOT EXISTS site_maps(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) NOT NULL,
      name VARCHAR(500) NOT NULL,
      sourceFileUrl TEXT,
      sourceFileName VARCHAR(500),
      mapImageUrl TEXT,
      boundaries TEXT,
      metadata TEXT,
      createdBy VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Map zones - safety/info zones overlaid on site maps
  await db.exec(`
    CREATE TABLE IF NOT EXISTS map_zones(
      id VARCHAR(255) PRIMARY KEY,
      siteMapId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NOT NULL,
      label VARCHAR(500) NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      top DOUBLE PRECISION DEFAULT 0,
      "left" DOUBLE PRECISION DEFAULT 0,
      width DOUBLE PRECISION DEFAULT 10,
      height DOUBLE PRECISION DEFAULT 10,
      protocol TEXT,
      trigger VARCHAR(100) DEFAULT 'Entry',
      createdAt TEXT NOT NULL,
      FOREIGN KEY(siteMapId) REFERENCES site_maps(id) ON DELETE CASCADE,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Location alerts - zone breaches, inactivity, anomalies
  await db.exec(`
    CREATE TABLE IF NOT EXISTS location_alerts(
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) NOT NULL,
      userId VARCHAR(255),
      projectId VARCHAR(255),
      type VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(50) DEFAULT 'info',
      zoneId VARCHAR(255),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      acknowledged INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Add location columns to users table if not present
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN currentLatitude DOUBLE PRECISION`);
  } catch (e) { /* column may already exist */ }
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN currentLongitude DOUBLE PRECISION`);
  } catch (e) { /* column may already exist */ }
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN lastLocationUpdate TEXT`);
  } catch (e) { /* column may already exist */ }

  // Indexes for location queries
  await createIndexSafe('location_logs', 'idx_location_logs_user', 'userId');
  await createIndexSafe('location_logs', 'idx_location_logs_company', 'companyId');
  await createIndexSafe('location_logs', 'idx_location_logs_recorded', 'recordedAt');
  await createIndexSafe('site_maps', 'idx_site_maps_project', 'projectId');
  await createIndexSafe('site_maps', 'idx_site_maps_company', 'companyId');
  await createIndexSafe('location_alerts', 'idx_location_alerts_company', 'companyId');

  logger.info('Database schema initialized successfully');
  await seedFeatureCatalog(db);
}

async function seedFeatureCatalog(db: IDatabase) {
  const features = [
    { name: 'basic_reports', displayName: 'Basic Reports', category: 'Analytics', defaultEnabled: 1 },
    { name: 'advanced_reports', displayName: 'Advanced Reports', category: 'Analytics', defaultEnabled: 0 },
    {
      name: 'real_time_collaboration',
      displayName: 'Real-time Collaboration',
      category: 'Collaboration',
      defaultEnabled: 1
    },
    { name: 'comments_mentions', displayName: 'Comments & Mentions', category: 'Collaboration', defaultEnabled: 1 },
    { name: 'file_sharing', displayName: 'File Sharing', category: 'Collaboration', defaultEnabled: 1 },
    { name: 'document_storage', displayName: 'Document Storage', category: 'Storage', defaultEnabled: 1 },
    { name: 'email_automation', displayName: 'Email Automation', category: 'Automation', defaultEnabled: 1 },
    { name: 'workflow_automation', displayName: 'Workflow Automation', category: 'Automation', defaultEnabled: 0 },
    { name: 'integrations', displayName: 'Integrations', category: 'Integrations', defaultEnabled: 0 }
  ];

  const now = new Date().toISOString();
  for (const f of features) {
    const existing = await db.get('SELECT name FROM featuredefinitions WHERE name = ?', [f.name]);
    if (!existing) {
      await db.run(
        `INSERT INTO featuredefinitions(name, displayName, category, defaultEnabled, createdAt, updatedAt)
  VALUES(?, ?, ?, ?, ?, ?)`,
        [f.name, f.displayName, f.category, f.defaultEnabled, now, now]
      );
    }
  }
  logger.info('Feature catalog seeded');
}

export default {
  initializeDatabase,
  ensureDbInitialized,
  getDb
};
