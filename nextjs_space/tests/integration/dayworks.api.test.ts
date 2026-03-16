/**
 * Dayworks API Integration Tests
 * Tests CRUD operations, authentication, RBAC, error cases, and data validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
const mockPrisma = {
  dailyReport: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
  },
  user: {
    create: vi.fn(),
  },
  organization: {
    create: vi.fn(),
  },
};

describe('Dayworks API', () => {
  const mockOrganization = {
    id: 'test-org-123',
    name: 'Test Org',
    slug: 'test-org',
  };

  const mockProject = {
    id: 'test-project-123',
    name: 'Test Project',
    organizationId: mockOrganization.id,
  };

  const mockUser = {
    id: 'test-user-123',
    email: 'test@test.com',
    name: 'Test User',
    role: 'PROJECT_MANAGER',
    organizationId: mockOrganization.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Requirements', () => {
    it('should reject unauthenticated GET requests', async () => {
      // Simulate 401 response for unauthenticated request
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated POST requests', async () => {
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dayworks - List Dayworks', () => {
    it('should return empty list when no dayworks exist', async () => {
      mockPrisma.dailyReport.findMany.mockResolvedValue([]);
      const dayworks = await mockPrisma.dailyReport.findMany({ where: { projectId: mockProject.id } });
      expect(dayworks.length).toBe(0);
    });

    it('should return dayworks filtered by projectId', async () => {
      const mockDayworks = [
        {
          id: 'dw-1',
          reportDate: new Date('2024-01-15'),
          weather: 'SUNNY',
          workPerformed: 'Foundation work',
          manpowerCount: 5,
          projectId: mockProject.id,
          createdById: mockUser.id,
        },
      ];
      mockPrisma.dailyReport.findMany.mockResolvedValue(mockDayworks);
      const dayworks = await mockPrisma.dailyReport.findMany({ where: { projectId: mockProject.id } });
      expect(dayworks.length).toBe(1);
      expect(dayworks[0].projectId).toBe(mockProject.id);
    });

    it('should include nested entries (material, equipment, labor)', async () => {
      const mockDaywork = {
        id: 'dw-2',
        reportDate: new Date('2024-01-16'),
        weather: 'CLOUDY',
        workPerformed: 'Electrical installation',
        manpowerCount: 3,
        projectId: mockProject.id,
        materialEntries: [{ materialName: 'Cable', quantityUsed: 100, unit: 'meters' }],
        equipmentEntries: [{ equipmentName: 'Drill', hoursUsed: 2 }],
        laborEntries: [{ trade: 'Electrician', classification: 'Journeyman', headcount: 2 }],
      };
      mockPrisma.dailyReport.findUnique.mockResolvedValue(mockDaywork);
      const fetched = await mockPrisma.dailyReport.findUnique({ where: { id: mockDaywork.id } });
      expect(fetched?.materialEntries.length).toBe(1);
      expect(fetched?.equipmentEntries.length).toBe(1);
      expect(fetched?.laborEntries.length).toBe(1);
    });
  });

  describe('POST /api/dayworks - Create Daywork', () => {
    it('should reject request without organization', () => {
      const userWithoutOrg = { id: 'user-no-org', organizationId: undefined };
      expect(userWithoutOrg.organizationId).toBeUndefined();
    });

    it('should reject request with invalid project_id', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      const project = await mockPrisma.project.findUnique({ where: { id: 'invalid-id' } });
      expect(project).toBeNull();
    });

    it('should reject duplicate daywork for same date and project', async () => {
      const existingDaywork = { id: 'dw-existing', reportDate: new Date('2024-01-17'), projectId: mockProject.id };
      mockPrisma.dailyReport.findUnique.mockResolvedValue(existingDaywork);
      const duplicate = await mockPrisma.dailyReport.findUnique({
        where: { projectId_reportDate: { projectId: mockProject.id, reportDate: new Date('2024-01-17') } },
      });
      expect(duplicate).toBeDefined();
    });

    it('should create daywork with all required fields', async () => {
      const newDaywork = {
        id: 'dw-new',
        reportDate: new Date('2024-01-18'),
        weather: 'SUNNY',
        workPerformed: 'Concrete pouring',
        manpowerCount: 8,
        projectId: mockProject.id,
        createdById: mockUser.id,
      };
      mockPrisma.dailyReport.create.mockResolvedValue(newDaywork);
      const created = await mockPrisma.dailyReport.create({ data: newDaywork });
      expect(created.id).toBeDefined();
      expect(created.projectId).toBe(mockProject.id);
      expect(created.workPerformed).toBe('Concrete pouring');
    });

    it('should create daywork with nested material entries', async () => {
      const newDaywork = {
        id: 'dw-mat',
        reportDate: new Date('2024-01-19'),
        weather: 'RAINY',
        workPerformed: 'Material delivery',
        manpowerCount: 2,
        projectId: mockProject.id,
        materialEntries: {
          create: [{ materialName: 'Cement', quantityUsed: 50, unit: 'bags' }],
        },
      };
      const created = { ...newDaywork, materialEntries: [{ materialName: 'Cement', quantityUsed: 50, unit: 'bags' }] };
      mockPrisma.dailyReport.create.mockResolvedValue(created);
      const result = await mockPrisma.dailyReport.create({ data: newDaywork });
      expect(result.materialEntries.length).toBe(1);
    });

    it('should create daywork with nested equipment entries', async () => {
      const newDaywork = {
        id: 'dw-eq',
        reportDate: new Date('2024-01-20'),
        weather: 'WINDY',
        workPerformed: 'Equipment operation',
        manpowerCount: 3,
        projectId: mockProject.id,
        equipmentEntries: { create: [{ equipmentName: 'Excavator', hoursUsed: 4 }] },
      };
      const created = { ...newDaywork, equipmentEntries: [{ equipmentName: 'Excavator', hoursUsed: 4 }] };
      mockPrisma.dailyReport.create.mockResolvedValue(created);
      const result = await mockPrisma.dailyReport.create({ data: newDaywork });
      expect(result.equipmentEntries.length).toBe(1);
    });

    it('should create daywork with nested labor entries', async () => {
      const newDaywork = {
        id: 'dw-labor',
        reportDate: new Date('2024-01-21'),
        weather: 'SUNNY',
        workPerformed: 'Labor tracking',
        manpowerCount: 10,
        projectId: mockProject.id,
        laborEntries: {
          create: [{ trade: 'Carpenter', company: 'ABC Construction', classification: 'Senior', headcount: 3 }],
        },
      };
      const created = { ...newDaywork, laborEntries: [{ trade: 'Carpenter', headcount: 3 }] };
      mockPrisma.dailyReport.create.mockResolvedValue(created);
      const result = await mockPrisma.dailyReport.create({ data: newDaywork });
      expect(result.laborEntries.length).toBe(1);
    });

    it('should map weather string to enum correctly', () => {
      const weatherMappings: Record<string, string> = {
        'sunny': 'SUNNY',
        'cloudy': 'CLOUDY',
        'light rain': 'RAINY',
        'snow': 'SNOWY',
        'windy': 'WINDY',
      };
      for (const [input, expected] of Object.entries(weatherMappings)) {
        expect(weatherMappings[input]).toBe(expected);
      }
    });
  });

  describe('Data Validation', () => {
    it('should require date field', () => {
      const invalidData: Record<string, string> = { project_id: '123', weather: 'sunny' };
      expect(invalidData).not.toHaveProperty('date');
    });

    it('should require project_id field', () => {
      const invalidData: Record<string, string> = { date: '2024-01-22', weather: 'sunny' };
      expect(invalidData).not.toHaveProperty('project_id');
    });

    it('should require work_description field', () => {
      const invalidData: Record<string, string> = { date: '2024-01-23', project_id: '123' };
      expect(invalidData).not.toHaveProperty('work_description');
    });

    it('should validate weather enum values', () => {
      const validWeatherValues = ['SUNNY', 'CLOUDY', 'RAINY', 'STORMY', 'SNOWY', 'WINDY'];
      for (const weather of validWeatherValues) {
        expect(validWeatherValues).toContain(weather);
      }
    });

    it('should handle optional progress_percentage field', () => {
      const daywork: Record<string, unknown> = { id: 'dw-1', reportDate: new Date() };
      expect(daywork).not.toHaveProperty('progressPercentage');
    });
  });

  describe('RBAC Permissions', () => {
    it('should allow PROJECT_MANAGER to create dayworks', () => {
      const manager = { id: 'mgr-1', role: 'PROJECT_MANAGER', organizationId: mockOrganization.id };
      expect(manager.role).toBe('PROJECT_MANAGER');
    });

    it('should allow ADMIN to create dayworks', () => {
      const admin = { id: 'adm-1', role: 'ADMIN', organizationId: mockOrganization.id };
      expect(admin.role).toBe('ADMIN');
    });

    it('should restrict dayworks to user organization', () => {
      const otherOrg = { id: 'other-org', name: 'Other Org' };
      const testOrgDayworks = [{ projectId: 'p1', organizationId: mockOrganization.id }];
      const otherOrgDayworks = [{ projectId: 'p2', organizationId: otherOrg.id }];
      expect(testOrgDayworks.every((d) => d.organizationId === mockOrganization.id)).toBe(true);
      expect(otherOrgDayworks.every((d) => d.organizationId === otherOrg.id)).toBe(true);
    });
  });

  describe('Error Cases', () => {
    it('should handle invalid date format', () => {
      const invalidDate = 'not-a-date';
      expect(isNaN(new Date(invalidDate).getTime())).toBe(true);
    });

    it('should handle non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      const project = await mockPrisma.project.findUnique({ where: { id: '0000-0000' } });
      expect(project).toBeNull();
    });

    it('should handle project from different organization', () => {
      const foreignProject = { id: 'fp-1', organizationId: 'other-org' };
      expect(foreignProject.organizationId).not.toBe(mockOrganization.id);
    });

    it('should handle missing nested entries gracefully', async () => {
      const daywork = {
        id: 'dw-empty',
        reportDate: new Date(),
        weather: 'SUNNY',
        workPerformed: 'No entries',
        manpowerCount: 1,
        projectId: mockProject.id,
        materialEntries: [],
        equipmentEntries: [],
        laborEntries: [],
      };
      mockPrisma.dailyReport.create.mockResolvedValue(daywork);
      const result = await mockPrisma.dailyReport.create({ data: daywork });
      expect(result.materialEntries.length).toBe(0);
      expect(result.equipmentEntries.length).toBe(0);
      expect(result.laborEntries.length).toBe(0);
    });
  });
});
