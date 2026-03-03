import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface Supplier {
  id: string
  name: string
  category: string
  rating: number
  activeContracts: number
  totalValue: number
  lastActivity: Date
  status: 'verified' | 'active' | 'pending'
  contact: {
    email: string
    phone: string
    address: string
  }
  qualifications: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateSupplierRequest {
  name: string
  category: string
  contact: {
    email: string
    phone: string
    address: string
  }
  qualifications?: string[]
}

export interface UpdateSupplierRequest {
  name?: string
  category?: string
  rating?: number
  status?: 'verified' | 'active' | 'pending'
  contact?: {
    email?: string
    phone?: string
    address?: string
  }
  qualifications?: string[]
}

export interface SupplierStats {
  total: number
  verified: number
  active: number
  totalContracts: number
  totalValue: number
}

function parseSupplier(supplier: any): Supplier {
  return {
    ...supplier,
    lastActivity: new Date(supplier.lastActivity),
    createdAt: new Date(supplier.createdAt),
    updatedAt: new Date(supplier.updatedAt),
  }
}

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await axios.get(`${API_URL}/api/suppliers`)
    return response.data.suppliers.map(parseSupplier)
  },

  async getSupplier(supplierId: string): Promise<Supplier> {
    const response = await axios.get(`${API_URL}/api/suppliers/${supplierId}`)
    return parseSupplier(response.data.supplier)
  },

  async createSupplier(supplier: CreateSupplierRequest): Promise<Supplier> {
    const response = await axios.post(`${API_URL}/api/suppliers`, supplier)
    return parseSupplier(response.data.supplier)
  },

  async updateSupplier(supplierId: string, updates: UpdateSupplierRequest): Promise<Supplier> {
    const response = await axios.put(`${API_URL}/api/suppliers/${supplierId}`, updates)
    return parseSupplier(response.data.supplier)
  },

  async deleteSupplier(supplierId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/suppliers/${supplierId}`)
  },

  async getSupplierStats(): Promise<SupplierStats> {
    const response = await axios.get(`${API_URL}/api/suppliers/stats`)
    return response.data.stats
  },
}

