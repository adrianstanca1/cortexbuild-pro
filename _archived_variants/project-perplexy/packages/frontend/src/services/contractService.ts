import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

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
  type?: string
  renewalDate: string
  keyTerms?: string[]
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

export interface ContractStats {
  total: number
  active: number
  pending: number
  expired: number
  needRenewal: number
  totalValue: number
}

function parseContract(contract: any): Contract {
  return {
    ...contract,
    startDate: new Date(contract.startDate),
    endDate: new Date(contract.endDate),
    renewalDate: new Date(contract.renewalDate),
    createdAt: new Date(contract.createdAt),
    updatedAt: new Date(contract.updatedAt),
  }
}

export const contractService = {
  async getContracts(): Promise<Contract[]> {
    const response = await axios.get(`${API_URL}/api/contracts`)
    return response.data.contracts.map(parseContract)
  },

  async getContract(contractId: string): Promise<Contract> {
    const response = await axios.get(`${API_URL}/api/contracts/${contractId}`)
    return parseContract(response.data.contract)
  },

  async createContract(contract: CreateContractRequest): Promise<Contract> {
    const response = await axios.post(`${API_URL}/api/contracts`, contract)
    return parseContract(response.data.contract)
  },

  async updateContract(contractId: string, updates: UpdateContractRequest): Promise<Contract> {
    const response = await axios.put(`${API_URL}/api/contracts/${contractId}`, updates)
    return parseContract(response.data.contract)
  },

  async deleteContract(contractId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/contracts/${contractId}`)
  },

  async getContractStats(): Promise<ContractStats> {
    const response = await axios.get(`${API_URL}/api/contracts/stats`)
    return response.data.stats
  },
}

