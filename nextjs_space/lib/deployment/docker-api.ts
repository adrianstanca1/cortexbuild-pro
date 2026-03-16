// =====================================================
// DOCKER CONTAINER MANAGEMENT API
// Integration with Docker CLI for container operations
// =====================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';

const execPromise = promisify(exec);

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'paused' | 'exited' | 'created' | 'restarting' | 'dead';
  state: string;
  ports: string[];
  created: string;
  uptime?: number;
  cpu_percent: number;
  memory_usage: number;
  memory_limit: number;
  networks: string[];
  mounts: string[];
  isMock?: boolean;
}

export interface DockerStats {
  total: number;
  running: number;
  paused: number;
  stopped: number;
}

export interface DockerAvailability {
  available: boolean;
  isMock: boolean;
  socketPath?: string;
  message?: string;
}

/**
 * Check if Docker is available and find the socket path
 * Returns the socket path if found, null otherwise
 */
export async function checkDockerAvailability(): Promise<DockerAvailability> {
  // 1. Check DOCKER_HOST environment variable first
  const dockerHost = process.env.DOCKER_HOST;
  if (dockerHost) {
    try {
      await execPromise('docker version --format "{{.Server.Version}}"');
      return {
        available: true,
        isMock: false,
        socketPath: dockerHost,
        message: 'Docker available via DOCKER_HOST',
      };
    } catch {
      // DOCKER_HOST set but Docker not responding
      return {
        available: false,
        isMock: true,
        message: 'Docker not available (DOCKER_HOST set but unresponsive)',
      };
    }
  }

  // 2. Check standard socket paths
  const standardPaths = [
    '/var/run/docker.sock',
    path.join(os.homedir(), '.docker', 'run', 'docker.sock'),
  ];

  const fs = await import('fs');

  for (const socketPath of standardPaths) {
    try {
      // Check if socket exists
      await fs.promises.access(socketPath, fs.constants.F_OK);

      // Test Docker connectivity
      await execPromise('docker version --format "{{.Server.Version}}"');

      return {
        available: true,
        isMock: false,
        socketPath,
        message: `Docker available at ${socketPath}`,
      };
    } catch {
      // Socket doesn't exist or Docker not responding, try next path
      continue;
    }
  }

  // 3. Docker not available - return mock mode
  return {
    available: false,
    isMock: true,
    message: 'Docker not available',
  };
}

/**
 * Get Docker container list
 * Uses docker CLI via exec when available, falls back to mock data
 */
export async function getDockerContainers(): Promise<DockerContainer[]> {
  const availability = await checkDockerAvailability();

  if (!availability.available) {
    // Log as warning, not error
    console.warn('Docker unavailable:', availability.message);
    return getMockDockerContainers();
  }

  try {
    // Get container list
    const { stdout: psOutput } = await execPromise(
      'docker ps -a --format "{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"'
    );

    const containers: DockerContainer[] = [];
    const lines = psOutput.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      if (parts.length >= 4) {
        const container = await getContainerDetails(parts[0]);
        if (container) {
          containers.push(container);
        }
      }
    }

    return containers;
  } catch (error) {
    console.warn('Docker containers error:', error);
    return getMockDockerContainers();
  }
}

/**
 * Get detailed container info
 */
async function getContainerDetails(id: string): Promise<DockerContainer | null> {
  try {
    // Get full inspect data
    const { stdout: inspectOutput } = await execPromise(`docker inspect ${id}`);
    const inspect = JSON.parse(inspectOutput);
    const data = inspect[0];

    // Get stats
    let cpuPercent = 0;
    let memoryUsage = 0;
    let memoryLimit = 0;

    try {
      const { stdout: statsOutput } = await execPromise(
        `docker stats ${id} --no-stream --format "{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.MemLimit}}"`
      );
      const statsParts = statsOutput.trim().split('\t');
      if (statsParts.length >= 3) {
        cpuPercent = parseFloat(statsParts[0]) || 0;
        memoryUsage = parseMemory(statsParts[1]);
        memoryLimit = parseMemory(statsParts[2]);
      }
    } catch {
      // Stats unavailable, use defaults
    }

    const state = data.State?.State || 'unknown';
    let status: DockerContainer['status'] = 'exited';
    if (state === 'running') status = 'running';
    else if (state === 'paused') status = 'paused';
    else if (state === 'restarting') status = 'restarting';
    else if (state === 'dead') status = 'dead';

    // Parse ports
    const ports: string[] = [];
    if (data.NetworkSettings?.Ports) {
      for (const [port, bindings] of Object.entries(data.NetworkSettings.Ports)) {
        if (bindings && bindings.length > 0) {
          ports.push(`${bindings[0].HostPort}:${port}`);
        }
      }
    }

    // Parse networks
    const networks = Object.keys(data.NetworkSettings?.Networks || {});

    // Parse mounts
    const mounts = (data.Mounts || []).map((m: any) => m.Destination || m.Source);

    return {
      id: data.Id.substring(0, 12),
      name: data.Name.replace(/^\//, ''),
      image: data.Config.Image,
      status,
      state,
      ports,
      created: data.Created,
      uptime: data.State?.StartedAt ? Date.now() - new Date(data.State.StartedAt).getTime() : undefined,
      cpu_percent: cpuPercent,
      memory_usage: memoryUsage,
      memory_limit: memoryLimit,
      networks,
      mounts,
      isMock: false,
    };
  } catch (error) {
    console.warn('Docker inspect error:', error);
    return null;
  }
}

/**
 * Parse memory string to bytes
 */
function parseMemory(memStr: string): number {
  const match = memStr.match(/(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return value * (multipliers[unit] || 1);
}

/**
 * Get Docker stats summary
 */
export async function getDockerStats(): Promise<DockerStats & { isMock: boolean }> {
  const availability = await checkDockerAvailability();
  const containers = await getDockerContainers();
  return {
    total: containers.length,
    running: containers.filter(c => c.status === 'running').length,
    paused: containers.filter(c => c.status === 'paused').length,
    stopped: containers.filter(c => ['exited', 'created', 'dead'].includes(c.status)).length,
    isMock: availability.isMock,
  };
}

/**
 * Start a Docker container
 */
export async function startContainer(containerId: string): Promise<boolean> {
  try {
    await execPromise(`docker start ${containerId}`);
    return true;
  } catch (error) {
    console.warn('Docker start error:', error);
    return false;
  }
}

/**
 * Stop a Docker container
 */
export async function stopContainer(containerId: string, timeout = 10): Promise<boolean> {
  try {
    await execPromise(`docker stop -t ${timeout} ${containerId}`);
    return true;
  } catch (error) {
    console.warn('Docker stop error:', error);
    return false;
  }
}

/**
 * Restart a Docker container
 */
export async function restartContainer(containerId: string): Promise<boolean> {
  try {
    await execPromise(`docker restart ${containerId}`);
    return true;
  } catch (error) {
    console.warn('Docker restart error:', error);
    return false;
  }
}

/**
 * Remove a Docker container
 */
export async function removeContainer(containerId: string, force = false): Promise<boolean> {
  try {
    const flags = force ? '-f' : '';
    await execPromise(`docker rm ${flags} ${containerId}`);
    return true;
  } catch (error) {
    console.warn('Docker remove error:', error);
    return false;
  }
}

/**
 * Get container logs
 */
export async function getContainerLogs(containerId: string, lines = 100): Promise<string> {
  try {
    const { stdout } = await execPromise(`docker logs --tail ${lines} ${containerId}`);
    return stdout;
  } catch (error) {
    console.warn('Docker logs error:', error);
    return '';
  }
}

/**
 * Mock Docker data for development/testing
 */
export function getMockDockerContainers(): DockerContainer[] {
  return [
    {
      id: 'abc123def',
      name: 'cortexbuild-app',
      image: 'cortexbuild-pro/nextjs:latest',
      status: 'running',
      state: 'running',
      ports: ['3000:3000'],
      created: new Date(Date.now() - 86400000).toISOString(),
      uptime: 86400000,
      cpu_percent: 2.5,
      memory_usage: 512000000,
      memory_limit: 1073741824,
      networks: ['bridge'],
      mounts: ['/app/.next', '/app/node_modules'],
      isMock: true,
    },
    {
      id: 'xyz789ghi',
      name: 'cortexbuild-db',
      image: 'postgres:15',
      status: 'running',
      state: 'running',
      ports: ['5432:5432'],
      created: new Date(Date.now() - 172800000).toISOString(),
      uptime: 172800000,
      cpu_percent: 1.0,
      memory_usage: 256000000,
      memory_limit: 536870912,
      networks: ['bridge'],
      mounts: ['/var/lib/postgresql/data'],
      isMock: true,
    },
    {
      id: 'mno456pqr',
      name: 'ollama',
      image: 'ollama/ollama:latest',
      status: 'running',
      state: 'running',
      ports: ['11434:11434'],
      created: new Date(Date.now() - 259200000).toISOString(),
      uptime: 259200000,
      cpu_percent: 5.0,
      memory_usage: 2147483648,
      memory_limit: 4294967296,
      networks: ['bridge'],
      mounts: ['/root/.ollama'],
      isMock: true,
    },
    {
      id: 'stu901vwx',
      name: 'redis-cache',
      image: 'redis:7-alpine',
      status: 'exited',
      state: 'exited',
      ports: [],
      created: new Date(Date.now() - 604800000).toISOString(),
      cpu_percent: 0,
      memory_usage: 0,
      memory_limit: 0,
      networks: ['bridge'],
      mounts: ['/data'],
      isMock: true,
    },
  ];
}
