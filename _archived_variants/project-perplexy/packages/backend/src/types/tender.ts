export interface Tender {
  id: string
  title: string
  client: string
  value: number
  deadline: Date
  status: 'draft' | 'active' | 'submitted' | 'won' | 'lost'
  winProbability: number
  submissionDate?: Date
  assignedTo: string
  category: string
  requirements: string[]
  progress: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateTenderRequest {
  title: string
  client: string
  value: number
  deadline: string
  assignedTo: string
  category: string
  requirements: string[]
}

export interface UpdateTenderRequest {
  title?: string
  client?: string
  value?: number
  deadline?: string
  status?: 'draft' | 'active' | 'submitted' | 'won' | 'lost'
  winProbability?: number
  submissionDate?: string
  assignedTo?: string
  category?: string
  requirements?: string[]
  progress?: number
}

