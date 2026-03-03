export interface Contract {
  id: string
  title: string
  supplier: string
  value: number
  startDate: Date
  endDate: Date
  status: 'active' | 'pending' | 'expired' | 'renewal'
  progress: number
  type: string
  renewalDate: Date
  keyTerms: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateContractRequest {
  title: string
  supplier: string
  value: number
  startDate: string
  endDate: string
  type: string
  renewalDate: string
  keyTerms: string[]
}

export interface UpdateContractRequest {
  title?: string
  supplier?: string
  value?: number
  startDate?: string
  endDate?: string
  status?: 'active' | 'pending' | 'expired' | 'renewal'
  progress?: number
  type?: string
  renewalDate?: string
  keyTerms?: string[]
}

