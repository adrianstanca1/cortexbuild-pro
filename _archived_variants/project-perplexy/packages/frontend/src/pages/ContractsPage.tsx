import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Filter, Search, Calendar } from 'lucide-react'
import { contractService, Contract, CreateContractRequest, UpdateContractRequest, ContractStats } from '../services/contractService'
import toast from 'react-hot-toast'

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    loadContracts()
    loadStats()
  }, [])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const data = await contractService.getContracts()
      setContracts(data)
    } catch (error) {
      toast.error('Failed to load contracts')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await contractService.getContractStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = () => {
    setSelectedContract(null)
    setIsModalOpen(true)
  }

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract)
    setIsModalOpen(true)
  }

  const handleDelete = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return

    try {
      await contractService.deleteContract(contractId)
      toast.success('Contract deleted successfully')
      loadContracts()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete contract')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateContractRequest | UpdateContractRequest) => {
    try {
      if (selectedContract) {
        await contractService.updateContract(selectedContract.id, formData as UpdateContractRequest)
        toast.success('Contract updated successfully')
      } else {
        await contractService.createContract(formData as CreateContractRequest)
        toast.success('Contract created successfully')
      }
      setIsModalOpen(false)
      setSelectedContract(null)
      loadContracts()
      loadStats()
    } catch (error) {
      toast.error(selectedContract ? 'Failed to update contract' : 'Failed to create contract')
      console.error(error)
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'renewal':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading contracts...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Contract
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Contracts</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Need Renewal</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.needRenewal}</div>
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
              placeholder="Search contracts..."
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="renewal">Renewal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{(contract.value / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.startDate.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.endDate.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${contract.progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(contract)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id)}
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
          {filteredContracts.length === 0 && (
            <div className="text-center py-8 text-gray-500">No contracts found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ContractModal
          contract={selectedContract}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedContract(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function ContractModal({
  contract,
  onClose,
  onSubmit,
}: {
  contract: Contract | null
  onClose: () => void
  onSubmit: (data: CreateContractRequest | UpdateContractRequest) => void
}) {
  const [formData, setFormData] = useState<CreateContractRequest | UpdateContractRequest>({
    title: contract?.title || '',
    supplier: contract?.supplier || '',
    value: contract?.value || 0,
    startDate: contract?.startDate.toISOString().split('T')[0] || '',
    endDate: contract?.endDate.toISOString().split('T')[0] || '',
    type: contract?.type || '',
    renewalDate: contract?.renewalDate.toISOString().split('T')[0] || '',
    keyTerms: contract?.keyTerms || [],
  } as CreateContractRequest)

  const [keyTerm, setKeyTerm] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addKeyTerm = () => {
    if (keyTerm.trim()) {
      setFormData({
        ...formData,
        keyTerms: [...(formData.keyTerms || []), keyTerm.trim()],
      })
      setKeyTerm('')
    }
  }

  const removeKeyTerm = (index: number) => {
    setFormData({
      ...formData,
      keyTerms: formData.keyTerms?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{contract ? 'Edit Contract' : 'New Contract'}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Date</label>
            <input
              type="date"
              value={formData.renewalDate}
              onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Terms</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keyTerm}
                onChange={(e) => setKeyTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addKeyTerm()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add key term"
              />
              <button
                type="button"
                onClick={addKeyTerm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keyTerms?.map((term, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {term}
                  <button
                    type="button"
                    onClick={() => removeKeyTerm(index)}
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
              {contract ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

