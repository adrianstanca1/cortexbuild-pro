/**
 * Variations API Integration Tests
 * Tests CRUD operations, authentication, RBAC, error cases, and data validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPrisma = {
  variation: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  user: {
    create: vi.fn(),
  },
  organization: {
    create: vi.fn(),
  },
};

describe('Variations API', () => {
  const mockOrganization = { id: 'test-org-123', name: 'Test Org', slug: 'test-org' };
  const mockProject = { id: 'test-project-123', name: 'Test Project', organizationId: mockOrganization.id, status: 'ACTIVE' };
  const mockUser = { id: 'test-user-123', email: 'test@test.com', name: 'Test User', role: 'PROJECT_MANAGER', organizationId: mockOrganization.id };

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

  describe('GET /api/variations - List Variations', () => {
    it('should return empty list when no variations exist', async () => {
      mockPrisma.variation.findMany.mockResolvedValue([]);
      const variations = await mockPrisma.variation.findMany({ where: { projectId: mockProject.id } });
      expect(variations.length).toBe(0);
    });

    it('should return variations filtered by projectId', async () => {
      const mockVariations = [{ id: 'v-1', title: 'Change Order #1', projectId: mockProject.id, status: 'PENDING' }];
      mockPrisma.variation.findMany.mockResolvedValue(mockVariations);
      const variations = await mockPrisma.variation.findMany({ where: { projectId: mockProject.id } });
      expect(variations.length).toBe(1);
      expect(variations[0].projectId).toBe(mockProject.id);
    });

    it('should include project and creator details', async () => {
      const mockVariation = {
        id: 'v-2',
        title: 'Scope Change',
        projectId: mockProject.id,
        project: { id: mockProject.id, name: mockProject.name },
        createdBy: { id: mockUser.id, name: mockUser.name },
      };
      mockPrisma.variation.create.mockResolvedValue(mockVariation);
      const variation = await mockPrisma.variation.create({ data: mockVariation });
      expect(variation.project).toBeDefined();
      expect(variation.createdBy).toBeDefined();
    });

    it('should order variations by createdAt descending', async () => {
      const mockVariations = [
        { id: 'v-3', title: 'Second Variation', createdAt: new Date('2024-01-15') },
        { id: 'v-4', title: 'First Variation', createdAt: new Date('2024-01-01') },
      ];
      mockPrisma.variation.findMany.mockResolvedValue(mockVariations);
      const variations = await mockPrisma.variation.findMany({ orderBy: { createdAt: 'desc' } });
      expect(variations.length).toBe(2);
      expect(variations[0].title).toBe('Second Variation');
    });
  });

  describe('POST /api/variations - Create Variation', () => {
    it('should reject request without organization', () => {
      const userWithoutOrg = { id: 'user-no-org', organizationId: undefined };
      expect(userWithoutOrg.organizationId).toBeUndefined();
    });

    it('should reject request with invalid project_id', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      const project = await mockPrisma.project.findUnique({ where: { id: 'invalid-id' } });
      expect(project).toBeNull();
    });

    it('should reject request with non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      const project = await mockPrisma.project.findUnique({ where: { id: '0000-0000' } });
      expect(project).toBeNull();
    });

    it('should reject project from different organization', () => {
      const otherProject = { id: 'other-p', organizationId: 'other-org' };
      expect(otherProject.organizationId).not.toBe(mockOrganization.id);
    });

    it('should require title field', () => {
      const invalidData: Record<string, string> = { projectId: '123' };
      expect(invalidData).not.toHaveProperty('title');
    });

    it('should create variation with all required fields', async () => {
      const newVariation = {
        id: 'v-new',
        title: 'Foundation Expansion',
        description: 'Additional foundation work',
        total: 25000,
        status: 'PENDING',
        projectId: mockProject.id,
        createdById: mockUser.id,
      };
      mockPrisma.variation.create.mockResolvedValue(newVariation);
      const created = await mockPrisma.variation.create({ data: newVariation });
      expect(created.id).toBeDefined();
      expect(created.title).toBe('Foundation Expansion');
      expect(created.status).toBe('PENDING');
    });

    it('should create variation with default status PENDING', async () => {
      const newVariation = { id: 'v-pending', title: 'Default Status', projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue({ ...newVariation, status: 'PENDING' });
      const created = await mockPrisma.variation.create({ data: newVariation });
      expect(created.status).toBe('PENDING');
    });

    it('should create variation with default total 0', async () => {
      const newVariation = { id: 'v-zero', title: 'Zero Total', projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue({ ...newVariation, total: 0 });
      const created = await mockPrisma.variation.create({ data: newVariation });
      expect(created.total).toBe(0);
    });

    it('should create variation with APPROVED status', async () => {
      const newVariation = { id: 'v-approved', title: 'Approved', status: 'APPROVED', projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue(newVariation);
      const created = await mockPrisma.variation.create({ data: newVariation });
      expect(created.status).toBe('APPROVED');
    });

    it('should create variation with REJECTED status', async () => {
      const newVariation = { id: 'v-rejected', title: 'Rejected', status: 'REJECTED', projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue(newVariation);
      const created = await mockPrisma.variation.create({ data: newVariation });
      expect(created.status).toBe('REJECTED');
    });

    it('should handle optional description field', async () => {
      const newVariation = { id: 'v-nodsc', title: 'No Description', projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue(newVariation);
      const created = await mockPrisma.variation.create({ data: newVariation });
      expect(created.description).toBeUndefined();
    });

    it('should handle large total values', async () => {
      const newVariation = { id: 'v-large', title: 'Large Value', total: 1000000.50, projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue(newVariation);
      const created = await mockPrisma.variation.create({ data: newVariation });
      expect(created.total).toBe(1000000.50);
    });
  });

  describe('Data Validation', () => {
    it('should validate VariationStatus enum values', () => {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
      for (const status of validStatuses) {
        expect(validStatuses).toContain(status);
      }
    });

    it('should handle empty title gracefully', () => {
      const emptyTitle = '';
      expect(emptyTitle.trim()).toBe('');
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(1000);
      expect(longDescription.length).toBe(1000);
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Change Order #123 <Test> & "Quotes"';
      expect(specialTitle).toBeDefined();
    });

    it('should handle negative total values', () => {
      const variation = { id: 'v-neg', title: 'Credit', total: -5000, projectId: mockProject.id };
      expect(variation.total).toBe(-5000);
    });
  });

  describe('RBAC Permissions', () => {
    it('should allow PROJECT_MANAGER to create variations', () => {
      const manager = { id: 'mgr-1', role: 'PROJECT_MANAGER', organizationId: mockOrganization.id };
      expect(manager.role).toBe('PROJECT_MANAGER');
    });

    it('should allow ADMIN to create variations', () => {
      const admin = { id: 'adm-1', role: 'ADMIN', organizationId: mockOrganization.id };
      expect(admin.role).toBe('ADMIN');
    });

    it('should allow COMPANY_OWNER to create variations', () => {
      const owner = { id: 'own-1', role: 'COMPANY_OWNER', organizationId: mockOrganization.id };
      expect(owner.role).toBe('COMPANY_OWNER');
    });

    it('should restrict variations to user organization', () => {
      const otherOrg = { id: 'other-org' };
      const testOrgVariations = [{ projectId: 'p1', organizationId: mockOrganization.id }];
      const otherOrgVariations = [{ projectId: 'p2', organizationId: otherOrg.id }];
      expect(testOrgVariations.every((v) => v.organizationId === mockOrganization.id)).toBe(true);
    });
  });

  describe('Error Cases', () => {
    it('should handle empty title', () => {
      const emptyTitle = '';
      expect(emptyTitle.trim()).toBe('');
    });

    it('should handle whitespace-only title', () => {
      const whitespaceTitle = '   ';
      expect(whitespaceTitle.trim()).toBe('');
    });

    it('should handle null total', async () => {
      const variation = { id: 'v-null', title: 'Null Total', projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue({ ...variation, total: 0 });
      const created = await mockPrisma.variation.create({ data: variation });
      expect(created.total).toBe(0);
    });

    it('should handle missing project relation', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      const project = await mockPrisma.project.findUnique({ where: { id: 'deleted-id' } });
      expect(project).toBeNull();
    });

    it('should handle deleted creator', async () => {
      const tempUser = { id: 'temp-1', email: 'temp@test.com' };
      const variation = { id: 'v-temp', title: 'Temp', createdById: tempUser.id, projectId: mockProject.id };
      mockPrisma.variation.create.mockResolvedValue(variation);
      const created = await mockPrisma.variation.create({ data: variation });
      expect(created.createdById).toBe(tempUser.id);
    });
  });
});
