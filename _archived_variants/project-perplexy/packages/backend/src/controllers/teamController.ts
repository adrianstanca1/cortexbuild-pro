import { Request, Response, NextFunction } from 'express'
import { teamService } from '../services/teamService.js'
import { ApiError } from '../utils/ApiError.js'

export const teamController = {
  async getTeamMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await teamService.getTeamMembers()
      res.json({ success: true, members })
    } catch (error) {
      next(error)
    }
  },

  async getTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params
      const member = await teamService.getTeamMember(memberId)
      if (!member) {
        throw new ApiError('Team member not found', 404)
      }
      res.json({ success: true, member })
    } catch (error) {
      next(error)
    }
  },

  async createTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await teamService.createTeamMember(req.body)
      res.json({ success: true, member, message: 'Team member created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params
      const member = await teamService.updateTeamMember(memberId, req.body)
      res.json({ success: true, member, message: 'Team member updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params
      await teamService.deleteTeamMember(memberId)
      res.json({ success: true, message: 'Team member deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getTeamStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await teamService.getTeamStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

