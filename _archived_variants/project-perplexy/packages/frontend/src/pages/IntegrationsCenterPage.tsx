import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, RefreshCw, Search, Filter, Plug, CheckCircle, XCircle } from 'lucide-react'
import { integrationsService, Integration, IntegrationProvider, CreateIntegrationRequest, UpdateIntegrationRequest, IntegrationsStats } from '../services/integrationsService'
import toast from 'react-hot-toast'

export default function IntegrationsCenterPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [providers, setProviders] = useState<IntegrationProvider[]>([])
  const [stats, setStats] = useState<IntegrationsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null)

  useEffect(() => {
    loadIntegrations()
    loadProviders()
    loadStats()
  }, [])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const data = await integrationsService.getIntegrations()
      setIntegrations(data)
    } catch (error) {
      toast.error('Failed to load integrations')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const data = await integrationsService.getProviders()
      setProviders(data)
    } catch (error) {
      console.error('Failed to load providers', error)
    }
  }

  const loadStats = async () => {
    try {
      const data = await integrationsService.getIntegrationsStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = (provider?: IntegrationProvider) => {
    setSelectedProvider(provider || null)
    setSelectedIntegration(null)
    setIsProviderModalOpen(true)
  }

  const handleEdit = (integration: Integration) => {
    setSelectedIntegration(integration)
    setIsModalOpen(true)
  }

  const handleSync = async (integrationId: string) => {
    try {
      await integrationsService.syncIntegration(integrationId)
      toast.success('Integration synced successfully')
      loadIntegrations()
      loadStats()
    } catch (error) {
      toast.error('Failed to sync integration')
      console.error(error)
    }
  }

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return

    try {
      await integrationsService.deleteIntegration(integrationId)
      toast.success('Integration deleted successfully')
      loadIntegrations()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete integration')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateIntegrationRequest | UpdateIntegrationRequest) => {
    try {
      if (selectedIntegration) {
        await integrationsService.updateIntegration(selectedIntegration.id, formData as UpdateIntegrationRequest)
        toast.success('Integration updated successfully')
      } else {
        await integrationsService.createIntegration(formData as CreateIntegrationRequest)
        toast.success('Integration created successfully')
      }
      setIsModalOpen(false)
      setIsProviderModalOpen(false)
      setSelectedIntegration(null)
      setSelectedProvider(null)
      loadIntegrations()
      loadStats()
    } catch (error) {
      toast.error(selectedIntegration ? 'Failed to update integration' : 'Failed to create integration')
      console.error(error)
    }
  }

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.provider.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || integration.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading integrations...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Plug className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Integrations Center</h1>
        </div>
        <button
          onClick={() => handleCreate()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-5 h-5" />
          New Integration
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Integrations</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Syncs</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalSyncs}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Providers</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCreate(provider)}
            >
              <div className="font-bold text-gray-900 mb-2">{provider.name}</div>
              <div className="text-sm text-gray-500 mb-2">{provider.description}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {provider.category}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                  {provider.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Syncs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sync</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIntegrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{integration.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{integration.provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{integration.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{integration.syncCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {integration.lastSync ? integration.lastSync.toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSync(integration.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Sync"
                        disabled={integration.status !== 'active'}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(integration)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(integration.id)}
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
          {filteredIntegrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">No integrations found</div>
          )}
        </div>
      </div>

      {isModalOpen && selectedIntegration && (
        <IntegrationModal
          integration={selectedIntegration}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedIntegration(null)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {isProviderModalOpen && (
        <ProviderModal
          provider={selectedProvider}
          onClose={() => {
            setIsProviderModalOpen(false)
            setSelectedProvider(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function IntegrationModal({
  integration,
  onClose,
  onSubmit,
}: {
  integration: Integration
  onClose: () => void
  onSubmit: (data: UpdateIntegrationRequest) => void
}) {
  const [formData, setFormData] = useState<UpdateIntegrationRequest>({
    name: integration.name,
    description: integration.description,
    status: integration.status,
    config: integration.config,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Integration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="error">Error</option>
            </select>
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProviderModal({
  provider,
  onClose,
  onSubmit,
}: {
  provider: IntegrationProvider | null
  onClose: () => void
  onSubmit: (data: CreateIntegrationRequest) => void
}) {
  const [formData, setFormData] = useState<CreateIntegrationRequest>({
    name: provider?.name || '',
    description: provider?.description || '',
    type: provider?.type || 'api',
    provider: provider?.name || '',
    config: {},
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Integration: {provider?.name || 'New'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div className="text-sm text-gray-500">
            Provider: {provider?.name || 'Custom'} | Type: {provider?.type || 'api'}
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

