import { v4 as uuidv4 } from 'uuid'
import {
  CollaborationRoom,
  CreateCollaborationRoomRequest,
  UpdateCollaborationRoomRequest,
  CollaborationMessage,
  CreateCollaborationMessageRequest,
} from '../types/collaboration.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const collaborationRooms: CollaborationRoom[] = [
  {
    id: 'room-1',
    name: 'Manchester Project Team',
    description: 'Discussion room for Manchester Commercial Development project',
    type: 'project',
    projectId: 'project-1',
    members: ['user-1', 'user-2', 'user-3'],
    createdBy: 'user-1',
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-10-14'),
  },
  {
    id: 'room-2',
    name: 'General Discussion',
    description: 'General team discussion room',
    type: 'general',
    members: ['user-1', 'user-2', 'user-3', 'user-4'],
    createdBy: 'user-1',
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-10-13'),
  },
]

const collaborationMessages: CollaborationMessage[] = [
  {
    id: 'msg-1',
    roomId: 'room-1',
    userId: 'user-1',
    userName: 'Sarah Mitchell',
    content: 'Welcome to the Manchester Project team room!',
    type: 'message',
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'msg-2',
    roomId: 'room-1',
    userId: 'user-2',
    userName: 'James Wilson',
    content: 'Thanks for adding me to the team!',
    type: 'message',
    createdAt: new Date('2025-09-02'),
  },
]

export const collaborationService = {
  async getRooms(userId?: string): Promise<CollaborationRoom[]> {
    let filteredRooms = collaborationRooms
    if (userId) {
      filteredRooms = collaborationRooms.filter((r) => r.members.includes(userId))
    }
    return filteredRooms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  },

  async getRoom(roomId: string): Promise<CollaborationRoom | null> {
    return collaborationRooms.find((r) => r.id === roomId) || null
  },

  async createRoom(room: CreateCollaborationRoomRequest, createdBy: string): Promise<CollaborationRoom> {
    if (!room.name || !room.description || !room.type) {
      throw new ApiError('Missing required fields', 400)
    }

    const newRoom: CollaborationRoom = {
      id: uuidv4(),
      name: room.name,
      description: room.description,
      type: room.type,
      projectId: room.projectId,
      members: room.members || [createdBy],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    collaborationRooms.push(newRoom)
    return newRoom
  },

  async updateRoom(roomId: string, updates: UpdateCollaborationRoomRequest): Promise<CollaborationRoom> {
    const room = collaborationRooms.find((r) => r.id === roomId)
    if (!room) {
      throw new ApiError('Room not found', 404)
    }

    if (updates.name) room.name = updates.name
    if (updates.description) room.description = updates.description
    if (updates.members) room.members = updates.members

    room.updatedAt = new Date()
    return room
  },

  async deleteRoom(roomId: string): Promise<void> {
    const index = collaborationRooms.findIndex((r) => r.id === roomId)
    if (index === -1) {
      throw new ApiError('Room not found', 404)
    }
    collaborationRooms.splice(index, 1)
    // Also delete all messages in this room
    const messageIndices = collaborationMessages
      .map((m, i) => (m.roomId === roomId ? i : -1))
      .filter((i) => i !== -1)
      .reverse()
    messageIndices.forEach((i) => collaborationMessages.splice(i, 1))
  },

  async getMessages(roomId: string): Promise<CollaborationMessage[]> {
    return collaborationMessages
      .filter((m) => m.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  },

  async createMessage(message: CreateCollaborationMessageRequest): Promise<CollaborationMessage> {
    if (!message.roomId || !message.userId || !message.content) {
      throw new ApiError('Missing required fields', 400)
    }

    const room = collaborationRooms.find((r) => r.id === message.roomId)
    if (!room) {
      throw new ApiError('Room not found', 404)
    }

    const newMessage: CollaborationMessage = {
      id: uuidv4(),
      roomId: message.roomId,
      userId: message.userId,
      userName: message.userName,
      content: message.content,
      type: message.type || 'message',
      fileUrl: message.fileUrl,
      createdAt: new Date(),
    }

    collaborationMessages.push(newMessage)
    room.updatedAt = new Date()
    return newMessage
  },

  async getCollaborationStats(): Promise<{
    totalRooms: number
    totalMessages: number
    activeRooms: number
  }> {
    const totalRooms = collaborationRooms.length
    const totalMessages = collaborationMessages.length
    const activeRooms = collaborationRooms.filter((r) => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return r.updatedAt >= oneWeekAgo
    }).length

    return {
      totalRooms,
      totalMessages,
      activeRooms,
    }
  },
}

