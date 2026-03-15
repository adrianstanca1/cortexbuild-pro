import { TenantSafeDatabase } from '../utils/tenantSafeDb.js';
import { IDatabase } from '../database.js';

/**
 * Unit tests for TenantSafeDatabase wrapper
 * Tests tenant isolation enforcement at query level
 */

// Mock database implementation for testing
class MockDatabase implements IDatabase {
    private queries: { sql: string; params: any[] }[] = [];
    private mockResults: any = [];

    async all<T = any>(sql: string, params?: any[]): Promise<T[]> {
        this.queries.push({ sql, params: params || [] });
        return this.mockResults;
    }

    async get<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
        this.queries.push({ sql, params: params || [] });
        return this.mockResults[0];
    }

    async run(sql: string, params?: any[]): Promise<any> {
        this.queries.push({ sql, params: params || [] });
        return { changes: 1, lastID: 1 };
    }

    async exec(sql: string): Promise<void> {
        this.queries.push({ sql, params: [] });
    }

    getType(): 'sqlite' {
        return 'sqlite';
    }

    async close(): Promise<void> { }

    async transaction<T>(fn: (db: IDatabase) => Promise<T>): Promise<T> {
        return fn(this);
    }

    getPoolStats() {
        return {};
    }

    // Test helpers
    getLastQuery() {
        return this.queries[this.queries.length - 1];
    }

    getAllQueries() {
        return this.queries;
    }

    clearQueries() {
        this.queries = [];
    }

    setMockResults(results: any) {
        this.mockResults = results;
    }
}

describe('TenantSafeDatabase', () => {
    let mockDb: MockDatabase;
    let tenantDb: TenantSafeDatabase;
    const TENANT_ID = 'tenant-123';
    const USER_ID = 'user-456';

    beforeEach(() => {
        mockDb = new MockDatabase();
        tenantDb = new TenantSafeDatabase(mockDb, TENANT_ID, USER_ID);
    });

    describe('Constructor', () => {
        test('should throw error if tenantId is missing', () => {
            expect(() => new TenantSafeDatabase(mockDb, '', USER_ID)).toThrow('TenantSafeDatabase requires tenantId');
        });

        test('should create instance with valid tenantId', () => {
            expect(tenantDb).toBeInstanceOf(TenantSafeDatabase);
        });
    });

    describe('safeAll', () => {
        test('should inject WHERE companyId for simple SELECT', async () => {
            await tenantDb.safeAll('SELECT * FROM projects', []);
            const query = mockDb.getLastQuery();

            expect(query.sql).toContain('WHERE companyId = ?');
            expect(query.params).toContain(TENANT_ID);
        });

        test('should append to existing WHERE clause with AND', async () => {
            await tenantDb.safeAll('SELECT * FROM projects WHERE status = ?', ['active']);
            const query = mockDb.getLastQuery();

            expect(query.sql).toContain('WHERE status = ?');
            expect(query.sql).toContain('AND companyId = ?');
            expect(query.params).toEqual(['active', TENANT_ID]);
        });

        test('should handle GROUP BY clause correctly', async () => {
            await tenantDb.safeAll('SELECT status, COUNT(*) FROM projects GROUP BY status', []);
            const query = mockDb.getLastQuery();

            expect(query.sql).toMatch(/WHERE companyId = \?\s+GROUP BY/);
        });

        test('should handle ORDER BY clause correctly', async () => {
            await tenantDb.safeAll('SELECT * FROM projects ORDER BY createdAt DESC', []);
            const query = mockDb.getLastQuery();

            expect(query.sql).toMatch(/WHERE companyId = \?\s+ORDER BY/);
        });

        test('should handle LIMIT clause correctly', async () => {
            await tenantDb.safeAll('SELECT * FROM projects LIMIT 10', []);
            const query = mockDb.getLastQuery();

            expect(query.sql).toMatch(/WHERE companyId = \?\s+LIMIT/);
        });

        test('should not double-inject if companyId already present', async () => {
            await tenantDb.safeAll('SELECT * FROM projects WHERE companyId = ?', [TENANT_ID]);
            const query = mockDb.getLastQuery();

            const matches = query.sql.match(/companyId/g);
            expect(matches?.length).toBe(1);
        });
    });

    describe('safeGet', () => {
        test('should inject WHERE companyId for SELECT', async () => {
            await tenantDb.safeGet('SELECT * FROM projects WHERE id = ?', ['proj-1']);
            const query = mockDb.getLastQuery();

            expect(query.sql).toContain('WHERE id = ?');
            expect(query.sql).toContain('AND companyId = ?');
            expect(query.params).toEqual(['proj-1', TENANT_ID]);
        });
    });

    describe('safeRun', () => {
        test('should validate INSERT includes companyId column', async () => {
            const insertSql = `INSERT INTO projects (id, name, companyId) VALUES (?, ?, ?)`;
            await expect(tenantDb.safeRun(insertSql, ['proj-1', 'Test', 'wrong-tenant']))
                .rejects.toThrow('INSERT companyId mismatch');
        });

        test('should allow INSERT with correct companyId', async () => {
            const insertSql = `INSERT INTO projects (id, name, companyId) VALUES (?, ?, ?)`;
            await tenantDb.safeRun(insertSql, ['proj-1', 'Test', TENANT_ID]);

            const query = mockDb.getLastQuery();
            expect(query.sql).toContain('INSERT INTO projects');
        });

        test('should throw error if INSERT missing companyId column', async () => {
            const insertSql = `INSERT INTO projects (id, name) VALUES (?, ?)`;
            await expect(tenantDb.safeRun(insertSql, ['proj-1', 'Test']))
                .rejects.toThrow('INSERT query must include companyId column');
        });

        test('should inject WHERE companyId for UPDATE', async () => {
            await tenantDb.safeRun('UPDATE projects SET status = ?', ['completed']);
            const query = mockDb.getLastQuery();

            expect(query.sql).toContain('WHERE companyId = ?');
            expect(query.params).toEqual(['completed', TENANT_ID]);
        });

        test('should inject WHERE companyId for DELETE', async () => {
            await tenantDb.safeRun('DELETE FROM projects', []);
            const query = mockDb.getLastQuery();

            expect(query.sql).toContain('WHERE companyId = ?');
            expect(query.params).toContain(TENANT_ID);
        });
    });

    describe('unsafeQuery', () => {
        test('should allow query without tenant filter', async () => {
            mockDb.setMockResults([{ id: '1', name: 'Company A' }, { id: '2', name: 'Company B' }]);
            const results = await tenantDb.unsafeQuery('SELECT * FROM companies', []);

            const query = mockDb.getLastQuery();
            expect(query.sql).not.toContain('companyId');
            expect(results.length).toBe(2);
        });

        test('should log audit trail for unsafe query', async () => {
            // Mock audit_logs insert
            await tenantDb.unsafeQuery('SELECT * FROM users', []);

            const queries = mockDb.getAllQueries();
            const auditQuery = queries.find(q => q.sql.includes('audit_logs'));

            expect(auditQuery).toBeDefined();
            expect(auditQuery?.params).toContain('UNSAFE_QUERY');
        });
    });

    describe('transaction', () => {
        test('should execute transaction with tenant scope', async () => {
            await tenantDb.transaction(async (db) => {
                await db.safeRun('INSERT INTO projects (id, name, companyId) VALUES (?, ?, ?)',
                    ['proj-1', 'Test', TENANT_ID]);
                await db.safeGet('SELECT * FROM projects WHERE id = ?', ['proj-1']);
            });

            const queries = mockDb.getAllQueries();
            expect(queries.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('SQL Injection Protection', () => {
        test('should not be vulnerable to WHERE clause injection', async () => {
            const maliciousParam = "'; DROP TABLE projects; --";
            await tenantDb.safeAll('SELECT * FROM projects WHERE name = ?', [maliciousParam]);

            const query = mockDb.getLastQuery();
            // Parameter should be safely passed, not concatenated
            expect(query.params).toContain(maliciousParam);
            expect(query.sql).not.toContain('DROP TABLE');
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty params array', async () => {
            await tenantDb.safeAll('SELECT * FROM projects', []);
            const query = mockDb.getLastQuery();
            expect(query.params).toEqual([TENANT_ID]);
        });

        test('should handle complex JOIN queries', async () => {
            const sql = `
        SELECT p.*, u.name as ownerName 
        FROM projects p 
        LEFT JOIN users u ON p.ownerId = u.id 
        WHERE p.status = ?
      `;
            await tenantDb.safeAll(sql, ['active']);
            const query = mockDb.getLastQuery();

            expect(query.sql).toContain('AND companyId = ?');
        });

        test('should preserve case in SQL statement', async () => {
            await tenantDb.safeAll('SELECT * FROM Projects WHERE Status = ?', ['Active']);
            const query = mockDb.getLastQuery();

            expect(query.sql).toContain('Projects');
            expect(query.sql).toContain('Status');
        });
    });
});

export { MockDatabase };
