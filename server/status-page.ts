/**
 * Status Page
 * Public status page for service availability
 */

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  description: string;
  uptime: number;
  lastChecked: string;
}

export interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  description: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  timestamp: string;
  status: string;
  message: string;
}

export interface StatusPageData {
  overallStatus: 'operational' | 'degraded' | 'down' | 'maintenance';
  lastUpdated: string;
  services: ServiceStatus[];
  incidents: Incident[];
  uptimeHistory: UptimeHistory[];
}

export interface UptimeHistory {
  date: string;
  uptime: number;
  incidents: number;
}

/**
 * Calculate overall status from services
 */
export function calculateOverallStatus(services: ServiceStatus[]): 'operational' | 'degraded' | 'down' | 'maintenance' {
  if (services.some(s => s.status === 'down')) return 'down';
  if (services.some(s => s.status === 'maintenance')) return 'maintenance';
  if (services.some(s => s.status === 'degraded')) return 'degraded';
  return 'operational';
}

/**
 * Get default services
 */
export function getDefaultServices(): ServiceStatus[] {
  return [
    {
      name: 'API',
      status: 'operational',
      description: 'REST API and GraphQL endpoints',
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Web Application',
      status: 'operational',
      description: 'Main web application',
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Database',
      status: 'operational',
      description: 'PostgreSQL database cluster',
      uptime: 99.99,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Cache',
      status: 'operational',
      description: 'Redis cache cluster',
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Storage',
      status: 'operational',
      description: 'File storage and CDN',
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Authentication',
      status: 'operational',
      description: 'User authentication and authorization',
      uptime: 99.99,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Email',
      status: 'operational',
      description: 'Email delivery service',
      uptime: 99.5,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Payments',
      status: 'operational',
      description: 'Payment processing',
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    },
  ];
}

/**
 * Create status page HTML
 */
export function createStatusPageHTML(data: StatusPageData): string {
  const statusColors = {
    operational: '#22c55e',
    degraded: '#f59e0b',
    down: '#ef4444',
    maintenance: '#6b7280',
  };
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CortexBuild Status</title>
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --border: #334155;
      --operational: #22c55e;
      --degraded: #f59e0b;
      --down: #ef4444;
      --maintenance: #6b7280;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    header {
      text-align: center;
      padding: 3rem 0;
      border-bottom: 1px solid var(--border);
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    .overall-status {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border-radius: 9999px;
      font-weight: 600;
      margin-top: 1rem;
    }
    
    .status-operational { background: var(--operational); }
    .status-degraded { background: var(--degraded); }
    .status-down { background: var(--down); }
    .status-maintenance { background: var(--maintenance); }
    
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }
    
    .service-card {
      background: var(--bg-secondary);
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
    }
    
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .service-name {
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .service-status {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .service-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .service-uptime {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .incidents-section {
      margin: 3rem 0;
    }
    
    .incident-card {
      background: var(--bg-secondary);
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      margin-bottom: 1rem;
    }
    
    .incident-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .incident-title {
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .incident-status {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .incident-updates {
      margin-top: 1rem;
      padding-left: 1rem;
      border-left: 2px solid var(--border);
    }
    
    .incident-update {
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    
    .incident-update-time {
      color: var(--text-secondary);
      font-size: 0.75rem;
    }
    
    .uptime-history {
      margin: 3rem 0;
    }
    
    .uptime-bar {
      display: flex;
      gap: 2px;
      margin-top: 1rem;
    }
    
    .uptime-day {
      flex: 1;
      height: 30px;
      border-radius: 2px;
    }
    
    .uptime-good { background: var(--operational); }
    .uptime-degraded { background: var(--degraded); }
    .uptime-down { background: var(--down); }
    
    footer {
      text-align: center;
      padding: 2rem 0;
      border-top: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .last-updated {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>CortexBuild Status</h1>
      <p>Current system status and availability</p>
      <div class="overall-status status-${data.overallStatus}">
        ${data.overallStatus.replace('-', ' ').toUpperCase()}
      </div>
      <p class="last-updated">Last updated: ${new Date(data.lastUpdated).toLocaleString()}</p>
    </header>
    
    <section>
      <h2 style="margin: 2rem 0 1rem;">Services</h2>
      <div class="services-grid">
        ${data.services.map(service => `
          <div class="service-card">
            <div class="service-header">
              <span class="service-name">${service.name}</span>
              <span class="service-status" style="background: ${statusColors[service.status]}">
                ${service.status}
              </span>
            </div>
            <p class="service-description">${service.description}</p>
            <p class="service-uptime">Uptime: ${service.uptime.toFixed(2)}%</p>
          </div>
        `).join('')}
      </div>
    </section>
    
    ${data.incidents.length > 0 ? `
      <section class="incidents-section">
        <h2>Active Incidents</h2>
        ${data.incidents.map(incident => `
          <div class="incident-card">
            <div class="incident-header">
              <span class="incident-title">${incident.title}</span>
              <span class="incident-status" style="background: ${statusColors[incident.status]}">
                ${incident.status}
              </span>
            </div>
            <p>${incident.description}</p>
            <div class="incident-updates">
              ${incident.updates.map(update => `
                <div class="incident-update">
                  <div class="incident-update-time">${new Date(update.timestamp).toLocaleString()}</div>
                  <div>${update.message}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </section>
    ` : ''}
    
    <section class="uptime-history">
      <h2>Uptime History (Last 90 Days)</h2>
      <div class="uptime-bar">
        ${data.uptimeHistory.map(day => `
          <div class="uptime-day uptime-${day.uptime > 99 ? 'good' : day.uptime > 95 ? 'degraded' : 'down'}" 
               title="${day.date}: ${day.uptime.toFixed(2)}%"></div>
        `).join('')}
      </div>
    </section>
    
    <footer>
      <p>CortexBuild Status Page</p>
      <p>For support, contact: support@cortexbuild.com</p>
      <p>API: <a href="/api/health" style="color: var(--text-secondary)">/api/health</a></p>
    </footer>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Express route for status page
 */
export function statusPageHandler(getStatusData: () => StatusPageData) {
  return (req: any, res: any): void => {
    const data = getStatusData();
    
    // Check if JSON or HTML requested
    if (req.headers.accept?.includes('application/json')) {
      res.json(data);
    } else {
      res.set('Content-Type', 'text/html');
      res.send(createStatusPageHTML(data));
    }
  };
}

/**
 * Create status page data from health checks
 */
export function createStatusData(
  services: ServiceStatus[],
  incidents: Incident[] = [],
  uptimeHistory: UptimeHistory[] = []
): StatusPageData {
  return {
    overallStatus: calculateOverallStatus(services),
    lastUpdated: new Date().toISOString(),
    services,
    incidents,
    uptimeHistory,
  };
}

/**
 * Generate 90-day uptime history
 */
export function generateUptimeHistory(days = 90): UptimeHistory[] {
  const history: UptimeHistory[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    history.push({
      date: date.toISOString().split('T')[0],
      uptime: 99.5 + (Math.random() * 0.5),
      incidents: Math.random() > 0.9 ? 1 : 0,
    });
  }
  
  return history;
}
