export interface TeamMember {
  id: string
  name: string
  role: string
  rate: number
  efficiency: number
  email?: string
  phone?: string
  status?: 'active' | 'away' | 'offline'
  skills?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateTeamMemberRequest {
  name: string
  role: string
  rate: number
  email?: string
  phone?: string
  skills?: string[]
}

export interface UpdateTeamMemberRequest {
  name?: string
  role?: string
  rate?: number
  efficiency?: number
  email?: string
  phone?: string
  status?: 'active' | 'away' | 'offline'
  skills?: string[]
}

