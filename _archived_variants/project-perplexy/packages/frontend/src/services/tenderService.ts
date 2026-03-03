import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

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
  assignedTo?: string
  category?: string
  requirements?: string[]
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

export interface TenderStats {
  total: number
  active: number
  submitted: number
  won: number
  lost: number
  totalValue: number
  avgWinProbability: number
}

function parseTender(tender: any): Tender {
  return {
    ...tender,
    deadline: new Date(tender.deadline),
    submissionDate: tender.submissionDate ? new Date(tender.submissionDate) : undefined,
    createdAt: new Date(tender.createdAt),
    updatedAt: new Date(tender.updatedAt),
  }
}

export const tenderService = {
  async getTenders(): Promise<Tender[]> {
    const response = await axios.get(`${API_URL}/api/tenders`)
    return response.data.tenders.map(parseTender)
  },

  async getTender(tenderId: string): Promise<Tender> {
    const response = await axios.get(`${API_URL}/api/tenders/${tenderId}`)
    return parseTender(response.data.tender)
  },

  async createTender(tender: CreateTenderRequest): Promise<Tender> {
    const response = await axios.post(`${API_URL}/api/tenders`, tender)
    return parseTender(response.data.tender)
  },

  async updateTender(tenderId: string, updates: UpdateTenderRequest): Promise<Tender> {
    const response = await axios.put(`${API_URL}/api/tenders/${tenderId}`, updates)
    return parseTender(response.data.tender)
  },

  async deleteTender(tenderId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/tenders/${tenderId}`)
  },

  async getTenderStats(): Promise<TenderStats> {
    const response = await axios.get(`${API_URL}/api/tenders/stats`)
    return response.data.stats
  },
}

