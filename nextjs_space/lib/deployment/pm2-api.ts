// =====================================================
// PM2 PROCESS MANAGEMENT API
// Integration with PM2 process manager
// =====================================================

export interface PM2Process {
  pid: number;
  name: string;
  namespace?: string;
  status: 'online' | 'stopped' | 'errored' | 'launching';
  cpu: number;
  memory: number;
  uptime: number;
  restart_time: number;
  version?: string;
  mode: 'fork' | 'cluster';
  pm_id: number;
}

export interface PM2Stats {
  total: number;
  online: number;
  stopped: number;
  errored: number;
}

/**
 * Get PM2 process list
 * Uses pm2 CLI via exec when available, falls back to mock data
 */
export async function getPM2Processes(): Promise<PM2Process[]> {
  try {
    // Try to use pm2 programmatic API
    const pm2 = await getPM2Client();
    if (pm2) {
      return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
          if (err) return reject(err);
          resolve(formatPM2Processes(list));
        });
      });
    }
  } catch (error) {
    console.error('PM2 list error:', error);
  }

  // Fallback to mock data for development
  return getMockPM2Processes();
}

/**
 * Get PM2 stats summary
 */
export async function getPM2Stats(): Promise<PM2Stats> {
  const processes = await getPM2Processes();
  return {
    total: processes.length,
    online: processes.filter(p => p.status === 'online').length,
    stopped: processes.filter(p => p.status === 'stopped').length,
    errored: processes.filter(p => p.status === 'errored').length,
  };
}

/**
 * Format PM2 process list to our schema
 */
function formatPM2Processes(list: any[]): PM2Process[] {
  return list.map(proc => ({
    pid: proc.pid,
    name: proc.name,
    namespace: proc.namespace,
    status: proc.status as 'online' | 'stopped' | 'errored' | 'launching',
    cpu: proc.monit?.cpu || 0,
    memory: proc.monit?.memory || 0,
    uptime: proc.uptime || 0,
    restart_time: proc.restart_time || 0,
    version: proc.version,
    mode: proc.pm2_env?.exec_mode || 'fork',
    pm_id: proc.pm_id,
  }));
}

/**
 * Get PM2 client if available
 */
async function getPM2Client(): Promise<any> {
  try {
    const pm2 = await import('pm2');
    return pm2;
  } catch {
    return null;
  }
}

/**
 * Mock PM2 data for development/testing
 */
function getMockPM2Processes(): PM2Process[] {
  return [
    {
      pid: 12345,
      name: 'nextjs-app',
      status: 'online',
      cpu: 2.5,
      memory: 256000000,
      uptime: 3600000,
      restart_time: 0,
      mode: 'cluster',
      pm_id: 0,
    },
    {
      pid: 12346,
      name: 'api-server',
      status: 'online',
      cpu: 1.2,
      memory: 128000000,
      uptime: 3600000,
      restart_time: 1,
      mode: 'fork',
      pm_id: 1,
    },
    {
      pid: 12347,
      name: 'worker',
      status: 'online',
      cpu: 0.8,
      memory: 64000000,
      uptime: 1800000,
      restart_time: 0,
      mode: 'fork',
      pm_id: 2,
    },
  ];
}

/**
 * Restart a PM2 process
 */
export async function restartProcess(nameOrId: string | number): Promise<boolean> {
  try {
    const pm2 = await getPM2Client();
    if (pm2) {
      return new Promise((resolve, reject) => {
        pm2.restart(nameOrId, (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    }
  } catch (error) {
    console.error('PM2 restart error:', error);
  }
  return false;
}

/**
 * Stop a PM2 process
 */
export async function stopProcess(nameOrId: string | number): Promise<boolean> {
  try {
    const pm2 = await getPM2Client();
    if (pm2) {
      return new Promise((resolve, reject) => {
        pm2.stop(nameOrId, (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    }
  } catch (error) {
    console.error('PM2 stop error:', error);
  }
  return false;
}

/**
 * Start a PM2 process
 */
export async function startProcess(nameOrId: string | number): Promise<boolean> {
  try {
    const pm2 = await getPM2Client();
    if (pm2) {
      return new Promise((resolve, reject) => {
        pm2.start(nameOrId, (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    }
  } catch (error) {
    console.error('PM2 start error:', error);
  }
  return false;
}
