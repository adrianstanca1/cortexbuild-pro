import { jest } from '@jest/globals';

// Mock Middleware using unstable_mockModule for ESM support
jest.unstable_mockModule('../middleware/authMiddleware', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        // console.log('Mock Auth Middleware Triggered');
        req.user = { id: 'test-user', companyId: 'test-company', role: 'ADMIN' };
        req.tenantId = 'test-company';
        next();
    }
}));

jest.unstable_mockModule('../middleware/contextMiddleware', () => ({
    contextMiddleware: (req: any, res: any, next: any) => {
        req.context = {
            userId: 'test-user',
            tenantId: 'test-company',
            role: 'ADMIN',
            permissions: ['*'],
            isSuperadmin: false
        };
        next();
    }
}));

// Dynamic imports after mocks are defined
const request = (await import('supertest')).default;
const { describe, it, expect, beforeAll } = await import('@jest/globals');
const { default: app } = await import('../index');
const { ensureDbInitialized, getDb } = await import('../database');

const COMPANY_ID = 'test-company';
const PROJECT_ID = 'proj-concrete-1';
let pourId: string;

describe('Concrete Management Flow', () => {
    beforeAll(async () => {
        await ensureDbInitialized();
        const db = getDb();

        // Seed Company
        try {
            await db.run('INSERT INTO companies (id, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)', [
                COMPANY_ID, 'Test Company', 'active', new Date().toISOString(), new Date().toISOString()
            ]);
        } catch (e) {
            // Ignore duplicate key errors during test setup
        }

        // Seed Project
        try {
            await db.run('INSERT INTO projects (id, companyId, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', [
                PROJECT_ID, COMPANY_ID, 'Concrete Project', 'Active', new Date().toISOString(), new Date().toISOString()
            ]);
        } catch (e) {
            // Ignore duplicate key errors during test setup
        }
    });

    it('should create a new Concrete Pour', async () => {
        const res = await request(app)
            .post('/api/construction/concrete/pours')
            .send({
                projectId: PROJECT_ID,
                location: 'Foundation Slab A',
                scheduledDate: new Date().toISOString(),
                mixDesign: 'MIX-3000',
                volume: 50,
                supplier: 'Test Concrete Co',
                temperature: 75,
                slump: 4,
                status: 'scheduled'
            });

        if (res.status !== 201) {
            console.error('Create Pour Failed:', res.status, res.body);
        }
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.location).toBe('Foundation Slab A');
        pourId = res.body.id;
    });

    it('should log a Concrete Test for the pour', async () => {
        expect(pourId).toBeDefined();

        const res = await request(app)
            .post('/api/construction/concrete/tests')
            .send({
                pourId,
                testDate: new Date().toISOString(),
                testAge: 7,
                strength: 3200,
                testType: '7-day',
                passed: true,
                notes: 'Passed 7-day target'
            });

        if (res.status !== 201) {
            console.error('Create Test Failed:', res.status, res.body);
        }
        expect(res.status).toBe(201);
        expect(res.body.strength).toBe(3200);
    });

    it('should retrieve the Strength Curve', async () => {
        expect(pourId).toBeDefined();

        const res = await request(app)
            .get(`/api/construction/concrete/pours/${pourId}/strength-curve`);

        if (res.status !== 200) {
            console.error('Get Curve Failed:', res.status, res.body);
        }
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('curve');
        expect(Array.isArray(res.body.curve)).toBe(true);

        // Should have the data point we just added
        const dataPoint = res.body.curve.find((d: any) => d.age === 7);
        expect(dataPoint).toBeDefined();
        expect(dataPoint.strength).toBe(3200);
    });
});
