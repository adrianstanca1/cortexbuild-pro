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

