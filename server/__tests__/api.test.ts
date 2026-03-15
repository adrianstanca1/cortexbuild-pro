import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import request from 'supertest';

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        console.log('[MockAuth] authenticateToken called');
        req.user = { id: 'test-user', email: 'test@example.com' };
        next();
    }
}));

jest.unstable_mockModule('web-push', () => {
    const mock = {
        setVapidDetails: jest.fn<any>(),
        sendNotification: jest.fn<any>().mockResolvedValue({} as any),
    };
    return {
        ...mock,
        default: mock
    };
});

jest.unstable_mockModule('../middleware/contextMiddleware.js', () => ({
    contextMiddleware: (req: any, res: any, next: any) => {
        console.log('[MockContext] contextMiddleware called');
        req.context = {
            userId: 'test-user',
            tenantId: 'c1',
            role: 'SUPERADMIN',
            permissions: ['*'],
            isSuperadmin: true
        };
        req.tenantId = 'c1';
        next();
    }
}));

jest.unstable_mockModule('../middleware/tenantMiddleware.js', () => ({
    tenantRoutingMiddleware: (req: any, res: any, next: any) => {
        req.tenantId = req.headers['x-tenant-id'] || req.headers['x-company-id'] || 'c1';
        next();
    },
    requireTenant: (req: any, res: any, next: any) => next()
}));

jest.unstable_mockModule('../services/permissionService.js', () => ({
    permissionService: {
        hasPermission: jest.fn<any>().mockResolvedValue(true as any),
        getUserPermissions: jest.fn<any>().mockResolvedValue(['*'] as any)
    }
}));

jest.unstable_mockModule('../services/membershipService.js', () => ({
    membershipService: {
        getMembership: jest.fn<any>().mockResolvedValue({ status: 'active', role: 'admin' } as any)
    }
}));

jest.unstable_mockModule('../services/emailService.js', () => ({
    emailService: {
        sendInvitation: jest.fn<any>().mockResolvedValue({ success: true } as any),
        sendPasswordReset: jest.fn<any>().mockResolvedValue({ success: true } as any),
        sendMessage: jest.fn<any>().mockResolvedValue({ success: true } as any)
    }
}));

jest.unstable_mockModule('../services/realtimeService.js', () => ({
    realtimeService: {
        init: jest.fn<any>(),
        registerClient: jest.fn<any>(),
        unregisterClient: jest.fn<any>(),
        updateClientProject: jest.fn<any>(),
        notifySystemAlert: jest.fn<any>(),
        broadcastToUser: jest.fn<any>(),
        broadcastToProject: jest.fn<any>(),
        broadcastToCompany: jest.fn<any>(),
        broadcastToSuperAdmins: jest.fn<any>(),
        notifyEntityChanged: jest.fn<any>()
    }
}));

// Mocks already initialized above
import { ensureDbInitialized, getDb } from '../database.js';

describe('API Integration Tests', () => {
    let server: any;
    let api: any;

    beforeAll(async () => {
        const { default: app, serverPromise } = await import('../index.js');
        server = createServer(app);
        await new Promise<void>((resolve, reject) => {
            const onError = (error: Error) => {
                server.off('listening', onListening);
                reject(error);
            };
            const onListening = () => {
                server.off('error', onError);
                resolve();
            };
            server.once('error', onError);
            server.once('listening', onListening);
            server.listen(0, '127.0.0.1');
        });
        api = request(server);

        // Wait for the server to be fully initialized (DB, seeding, etc.)
        await serverPromise;
        // Also explicitly ensure local DB instance is ready if needed
        await ensureDbInitialized();

        // Seed 'c1' company if it doesn't exist for FK constraints
        const db = getDb();
        const now = new Date().toISOString();
        await db.run(`INSERT OR IGNORE INTO companies (id, name, status, plan, createdAt, updatedAt) VALUES ('c1', 'Test Tenant', 'Active', 'Enterprise', ?, ?)`, [now, now]);
    });

    afterAll(async () => {
        const { closeAll } = await import('../index.js');
        await closeAll();
    });

    it('should return 404 for unknown routes', async () => {
        const res = await api.get('/api/unknown-route');
        expect(res.status).toBe(404);
        expect(res.body.status).toBe('fail');
    });

    it('POST /api/provisioning/companies should return 400 if name is missing', async () => {
        const res = await api
            .post('/api/provisioning/companies')
            .send({
                // missing name
                plan: 'Enterprise'
            });

        expect(res.status).toBe(400);
    });

    it('POST /api/provisioning/companies should create a company with valid data', async () => {
        const res = await api
            .post('/api/provisioning/companies')
            .send({
                company: {
                    name: 'Test Company ' + Date.now(),
                    plan: 'Pro'
                },
                owner: {
                    email: `test-${Date.now()}@example.com`,
                    name: 'Test Owner'
                }
            });

        expect(res.status).toBe(201);
        expect(res.body.data.company.id).toBeDefined();
    });

    it('GET /api/projects should return empty list (or filtered) initially', async () => {
        const res = await api.get('/api/projects').set('x-company-id', 'c1');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/projects should fail validation if name missing', async () => {
        const res = await api
            .post('/api/projects')
            .set('x-company-id', 'c1')
            .send({
                description: 'Project without name'
            });

        expect(res.status).toBe(400); // Zod validation error
    });

    it('POST /api/projects should create project', async () => {
        const res = await api
            .post('/api/projects')
            .set('x-company-id', 'c1')
            .send({
                name: 'New Skyscraper',
                status: 'Planning'
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
    });
});
