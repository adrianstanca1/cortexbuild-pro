import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Search, Filter, Workflow as WorkflowIcon } from 'lucide-react'
import { workflowService, Workflow, CreateWorkflowRequest, UpdateWorkflowRequest, WorkflowStats } from '../services/workflowService'
import toast from 'react-hot-toast'

export default function WorkflowAutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  useEffect(() => {
    loadWorkflows()
    loadStats()
  }, [])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const data = await workflowService.getWorkflows()
      setWorkflows(data)
    } catch (error) {
      toast.error('Failed to load workflows')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await workflowService.getWorkflowStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = () => {
    setSelectedWorkflow(null)
    setIsModalOpen(true)
  }

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setIsModalOpen(true)
  }

  const handleExecute = async (workflowId: string) => {
    try {
      await workflowService.executeWorkflow(workflowId)
      toast.success('Workflow executed successfully')
      loadWorkflows()
      loadStats()
    } catch (error) {
      toast.error('Failed to execute workflow')
      console.error(error)
    }
  }

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      await workflowService.deleteWorkflow(workflowId)
      toast.success('Workflow deleted successfully')
      loadWorkflows()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete workflow')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateWorkflowRequest | UpdateWorkflowRequest) => {
    try {
      if (selectedWorkflow) {
        await workflowService.updateWorkflow(selectedWorkflow.id, formData as UpdateWorkflowRequest)
        toast.success('Workflow updated successfully')
      } else {
        await workflowService.createWorkflow(formData as CreateWorkflowRequest)
        toast.success('Workflow created successfully')
      }
      setIsModalOpen(false)
      setSelectedWorkflow(null)
      loadWorkflows()
      loadStats()
    } catch (error) {
      toast.error(selectedWorkflow ? 'Failed to update workflow' : 'Failed to create workflow')
      console.error(error)
    }
  }

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workflows...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <WorkflowIcon className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          New Workflow
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Workflows</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Runs</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRuns}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{workflow.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{workflow.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{workflow.triggers.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{workflow.actions.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{workflow.runCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.lastRun ? workflow.lastRun.toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExecute(workflow.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Execute"
                        disabled={workflow.status !== 'active'}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(workflow)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id)}
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
          {filteredWorkflows.length === 0 && (
            <div className="text-center py-8 text-gray-500">No workflows found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <WorkflowModal
          workflow={selectedWorkflow}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedWorkflow(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function WorkflowModal({
  workflow,
  onClose,
  onSubmit,
}: {
  workflow: Workflow | null
  onClose: () => void
  onSubmit: (data: CreateWorkflowRequest | UpdateWorkflowRequest) => void
}) {
  const [formData, setFormData] = useState<CreateWorkflowRequest | UpdateWorkflowRequest>({
    name: workflow?.name || '',
    description: workflow?.description || '',
    triggers: workflow?.triggers || [{ type: 'manual', config: {} }],
    actions: workflow?.actions || [{ type: 'notification', config: {}, order: 1 }],
  } as CreateWorkflowRequest)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{workflow ? 'Edit Workflow' : 'New Workflow'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          {workflow && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={(formData as UpdateWorkflowRequest).status || workflow.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Triggers: {formData.triggers?.length || 0} | Actions: {formData.actions?.length || 0}
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {workflow ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

