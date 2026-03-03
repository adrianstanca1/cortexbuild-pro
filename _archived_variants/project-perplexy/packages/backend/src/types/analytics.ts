export interface AnalyticsDashboard {
  id: string
  name: string
  description: string
  widgets: AnalyticsWidget[]
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsWidget {
  id: string
  type: 'chart' | 'table' | 'metric' | 'map'
  title: string
  config: Record<string, any>
  data: any
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

