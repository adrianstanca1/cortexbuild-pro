import { v4 as uuidv4 } from 'uuid'
import { Contract, CreateContractRequest, UpdateContractRequest } from '../types/contract.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const contracts: Contract[] = [
  {
    id: 'CNT-2025-A01',
    title: 'Annual Steel Supply Agreement',
    supplier: 'Northern Steel Supplies',
    value: 450000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'active',
    progress: 65,
    type: 'Supply Agreement',
    renewalDate: new Date('2025-11-01'),
    keyTerms: ['Monthly deliveries', 'Quality guarantees', 'Price protection'],
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2025-10-14'),
  },
  {
    id: 'CNT-2025-B02',
    title: 'Construction Equipment Lease',
    supplier: 'BuildTech Solutions Ltd',
    value: 125000,
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-08-31'),
    status: 'active',
    progress: 80,
    type: 'Equipment Lease',
    renewalDate: new Date('2025-07-01'),
    keyTerms: ['24/7 support', 'Maintenance included', 'Upgrade options'],
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-10-13'),
  },
]

export const contractService = {
  async getContracts(): Promise<Contract[]> {
    return contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async getContract(contractId: string): Promise<Contract | null> {
    return contracts.find((c) => c.id === contractId) || null
  },

  async createContract(contract: CreateContractRequest): Promise<Contract> {
    if (!contract.title || !contract.supplier || !contract.value || !contract.startDate || !contract.endDate) {
      throw new ApiError('Missing required fields', 400)
    }

    const newContract: Contract = {
      id: uuidv4(),
      title: contract.title,
      supplier: contract.supplier,
      value: contract.value,
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      status: 'pending',
      progress: 0,
      type: contract.type || 'General',
      renewalDate: new Date(contract.renewalDate),
      keyTerms: contract.keyTerms || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    contracts.push(newContract)
    return newContract
  },

  async updateContract(contractId: string, updates: UpdateContractRequest): Promise<Contract> {
    const contract = contracts.find((c) => c.id === contractId)
    if (!contract) {
      throw new ApiError('Contract not found', 404)
    }

    if (updates.title) contract.title = updates.title
    if (updates.supplier) contract.supplier = updates.supplier
    if (updates.value !== undefined) contract.value = updates.value
    if (updates.startDate) contract.startDate = new Date(updates.startDate)
    if (updates.endDate) contract.endDate = new Date(updates.endDate)
    if (updates.status) contract.status = updates.status
    if (updates.progress !== undefined) contract.progress = updates.progress
    if (updates.type) contract.type = updates.type
    if (updates.renewalDate) contract.renewalDate = new Date(updates.renewalDate)
    if (updates.keyTerms) contract.keyTerms = updates.keyTerms

    contract.updatedAt = new Date()
    return contract
  },

  async deleteContract(contractId: string): Promise<void> {
    const index = contracts.findIndex((c) => c.id === contractId)
    if (index === -1) {
      throw new ApiError('Contract not found', 404)
    }
    contracts.splice(index, 1)
  },

  async getContractStats(): Promise<{
    total: number
    active: number
    pending: number
    expired: number
    needRenewal: number
    totalValue: number
  }> {
    const total = contracts.length
    const active = contracts.filter((c) => c.status === 'active').length
    const pending = contracts.filter((c) => c.status === 'pending').length
    const expired = contracts.filter((c) => c.status === 'expired').length
    const needRenewal = contracts.filter((c) => {
      const daysUntilRenewal = Math.ceil(
        (new Date(c.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilRenewal <= 30 && daysUntilRenewal >= 0
    }).length
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0)

    return {
      total,
      active,
      pending,
      expired,
      needRenewal,
      totalValue,
    }
  },
}

