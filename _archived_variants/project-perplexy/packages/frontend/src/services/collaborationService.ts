import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface CollaborationRoom {
  id: string
  name: string
  description: string
  type: 'project' | 'team' | 'general'
  projectId?: string
  members: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CollaborationMessage {
  id: string
  roomId: string
  userId: string
  userName: string
  content: string
  type: 'message' | 'file' | 'system'
  fileUrl?: string
  createdAt: Date
}

export interface CreateCollaborationRoomRequest {
  name: string
  description: string
  type: 'project' | 'team' | 'general'
  projectId?: string
  members?: string[]
}

export interface UpdateCollaborationRoomRequest {
  name?: string
  description?: string
  members?: string[]
}

export interface CreateCollaborationMessageRequest {
  roomId: string
  userId: string
  userName: string
  content: string
  type?: 'message' | 'file' | 'system'
  fileUrl?: string
}

export interface CollaborationStats {
  totalRooms: number
  totalMessages: number
  activeRooms: number
}

function parseCollaborationRoom(room: any): CollaborationRoom {
  return {
    ...room,
    createdAt: new Date(room.createdAt),
    updatedAt: new Date(room.updatedAt),
  }
}

function parseCollaborationMessage(message: any): CollaborationMessage {
  return {
    ...message,
    createdAt: new Date(message.createdAt),
  }
}

export const collaborationService = {
  async getRooms(userId?: string): Promise<CollaborationRoom[]> {
    const params = userId ? { userId } : {}
    const response = await axios.get(`${API_URL}/api/collaboration/rooms`, { params })
    return response.data.rooms.map(parseCollaborationRoom)
  },

  async getRoom(roomId: string): Promise<CollaborationRoom> {
    const response = await axios.get(`${API_URL}/api/collaboration/rooms/${roomId}`)
    return parseCollaborationRoom(response.data.room)
  },

  async createRoom(room: CreateCollaborationRoomRequest): Promise<CollaborationRoom> {
    const response = await axios.post(`${API_URL}/api/collaboration/rooms`, room)
    return parseCollaborationRoom(response.data.room)
  },

  async updateRoom(roomId: string, updates: UpdateCollaborationRoomRequest): Promise<CollaborationRoom> {
    const response = await axios.put(`${API_URL}/api/collaboration/rooms/${roomId}`, updates)
    return parseCollaborationRoom(response.data.room)
  },

  async deleteRoom(roomId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/collaboration/rooms/${roomId}`)
  },

  async getMessages(roomId: string): Promise<CollaborationMessage[]> {
    const response = await axios.get(`${API_URL}/api/collaboration/rooms/${roomId}/messages`)
    return response.data.messages.map(parseCollaborationMessage)
  },

  async createMessage(message: CreateCollaborationMessageRequest): Promise<CollaborationMessage> {
    const response = await axios.post(`${API_URL}/api/collaboration/messages`, message)
    return parseCollaborationMessage(response.data.message)
  },

  async getCollaborationStats(): Promise<CollaborationStats> {
    const response = await axios.get(`${API_URL}/api/collaboration/stats`)
    return response.data.stats
  },
}

