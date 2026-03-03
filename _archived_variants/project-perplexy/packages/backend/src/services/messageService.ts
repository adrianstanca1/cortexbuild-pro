import { v4 as uuidv4 } from 'uuid'
import { Message, CreateMessageRequest } from '../types/message.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const messages: Message[] = [
  {
    id: 'msg-1',
    from: 'Manchester City Council',
    to: 'admin',
    subject: 'Tender Clarification Required',
    content: 'Please provide additional details on environmental compliance.',
    date: new Date('2025-10-14'),
    read: false,
    tenderId: 'TND-2025-001',
    createdAt: new Date('2025-10-14'),
    updatedAt: new Date('2025-10-14'),
  },
  {
    id: 'msg-2',
    from: 'Transport for London',
    to: 'admin',
    subject: 'Submission Confirmation',
    content: 'Your tender submission has been received and is under review.',
    date: new Date('2025-10-13'),
    read: true,
    tenderId: 'TND-2025-002',
    createdAt: new Date('2025-10-13'),
    updatedAt: new Date('2025-10-13'),
  },
]

export const messageService = {
  async getMessages(userId?: string): Promise<Message[]> {
    let filteredMessages = messages
    if (userId) {
      filteredMessages = messages.filter((m) => m.to === userId || m.from === userId)
    }
    return filteredMessages.sort((a, b) => b.date.getTime() - a.date.getTime())
  },

  async getMessage(messageId: string): Promise<Message | null> {
    return messages.find((m) => m.id === messageId) || null
  },

  async createMessage(message: CreateMessageRequest): Promise<Message> {
    if (!message.to || !message.subject || !message.content) {
      throw new ApiError('Missing required fields', 400)
    }
    
    if (!message.from) {
      throw new ApiError('Sender (from) is required', 400)
    }

    const newMessage: Message = {
      id: uuidv4(),
      from: message.from,
      to: message.to,
      subject: message.subject,
      content: message.content,
      date: new Date(),
      read: false,
      tenderId: message.tenderId,
      contractId: message.contractId,
      projectId: message.projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    messages.push(newMessage)
    return newMessage
  },

  async markAsRead(messageId: string): Promise<void> {
    const message = messages.find((m) => m.id === messageId)
    if (!message) {
      throw new ApiError('Message not found', 404)
    }
    message.read = true
    message.updatedAt = new Date()
  },

  async deleteMessage(messageId: string): Promise<void> {
    const index = messages.findIndex((m) => m.id === messageId)
    if (index === -1) {
      throw new ApiError('Message not found', 404)
    }
    messages.splice(index, 1)
  },

  async getMessageStats(userId?: string): Promise<{
    total: number
    unread: number
    tenderRelated: number
    thisWeek: number
  }> {
    let filteredMessages = messages
    if (userId) {
      filteredMessages = messages.filter((m) => m.to === userId || m.from === userId)
    }

    const total = filteredMessages.length
    const unread = filteredMessages.filter((m) => !m.read).length
    const tenderRelated = filteredMessages.filter((m) => m.tenderId).length
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek = filteredMessages.filter((m) => m.date >= weekAgo).length

    return {
      total,
      unread,
      tenderRelated,
      thisWeek,
    }
  },
}

