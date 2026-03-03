import { Request, Response, NextFunction } from 'express'
import { workflowService } from '../services/workflowService.js'
import { ApiError } from '../utils/ApiError.js'

export const workflowController = {
  async getWorkflows(req: Request, res: Response, next: NextFunction) {
    try {
      const workflows = await workflowService.getWorkflows()
      res.json({ success: true, workflows })
    } catch (error) {
      next(error)
    }
  },

  async getWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const { workflowId } = req.params
      const workflow = await workflowService.getWorkflow(workflowId)
      if (!workflow) {
        throw new ApiError('Workflow not found', 404)
      }
      res.json({ success: true, workflow })
    } catch (error) {
      next(error)
    }
  },

  async createWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.createWorkflow(req.body)
      res.json({ success: true, workflow, msg: 'Workflow created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const { workflowId } = req.params
      const workflow = await workflowService.updateWorkflow(workflowId, req.body)
      res.json({ success: true, workflow, msg: 'Workflow updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const { workflowId } = req.params
      await workflowService.deleteWorkflow(workflowId)
      res.json({ success: true, message: 'Workflow deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async executeWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const { workflowId } = req.params
      const execution = await workflowService.executeWorkflow(workflowId)
      res.json({ success: true, execution })
    } catch (error) {
      next(error)
    }
  },

  async getWorkflowExecutions(req: Request, res: Response, next: NextFunction) {
    try {
      const workflowId = req.query.workflowId as string | undefined
      const executions = await workflowService.getWorkflowExecutions(workflowId)
      res.json({ success: true, executions })
    } catch (error) {
      next(error)
    }
  },

  async getWorkflowStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await workflowService.getWorkflowStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

