import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface Message {
  id: string
  from: string
  to: string
  subject: string
  content: string
  date: Date
  read: boolean
  tenderId?: string
  contractId?: string
  projectId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMessageRequest {
  from?: string
  to: string
  subject: string
  content: string
  tenderId?: string
  contractId?: string
  projectId?: string
}

export interface MessageStats {
  total: number
  unread: number
  tenderRelated: number
  thisWeek: number
}

function parseMessage(message: any): Message {
  return {
    ...message,
    date: new Date(message.date),
    createdAt: new Date(message.createdAt),
    updatedAt: new Date(message.updatedAt),
  }
}

export const messageService = {
  async getMessages(userId?: string): Promise<Message[]> {
    const params = userId ? { userId } : {}
    const response = await axios.get(`${API_URL}/api/messages`, { params })
    return response.data.messages.map(parseMessage)
  },

  async getMessage(messageId: string): Promise<Message> {
    const response = await axios.get(`${API_URL}/api/messages/${messageId}`)
    return parseMessage(response.data.message)
  },

  async createMessage(message: CreateMessageRequest): Promise<Message> {
    const response = await axios.post(`${API_URL}/api/messages`, message)
    return parseMessage(response.data.message)
  },

  async markAsRead(messageId: string): Promise<void> {
    await axios.put(`${API_URL}/api/messages/${messageId}/read`)
  },

  async deleteMessage(messageId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/messages/${messageId}`)
  },

  async getMessageStats(userId?: string): Promise<MessageStats> {
    const params = userId ? { userId } : {}
    const response = await axios.get(`${API_URL}/api/messages/stats`, { params })
    return response.data.stats
  },
}

