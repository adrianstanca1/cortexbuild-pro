/**
 * Analytics Service
 * Manages dashboards, metrics, and reports
 */

import { prisma } from '../config/database.js'
import { ReportType } from '@prisma/client'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface DashboardFilters {
  organizationId?: string
  userId?: string
}

interface MetricFilters {
  organizationId?: string
  projectId?: string
  type?: string
}

interface ReportFilters {
  organizationId?: string
  projectId?: string
  type?: string
}

interface CreateDashboardInput {
  organizationId: string
  userId?: string
  name: string
  description?: string
  widgets?: any[]
  layout?: any
  isDefault?: boolean
  isPublic?: boolean
}

interface GenerateReportInput {
  organizationId: string
  projectId?: string
  type: ReportType
  template?: string
  filters?: any
}

class AnalyticsService {
  async getDashboards(filters: DashboardFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.userId) where.userId = filters.userId

    return prisma.analyticsDashboard.findMany({
      where,
      include: {
        organization: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getDashboardById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.analyticsDashboard.findFirst({
      where,
      include: {
        organization: true,
        user: true,
      },
    })
  }

  async createDashboard(input: CreateDashboardInput) {
    const dashboard = await prisma.analyticsDashboard.create({
      data: {
        ...input,
        widgets: input.widgets || [],
        layout: input.layout || {},
        defaultFilters: {},
      },
      include: {
        organization: true,
        user: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${input.organizationId}`).emit('analytics:dashboard:created', dashboard)

    return dashboard
  }

  async updateDashboard(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.analyticsDashboard.findFirst({ where })
    if (!existing) {
      throw new Error('Dashboard not found')
    }

    const updated = await prisma.analyticsDashboard.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.widgets && { widgets: updates.widgets as any }),
        ...(updates.layout && { layout: updates.layout as any }),
        ...(updates.defaultFilters && { defaultFilters: updates.defaultFilters as any }),
      },
      include: {
        organization: true,
        user: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${updated.organizationId}`).emit('analytics:dashboard:updated', updated)

    return updated
  }

  async deleteDashboard(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.analyticsDashboard.deleteMany({ where })
  }

  async getMetrics(filters: MetricFilters) {
    // Placeholder - would calculate metrics from various data sources
    return {
      projectMetrics: {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
      },
      financialMetrics: {
        totalBudget: 0,
        spent: 0,
        remaining: 0,
      },
      safetyMetrics: {
        totalIncidents: 0,
        criticalIncidents: 0,
        daysSinceLastIncident: 0,
      },
    }
  }

  async getMetricByType(type: string, scopeFilter: any) {
    // Placeholder - would fetch specific metric type
    return { type, value: 0, timestamp: new Date() }
  }

  async getReports(filters: ReportFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.type) where.type = filters.type as ReportType

    return prisma.report.findMany({
      where,
      include: {
        project: true,
        organization: true,
      },
      orderBy: { generatedAt: 'desc' },
    })
  }

  async getReportById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.report.findFirst({
      where,
      include: {
        project: true,
        organization: true,
      },
    })
  }

  async generateReport(input: GenerateReportInput) {
    // Generate report content based on type
    const content = this.generateReportContent(input)

    const report = await prisma.report.create({
      data: {
        ...input,
        title: `${input.type} Report`,
        content: content as any,
        generatedAt: new Date(),
      },
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${input.organizationId}`).emit('analytics:report:generated', report)

    return report
  }

  async distributeReport(id: string, distributionList: string[], scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const report = await prisma.report.update({
      where: { id },
      data: {
        distributionList,
        distributedAt: new Date(),
      },
    })

    // Emit notifications to recipients
    distributionList.forEach((userId) => {
      io.to(`user:${userId}`).emit('analytics:report:distributed', report)
    })

    return report
  }

  async getAnalyticsStats(filters: DashboardFilters = {}) {
    const where = filters.organizationId ? { organizationId: filters.organizationId } : {}

    const [dashboardCount, reportCount, metrics] = await Promise.all([
      prisma.analyticsDashboard.count({ where }),
      prisma.report.count({ where }),
      this.getMetrics({ organizationId: filters.organizationId }),
    ])

    return {
      dashboards: dashboardCount,
      reports: reportCount,
      metrics,
    }
  }

  private generateReportContent(input: GenerateReportInput): any {
    // Placeholder - would generate actual report content
    return {
      type: input.type,
      generatedAt: new Date(),
      data: {},
    }
  }
}

export const analyticsService = new AnalyticsService()
