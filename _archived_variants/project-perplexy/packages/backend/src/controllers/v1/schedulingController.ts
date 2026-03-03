/**
 * Scheduling Controller (v1)
 */

import { Request, Response } from 'express'
import { schedulingService } from '../../services/schedulingService.js'
import { schedulingAgent } from '../../services/aiAgents/schedulingAgent.js'
import { ApiError } from '../../utils/errors.js'
import logger from '../../config/logger.js'

export const schedulingController = {
  async getSchedules(req: Request, res: Response) {
    try {
      const { projectId } = req.query
      const scopeFilter = req.scopeFilter || {}

      const schedules = await schedulingService.getSchedules({
        ...scopeFilter,
        projectId: projectId as string,
      })

      res.json({ success: true, schedules })
    } catch (error: any) {
      logger.error('Get schedules failed', { error: error.message })
      throw new ApiError(500, 'Failed to fetch schedules')
    }
  },

  async getScheduleById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const schedule = await schedulingService.getScheduleById(id, scopeFilter)

      if (!schedule) {
        throw new ApiError(404, 'Schedule not found')
      }

      res.json({ success: true, schedule })
    } catch (error: any) {
      logger.error('Get schedule by ID failed', { error: error.message })
      throw error
    }
  },

  async createSchedule(req: Request, res: Response) {
    try {
      const scopeFilter = req.scopeFilter || {}

      const schedule = await schedulingService.createSchedule({
        ...req.body,
        organizationId: scopeFilter.organizationId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      })

      res.status(201).json({ success: true, schedule })
    } catch (error: any) {
      logger.error('Create schedule failed', { error: error.message })
      throw new ApiError(500, 'Failed to create schedule')
    }
  },

  async updateSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const schedule = await schedulingService.updateSchedule(id, req.body, scopeFilter)

      res.json({ success: true, schedule })
    } catch (error: any) {
      logger.error('Update schedule failed', { error: error.message })
      throw error
    }
  },

  async deleteSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      await schedulingService.deleteSchedule(id, scopeFilter)

      res.json({ success: true, message: 'Schedule deleted' })
    } catch (error: any) {
      logger.error('Delete schedule failed', { error: error.message })
      throw error
    }
  },

  async optimizeTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const result = await schedulingAgent.execute(
        { action: 'optimize_timeline', scheduleId: id },
        scopeFilter
      )

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Optimize timeline failed', { error: error.message })
      throw new ApiError(500, 'Timeline optimization failed')
    }
  },

  async analyzeCriticalPath(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const result = await schedulingAgent.execute(
        { action: 'analyze_critical_path', scheduleId: id },
        scopeFilter
      )

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Analyze critical path failed', { error: error.message })
      throw new ApiError(500, 'Critical path analysis failed')
    }
  },

  async resolveConflicts(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const result = await schedulingAgent.execute(
        { action: 'resolve_conflicts', scheduleId: id },
        scopeFilter
      )

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Resolve conflicts failed', { error: error.message })
      throw new ApiError(500, 'Conflict resolution failed')
    }
  },

  async generateSchedule(req: Request, res: Response) {
    try {
      const { projectId, requirements } = req.body
      const scopeFilter = req.scopeFilter || {}

      const result = await schedulingAgent.execute(
        { action: 'generate_schedule', projectId, requirements },
        scopeFilter
      )

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Generate schedule failed', { error: error.message })
      throw new ApiError(500, 'Schedule generation failed')
    }
  },
}

