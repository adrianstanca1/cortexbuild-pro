import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calculator, FileText, Search } from 'lucide-react'
import { costEstimatorService, CostEstimate, CreateCostEstimateRequest, UpdateCostEstimateRequest, CostCategory, CostItem, CostEstimatorStats } from '../services/costEstimatorService'
import toast from 'react-hot-toast'

export default function CostEstimatorPage() {
  const [estimates, setEstimates] = useState<CostEstimate[]>([])
  const [stats, setStats] = useState<CostEstimatorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEstimate, setSelectedEstimate] = useState<CostEstimate | null>(null)

  useEffect(() => {
    loadEstimates()
    loadStats()
  }, [])

  const loadEstimates = async () => {
    try {
      setLoading(true)
      const data = await costEstimatorService.getCostEstimates()
      setEstimates(data)
    } catch (error) {
      toast.error('Failed to load cost estimates')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await costEstimatorService.getCostEstimatorStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = () => {
    setSelectedEstimate(null)
    setIsModalOpen(true)
  }

  const handleEdit = (estimate: CostEstimate) => {
    setSelectedEstimate(estimate)
    setIsModalOpen(true)
  }

  const handleDelete = async (estimateId: string) => {
    if (!confirm('Are you sure you want to delete this cost estimate?')) return

    try {
      await costEstimatorService.deleteCostEstimate(estimateId)
      toast.success('Cost estimate deleted successfully')
      loadEstimates()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete cost estimate')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateCostEstimateRequest | UpdateCostEstimateRequest) => {
    try {
      if (selectedEstimate) {
        await costEstimatorService.updateCostEstimate(selectedEstimate.id, formData as UpdateCostEstimateRequest)
        toast.success('Cost estimate updated successfully')
      } else {
        await costEstimatorService.createCostEstimate(formData as CreateCostEstimateRequest)
        toast.success('Cost estimate created successfully')
      }
      setIsModalOpen(false)
      setSelectedEstimate(null)
      loadEstimates()
      loadStats()
    } catch (error) {
      toast.error(selectedEstimate ? 'Failed to update cost estimate' : 'Failed to create cost estimate')
      console.error(error)
    }
  }

  const filteredEstimates = estimates.filter((estimate) => {
    const matchesSearch =
      estimate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || estimate.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cost estimates...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Cost Estimator</h1>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          New Estimate
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Estimates</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
              placeholder="Search cost estimates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Markup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEstimates.map((estimate) => (
                <tr key={estimate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{estimate.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{estimate.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimate.categories.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{(estimate.totalCost / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimate.markup}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">£{(estimate.finalPrice / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(estimate.status)}`}>
                      {estimate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(estimate)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(estimate.id)}
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
          {filteredEstimates.length === 0 && (
            <div className="text-center py-8 text-gray-500">No cost estimates found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CostEstimateModal
          estimate={selectedEstimate}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedEstimate(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function CostEstimateModal({
  estimate,
  onClose,
  onSubmit,
}: {
  estimate: CostEstimate | null
  onClose: () => void
  onSubmit: (data: CreateCostEstimateRequest | UpdateCostEstimateRequest) => void
}) {
  const [formData, setFormData] = useState<CreateCostEstimateRequest | UpdateCostEstimateRequest>({
    name: estimate?.name || '',
    description: estimate?.description || '',
    categories: estimate?.categories || [
      {
        id: 'cat-1',
        name: 'Materials',
        items: [],
        subtotal: 0,
      },
    ],
    markup: estimate?.markup || 15,
  } as CreateCostEstimateRequest)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{estimate ? 'Edit Cost Estimate' : 'New Cost Estimate'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Markup (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.markup}
              onChange={(e) => setFormData({ ...formData, markup: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
              required
            />
          </div>
          <div className="text-sm text-gray-500">
            Categories: {formData.categories?.length || 0} | Items: {formData.categories?.reduce((sum, cat) => sum + cat.items.length, 0) || 0}
          </div>
          {estimate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={(formData as UpdateCostEstimateRequest).status || estimate.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {estimate ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

