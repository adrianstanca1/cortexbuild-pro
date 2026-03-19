/**
 * Grafana Dashboard Configurations
 * 6+ production dashboards for SRE monitoring
 */

export const dashboards = {
  /**
   * 1. Executive Summary Dashboard
   * High-level business and technical KPIs
   */
  executiveSummary: {
    title: 'CortexBuild Executive Summary',
    description: 'High-level overview of platform health and business metrics',
    refresh: '5m',
    time: { from: 'now-6h', to: 'now' },
    panels: [
      {
        id: 1,
        title: 'System Health Status',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 0, y: 0 },
        targets: [
          {
            expr: 'up{job="cortexbuild-api"}',
            legendFormat: 'API Status',
          },
        ],
        options: {
          colorMode: 'background',
          graphMode: 'none',
          justifyMode: 'center',
        },
        fieldConfig: {
          defaults: {
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'red', value: 0 },
                { color: 'green', value: 1 },
              ],
            },
            mappings: [
              { type: 'value', options: { 0: 'Down', 1: 'Up' } },
            ],
          },
        },
      },
      {
        id: 2,
        title: 'Active Users',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 6, y: 0 },
        targets: [
          {
            expr: 'sum(increase(user_sessions_total[1h]))',
            legendFormat: 'Sessions',
          },
        ],
      },
      {
        id: 3,
        title: 'Request Rate',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
        targets: [
          {
            expr: 'sum(rate(http_requests_total[5m]))',
            legendFormat: 'Requests/sec',
          },
        ],
      },
      {
        id: 4,
        title: 'Error Rate',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 4 },
        targets: [
          {
            expr: 'sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100',
            legendFormat: 'Error Rate %',
          },
        ],
        thresholds: [
          { value: 1, color: 'yellow' },
          { value: 5, color: 'red' },
        ],
      },
      {
        id: 5,
        title: 'Revenue (MTD)',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 0, y: 8 },
        targets: [
          {
            expr: 'sum(subscription_revenue_total{month="current"})',
            legendFormat: 'Revenue',
          },
        ],
        decimals: 2,
        unit: 'currencyUSD',
      },
      {
        id: 6,
        title: 'Active Projects',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 6, y: 8 },
        targets: [
          {
            expr: 'count(active_projects)',
            legendFormat: 'Projects',
          },
        ],
      },
    ],
  },

  /**
   * 2. Technical Metrics Dashboard
   * Infrastructure and application performance
   */
  technicalMetrics: {
    title: 'CortexBuild Technical Metrics',
    description: 'Detailed technical performance metrics',
    refresh: '30s',
    time: { from: 'now-1h', to: 'now' },
    panels: [
      {
        id: 1,
        title: 'CPU Usage',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
        targets: [
          {
            expr: 'rate(process_cpu_seconds_total[5m]) * 100',
            legendFormat: 'CPU %',
          },
        ],
        thresholds: [
          { value: 75, color: 'yellow' },
          { value: 90, color: 'red' },
        ],
      },
      {
        id: 2,
        title: 'Memory Usage',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
        targets: [
          {
            expr: 'process_resident_memory_bytes',
            legendFormat: 'RSS Memory',
          },
          {
            expr: 'process_heap_bytes',
            legendFormat: 'Heap Used',
          },
        ],
      },
      {
        id: 3,
        title: 'Response Time Percentiles',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 8 },
        targets: [
          {
            expr: 'histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))',
            legendFormat: 'p50',
          },
          {
            expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
            legendFormat: 'p95',
          },
          {
            expr: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))',
            legendFormat: 'p99',
          },
        ],
      },
      {
        id: 4,
        title: 'Request Rate by Endpoint',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 8 },
        targets: [
          {
            expr: 'sum(rate(http_requests_total[5m])) by (path)',
            legendFormat: '{{path}}',
          },
        ],
      },
      {
        id: 5,
        title: 'Database Connections',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 16 },
        targets: [
          {
            expr: 'pg_stat_activity_count',
            legendFormat: 'Active Connections',
          },
        ],
      },
      {
        id: 6,
        title: 'Cache Hit Rate',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 16 },
        targets: [
          {
            expr: 'cache_hit_ratio',
            legendFormat: 'Hit Rate',
          },
        ],
        thresholds: [
          { value: 0.8, color: 'yellow' },
          { value: 0.9, color: 'green' },
        ],
      },
    ],
  },

  /**
   * 3. Business Metrics Dashboard
   * User, project, and revenue tracking
   */
  businessMetrics: {
    title: 'CortexBuild Business Metrics',
    description: 'Business KPIs and user engagement',
    refresh: '5m',
    time: { from: 'now-24h', to: 'now' },
    panels: [
      {
        id: 1,
        title: 'Total Users',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 0, y: 0 },
        targets: [
          {
            expr: 'count(users_total)',
            legendFormat: 'Users',
          },
        ],
      },
      {
        id: 2,
        title: 'Active Organizations',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 6, y: 0 },
        targets: [
          {
            expr: 'count(organizations_active)',
            legendFormat: 'Orgs',
          },
        ],
      },
      {
        id: 3,
        title: 'New Signups (24h)',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 12, y: 0 },
        targets: [
          {
            expr: 'increase(user_signups_total[24h])',
            legendFormat: 'Signups',
          },
        ],
      },
      {
        id: 4,
        title: 'MRR (Monthly Recurring Revenue)',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 18, y: 0 },
        targets: [
          {
            expr: 'sum(subscription_mrr)',
            legendFormat: 'MRR',
          },
        ],
        unit: 'currencyUSD',
      },
      {
        id: 5,
        title: 'User Signups Trend',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 4 },
        targets: [
          {
            expr: 'increase(user_signups_total[1h])',
            legendFormat: 'Signups/hour',
          },
        ],
      },
      {
        id: 6,
        title: 'Projects Created',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 4 },
        targets: [
          {
            expr: 'increase(projects_created_total[1h])',
            legendFormat: 'Projects/hour',
          },
        ],
      },
      {
        id: 7,
        title: 'Revenue by Plan',
        type: 'piechart',
        gridPos: { h: 8, w: 12, x: 0, y: 12 },
        targets: [
          {
            expr: 'sum(subscription_revenue_total) by (plan)',
            legendFormat: '{{plan}}',
          },
        ],
      },
      {
        id: 8,
        title: 'User Activity Heatmap',
        type: 'heatmap',
        gridPos: { h: 8, w: 12, x: 12, y: 12 },
        targets: [
          {
            expr: 'sum(rate(user_actions_total[5m])) by (hour)',
            legendFormat: 'Actions',
          },
        ],
      },
    ],
  },

  /**
   * 4. Error Tracking Dashboard
   * Application errors and failures
   */
  errorTracking: {
    title: 'CortexBuild Error Tracking',
    description: 'Error rates, types, and troubleshooting',
    refresh: '1m',
    time: { from: 'now-6h', to: 'now' },
    panels: [
      {
        id: 1,
        title: 'Error Rate (Overall)',
        type: 'graph',
        gridPos: { h: 8, w: 24, x: 0, y: 0 },
        targets: [
          {
            expr: 'sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100',
            legendFormat: 'Error Rate %',
          },
        ],
        thresholds: [
          { value: 1, color: 'yellow' },
          { value: 5, color: 'red' },
        ],
      },
      {
        id: 2,
        title: 'Errors by Status Code',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 8 },
        targets: [
          {
            expr: 'sum(rate(http_errors_total[5m])) by (status)',
            legendFormat: '{{status}}',
          },
        ],
      },
      {
        id: 3,
        title: 'Errors by Endpoint',
        type: 'table',
        gridPos: { h: 8, w: 12, x: 12, y: 8 },
        targets: [
          {
            expr: 'topk(10, sum(increase(http_errors_total[1h])) by (path))',
            legendFormat: '{{path}}',
          },
        ],
      },
      {
        id: 4,
        title: 'Database Errors',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 16 },
        targets: [
          {
            expr: 'rate(db_query_errors_total[5m])',
            legendFormat: 'DB Errors/sec',
          },
        ],
      },
      {
        id: 5,
        title: 'Application Exceptions',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 16 },
        targets: [
          {
            expr: 'rate(app_exceptions_total[5m])',
            legendFormat: 'Exceptions/sec',
          },
        ],
      },
      {
        id: 6,
        title: 'Error Logs',
        type: 'logs',
        gridPos: { h: 8, w: 24, x: 0, y: 24 },
        targets: [
          {
            expr: '{job="cortexbuild"} |= "error"',
          },
        ],
      },
    ],
  },

  /**
   * 5. Performance Trends Dashboard
   * Long-term performance analysis
   */
  performanceTrends: {
    title: 'CortexBuild Performance Trends',
    description: 'Performance trends and SLA tracking',
    refresh: '5m',
    time: { from: 'now-7d', to: 'now' },
    panels: [
      {
        id: 1,
        title: 'Response Time Trend (p99)',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
        targets: [
          {
            expr: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[1h]))',
            legendFormat: 'p99 Latency',
          },
        ],
      },
      {
        id: 2,
        title: 'Throughput Trend',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
        targets: [
          {
            expr: 'sum(rate(http_requests_total[1h]))',
            legendFormat: 'Requests/sec',
          },
        ],
      },
      {
        id: 3,
        title: 'SLA Compliance',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 0, y: 8 },
        targets: [
          {
            expr: 'avg_over_time(up{job="cortexbuild-api"}[7d]) * 100',
            legendFormat: 'Uptime %',
          },
        ],
        decimals: 2,
      },
      {
        id: 4,
        title: 'Error Budget Remaining',
        type: 'gauge',
        gridPos: { h: 4, w: 6, x: 6, y: 8 },
        targets: [
          {
            expr: '(0.05 - sum(rate(http_errors_total[7d])) / sum(rate(http_requests_total[7d]))) * 1000',
            legendFormat: 'Budget',
          },
        ],
      },
      {
        id: 5,
        title: 'Database Performance',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 8 },
        targets: [
          {
            expr: 'histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[1h]))',
            legendFormat: 'DB p95',
          },
        ],
      },
      {
        id: 6,
        title: 'Cache Performance',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 12 },
        targets: [
          {
            expr: 'cache_hit_ratio',
            legendFormat: 'Hit Rate',
          },
        ],
      },
      {
        id: 7,
        title: 'Memory Usage Trend',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 12, y: 12 },
        targets: [
          {
            expr: 'process_resident_memory_bytes',
            legendFormat: 'Memory',
          },
        ],
      },
    ],
  },

  /**
   * 6. Real-time Traffic Dashboard
   * Live traffic monitoring
   */
  realtimeTraffic: {
    title: 'CortexBuild Real-time Traffic',
    description: 'Live traffic and request monitoring',
    refresh: '5s',
    time: { from: 'now-30m', to: 'now' },
    panels: [
      {
        id: 1,
        title: 'Live Request Rate',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 0, y: 0 },
        targets: [
          {
            expr: 'sum(rate(http_requests_total[1m]))',
            legendFormat: 'RPS',
          },
        ],
        decimals: 2,
      },
      {
        id: 2,
        title: 'Active Connections',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 6, y: 0 },
        targets: [
          {
            expr: 'sum(websocket_connections)',
            legendFormat: 'Connections',
          },
        ],
      },
      {
        id: 3,
        title: 'Live Error Rate',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 12, y: 0 },
        targets: [
          {
            expr: 'sum(rate(http_errors_total[1m])) / sum(rate(http_requests_total[1m])) * 100',
            legendFormat: 'Error %',
          },
        ],
        decimals: 2,
        thresholds: [
          { value: 1, color: 'yellow' },
          { value: 5, color: 'red' },
        ],
      },
      {
        id: 4,
        title: 'Current Latency (p99)',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 18, y: 0 },
        targets: [
          {
            expr: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[1m]))',
            legendFormat: 'p99',
          },
        ],
        unit: 's',
      },
      {
        id: 5,
        title: 'Requests by Method',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 4 },
        targets: [
          {
            expr: 'sum(rate(http_requests_total[1m])) by (method)',
            legendFormat: '{{method}}',
          },
        ],
      },
      {
        id: 6,
        title: 'Top Endpoints',
        type: 'bargauge',
        gridPos: { h: 8, w: 12, x: 12, y: 4 },
        targets: [
          {
            expr: 'topk(10, sum(rate(http_requests_total[5m])) by (path))',
            legendFormat: '{{path}}',
          },
        ],
      },
      {
        id: 7,
        title: 'Request Rate (Live)',
        type: 'graph',
        gridPos: { h: 8, w: 24, x: 0, y: 12 },
        targets: [
          {
            expr: 'sum(rate(http_requests_total[30s]))',
            legendFormat: 'Requests/sec',
          },
        ],
        options: {
          graphMode: 'area',
        },
      },
      {
        id: 8,
        title: 'Latency Heatmap',
        type: 'heatmap',
        gridPos: { h: 8, w: 24, x: 0, y: 20 },
        targets: [
          {
            expr: 'rate(http_request_duration_seconds_bucket[1m])',
            legendFormat: 'Latency',
          },
        ],
      },
    ],
  },
};
