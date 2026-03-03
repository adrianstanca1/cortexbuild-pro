import { v4 as uuidv4 } from 'uuid'
import { Tender, CreateTenderRequest, UpdateTenderRequest } from '../types/tender.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const tenders: Tender[] = [
  {
    id: 'TND-2025-001',
    title: 'Manchester Commercial Development',
    client: 'Manchester City Council',
    value: 2400000,
    deadline: new Date('2025-11-15'),
    status: 'active',
    winProbability: 75,
    submissionDate: new Date('2025-10-01'),
    assignedTo: 'Sarah Mitchell',
    category: 'Commercial',
    requirements: ['Planning Permission', 'Environmental Assessment', 'Traffic Impact Study'],
    progress: 45,
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-10-14'),
  },
  {
    id: 'TND-2025-002',
    title: 'London Bridge Infrastructure',
    client: 'Transport for London',
    value: 5600000,
    deadline: new Date('2025-12-01'),
    status: 'submitted',
    winProbability: 60,
    submissionDate: new Date('2025-09-15'),
    assignedTo: 'James Wilson',
    category: 'Infrastructure',
    requirements: ['Safety Certification', 'Quality Assurance', 'Timeline Compliance'],
    progress: 100,
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-09-15'),
  },
  {
    id: 'TND-2025-003',
    title: 'Edinburgh Housing Project',
    client: 'Edinburgh Council',
    value: 3200000,
    deadline: new Date('2025-10-30'),
    status: 'draft',
    winProbability: 85,
    assignedTo: 'Emma Thompson',
    category: 'Residential',
    requirements: ['Building Regulations', 'Fire Safety', 'Accessibility Compliance'],
    progress: 25,
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-10-10'),
  },
]

export const tenderService = {
  async getTenders(): Promise<Tender[]> {
    return tenders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async getTender(tenderId: string): Promise<Tender | null> {
    return tenders.find((t) => t.id === tenderId) || null
  },

  async createTender(tender: CreateTenderRequest): Promise<Tender> {
    if (!tender.title || !tender.client || !tender.value || !tender.deadline) {
      throw new ApiError('Missing required fields', 400)
    }

    const newTender: Tender = {
      id: uuidv4(),
      title: tender.title,
      client: tender.client,
      value: tender.value,
      deadline: new Date(tender.deadline),
      status: 'draft',
      winProbability: 0,
      assignedTo: tender.assignedTo || 'Unassigned',
      category: tender.category || 'General',
      requirements: tender.requirements || [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    tenders.push(newTender)
    return newTender
  },

  async updateTender(tenderId: string, updates: UpdateTenderRequest): Promise<Tender> {
    const tender = tenders.find((t) => t.id === tenderId)
    if (!tender) {
      throw new ApiError('Tender not found', 404)
    }

    if (updates.deadline) tender.deadline = new Date(updates.deadline)
    if (updates.submissionDate) tender.submissionDate = new Date(updates.submissionDate)
    if (updates.title) tender.title = updates.title
    if (updates.client) tender.client = updates.client
    if (updates.value !== undefined) tender.value = updates.value
    if (updates.status) tender.status = updates.status
    if (updates.winProbability !== undefined) tender.winProbability = updates.winProbability
    if (updates.assignedTo) tender.assignedTo = updates.assignedTo
    if (updates.category) tender.category = updates.category
    if (updates.requirements) tender.requirements = updates.requirements
    if (updates.progress !== undefined) tender.progress = updates.progress

    tender.updatedAt = new Date()
    return tender
  },

  async deleteTender(tenderId: string): Promise<void> {
    const index = tenders.findIndex((t) => t.id === tenderId)
    if (index === -1) {
      throw new ApiError('Tender not found', 404)
    }
    tenders.splice(index, 1)
  },

  async getTenderStats(): Promise<{
    total: number
    active: number
    submitted: number
    won: number
    lost: number
    totalValue: number
    avgWinProbability: number
  }> {
    const total = tenders.length
    const active = tenders.filter((t) => t.status === 'active').length
    const submitted = tenders.filter((t) => t.status === 'submitted').length
    const won = tenders.filter((t) => t.status === 'won').length
    const lost = tenders.filter((t) => t.status === 'lost').length
    const totalValue = tenders.reduce((sum, t) => sum + t.value, 0)
    const avgWinProbability =
      tenders.length > 0
        ? tenders.reduce((sum, t) => sum + t.winProbability, 0) / tenders.length
        : 0

    return {
      total,
      active,
      submitted,
      won,
      lost,
      totalValue,
      avgWinProbability,
    }
  },
}

