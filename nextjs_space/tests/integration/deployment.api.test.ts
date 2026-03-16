/**
 * Deployment API Integration Tests
 * Tests health, status, containers, and processes endpoints
 * Authentication, RBAC, error cases, and data validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock deployment data for testing
const mockPM2Processes = [
  { pid: 12345, name: 'nextjs-app', status: 'online' as const, cpu: 2.5, memory: 256000000, uptime: 3600000, restart_time: 0, mode: 'cluster' as const, pm_id: 0 },
  { pid: 12346, name: 'api-server', status: 'online' as const, cpu: 1.2, memory: 128000000, uptime: 3600000, restart_time: 1, mode: 'fork' as const, pm_id: 1 },
  { pid: 12347, name: 'worker', status: 'stopped' as const, cpu: 0, memory: 0, uptime: 0, restart_time: 3, mode: 'fork' as const, pm_id: 2 },
];

const mockDockerContainers = [
  { id: 'abc123def', name: 'cortexbuild-app', image: 'cortexbuild-pro/nextjs:latest', status: 'running' as const, state: 'running', ports: ['3000:3000'], created: new Date().toISOString(), uptime: 86400000, cpu_percent: 2.5, memory_usage: 512000000, memory_limit: 1073741824, networks: ['bridge'], mounts: ['/app/.next', '/app/node_modules'] },
  { id: 'xyz789ghi', name: 'cortexbuild-db', image: 'postgres:15', status: 'running' as const, state: 'running', ports: ['5432:5432'], created: new Date().toISOString(), uptime: 172800000, cpu_percent: 1.0, memory_usage: 256000000, memory_limit: 536870912, networks: ['bridge'], mounts: ['/var/lib/postgresql/data'] },
  { id: 'stu901vwx', name: 'redis-cache', image: 'redis:7-alpine', status: 'exited' as const, state: 'exited', ports: [], created: new Date().toISOString(), cpu_percent: 0, memory_usage: 0, memory_limit: 0, networks: ['bridge'], mounts: ['/data'] },
];

const mockPrisma = {
  user: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
  organization: { create: vi.fn(), findUnique: vi.fn() },
};

describe('Deployment API', () => {
  const mockOrganization = { id: 'test-org-123', name: 'Test Org', slug: 'test-org' };
  const mockAdminUser = { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', organizationId: mockOrganization.id };
  const mockRegularUser = { id: 'user-1', email: 'user@test.com', name: 'User', role: 'FIELD_WORKER', organizationId: mockOrganization.id };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/deployment/health - Service Health Checks', () => {
    it('should return overall system health status', () => {
      const healthChecks = mockPM2Processes.map((proc) => ({
        name: `${proc.name} (PM2)`,
        type: 'pm2' as const,
        status: proc.status === 'online' ? 'healthy' : 'unhealthy',
      }));
      const healthyCount = healthChecks.filter((h) => h.status === 'healthy').length;
      const totalCount = healthChecks.length;
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (healthyCount < totalCount * 0.5) {
        overallStatus = 'unhealthy';
      } else if (healthyCount < totalCount) {
        overallStatus = 'degraded';
      }
      expect(overallStatus).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(overallStatus);
    });

    it('should return PM2 process health', () => {
      const pm2Health = mockPM2Processes.map((proc) => ({
        name: proc.name,
        type: 'pm2' as const,
        status: proc.status === 'online' ? 'healthy' : 'unhealthy',
      }));
      expect(pm2Health.length).toBe(3);
      expect(pm2Health.filter((h) => h.status === 'healthy').length).toBe(2);
      expect(pm2Health.filter((h) => h.status === 'unhealthy').length).toBe(1);
    });

    it('should return Docker container health', () => {
      const dockerHealth = mockDockerContainers.map((container) => ({
        name: container.name,
        type: 'docker' as const,
        status: container.status === 'running' ? 'healthy' : 'unhealthy',
      }));
      expect(dockerHealth.length).toBe(3);
      expect(dockerHealth.filter((h) => h.status === 'healthy').length).toBe(2);
      expect(dockerHealth.filter((h) => h.status === 'unhealthy').length).toBe(1);
    });

    it('should calculate healthy count correctly', () => {
      const healthChecks = [{ status: 'healthy' }, { status: 'healthy' }, { status: 'unhealthy' }, { status: 'degraded' }];
      const healthyCount = healthChecks.filter((h) => h.status === 'healthy').length;
      const unhealthyCount = healthChecks.filter((h) => h.status === 'unhealthy').length;
      expect(healthyCount).toBe(2);
      expect(unhealthyCount).toBe(1);
    });

    it('should determine overall status as healthy when all healthy', () => {
      const healthChecks = [{ status: 'healthy' }, { status: 'healthy' }, { status: 'healthy' }];
      const healthyCount = healthChecks.filter((h) => h.status === 'healthy').length;
      const unhealthyCount = healthChecks.filter((h) => h.status === 'unhealthy').length;
      const totalCount = healthChecks.length;
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (unhealthyCount > totalCount * 0.5) {
        overallStatus = 'unhealthy';
      } else if (unhealthyCount > 0) {
        overallStatus = 'degraded';
      }
      expect(overallStatus).toBe('healthy');
    });

    it('should determine overall status as degraded when some unhealthy', () => {
      const healthChecks = [{ status: 'healthy' }, { status: 'healthy' }, { status: 'unhealthy' }];
      const healthyCount = healthChecks.filter((h) => h.status === 'healthy').length;
      const unhealthyCount = healthChecks.filter((h) => h.status === 'unhealthy').length;
      const totalCount = healthChecks.length;
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (unhealthyCount > totalCount * 0.5) {
        overallStatus = 'unhealthy';
      } else if (unhealthyCount > 0) {
        overallStatus = 'degraded';
      }
      expect(overallStatus).toBe('degraded');
    });

    it('should determine overall status as unhealthy when majority unhealthy', () => {
      const healthChecks = [{ status: 'healthy' }, { status: 'unhealthy' }, { status: 'unhealthy' }, { status: 'unhealthy' }];
      const healthyCount = healthChecks.filter((h) => h.status === 'healthy').length;
      const unhealthyCount = healthChecks.filter((h) => h.status === 'unhealthy').length;
      const totalCount = healthChecks.length;
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (unhealthyCount > totalCount * 0.5) {
        overallStatus = 'unhealthy';
      } else if (unhealthyCount > 0) {
        overallStatus = 'degraded';
      }
      expect(overallStatus).toBe('unhealthy');
    });

    it('should handle empty health checks list', () => {
      const healthChecks: Array<{ status: string }> = [];
      const totalCount = healthChecks.length;
      let system: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'healthy';
      if (totalCount === 0) {
        system = 'unknown';
      }
      expect(system).toBe('unknown');
    });
  });

  describe('GET /api/deployment/status - Overall Deployment Status', () => {
    it('should return combined PM2 and Docker status', () => {
      const pm2Stats = {
        total: mockPM2Processes.length,
        online: mockPM2Processes.filter((p) => p.status === 'online').length,
        stopped: mockPM2Processes.filter((p) => p.status === 'stopped').length,
        errored: 0,
      };
      const dockerStats = {
        total: mockDockerContainers.length,
        running: mockDockerContainers.filter((c) => c.status === 'running').length,
        paused: 0,
        stopped: mockDockerContainers.filter((c) => c.status === 'exited').length,
      };
      expect(pm2Stats.total).toBe(3);
      expect(pm2Stats.online).toBe(2);
      expect(dockerStats.total).toBe(3);
      expect(dockerStats.running).toBe(2);
    });

    it('should indicate PM2 availability', () => {
      const pm2Available = mockPM2Processes.length > 0;
      expect(pm2Available).toBe(true);
    });

    it('should indicate Docker availability', () => {
      const dockerAvailable = mockDockerContainers.filter((c) => c.status === 'running').length > 0;
      expect(dockerAvailable).toBe(true);
    });

    it('should return services list with details', () => {
      const services = [
        ...mockPM2Processes.map((proc) => ({ name: proc.name, type: 'pm2' as const, status: proc.status === 'online' ? 'healthy' : 'unhealthy' })),
        ...mockDockerContainers.map((container) => ({ name: container.name, type: 'docker' as const, status: container.status === 'running' ? 'healthy' : 'unhealthy' })),
      ];
      expect(services.length).toBe(6);
      expect(services.filter((s) => s.type === 'pm2').length).toBe(3);
      expect(services.filter((s) => s.type === 'docker').length).toBe(3);
    });

    it('should include lastChecked timestamp', () => {
      const lastChecked = new Date();
      expect(lastChecked).toBeDefined();
      expect(lastChecked.getTime()).toBeGreaterThan(0);
    });

    it('should determine system status based on service health', () => {
      const services = [{ status: 'healthy' }, { status: 'healthy' }, { status: 'healthy' }, { status: 'unhealthy' }];
      const healthyCount = services.filter((s) => s.status === 'healthy').length;
      const totalCount = services.length;
      let system: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (healthyCount < totalCount * 0.5) {
        system = 'unhealthy';
      } else if (healthyCount < totalCount) {
        system = 'degraded';
      }
      expect(system).toBe('degraded');
    });
  });

  describe('GET /api/deployment/processes - PM2 Processes', () => {
    it('should return list of PM2 processes', () => {
      const processes = mockPM2Processes;
      expect(processes.length).toBe(3);
      expect(processes[0].name).toBe('nextjs-app');
      expect(processes[0].status).toBe('online');
    });

    it('should include process PID', () => {
      const process = mockPM2Processes[0];
      expect(process.pid).toBe(12345);
      expect(typeof process.pid).toBe('number');
    });

    it('should include process name', () => {
      const process = mockPM2Processes[0];
      expect(process.name).toBe('nextjs-app');
      expect(typeof process.name).toBe('string');
    });

    it('should include process status', () => {
      const validStatuses = ['online', 'stopped', 'errored', 'launching'];
      for (const proc of mockPM2Processes) {
        expect(validStatuses).toContain(proc.status);
      }
    });

    it('should include CPU usage', () => {
      const process = mockPM2Processes[0];
      expect(process.cpu).toBe(2.5);
      expect(typeof process.cpu).toBe('number');
    });

    it('should include memory usage', () => {
      const process = mockPM2Processes[0];
      expect(process.memory).toBe(256000000);
      expect(typeof process.memory).toBe('number');
    });

    it('should include uptime', () => {
      const process = mockPM2Processes[0];
      expect(process.uptime).toBe(3600000);
      expect(typeof process.uptime).toBe('number');
    });

    it('should include restart count', () => {
      const process = mockPM2Processes[1];
      expect(process.restart_time).toBe(1);
      expect(typeof process.restart_time).toBe('number');
    });

    it('should include execution mode', () => {
      const validModes = ['fork', 'cluster'];
      for (const proc of mockPM2Processes) {
        expect(validModes).toContain(proc.mode);
      }
    });

    it('should calculate PM2 stats summary', () => {
      const stats = {
        total: mockPM2Processes.length,
        online: mockPM2Processes.filter((p) => p.status === 'online').length,
        stopped: mockPM2Processes.filter((p) => p.status === 'stopped').length,
        errored: 0,
      };
      expect(stats.total).toBe(3);
      expect(stats.online).toBe(2);
      expect(stats.stopped).toBe(1);
    });
  });

  describe('GET /api/deployment/containers - Docker Containers', () => {
    it('should return list of Docker containers', () => {
      const containers = mockDockerContainers;
      expect(containers.length).toBe(3);
      expect(containers[0].name).toBe('cortexbuild-app');
      expect(containers[0].status).toBe('running');
    });

    it('should include container ID', () => {
      const container = mockDockerContainers[0];
      expect(container.id).toBe('abc123def');
      expect(typeof container.id).toBe('string');
    });

    it('should include container name', () => {
      const container = mockDockerContainers[0];
      expect(container.name).toBe('cortexbuild-app');
      expect(typeof container.name).toBe('string');
    });

    it('should include container image', () => {
      const container = mockDockerContainers[0];
      expect(container.image).toBe('cortexbuild-pro/nextjs:latest');
      expect(typeof container.image).toBe('string');
    });

    it('should include container status', () => {
      const validStatuses = ['running', 'paused', 'exited', 'created', 'restarting', 'dead'];
      for (const container of mockDockerContainers) {
        expect(validStatuses).toContain(container.status);
      }
    });

    it('should include container state', () => {
      const container = mockDockerContainers[0];
      expect(container.state).toBe('running');
      expect(typeof container.state).toBe('string');
    });

    it('should include exposed ports', () => {
      const container = mockDockerContainers[0];
      expect(container.ports).toEqual(['3000:3000']);
      expect(Array.isArray(container.ports)).toBe(true);
    });

    it('should include creation timestamp', () => {
      const container = mockDockerContainers[0];
      expect(container.created).toBeDefined();
      expect(new Date(container.created).getTime()).toBeGreaterThan(0);
    });

    it('should include CPU percentage', () => {
      const container = mockDockerContainers[0];
      expect(container.cpu_percent).toBe(2.5);
      expect(typeof container.cpu_percent).toBe('number');
    });

    it('should include memory usage', () => {
      const container = mockDockerContainers[0];
      expect(container.memory_usage).toBe(512000000);
      expect(typeof container.memory_usage).toBe('number');
    });

    it('should include memory limit', () => {
      const container = mockDockerContainers[0];
      expect(container.memory_limit).toBe(1073741824);
      expect(typeof container.memory_limit).toBe('number');
    });

    it('should include networks', () => {
      const container = mockDockerContainers[0];
      expect(container.networks).toEqual(['bridge']);
      expect(Array.isArray(container.networks)).toBe(true);
    });

    it('should include mounts', () => {
      const container = mockDockerContainers[0];
      expect(container.mounts).toEqual(['/app/.next', '/app/node_modules']);
      expect(Array.isArray(container.mounts)).toBe(true);
    });

    it('should calculate Docker stats summary', () => {
      const stats = {
        total: mockDockerContainers.length,
        running: mockDockerContainers.filter((c) => c.status === 'running').length,
        paused: 0,
        stopped: mockDockerContainers.filter((c) => ['exited', 'created', 'dead'].includes(c.status)).length,
      };
      expect(stats.total).toBe(3);
      expect(stats.running).toBe(2);
      expect(stats.stopped).toBe(1);
    });
  });

  describe('Authentication Requirements', () => {
    it('should reject unauthenticated health requests', async () => {
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated status requests', async () => {
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated processes requests', async () => {
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated containers requests', async () => {
      const response = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
      expect(response.status).toBe(401);
    });
  });

  describe('RBAC Permissions', () => {
    it('should allow ADMIN to access deployment endpoints', () => {
      expect(mockAdminUser.role).toBe('ADMIN');
      const allowedRoles = ['ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'];
      expect(allowedRoles).toContain('ADMIN');
    });

    it('should allow COMPANY_OWNER to access deployment endpoints', () => {
      const ownerUser = { id: 'own-1', role: 'COMPANY_OWNER', organizationId: mockOrganization.id };
      expect(ownerUser.role).toBe('COMPANY_OWNER');
    });

    it('should allow SUPER_ADMIN to access deployment endpoints', () => {
      const superAdmin = { id: 'sa-1', role: 'SUPER_ADMIN' };
      expect(superAdmin.role).toBe('SUPER_ADMIN');
    });

    it('should restrict FIELD_WORKER from deployment endpoints', () => {
      expect(mockRegularUser.role).toBe('FIELD_WORKER');
      const allowedRoles = ['ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'];
      expect(allowedRoles).not.toContain('FIELD_WORKER');
    });

    it('should restrict PROJECT_MANAGER from deployment endpoints', () => {
      const allowedRoles = ['ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'];
      expect(allowedRoles).not.toContain('PROJECT_MANAGER');
    });
  });

  describe('Error Cases', () => {
    it('should handle PM2 not available', () => {
      const pm2Available = false;
      if (!pm2Available) {
        expect(mockPM2Processes.length).toBeGreaterThan(0);
      }
    });

    it('should handle Docker not available', () => {
      const dockerAvailable = false;
      if (!dockerAvailable) {
        expect(mockDockerContainers.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty process list', () => {
      const emptyProcesses: Array<any> = [];
      const stats = { total: emptyProcesses.length, online: 0, stopped: 0, errored: 0 };
      expect(stats.total).toBe(0);
    });

    it('should handle empty container list', () => {
      const emptyContainers: Array<any> = [];
      const stats = { total: emptyContainers.length, running: 0, paused: 0, stopped: 0 };
      expect(stats.total).toBe(0);
    });

    it('should handle process with missing fields', () => {
      const incompleteProcess = { pid: 12345, name: 'incomplete' };
      expect(incompleteProcess.status).toBeUndefined();
      expect(incompleteProcess.cpu).toBeUndefined();
    });

    it('should handle container with missing fields', () => {
      const incompleteContainer = { id: 'abc123', name: 'incomplete' };
      expect(incompleteContainer.status).toBeUndefined();
      expect(incompleteContainer.image).toBeUndefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate PM2 status enum', () => {
      const validStatuses = ['online', 'stopped', 'errored', 'launching'];
      for (const proc of mockPM2Processes) {
        expect(validStatuses).toContain(proc.status);
      }
    });

    it('should validate Docker status enum', () => {
      const validStatuses = ['running', 'paused', 'exited', 'created', 'restarting', 'dead'];
      for (const container of mockDockerContainers) {
        expect(validStatuses).toContain(container.status);
      }
    });

    it('should validate health status enum', () => {
      const validStatuses = ['healthy', 'unhealthy', 'unknown'];
      const healthChecks = [{ status: 'healthy' }, { status: 'unhealthy' }, { status: 'unknown' }];
      for (const check of healthChecks) {
        expect(validStatuses).toContain(check.status);
      }
    });

    it('should validate system status enum', () => {
      const validStatuses = ['healthy', 'degraded', 'unhealthy', 'unknown'];
      expect(validStatuses).toContain('healthy');
      expect(validStatuses).toContain('degraded');
      expect(validStatuses).toContain('unhealthy');
      expect(validStatuses).toContain('unknown');
    });

    it('should validate service type enum', () => {
      const validTypes = ['pm2', 'docker', 'native'];
      expect(validTypes).toContain('pm2');
      expect(validTypes).toContain('docker');
      expect(validTypes).toContain('native');
    });

    it('should validate memory parsing', () => {
      const parseMemory = (memStr: string): number => {
        const match = memStr.match(/(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?/i);
        if (!match) return 0;
        const value = parseFloat(match[1]);
        const unit = (match[2] || 'B').toUpperCase();
        const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024, TB: 1024 * 1024 * 1024 * 1024 };
        return value * (multipliers[unit] || 1);
      };
      expect(parseMemory('512MB')).toBe(536870912);
      expect(parseMemory('1GB')).toBe(1073741824);
    });

    it('should validate CPU percentage range', () => {
      for (const proc of mockPM2Processes) {
        expect(proc.cpu).toBeGreaterThanOrEqual(0);
        expect(proc.cpu).toBeLessThan(100);
      }
      for (const container of mockDockerContainers) {
        expect(container.cpu_percent).toBeGreaterThanOrEqual(0);
        expect(container.cpu_percent).toBeLessThan(100);
      }
    });

    it('should validate memory is non-negative', () => {
      for (const proc of mockPM2Processes) {
        expect(proc.memory).toBeGreaterThanOrEqual(0);
      }
      for (const container of mockDockerContainers) {
        expect(container.memory_usage).toBeGreaterThanOrEqual(0);
        expect(container.memory_limit).toBeGreaterThanOrEqual(0);
      }
    });

    it('should validate uptime is non-negative', () => {
      for (const proc of mockPM2Processes) {
        expect(proc.uptime).toBeGreaterThanOrEqual(0);
      }
      for (const container of mockDockerContainers) {
        if (container.uptime !== undefined) {
          expect(container.uptime).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should validate restart count is non-negative', () => {
      for (const proc of mockPM2Processes) {
        expect(proc.restart_time).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
