// Imports will be dynamic to allow mocking
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

(jest as any).unstable_mockModule('../database.js', () => ({
    getDb: () => ({
        run: jest.fn<any>().mockResolvedValue({ lastID: 'test-id', changes: 1 } as any),
        get: jest.fn<any>().mockResolvedValue({ id: 'test-id', name: 'Test Tenant' } as any),
        all: jest.fn<any>().mockResolvedValue([] as any)
    })
}));

const { TenantService } = await import('../services/tenantService.js');
const { auditService } = await import('../services/auditService.js');

export { };

describe('Audit Trail Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should log audit event when tenant is created', async () => {
        const auditSpy = jest.spyOn(auditService, 'log').mockResolvedValue(undefined);

        const tenantData = {
            name: 'Audit Test Tenant',
            planId: 'pro-plan',
            adminUser: {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'password123'
            }
        };

        await TenantService.createTenant(tenantData);

        expect(auditSpy).toHaveBeenCalledTimes(1);
        expect(auditSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'TenantService.createTenant',
                resource: 'companies',
                metadata: expect.objectContaining({ name: 'Audit Test Tenant' })
            })
        );
    });

    it('should log audit event when tenant is updated', async () => {
        const auditSpy = jest.spyOn(auditService, 'log').mockResolvedValue(undefined);

        await TenantService.updateTenant('test-id', { name: 'Updated Name' });

        expect(auditSpy).toHaveBeenCalledTimes(1);
        expect(auditSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'TenantService.updateTenant',
                resource: 'companies',
                resourceId: 'test-id'
            })
        );
    });
});
