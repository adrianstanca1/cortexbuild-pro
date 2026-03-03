import { describe, it, expect, beforeEach } from 'vitest';
import { TodoPriority, TodoStatus, ProjectStatus, CompanyType } from '../../types';

// Simple integration tests for critical functionality
describe('ASAgents Platform Integration', () => {
  beforeEach(() => {
    // Clear any stored state between tests
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  it('validates core module imports', async () => {
    // Test that critical modules can be imported without errors
    await expect(import('../../services/mockApi')).resolves.toBeDefined();
    await expect(import('../../types')).resolves.toBeDefined();
    await expect(import('../../utils/finance')).resolves.toBeDefined();
    await expect(import('../../utils/projectPortfolio')).resolves.toBeDefined();
  });

  it('validates authentication API functionality', async () => {
    const { authApi } = await import('../../services/mockApi');
    
    // Test user registration
    const registrationData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'User',
      companyName: 'Test Construction Co',
      companyType: 'GENERAL_CONTRACTOR' as CompanyType,
      phone: '555-0123',
      termsAccepted: true,
      companySelection: 'create' as const
    };

    const result = await authApi.register(registrationData);
    
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
    expect(result.company.name).toBe('Test Construction Co');

    // Test login with registered user
    const loginResult = await authApi.login({
      email: 'test@example.com',
      password: 'SecurePassword123!'
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.user.email).toBe('test@example.com');
  });

  it('validates data API functionality', async () => {
    const { api } = await import('../../services/mockApi');
    
    // Test project creation
    const project = await api.createProject({
      name: 'Test Project',
      description: 'A test project',
      status: 'ACTIVE' as ProjectStatus,
      budget: 100000
    }, null, 'test-user-id');    expect(project.name).toBe('Test Project');
    expect(project.budget).toBe(100000);

    // Test task creation
        const task = await api.createTodo({
      title: 'Test task',
      projectId: project.id,
      priority: TodoPriority.HIGH,
      status: TodoStatus.TODO
    }, 'test-user-id');

    expect(task.title).toBe('Test task');
    expect(task.projectId).toBe(project.id);
  });

  it('validates financial calculations', async () => {
    const { getInvoiceFinancials } = await import('../../utils/finance');
    
    const mockInvoice = {
      id: 'test-invoice',
      subtotal: 10000,
      taxAmount: 800,
      retentionAmount: 500,
      status: 'sent' as const,
      dueDate: '2025-02-01',
      createdAt: '2025-01-01',
      payments: [
        { id: 'p1', amount: 5000, date: '2025-01-15' }
      ]
    };

    const financials = getInvoiceFinancials(mockInvoice);
    
    expect(financials.total).toBe(10300); // 10000 + 800 tax - 500 retention
    expect(financials.amountPaid).toBe(5000);
    expect(financials.balance).toBe(5300); // 10300 - 5000
    expect(financials.retentionAmount).toBe(500);
  });

  it('validates project portfolio calculations', async () => {
    const { computeProjectPortfolioSummary } = await import('../../utils/projectPortfolio');
    
    const mockProjects = [
      {
        id: '1',
        name: 'Project 1',
        status: 'ACTIVE' as const,
        budget: 100000,
        spent: 75000,
        progress: 0.8,
        endDate: '2025-12-01', // Future date
        priority: 'high' as const
      },
      {
        id: '2', 
        name: 'Project 2',
        status: 'ACTIVE' as const,
        budget: 50000,
        spent: 25000,
        progress: 0.5,
        endDate: '2024-01-01', // Past date - overdue
        priority: 'medium' as const
      }
    ];

    const summary = computeProjectPortfolioSummary(mockProjects);
    
    expect(summary.totalProjects).toBe(2);
    expect(summary.pipelineValue).toBe(150000);
    expect(summary.totalActualCost).toBe(100000);
    expect(summary.overdueProjects).toBe(1); // Project 2 is overdue
  });

  it('validates error handling', async () => {
    const { authApi } = await import('../../services/mockApi');
    
    // Test duplicate email registration
    const userData = {
      email: 'duplicate@example.com',
      password: 'SecurePassword123!',
      firstName: 'Duplicate',
      lastName: 'User',
      companyName: 'Duplicate Company',
      companyType: 'GENERAL_CONTRACTOR' as CompanyType,
      phone: '+1234567890',
      termsAccepted: true,
      companySelection: 'create' as const
    };

    // First registration should succeed
    await authApi.register(userData);
    
    // Second registration with same email should fail
    await expect(authApi.register(userData)).rejects.toThrow();
    
    // Invalid login should fail
    await expect(authApi.login({
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    })).rejects.toThrow();
  });

  it('validates performance monitoring availability', () => {
    // Check that performance APIs are available
    expect(typeof performance).toBe('object');
    expect(typeof performance.now).toBe('function');
    
    // Check timing functions
    const start = performance.now();
    const end = performance.now();
    expect(end).toBeGreaterThanOrEqual(start);
  });

  it('validates TypeScript types', () => {
    // This test ensures our type definitions work correctly
    // If types are broken, this test would fail to compile
    const user: import('../../types').User = {
      id: 'test',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'foreman' as const,
      companyId: 'company-1',
      isActive: true,
      createdAt: '2025-01-01',
      lastLoginAt: '2025-01-01'
    };

    expect(user.role).toBe('foreman');
    expect(user.isActive).toBe(true);
  });
});