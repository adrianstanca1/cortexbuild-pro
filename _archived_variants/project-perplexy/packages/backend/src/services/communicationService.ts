/**
 * Communication Service
 * Manages threads and messages
 */

import { prisma } from '../config/database.js'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface CommunicationFilters {
  organizationId?: string
  projectId?: string
  type?: string
}

interface CreateThreadInput {
  organizationId: string
  projectId?: string
  title: string
  type?: string
  createdBy: string
  participants?: string[]
}

class CommunicationService {
  async getThreads(filters: CommunicationFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.type) where.type = filters.type

    return prisma.communicationThread.findMany({
      where,
      include: {
        project: true,
        organization: true,
      },
      orderBy: { lastMessageAt: 'desc' },
    })
  }

  async getThreadById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.communicationThread.findFirst({
      where,
      include: {
        project: true,
        organization: true,
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })
  }

  async createThread(input: CreateThreadInput) {
    const thread = await prisma.communicationThread.create({
      data: {
        ...input,
        type: input.type || 'general',
        participants: input.participants || [input.createdBy],
      },
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${input.organizationId}`).emit('thread:created', thread)

    return thread
  }

  async updateThread(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.communicationThread.findFirst({ where })
    if (!existing) {
      throw new Error('Thread not found')
    }

    const updated = await prisma.communicationThread.update({
      where: { id },
      data: updates,
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`thread:${id}`).emit('thread:updated', updated)

    return updated
  }

  async deleteThread(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.communicationThread.deleteMany({ where })
  }

  async getMessages(threadId: string, scopeFilter: any) {
    const thread = await prisma.communicationThread.findFirst({
      where: {
        id: threadId,
        ...(scopeFilter.organizationId && { organizationId: scopeFilter.organizationId }),
      },
    })

    if (!thread) {
      throw new Error('Thread not found')
    }

    return prisma.communicationMessage.findMany({
      where: { threadId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async sendMessage(data: {
    threadId: string
    userId: string
    content: string
    type?: string
    attachments?: string[]
  }) {
    const message = await prisma.communicationMessage.create({
      data: {
        ...data,
        type: data.type || 'text',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update thread last message time
    await prisma.communicationThread.update({
      where: { id: data.threadId },
      data: { lastMessageAt: new Date() },
    })

    return message
  }

  async updateMessage(id: string, updates: any) {
    return prisma.communicationMessage.update({
      where: { id },
      data: updates,
    })
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await prisma.communicationMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      throw new Error('Message not found')
    }

    const readBy = message.readBy || []
    if (!readBy.includes(userId)) {
      await prisma.communicationMessage.update({
        where: { id: messageId },
        data: {
          readBy: [...readBy, userId],
          readAt: {
            ...(message.readAt as any),
            [userId]: new Date(),
          },
        },
      })
    }
  }
}

export const communicationService = new CommunicationService()

