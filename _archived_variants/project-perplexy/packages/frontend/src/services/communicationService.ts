/**
 * Communication Service
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class CommunicationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async getThreads(filters?: any) {
    const response = await axios.get(`${API_URL}/api/collaboration/rooms`, {
      headers: this.getAuthHeaders(),
      params: filters,
    })
    return response.data
  }

  async getMessages(threadId: string) {
    const response = await axios.get(
      `${API_URL}/api/collaboration/rooms/${threadId}/messages`,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async sendMessage(data: { threadId: string; content: string; attachments?: string[] }) {
    const response = await axios.post(
      `${API_URL}/api/collaboration/rooms/${data.threadId}/messages`,
      {
        content: data.content,
        attachments: data.attachments || [],
      },
      { headers: this.getAuthHeaders() }
    )
    return response.data.message
  }

  async markAsRead(threadId: string, messageId: string) {
    const response = await axios.post(
      `${API_URL}/api/collaboration/rooms/${threadId}/messages/${messageId}/read`,
      {},
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async createThread(data: { title: string; projectId?: string; participants?: string[] }) {
    const response = await axios.post(
      `${API_URL}/api/collaboration/rooms`,
      data,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }
}

export const communicationService = new CommunicationService()
