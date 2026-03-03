import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Filter, Search, Star } from 'lucide-react'
import { supplierService, Supplier, CreateSupplierRequest, UpdateSupplierRequest, SupplierStats } from '../services/supplierService'
import toast from 'react-hot-toast'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stats, setStats] = useState<SupplierStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    loadSuppliers()
    loadStats()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const data = await supplierService.getSuppliers()
      setSuppliers(data)
    } catch (error) {
      toast.error('Failed to load suppliers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await supplierService.getSupplierStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = () => {
    setSelectedSupplier(null)
    setIsModalOpen(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsModalOpen(true)
  }

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    try {
      await supplierService.deleteSupplier(supplierId)
      toast.success('Supplier deleted successfully')
      loadSuppliers()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete supplier')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateSupplierRequest | UpdateSupplierRequest) => {
    try {
      if (selectedSupplier) {
        await supplierService.updateSupplier(selectedSupplier.id, formData as UpdateSupplierRequest)
        toast.success('Supplier updated successfully')
      } else {
        await supplierService.createSupplier(formData as CreateSupplierRequest)
        toast.success('Supplier created successfully')
      }
      setIsModalOpen(false)
      setSelectedSupplier(null)
      loadSuppliers()
      loadStats()
    } catch (error) {
      toast.error(selectedSupplier ? 'Failed to update supplier' : 'Failed to create supplier')
      console.error(error)
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading suppliers...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Supplier
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Suppliers</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Verified</div>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Contracts</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalContracts}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-green-600">£{(stats.totalValue / 1000).toFixed(0)}k</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Contracts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-900">{supplier.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(supplier.status)}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.activeContracts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{(supplier.totalValue / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contact.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No suppliers found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <SupplierModal
          supplier={selectedSupplier}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSupplier(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function SupplierModal({
  supplier,
  onClose,
  onSubmit,
}: {
  supplier: Supplier | null
  onClose: () => void
  onSubmit: (data: CreateSupplierRequest | UpdateSupplierRequest) => void
}) {
  const [formData, setFormData] = useState<CreateSupplierRequest | UpdateSupplierRequest>({
    name: supplier?.name || '',
    category: supplier?.category || '',
    contact: {
      email: supplier?.contact.email || '',
      phone: supplier?.contact.phone || '',
      address: supplier?.contact.address || '',
    },
    qualifications: supplier?.qualifications || [],
  } as CreateSupplierRequest)

  const [qualification, setQualification] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addQualification = () => {
    if (qualification.trim()) {
      setFormData({
        ...formData,
        qualifications: [...(formData.qualifications || []), qualification.trim()],
      })
      setQualification('')
    }
  }

  const removeQualification = (index: number) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{supplier ? 'Edit Supplier' : 'New Supplier'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.contact?.email || ''}
              onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={formData.contact?.phone || ''}
              onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.contact?.address || ''}
              onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, address: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addQualification()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add qualification"
              />
              <button
                type="button"
                onClick={addQualification}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.qualifications?.map((qual, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {qual}
                  <button
                    type="button"
                    onClick={() => removeQualification(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {supplier ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

