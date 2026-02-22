/**
 * Test Utilities and Helpers
 */

import type { Session } from 'next-auth';

/**
 * Create a mock Next.js session
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'PROJECT_MANAGER',
      organizationId: 'test-org-id',
      avatarUrl: null,
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Create admin session
 */
export function createAdminSession(overrides?: Partial<Session>): Session {
  return createMockSession({
    ...overrides,
    user: {
      ...createMockSession().user,
      role: 'SUPER_ADMIN',
      ...overrides?.user,
    },
  });
}

/**
 * Test data factories
 */
export const factories = {
  user: (overrides?: any) => ({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
    name: 'Test User',
    password: 'hashedpassword123',
    role: 'PROJECT_MANAGER',
    organizationId: 'org-123',
    active: true,
    emailVerified: new Date(),
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  organization: (overrides?: any) => ({
    id: 'org-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Organization',
    domain: 'test.com',
    active: true,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  project: (overrides?: any) => ({
    id: 'proj-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Project',
    description: 'A test project',
    status: 'IN_PROGRESS',
    organizationId: 'org-123',
    startDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  task: (overrides?: any) => ({
    id: 'task-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Task',
    description: 'A test task',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: 'proj-123',
    createdById: 'user-123',
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

// Tests for test helpers
describe('Test Helpers', () => {
  describe('createMockSession', () => {
    it('should create a mock session with default values', () => {
      const session = createMockSession();
      
      expect(session.user.id).toBe('test-user-id');
      expect(session.user.email).toBe('test@example.com');
      expect(session.user.role).toBe('PROJECT_MANAGER');
    });
    
    it('should allow overriding session values', () => {
      const session = createMockSession({
        user: {
          id: 'custom-id',
          email: 'custom@example.com',
          name: 'Custom User',
          role: 'ADMIN',
          organizationId: 'custom-org',
          avatarUrl: null,
        },
      });
      
      expect(session.user.id).toBe('custom-id');
      expect(session.user.email).toBe('custom@example.com');
      expect(session.user.role).toBe('ADMIN');
    });
  });
  
  describe('createAdminSession', () => {
    it('should create an admin session', () => {
      const session = createAdminSession();
      
      expect(session.user.role).toBe('SUPER_ADMIN');
    });
  });
  
  describe('factories', () => {
    it('should create user factory data', () => {
      const user = factories.user();
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user.role).toBe('PROJECT_MANAGER');
    });
    
    it('should create organization factory data', () => {
      const org = factories.organization();
      
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org.active).toBe(true);
    });
    
    it('should create project factory data', () => {
      const project = factories.project();
      
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project.status).toBe('IN_PROGRESS');
    });
    
    it('should create task factory data', () => {
      const task = factories.task();
      
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task.status).toBe('TODO');
      expect(task.priority).toBe('MEDIUM');
    });
  });
});
