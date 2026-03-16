// =====================================================
// DEPLOYMENT API LIBRARY
// Central export for deployment-related utilities
// =====================================================

export * from './pm2-api';
export * from './docker-api';

// Combined deployment status
export interface DeploymentStatus {
  system: 'healthy' | 'degraded' | 'unhealthy';
  pm2: {
    available: boolean;
    stats: import('./pm2-api').PM2Stats;
  };
  docker: {
    available: boolean;
    stats: import('./docker-api').DockerStats;
  };
  services: ServiceHealth[];
  lastChecked: Date;
}

export interface ServiceHealth {
  name: string;
  type: 'pm2' | 'docker' | 'native';
  status: 'healthy' | 'unhealthy' | 'unknown';
  details?: Record<string, any>;
}

/**
 * Get overall deployment system status
 */
export async function getDeploymentStatus(): Promise<DeploymentStatus> {
  const { getPM2Stats } = await import('./pm2-api');
  const { getDockerStats } = await import('./docker-api');

  // Check PM2 availability
  let pm2Available = false;
  let pm2Stats = { total: 0, online: 0, stopped: 0, errored: 0 };
  try {
    pm2Stats = await getPM2Stats();
    pm2Available = pm2Stats.total > 0;
  } catch {
    pm2Available = false;
  }

  // Check Docker availability
  let dockerAvailable = false;
  let dockerStats = { total: 0, running: 0, paused: 0, stopped: 0 };
  try {
    dockerStats = await getDockerStats();
    dockerAvailable = dockerStats.total > 0;
  } catch {
    dockerAvailable = false;
  }

  // Build service health list
  const services: ServiceHealth[] = [];

  // PM2 processes
  const { getPM2Processes } = await import('./pm2-api');
  const pm2Processes = await getPM2Processes();
  for (const proc of pm2Processes) {
    services.push({
      name: proc.name,
      type: 'pm2',
      status: proc.status === 'online' ? 'healthy' : 'unhealthy',
      details: {
        pid: proc.pid,
        cpu: proc.cpu,
        memory: proc.memory,
        restarts: proc.restart_time,
      },
    });
  }

  // Docker containers
  const { getDockerContainers } = await import('./docker-api');
  const dockerContainers = await getDockerContainers();
  for (const container of dockerContainers) {
    services.push({
      name: container.name,
      type: 'docker',
      status: container.status === 'running' ? 'healthy' : 'unhealthy',
      details: {
        image: container.image,
        ports: container.ports,
        cpu: container.cpu_percent,
        memory: container.memory_usage,
      },
    });
  }

  // Determine overall system status
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;

  let system: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (totalCount === 0) {
    system = 'healthy'; // Default to healthy when no services
  } else if (healthyCount < totalCount * 0.5) {
    system = 'unhealthy';
  } else if (healthyCount < totalCount) {
    system = 'degraded';
  }

  return {
    system,
    pm2: {
      available: pm2Available,
      stats: pm2Stats,
    },
    docker: {
      available: dockerAvailable,
      stats: dockerStats,
    },
    services,
    lastChecked: new Date(),
  };
}

/**
 * Get service health checks
 */
export async function getServiceHealthChecks(): Promise<ServiceHealth[]> {
  const { getPM2Processes } = await import('./pm2-api');
  const { getDockerContainers } = await import('./docker-api');

  const healthChecks: ServiceHealth[] = [];

  // Check PM2 processes
  try {
    const pm2Processes = await getPM2Processes();
    for (const proc of pm2Processes) {
      healthChecks.push({
        name: `${proc.name} (PM2)`,
        type: 'pm2',
        status: proc.status === 'online' ? 'healthy' : 'unhealthy',
        details: {
          pid: proc.pid,
          status: proc.status,
          memory_mb: Math.round(proc.memory / 1024 / 1024),
          cpu_percent: proc.cpu,
          uptime_hours: Math.round(proc.uptime / 3600000),
          restarts: proc.restart_time,
        },
      });
    }
  } catch {
    healthChecks.push({
      name: 'PM2',
      type: 'pm2',
      status: 'unhealthy',
      details: { error: 'PM2 not available' },
    });
  }

  // Check Docker containers
  try {
    const { getDockerContainers, checkDockerAvailability } = await import('./docker-api');
    const availability = await checkDockerAvailability();

    if (!availability.available) {
      // Log as warning when Docker is unavailable
      console.warn('Docker health check:', availability.message);
      healthChecks.push({
        name: 'Docker',
        type: 'docker',
        status: 'unknown',
        details: {
          error: availability.message,
          isMock: true,
        },
      });
    } else {
      const dockerContainers = await getDockerContainers();
      for (const container of dockerContainers) {
        healthChecks.push({
          name: `${container.name} (Docker)`,
          type: 'docker',
          status: container.status === 'running' ? 'healthy' : 'unhealthy',
          details: {
            image: container.image,
            status: container.state,
            ports: container.ports.join(', '),
            memory_mb: Math.round(container.memory_usage / 1024 / 1024),
            cpu_percent: container.cpu_percent,
          },
        });
      }
    }
  } catch (error) {
    console.warn('Docker health check error:', error);
    healthChecks.push({
      name: 'Docker',
      type: 'docker',
      status: 'unknown',
      details: { error: 'Docker not available', isMock: true },
    });
  }

  return healthChecks;
}
