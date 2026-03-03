import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Filter, Search } from 'lucide-react'
import { tenderService, Tender, CreateTenderRequest, UpdateTenderRequest, TenderStats } from '../services/tenderService'
import toast from 'react-hot-toast'

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [stats, setStats] = useState<TenderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewTender, setViewTender] = useState<Tender | null>(null)

  useEffect(() => {
    loadTenders()
    loadStats()
  }, [])

  const loadTenders = async () => {
    try {
      setLoading(true)
      const data = await tenderService.getTenders()
      setTenders(data)
    } catch (error) {
      toast.error('Failed to load tenders')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await tenderService.getTenderStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = () => {
    setSelectedTender(null)
    setIsModalOpen(true)
  }

  const handleEdit = (tender: Tender) => {
    setSelectedTender(tender)
    setIsModalOpen(true)
  }

  const handleView = async (tender: Tender) => {
    try {
      const fullTender = await tenderService.getTender(tender.id)
      setViewTender(fullTender)
      setIsViewModalOpen(true)
    } catch (error) {
      toast.error('Failed to load tender details')
      console.error(error)
    }
  }

  const handleDelete = async (tenderId: string) => {
    if (!confirm('Are you sure you want to delete this tender?')) return

    try {
      await tenderService.deleteTender(tenderId)
      toast.success('Tender deleted successfully')
      loadTenders()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete tender')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateTenderRequest | UpdateTenderRequest) => {
    try {
      if (selectedTender) {
        await tenderService.updateTender(selectedTender.id, formData as UpdateTenderRequest)
        toast.success('Tender updated successfully')
      } else {
        await tenderService.createTender(formData as CreateTenderRequest)
        toast.success('Tender created successfully')
      }
      setIsModalOpen(false)
      setSelectedTender(null)
      loadTenders()
      loadStats()
    } catch (error) {
      toast.error(selectedTender ? 'Failed to update tender' : 'Failed to create tender')
      console.error(error)
    }
  }

  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'won':
        return 'bg-green-100 text-green-800'
      case 'lost':
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
        <div className="text-gray-500">Loading tenders...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tenders</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Tender
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Tenders</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Submitted</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-green-600">£{(stats.totalValue / 1000000).toFixed(1)}M</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tenders..."
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
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="submitted">Submitted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Probability</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenders.map((tender) => (
                <tr key={tender.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tender.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tender.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tender.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{(tender.value / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tender.deadline.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tender.status)}`}>
                      {tender.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tender.winProbability}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${tender.progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(tender)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(tender)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tender.id)}
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
          {filteredTenders.length === 0 && (
            <div className="text-center py-8 text-gray-500">No tenders found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <TenderModal
          tender={selectedTender}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedTender(null)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {isViewModalOpen && viewTender && (
        <ViewTenderModal
          tender={viewTender}
          onClose={() => {
            setIsViewModalOpen(false)
            setViewTender(null)
          }}
        />
      )}
    </div>
  )
}

function TenderModal({
  tender,
  onClose,
  onSubmit,
}: {
  tender: Tender | null
  onClose: () => void
  onSubmit: (data: CreateTenderRequest | UpdateTenderRequest) => void
}) {
  const [formData, setFormData] = useState<CreateTenderRequest | UpdateTenderRequest>({
    title: tender?.title || '',
    client: tender?.client || '',
    value: tender?.value || 0,
    deadline: tender?.deadline.toISOString().split('T')[0] || '',
    assignedTo: tender?.assignedTo || '',
    category: tender?.category || '',
    requirements: tender?.requirements || [],
  } as CreateTenderRequest)

  const [requirement, setRequirement] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addRequirement = () => {
    if (requirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...(formData.requirements || []), requirement.trim()],
      })
      setRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{tender ? 'Edit Tender' : 'New Tender'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value (£)</label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRequirement()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add requirement"
              />
              <button
                type="button"
                onClick={addRequirement}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requirements?.map((req, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {req}
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
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
              {tender ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewTenderModal({ tender, onClose }: { tender: Tender; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Tender Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID</label>
            <div className="mt-1 text-sm text-gray-900">{tender.id}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <div className="mt-1 text-sm text-gray-900">{tender.title}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Client</label>
            <div className="mt-1 text-sm text-gray-900">{tender.client}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Value</label>
              <div className="mt-1 text-sm text-gray-900">£{(tender.value / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <div className="mt-1 text-sm text-gray-900">{tender.deadline.toLocaleDateString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1 text-sm text-gray-900">{tender.status}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Win Probability</label>
              <div className="mt-1 text-sm text-gray-900">{tender.winProbability}%</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Requirements</label>
            <div className="mt-1">
              <ul className="list-disc list-inside space-y-1">
                {tender.requirements.map((req, index) => (
                  <li key={index} className="text-sm text-gray-900">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Progress</label>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${tender.progress}%` }}
              />
            </div>
            <div className="mt-1 text-sm text-gray-900">{tender.progress}%</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

