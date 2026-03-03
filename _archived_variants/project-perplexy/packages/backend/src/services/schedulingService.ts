/**
 * Scheduling Service
 * Manages project schedules and timelines
 */

import { prisma } from '../config/database.js'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface SchedulingFilters {
  organizationId?: string
  projectId?: string
}

interface CreateScheduleInput {
  organizationId: string
  projectId: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
}

class SchedulingService {
  async getSchedules(filters: SchedulingFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId

    return prisma.schedule.findMany({
      where,
      include: {
        project: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getScheduleById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.schedule.findFirst({
      where,
      include: {
        project: true,
        organization: true,
      },
    })
  }

  async createSchedule(input: CreateScheduleInput) {
    const schedule = await prisma.schedule.create({
      data: {
        ...input,
        baseline: {} as any,
        current: {} as any,
        milestones: [],
        conflicts: [],
      },
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`project:${input.projectId}`).emit('schedule:created', schedule)

    return schedule
  }

  async updateSchedule(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.schedule.findFirst({ where })
    if (!existing) {
      throw new Error('Schedule not found')
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.baseline && { baseline: updates.baseline as any }),
        ...(updates.current && { current: updates.current as any }),
        ...(updates.milestones && { milestones: updates.milestones as any }),
        ...(updates.conflicts && { conflicts: updates.conflicts as any }),
        ...(updates.criticalPath && { criticalPath: updates.criticalPath as any }),
        ...(updates.resourceAllocations && {
          resourceAllocations: updates.resourceAllocations as any,
        }),
      },
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`project:${updated.projectId}`).emit('schedule:updated', updated)

    return updated
  }

  async deleteSchedule(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.schedule.deleteMany({ where })
  }
}

export const schedulingService = new SchedulingService()

