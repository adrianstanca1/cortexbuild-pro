import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface AnalyticsWidget {
  id: string
  type: 'chart' | 'table' | 'metric' | 'map'
  title: string
  config: Record<string, any>
  data: any
}

export interface AnalyticsDashboard {
  id: string
  name: string
  description: string
  widgets: AnalyticsWidget[]
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsMetric {
  id: string
  name: string
  value: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  period: 'day' | 'week' | 'month' | 'year'
  createdAt: Date
}

export interface AnalyticsReport {
  id: string
  name: string
  type: 'tender' | 'contract' | 'project' | 'team' | 'financial'
  data: any
  generatedAt: Date
  createdAt: Date
}

export interface CreateAnalyticsDashboardRequest {
  name: string
  description: string
  widgets?: AnalyticsWidget[]
}

export interface UpdateAnalyticsDashboardRequest {
  name?: string
  description?: string
  widgets?: AnalyticsWidget[]
}

export interface GenerateAnalyticsReportRequest {
  name: string
  type: 'tender' | 'contract' | 'project' | 'team' | 'financial'
  filters?: Record<string, any>
  dateRange?: {
    start: string
    end: string
  }
}

export interface AnalyticsStats {
  totalDashboards: number
  totalReports: number
  totalMetrics: number
}

function parseAnalyticsDashboard(dashboard: any): AnalyticsDashboard {
  return {
    ...dashboard,
    createdAt: new Date(dashboard.createdAt),
    updatedAt: new Date(dashboard.updatedAt),
  }
}

function parseAnalyticsMetric(metric: any): AnalyticsMetric {
  return {
    ...metric,
    createdAt: new Date(metric.createdAt),
  }
}

function parseAnalyticsReport(report: any): AnalyticsReport {
  return {
    ...report,
    generatedAt: new Date(report.generatedAt),
    createdAt: new Date(report.createdAt),
  }
}

export const analyticsService = {
  async getDashboards(): Promise<AnalyticsDashboard[]> {
    const response = await axios.get(`${API_URL}/api/analytics/dashboards`)
    return response.data.dashboards.map(parseAnalyticsDashboard)
  },

  async getDashboard(dashboardId: string): Promise<AnalyticsDashboard> {
    const response = await axios.get(`${API_URL}/api/analytics/dashboards/${dashboardId}`)
    return parseAnalyticsDashboard(response.data.dashboard)
  },

  async createDashboard(dashboard: CreateAnalyticsDashboardRequest): Promise<AnalyticsDashboard> {
    const response = await axios.post(`${API_URL}/api/analytics/dashboards`, dashboard)
    return parseAnalyticsDashboard(response.data.dashboard)
  },

  async updateDashboard(dashboardId: string, updates: UpdateAnalyticsDashboardRequest): Promise<AnalyticsDashboard> {
    const response = await axios.put(`${API_URL}/api/analytics/dashboards/${dashboardId}`, updates)
    return parseAnalyticsDashboard(response.data.dashboard)
  },

  async deleteDashboard(dashboardId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/analytics/dashboards/${dashboardId}`)
  },

  async getMetrics(period?: 'day' | 'week' | 'month' | 'year'): Promise<AnalyticsMetric[]> {
    const params = period ? { period } : {}
    const response = await axios.get(`${API_URL}/api/analytics/metrics`, { params })
    return response.data.metrics.map(parseAnalyticsMetric)
  },

  async generateReport(request: GenerateAnalyticsReportRequest): Promise<AnalyticsReport> {
    const response = await axios.post(`${API_URL}/api/analytics/reports/generate`, request)
    return parseAnalyticsReport(response.data.report)
  },

  async getReports(): Promise<AnalyticsReport[]> {
    const response = await axios.get(`${API_URL}/api/analytics/reports`)
    return response.data.reports.map(parseAnalyticsReport)
  },

  async getReport(reportId: string): Promise<AnalyticsReport> {
    const response = await axios.get(`${API_URL}/api/analytics/reports/${reportId}`)
    return parseAnalyticsReport(response.data.report)
  },

  async getAnalyticsStats(): Promise<AnalyticsStats> {
    const response = await axios.get(`${API_URL}/api/analytics/stats`)
    return response.data.stats
  },
}

