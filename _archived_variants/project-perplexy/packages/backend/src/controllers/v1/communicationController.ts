/**
 * Communication Controller (v1)
 */

import { Request, Response } from 'express'
import { communicationService } from '../../services/communicationService.js'
import { communicationAgent } from '../../services/aiAgents/communicationAgent.js'
import { io } from '../../index.js'
import { ApiError } from '../../utils/errors.js'
import logger from '../../config/logger.js'

const getScopeFilter = (req: Request) => req.scopeFilter || {}

export const communicationController = {
  async getThreads(req: Request, res: Response) {
    try {
      const { projectId, type } = req.query
      const scopeFilter = getScopeFilter(req)

      const threads = await communicationService.getThreads({
        ...scopeFilter,
        projectId: projectId as string,
        type: type as string,
      })

      res.json({ success: true, threads })
    } catch (error: any) {
      logger.error('Get threads failed', { error: error.message })
      throw new ApiError(500, 'Failed to fetch threads')
    }
  },

  async getThreadById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = getScopeFilter(req)

      const thread = await communicationService.getThreadById(id, scopeFilter)

      if (!thread) {
        throw new ApiError(404, 'Thread not found')
      }

      res.json({ success: true, thread })
    } catch (error: any) {
      logger.error('Get thread by ID failed', { error: error.message })
      throw error
    }
  },

  async createThread(req: Request, res: Response) {
    try {
      const userData = req.userData!
      const scopeFilter = getScopeFilter(req)

      const thread = await communicationService.createThread({
        ...req.body,
        organizationId: scopeFilter.organizationId,
        createdBy: userData.id,
        participants: req.body.participants || [userData.id],
      })

      res.status(201).json({ success: true, thread })
    } catch (error: any) {
      logger.error('Create thread failed', { error: error.message })
      throw new ApiError(500, 'Failed to create thread')
    }
  },

  async updateThread(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = getScopeFilter(req)

      const thread = await communicationService.updateThread(id, req.body, scopeFilter)

      res.json({ success: true, thread })
    } catch (error: any) {
      logger.error('Update thread failed', { error: error.message })
      throw error
    }
  },

  async deleteThread(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = getScopeFilter(req)

      await communicationService.deleteThread(id, scopeFilter)

      res.json({ success: true, message: 'Thread deleted' })
    } catch (error: any) {
      logger.error('Delete thread failed', { error: error.message })
      throw error
    }
  },

  async getMessages(req: Request, res: Response) {
    try {
      const { threadId } = req.params
      const scopeFilter = getScopeFilter(req)

      const messages = await communicationService.getMessages(threadId, scopeFilter)

      res.json({ success: true, messages })
    } catch (error: any) {
      logger.error('Get messages failed', { error: error.message })
      throw new ApiError(500, 'Failed to fetch messages')
    }
  },

  async sendMessage(req: Request, res: Response) {
    try {
      const { threadId } = req.params
      const userData = req.userData!
      const scopeFilter = getScopeFilter(req)

      const message = await communicationService.sendMessage({
        threadId,
        userId: userData.id,
        ...req.body,
      })

      // Analyze sentiment
      const sentimentResult = await communicationAgent.execute(
        { action: 'analyze_sentiment', messageId: message.id },
        scopeFilter
      )

      // Update message with sentiment
      await communicationService.updateMessage(message.id, {
        sentiment: sentimentResult.output,
      })

      // Emit real-time update
      io.to(`thread:${threadId}`).emit('message:new', message)

      res.status(201).json({ success: true, message })
    } catch (error: any) {
      logger.error('Send message failed', { error: error.message })
      throw new ApiError(500, 'Failed to send message')
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userData = req.userData!

      await communicationService.markAsRead(id, userData.id)

      // Emit real-time update
      io.emit('message:read', { messageId: id, userId: userData.id })

      res.json({ success: true })
    } catch (error: any) {
      logger.error('Mark as read failed', { error: error.message })
      throw new ApiError(500, 'Failed to mark as read')
    }
  },
}

