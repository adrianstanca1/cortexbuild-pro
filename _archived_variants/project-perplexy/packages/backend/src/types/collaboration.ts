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

