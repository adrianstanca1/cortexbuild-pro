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
  qualifications: string[]
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

