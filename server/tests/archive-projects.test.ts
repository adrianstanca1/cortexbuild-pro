import request from 'supertest';
import { jest } from '@jest/globals';

let app: any;
let serverPromise: Promise<unknown>;
let ensureDbInitialized: () => Promise<void>;
let getDb: () => any;

import { v4 as uuidv4 } from 'uuid';

// --- Mocks ---
jest.mock('../middleware/authMiddleware.js', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const tokenStr = authHeader.split(' ')[1];
                const cleanToken = tokenStr.includes('%7B') ? decodeURIComponent(tokenStr) : tokenStr;
                if (cleanToken.startsWith('{')) {
                    req.user = JSON.parse(cleanToken);
                } else {
                    req.user = { id: 'test-user', companyId: 'c1' };
                }
            } catch (e) {
                return res.status(403).json({ error: 'Invalid test token' });
            }
        }
        next();
    }
}));

jest.mock('../middleware/contextMiddleware.js', () => ({
    contextMiddleware: (req: any, res: any, next: any) => {
        if (req.user) {
            req.context = {
                userId: req.user.id,
                tenantId: req.user.companyId,
                role: req.user.role || 'ADMIN',
                permissions: ['projects:read', 'projects:create', 'projects:update', 'projects:delete'],
                isSuperadmin: req.user.role === 'SUPERADMIN'
            };
            req.tenantId = req.user.companyId;
        }
        next();
    }
}));

jest.mock('../services/permissionService.js', () => ({
    permissionService: {
        checkPermission: jest.fn().mockReturnValue(true),
        getUserPermissions: jest.fn().mockResolvedValue(['projects:read', 'projects:create', 'projects:update', 'projects:delete'])
    }
}));

const indexModule = await import('../index.js');
app = indexModule.default;
serverPromise = indexModule.serverPromise;
const databaseModule = await import('../database.js');
ensureDbInitialized = databaseModule.ensureDbInitialized;
getDb = databaseModule.getDb;

describe.skip('Project Archive Endpoints', () => {
    let testProjectId: string;
    const testToken = JSON.stringify({ id: 'demo-user', companyId: 'c1', role: 'ADMIN' });

    beforeAll(async () => {
        await serverPromise;
        await ensureDbInitialized();

        // Create a test project
        const db = getDb();
        testProjectId = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO projects (
                id, companyId, name, code, description, location, type, status, health,
                progress, budget, spent, startDate, endDate, manager, image, teamSize,
                tags, priority, riskScore, lastActivity, archived, activeCollaborators,
                recentComments, customFields, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                testProjectId, 'c1', 'Test Archive Project', 'TEST-001', 'Test project for archive',
                'Test Location', 'Commercial', 'Active', 'Good', 50, 100000, 50000,
                now, now, 'Test Manager', '', 10,
                '["test"]', 'medium', 30, now, 0, '[]', '[]', '{}', now, now
            ]
        );
    });

    afterAll(async () => {
        // Clean up test project
        const db = getDb();
        await db.run('DELETE FROM projects WHERE id = ?', [testProjectId]);
    });

    it('should archive a project', async () => {
        const response = await request(app)
            .post(`/api/projects/${testProjectId}/archive`)
            .set('Authorization', `Bearer ${testToken}`)
            .expect(200);

        expect(response.body).toHaveProperty('id', testProjectId);
        expect(response.body).toHaveProperty('archived', true);
        expect(response.body).toHaveProperty('archivedAt');
        expect(response.body).toHaveProperty('archivedBy', 'demo-user');

        // Verify in database
        const db = getDb();
        const project = await db.get('SELECT archived, archivedAt, archivedBy FROM projects WHERE id = ?', [testProjectId]);
        expect(project.archived).toBe(1);
        expect(project.archivedAt).toBeTruthy();
        expect(project.archivedBy).toBe('demo-user');
    });

    it('should unarchive a project', async () => {
        const response = await request(app)
            .post(`/api/projects/${testProjectId}/unarchive`)
            .set('Authorization', `Bearer ${testToken}`)
            .expect(200);

        expect(response.body).toHaveProperty('id', testProjectId);
        expect(response.body).toHaveProperty('archived', false);
        expect(response.body.archivedAt).toBeNull();
        expect(response.body.archivedBy).toBeNull();

        // Verify in database
        const db = getDb();
        const project = await db.get('SELECT archived, archivedAt, archivedBy FROM projects WHERE id = ?', [testProjectId]);
        expect(project.archived).toBe(0);
        expect(project.archivedAt).toBeNull();
        expect(project.archivedBy).toBeNull();
    });

    it('should get project stats', async () => {
        const response = await request(app)
            .get(`/api/projects/${testProjectId}/stats`)
            .set('Authorization', `Bearer ${testToken}`)
            .expect(200);

        expect(response.body).toHaveProperty('project');
        expect(response.body).toHaveProperty('tasks');
        expect(response.body).toHaveProperty('documentCount');
        expect(response.body).toHaveProperty('teamMemberCount');
        expect(response.body.project.id).toBe(testProjectId);
    });

    it('should return 404 for non-existent project archive', async () => {
        const fakeId = uuidv4();
        await request(app)
            .post(`/api/projects/${fakeId}/archive`)
            .set('Authorization', `Bearer ${testToken}`)
            .expect(404);
    });

    it('should return 404 for non-existent project unarchive', async () => {
        const fakeId = uuidv4();
        await request(app)
            .post(`/api/projects/${fakeId}/unarchive`)
            .set('Authorization', `Bearer ${testToken}`)
            .expect(404);
    });

    it('should verify archived field in project list', async () => {
        // Archive the project first
        await request(app)
            .post(`/api/projects/${testProjectId}/archive`)
            .set('Authorization', `Bearer ${testToken}`);

        // Get all projects
        const response = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${testToken}`)
            .expect(200);

        const archivedProject = response.body.find((p: any) => p.id === testProjectId);
        expect(archivedProject).toBeDefined();
        expect(archivedProject.archived).toBe(true);
    });
});
