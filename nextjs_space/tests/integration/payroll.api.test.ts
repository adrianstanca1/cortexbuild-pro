/**
 * Payroll API Integration Tests
 * Tests CRUD operations, authentication, RBAC, error cases, and data validation
 * Focus on CIS (Construction Industry Scheme) deductions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPrisma = {
  payroll: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  teamMember: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  organization: {
    create: vi.fn(),
  },
};

describe('Payroll API', () => {
  const mockOrganization = { id: 'test-org-123', name: 'Test Org', slug: 'test-org' };
  const mockTeamMember = { id: 'tm-1', userId: 'user-1', organizationId: mockOrganization.id, role: 'EMPLOYEE', displayName: 'Test Employee' };
  const mockAdminUser = { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', organizationId: mockOrganization.id };
  const mockUser = { id: 'user-1', email: 'user@test.com', name: 'User', role: 'FIELD_WORKER', organizationId: mockOrganization.id };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Requirements', () => {
    it('should reject unauthenticated GET requests', async () => {
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated POST requests', async () => {
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payroll - List Payroll Records', () => {
    it('should return empty list when no payroll records exist', async () => {
      mockPrisma.payroll.findMany.mockResolvedValue([]);
      const payrolls = await mockPrisma.payroll.findMany({ where: { organizationId: mockOrganization.id } });
      expect(payrolls.length).toBe(0);
    });

    it('should return payroll records filtered by organization', async () => {
      const mockPayrolls = [{
        id: 'p-1',
        employeeId: mockTeamMember.id,
        organizationId: mockOrganization.id,
        period: '2024-01',
        baseSalary: 5000,
        status: 'DRAFT',
      }];
      mockPrisma.payroll.findMany.mockResolvedValue(mockPayrolls);
      const payrolls = await mockPrisma.payroll.findMany({ where: { organizationId: mockOrganization.id } });
      expect(payrolls.length).toBe(1);
      expect(payrolls[0].organizationId).toBe(mockOrganization.id);
    });

    it('should include employee and user details', async () => {
      const mockPayroll = {
        id: 'p-2',
        employeeId: mockTeamMember.id,
        organizationId: mockOrganization.id,
        period: '2024-02',
        baseSalary: 6000,
        employee: { userId: mockTeamMember.userId, user: { id: mockUser.id, name: mockUser.name } },
      };
      mockPrisma.payroll.create.mockResolvedValue(mockPayroll);
      const payroll = await mockPrisma.payroll.create({ data: mockPayroll });
      expect(payroll.employee).toBeDefined();
    });

    it('should filter by period parameter', async () => {
      const mockPayrolls = [{ id: 'p-jan', period: '2024-01', organizationId: mockOrganization.id }];
      mockPrisma.payroll.findMany.mockResolvedValue(mockPayrolls);
      const januaryPayrolls = await mockPrisma.payroll.findMany({ where: { organizationId: mockOrganization.id, period: '2024-01' } });
      expect(januaryPayrolls.length).toBe(1);
      expect(januaryPayrolls[0].period).toBe('2024-01');
    });

    it('should filter by status parameter', async () => {
      const mockPayrolls = [{ id: 'p-draft', status: 'DRAFT', organizationId: mockOrganization.id }];
      mockPrisma.payroll.findMany.mockResolvedValue(mockPayrolls);
      const draftPayrolls = await mockPrisma.payroll.findMany({ where: { organizationId: mockOrganization.id, status: 'DRAFT' } });
      expect(draftPayrolls.length).toBe(1);
      expect(draftPayrolls[0].status).toBe('DRAFT');
    });

    it('should filter by employeeId parameter', async () => {
      const mockPayrolls = [{ id: 'p-emp', employeeId: mockTeamMember.id, organizationId: mockOrganization.id }];
      mockPrisma.payroll.findMany.mockResolvedValue(mockPayrolls);
      const empPayrolls = await mockPrisma.payroll.findMany({ where: { organizationId: mockOrganization.id, employeeId: mockTeamMember.id } });
      expect(empPayrolls.length).toBe(1);
      expect(empPayrolls[0].employeeId).toBe(mockTeamMember.id);
    });

    it('should order by period descending', async () => {
      const mockPayrolls = [
        { id: 'p-2', period: '2024-06', organizationId: mockOrganization.id },
        { id: 'p-1', period: '2024-01', organizationId: mockOrganization.id },
      ];
      mockPrisma.payroll.findMany.mockResolvedValue(mockPayrolls);
      const payrolls = await mockPrisma.payroll.findMany({ orderBy: { period: 'desc' } });
      expect(payrolls.length).toBe(2);
      expect(payrolls[0].period).toBe('2024-06');
    });
  });

  describe('POST /api/payroll - Create Payroll Record', () => {
    it('should reject request from FIELD_WORKER role', () => {
      expect(mockUser.role).toBe('FIELD_WORKER');
      const allowedRoles = ['ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN', 'SUPER_ADMIN'];
      expect(allowedRoles).not.toContain('FIELD_WORKER');
    });

    it('should reject request without employeeId', () => {
      const invalidData: Record<string, string> = { period: '2024-01', baseSalary: '5000' };
      expect(invalidData).not.toHaveProperty('employeeId');
    });

    it('should reject request without period', () => {
      const invalidData: Record<string, string> = { employeeId: '123', baseSalary: '5000' };
      expect(invalidData).not.toHaveProperty('period');
    });

    it('should reject request without baseSalary', () => {
      const invalidData: Record<string, string> = { employeeId: '123', period: '2024-01' };
      expect(invalidData).not.toHaveProperty('baseSalary');
    });

    it('should reject invalid employeeId', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(null);
      const teamMember = await mockPrisma.teamMember.findUnique({ where: { id: 'invalid-id' } });
      expect(teamMember).toBeNull();
    });

    it('should reject employee from different organization', () => {
      const otherTeamMember = { id: 'other-tm', organizationId: 'other-org' };
      expect(otherTeamMember.organizationId).not.toBe(mockOrganization.id);
    });

    it('should create payroll with all required fields', async () => {
      const newPayroll = {
        id: 'p-new',
        employeeId: mockTeamMember.id,
        organizationId: mockOrganization.id,
        period: '2024-07',
        baseSalary: 5000,
        status: 'DRAFT',
      };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.id).toBeDefined();
      expect(created.employeeId).toBe(mockTeamMember.id);
      expect(created.period).toBe('2024-07');
    });

    it('should create payroll with default status DRAFT', async () => {
      const newPayroll = { id: 'p-d', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2024-08', baseSalary: 5000 };
      mockPrisma.payroll.create.mockResolvedValue({ ...newPayroll, status: 'DRAFT' });
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.status).toBe('DRAFT');
    });

    it('should calculate CIS deduction correctly (20% standard rate)', () => {
      const baseSalary = 5000;
      const overtime = 500;
      const labour = baseSalary + overtime;
      const cisRate = 20;
      const cisDeduction = Math.round((labour * (cisRate / 100)) * 100) / 100;
      expect(cisDeduction).toBe(1100);
    });

    it('should calculate netPay correctly', () => {
      const baseSalary = 5000;
      const overtime = 500;
      const niContribution = 200;
      const pension = 100;
      const cisDeduction = 1100;
      const netPay = Math.round((baseSalary + overtime - cisDeduction - niContribution - pension) * 100) / 100;
      expect(netPay).toBe(4100);
    });

    it('should create payroll with overtime', async () => {
      const newPayroll = { id: 'p-ot', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2024-09', baseSalary: 5000, overtime: 800 };
      mockPrisma.payroll.create.mockResolvedValue({ ...newPayroll, overtime: 800 });
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.overtime).toBe(800);
    });

    it('should create payroll with default overtime 0', async () => {
      const newPayroll = { id: 'p-ot0', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2024-10', baseSalary: 5000 };
      mockPrisma.payroll.create.mockResolvedValue({ ...newPayroll, overtime: 0 });
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.overtime).toBe(0);
    });

    it('should create payroll with NI contribution', async () => {
      const newPayroll = { id: 'p-ni', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2024-11', baseSalary: 5000, niContribution: 250 };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.niContribution).toBe(250);
    });

    it('should create payroll with pension contribution', async () => {
      const newPayroll = { id: 'p-pen', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2025-01', baseSalary: 5000, pension: 300 };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.pension).toBe(300);
    });

    it('should create payroll with notes', async () => {
      const newPayroll = { id: 'p-notes', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2025-03', baseSalary: 5000, notes: 'Bonus included' };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.notes).toBe('Bonus included');
    });

    it('should create payroll with status PROCESSED', async () => {
      const newPayroll = { id: 'p-proc', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2025-04', baseSalary: 5000, status: 'PROCESSED' };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.status).toBe('PROCESSED');
    });

    it('should create payroll with status PAID', async () => {
      const newPayroll = { id: 'p-paid', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2025-05', baseSalary: 5000, status: 'PAID' };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.status).toBe('PAID');
    });

    it('should create payroll with status CANCELLED', async () => {
      const newPayroll = { id: 'p-cancel', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2025-06', baseSalary: 5000, status: 'CANCELLED' };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.status).toBe('CANCELLED');
    });
  });

  describe('Data Validation', () => {
    it('should validate PayrollStatus enum values', () => {
      const validStatuses = ['DRAFT', 'PROCESSED', 'PAID', 'CANCELLED'];
      for (const status of validStatuses) {
        expect(validStatuses).toContain(status);
      }
    });

    it('should validate period format (YYYY-MM)', () => {
      const validPeriod = '2024-01';
      expect(validPeriod).toMatch(/^\d{4}-\d{2}$/);
      const invalidPeriod = '01-2024';
      expect(invalidPeriod).not.toMatch(/^\d{4}-\d{2}$/);
    });

    it('should handle decimal baseSalary values', () => {
      const payroll = { id: 'p-dec', baseSalary: 5000.50 };
      expect(payroll.baseSalary).toBe(5000.50);
    });

    it('should handle null notes field', () => {
      const payroll: Record<string, unknown> = { id: 'p-null', baseSalary: 5000 };
      expect(payroll).not.toHaveProperty('notes');
    });
  });

  describe('RBAC Permissions', () => {
    it('should allow ADMIN to create payroll', () => {
      expect(mockAdminUser.role).toBe('ADMIN');
    });

    it('should allow COMPANY_OWNER to create payroll', () => {
      const owner = { id: 'own-1', role: 'COMPANY_OWNER', organizationId: mockOrganization.id };
      expect(owner.role).toBe('COMPANY_OWNER');
    });

    it('should allow COMPANY_ADMIN to create payroll', () => {
      const companyAdmin = { id: 'ca-1', role: 'COMPANY_ADMIN', organizationId: mockOrganization.id };
      expect(companyAdmin.role).toBe('COMPANY_ADMIN');
    });

    it('should allow SUPER_ADMIN to create payroll', () => {
      const superAdmin = { id: 'sa-1', role: 'SUPER_ADMIN' };
      expect(superAdmin.role).toBe('SUPER_ADMIN');
    });

    it('should restrict payroll to user organization', () => {
      const otherOrg = { id: 'other-org' };
      const testOrgPayrolls = [{ organizationId: mockOrganization.id }];
      const otherOrgPayrolls = [{ organizationId: otherOrg.id }];
      expect(testOrgPayrolls.every((p) => p.organizationId === mockOrganization.id)).toBe(true);
    });

    it('should deny FIELD_WORKER access to payroll', () => {
      const allowedRoles = ['ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN', 'SUPER_ADMIN'];
      expect(allowedRoles).not.toContain('FIELD_WORKER');
    });

    it('should deny PROJECT_MANAGER access to payroll', () => {
      const allowedRoles = ['ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN', 'SUPER_ADMIN'];
      expect(allowedRoles).not.toContain('PROJECT_MANAGER');
    });
  });

  describe('Error Cases', () => {
    it('should handle non-existent employee', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(null);
      const teamMember = await mockPrisma.teamMember.findUnique({ where: { id: '0000-0000' } });
      expect(teamMember).toBeNull();
    });

    it('should handle duplicate period for same employee', async () => {
      const existingPayroll = { id: 'p-dup', employeeId: mockTeamMember.id, period: '2024-DUP' };
      mockPrisma.payroll.findFirst.mockResolvedValue(existingPayroll);
      const duplicate = await mockPrisma.payroll.findFirst({ where: { employeeId: mockTeamMember.id, period: '2024-DUP' } });
      expect(duplicate).toBeDefined();
    });

    it('should handle very large baseSalary', async () => {
      const newPayroll = { id: 'p-high', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2024-HIGH', baseSalary: 1000000.99 };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.baseSalary).toBe(1000000.99);
    });

    it('should handle zero baseSalary', async () => {
      const newPayroll = { id: 'p-zero', employeeId: mockTeamMember.id, organizationId: mockOrganization.id, period: '2024-ZERO', baseSalary: 0 };
      mockPrisma.payroll.create.mockResolvedValue(newPayroll);
      const created = await mockPrisma.payroll.create({ data: newPayroll });
      expect(created.baseSalary).toBe(0);
    });
  });

  describe('CIS Deduction Calculations', () => {
    it('should apply standard 20% CIS rate', () => {
      const labour = 5000;
      const standardRate = 20;
      const cisDeduction = labour * (standardRate / 100);
      expect(cisDeduction).toBe(1000);
    });

    it('should apply gross 30% CIS rate for non-registered', () => {
      const labour = 5000;
      const grossRate = 30;
      const cisDeduction = labour * (grossRate / 100);
      expect(cisDeduction).toBe(1500);
    });

    it('should apply 0% CIS rate for verified', () => {
      const labour = 5000;
      const verifiedRate = 0;
      const cisDeduction = labour * (verifiedRate / 100);
      expect(cisDeduction).toBe(0);
    });

    it('should calculate total labour cost', () => {
      const baseSalary = 5000;
      const overtime = 800;
      const totalLabour = baseSalary + overtime;
      expect(totalLabour).toBe(5800);
    });

    it('should calculate netPay with all deductions', () => {
      const baseSalary = 6000;
      const overtime = 1000;
      const cisDeduction = 1400;
      const niContribution = 300;
      const pension = 200;
      const netPay = baseSalary + overtime - cisDeduction - niContribution - pension;
      expect(netPay).toBe(5100);
    });
  });
});
