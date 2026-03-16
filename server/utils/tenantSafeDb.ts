import { IDatabase } from '../database.js';
import { logger } from './logger.js';

/**
 * TenantSafeDatabase - Wrapper that enforces tenant isolation at query level
 * 
 * All queries automatically inject companyId filter to prevent cross-tenant data leaks.
 * Use unsafeQuery() only for SUPERADMIN operations (logged for audit).
 */
export class TenantSafeDatabase {
    private db: IDatabase;
    private tenantId: string;
    private userId?: string;

    constructor(db: IDatabase, tenantId: string, userId?: string) {
        if (!tenantId) {
            throw new Error('TenantSafeDatabase requires tenantId');
        }
        this.db = db;
        this.tenantId = tenantId;
        this.userId = userId;
    }

    /**
     * Tenant-safe SELECT query - auto-injects WHERE companyId = ?
     * @param sql - SQL query (should NOT include WHERE companyId clause)
     * @param params - Query parameters
     * @returns Array of results scoped to tenant
     */
    async safeAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const { scopedSql, scopedParams } = this.injectTenantFilter(sql, params);
        logger.debug(`[TenantSafeDB] safeAll for tenant ${this.tenantId}: ${scopedSql}`);
        return this.db.all<T>(scopedSql, scopedParams);
    }

    /**
     * Tenant-safe SELECT query - auto-injects WHERE companyId = ?
     * @param sql - SQL query
     * @param params - Query parameters
     * @returns Single result or undefined
     */
    async safeGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
        const { scopedSql, scopedParams } = this.injectTenantFilter(sql, params);
        logger.debug(`[TenantSafeDB] safeGet for tenant ${this.tenantId}: ${scopedSql}`);
        return this.db.get<T>(scopedSql, scopedParams);
    }

    /**
     * Tenant-safe INSERT/UPDATE/DELETE - validates companyId presence
     * @param sql - SQL query
     * @param params - Query parameters (must include companyId for INSERT)
     * @returns Query result
     */
    async safeRun(sql: string, params: any[] = []): Promise<any> {
        const sqlUpper = sql.trim().toUpperCase();

        if (sqlUpper.startsWith('INSERT')) {
            // Validate INSERT includes companyId
            if (!sql.toLowerCase().includes('companyid') && !sql.toLowerCase().includes('company_id')) {
                throw new Error('INSERT query must include companyId column for tenant isolation');
            }
            // Ensure companyId value matches tenant
            const companyIdIndex = this.findCompanyIdIndex(sql);
            if (companyIdIndex !== -1 && params[companyIdIndex] !== this.tenantId) {
                throw new Error(`INSERT companyId mismatch: expected ${this.tenantId}, got ${params[companyIdIndex]}`);
            }
        } else if (sqlUpper.startsWith('UPDATE') || sqlUpper.startsWith('DELETE')) {
            // Auto-inject WHERE companyId = ? for UPDATE/DELETE
            const { scopedSql, scopedParams } = this.injectTenantFilter(sql, params);
            logger.debug(`[TenantSafeDB] safeRun for tenant ${this.tenantId}: ${scopedSql}`);
            return this.db.run(scopedSql, scopedParams);
        }

        logger.debug(`[TenantSafeDB] safeRun for tenant ${this.tenantId}: ${sql}`);
        return this.db.run(sql, params);
    }

    /**
     * UNSAFE query - bypasses tenant filter (use only for SUPERADMIN or cross-tenant ops)
     * Automatically logged for security audit
     */
    async unsafeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        logger.warn(`[TenantSafeDB] UNSAFE QUERY by user ${this.userId} for tenant ${this.tenantId}: ${sql.substring(0, 100)}...`);

        // Audit log the unsafe query
        try {
            await this.db.run(`
        INSERT INTO audit_logs (id, userId, companyId, action, resource, resourceId, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                this.generateId(),
                this.userId || 'system',
                this.tenantId,
                'UNSAFE_QUERY',
                'database',
                null,
                JSON.stringify({ sql: sql.substring(0, 500), params }),
                new Date().toISOString()
            ]);
        } catch (err) {
            logger.error('Failed to audit log unsafe query:', err);
        }

        return this.db.all<T>(sql, params);
    }

    /**
     * Execute raw SQL without tenant filtering (for schema migrations, etc.)
     * DANGER: Only use in migration scripts
     */
    async exec(sql: string): Promise<void> {
        logger.warn(`[TenantSafeDB] EXEC (schema operation) for tenant ${this.tenantId}`);
        return this.db.exec(sql);
    }

    /**
     * Get underlying database type
     */
    getType(): 'sqlite' | 'postgres' | 'mysql' {
        return this.db.getType();
    }

    /**
     * Start transaction (tenant-scoped)
     */
    async transaction<T>(fn: (db: TenantSafeDatabase) => Promise<T>): Promise<T> {
        return this.db.transaction(async (transactionDb) => {
            const scopedDb = new TenantSafeDatabase(transactionDb, this.tenantId, this.userId);
            return fn(scopedDb);
        });
    }

    /**
     * Inject WHERE companyId = ? into SQL query
     * Handles existing WHERE clauses, JOINs, GROUP BY, etc.
     */
    private injectTenantFilter(sql: string, params: any[]): { scopedSql: string; scopedParams: any[] } {
        const sqlUpper = sql.trim().toUpperCase();

        // Already has companyId filter - don't double-inject
        if (sql.toLowerCase().includes('companyid =') || sql.toLowerCase().includes('company_id =')) {
            return { scopedSql: sql, scopedParams: params };
        }

        let scopedSql = sql.trim();
        let scopedParams = [...params];

        // Find WHERE clause insertion point
        const whereIndex = sqlUpper.indexOf('WHERE');
        const groupByIndex = sqlUpper.indexOf('GROUP BY');
        const orderByIndex = sqlUpper.indexOf('ORDER BY');
        const limitIndex = sqlUpper.indexOf('LIMIT');

        if (whereIndex !== -1) {
            // Append to existing WHERE with AND
            const insertPos = this.findWhereClauseEnd(sqlUpper, whereIndex);
            scopedSql = sql.substring(0, insertPos) + ' AND companyId = ?' + sql.substring(insertPos);
            scopedParams.push(this.tenantId);
        } else {
            // Insert new WHERE before GROUP BY, ORDER BY, or LIMIT
            let insertPos = sql.length;
            if (groupByIndex !== -1) insertPos = Math.min(insertPos, groupByIndex);
            if (orderByIndex !== -1) insertPos = Math.min(insertPos, orderByIndex);
            if (limitIndex !== -1) insertPos = Math.min(insertPos, limitIndex);

            scopedSql = sql.substring(0, insertPos).trim() + ' WHERE companyId = ? ' + sql.substring(insertPos);
            scopedParams.push(this.tenantId);
        }

        return { scopedSql, scopedParams };
    }

    /**
     * Find the end of the WHERE clause (before GROUP BY, ORDER BY, LIMIT)
     */
    private findWhereClauseEnd(sqlUpper: string, whereIndex: number): number {
        const groupByIndex = sqlUpper.indexOf('GROUP BY', whereIndex);
        const orderByIndex = sqlUpper.indexOf('ORDER BY', whereIndex);
        const limitIndex = sqlUpper.indexOf('LIMIT', whereIndex);

        let endPos = sqlUpper.length;
        if (groupByIndex !== -1) endPos = Math.min(endPos, groupByIndex);
        if (orderByIndex !== -1) endPos = Math.min(endPos, orderByIndex);
        if (limitIndex !== -1) endPos = Math.min(endPos, limitIndex);

        return endPos;
    }

    /**
     * Find companyId parameter index in INSERT statement
     */
    private findCompanyIdIndex(sql: string): number {
        const sqlLower = sql.toLowerCase();
        const valuesIndex = sqlLower.indexOf('values');
        if (valuesIndex === -1) return -1;

        const columnsPart = sql.substring(0, valuesIndex);
        const columns = columnsPart.match(/\(([^)]+)\)/)?.[1].split(',').map(c => c.trim().toLowerCase());

        if (!columns) return -1;

        const companyIdIndex = columns.findIndex(c => c === 'companyid' || c === 'company_id');
        return companyIdIndex;
    }

    /**
     * Generate UUID for audit logs
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Helper to create tenant-safe database instance
 */
export function createTenantSafeDb(db: IDatabase, tenantId: string, userId?: string): TenantSafeDatabase {
    return new TenantSafeDatabase(db, tenantId, userId);
}
