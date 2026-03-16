import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { AppError } from '../utils/AppError.js';
import { BucketRegistry } from '../buckets/DataBucket.js';
import { getDb } from '../database.js';

/**
 * Search Controller
 * Handles global search across all entities (Projects, Tasks, Documents)
 */

interface SearchResult {
    type: 'project' | 'task' | 'document';
    id: string;
    title: string;
    description?: string;
    url?: string; // For documents or frontend routing
    metadata?: any;
    relevance: number;
}

export const searchAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { q } = req.query;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const isSuperAdmin = req.user?.role === 'SUPERADMIN';
        const isGlobal = isSuperAdmin && req.query.global === 'true';

        // Use main DB for global search, otherwise use tenant-specific DB
        const db = isGlobal ? getDb() : req.tenantDb;
        if (!db) throw new AppError('Database connection failed', 500);

        const query = `%${q}%`;
        const results: SearchResult[] = [];

        // 1. Search Projects
        const projectSql = isGlobal
            ? `SELECT id, name, description, status, companyId FROM projects WHERE name LIKE ? OR description LIKE ? LIMIT 10`
            : `SELECT id, name, description, status FROM projects WHERE name LIKE ? OR description LIKE ? LIMIT 5`;

        const projects = await db.all(projectSql, [query, query]);

        const projectResults: any[] = projects.map(p => ({
            id: p.id,
            name: p.name,
            type: 'project',
            companyId: p.companyId,
            status: p.status
        }));

        // 2. Search Tasks (Include these in projects for now or separate if needed)
        // For GlobalSearch.tsx, let's stick to the groups it expects: tenants, users, projects

        const tenantResults: any[] = [];
        const userResults: any[] = [];

        // 4. Global-only searches (Tenants & Users)
        if (isGlobal) {
            // Search Tenants
            const tenantSql = `SELECT id, name, status, industry FROM companies WHERE name LIKE ? OR domain LIKE ? LIMIT 10`;
            const companies = await db.all(tenantSql, [query, query]);
            companies.forEach(c => {
                tenantResults.push({
                    id: c.id,
                    name: c.name,
                    type: 'tenant',
                    industry: c.industry,
                    status: c.status
                });
            });

            // Search Users
            const userSql = `SELECT id, name, email, role FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10`;
            const users = await db.all(userSql, [query, query]);
            users.forEach(u => {
                userResults.push({
                    id: u.id,
                    name: u.name,
                    type: 'user',
                    role: u.role,
                    email: u.email
                });
            });
        }

        res.json({
            success: true,
            data: {
                tenants: tenantResults,
                users: userResults,
                projects: projectResults
            }
        });
    } catch (error) {
        next(error);
    }
};
