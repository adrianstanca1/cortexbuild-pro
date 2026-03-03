import { v4 as uuidv4 } from 'uuid'
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/supplier.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const suppliers: Supplier[] = [
  {
    id: 'supplier-1',
    name: 'BuildTech Solutions Ltd',
    category: 'Construction Technology',
    rating: 4.8,
    activeContracts: 5,
    totalValue: 890000,
    lastActivity: new Date('2025-10-14'),
    status: 'verified',
    contact: {
      email: 'info@buildtech.co.uk',
      phone: '+44 20 1234 5678',
      address: '123 Tech Street, London',
    },
    qualifications: ['ISO 9001', 'CHAS Certified', 'SafeContractor'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2025-10-14'),
  },
  {
    id: 'supplier-2',
    name: 'Northern Steel Supplies',
    category: 'Materials Supplier',
    rating: 4.2,
    activeContracts: 3,
    totalValue: 340000,
    lastActivity: new Date('2025-10-13'),
    status: 'active',
    contact: {
      email: 'sales@northernsteel.co.uk',
      phone: '+44 161 987 6543',
      address: '456 Industrial Way, Manchester',
    },
    qualifications: ['CE Marking', 'UKCA Certified', 'BSI Approved'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2025-10-13'),
  },
]

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    return suppliers.sort((a, b) => b.rating - a.rating)
  },

  async getSupplier(supplierId: string): Promise<Supplier | null> {
    return suppliers.find((s) => s.id === supplierId) || null
  },

  async createSupplier(supplier: CreateSupplierRequest): Promise<Supplier> {
    if (!supplier.name || !supplier.category || !supplier.contact) {
      throw new ApiError('Missing required fields', 400)
    }

    const newSupplier: Supplier = {
      id: uuidv4(),
      name: supplier.name,
      category: supplier.category,
      rating: 0,
      activeContracts: 0,
      totalValue: 0,
      lastActivity: new Date(),
      status: 'pending',
      contact: supplier.contact,
      qualifications: supplier.qualifications || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    suppliers.push(newSupplier)
    return newSupplier
  },

  async updateSupplier(supplierId: string, updates: UpdateSupplierRequest): Promise<Supplier> {
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (!supplier) {
      throw new ApiError('Supplier not found', 404)
    }

    if (updates.name) supplier.name = updates.name
    if (updates.category) supplier.category = updates.category
    if (updates.rating !== undefined) supplier.rating = updates.rating
    if (updates.status) supplier.status = updates.status
    if (updates.contact) {
      supplier.contact = {
        ...supplier.contact,
        ...updates.contact,
      }
    }
    if (updates.qualifications) supplier.qualifications = updates.qualifications

    supplier.lastActivity = new Date()
    supplier.updatedAt = new Date()
    return supplier
  },

  async deleteSupplier(supplierId: string): Promise<void> {
    const index = suppliers.findIndex((s) => s.id === supplierId)
    if (index === -1) {
      throw new ApiError('Supplier not found', 404)
    }
    suppliers.splice(index, 1)
  },

  async getSupplierStats(): Promise<{
    total: number
    verified: number
    active: number
    totalContracts: number
    totalValue: number
  }> {
    const total = suppliers.length
    const verified = suppliers.filter((s) => s.status === 'verified').length
    const active = suppliers.filter((s) => s.status === 'active').length
    const totalContracts = suppliers.reduce((sum, s) => sum + s.activeContracts, 0)
    const totalValue = suppliers.reduce((sum, s) => sum + s.totalValue, 0)

    return {
      total,
      verified,
      active,
      totalContracts,
      totalValue,
    }
  },
}

