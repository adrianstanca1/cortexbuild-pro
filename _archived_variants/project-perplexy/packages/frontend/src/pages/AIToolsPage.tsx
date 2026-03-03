import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Search, Filter, Sparkles } from 'lucide-react'
import { aiToolsService, AITool, CreateAIToolRequest, UpdateAIToolRequest, AIToolRequest, AIToolStats } from '../services/aiToolsService'
import toast from 'react-hot-toast'

export default function AIToolsPage() {
  const [tools, setTools] = useState<AITool[]>([])
  const [stats, setStats] = useState<AIToolStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null)
  const [executingTool, setExecutingTool] = useState<AITool | null>(null)
  const [output, setOutput] = useState<string>('')
  const [input, setInput] = useState<string>('')

  useEffect(() => {
    loadTools()
    loadStats()
  }, [])

  const loadTools = async () => {
    try {
      setLoading(true)
      const data = await aiToolsService.getAITools()
      setTools(data)
    } catch (error) {
      toast.error('Failed to load AI tools')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await aiToolsService.getAIToolStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = () => {
    setSelectedTool(null)
    setIsModalOpen(true)
  }

  const handleEdit = (tool: AITool) => {
    setSelectedTool(tool)
    setIsModalOpen(true)
  }

  const handleExecute = (tool: AITool) => {
    setExecutingTool(tool)
    setInput('')
    setOutput('')
    setIsExecuteModalOpen(true)
  }

  const handleDelete = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this AI tool?')) return

    try {
      await aiToolsService.deleteAITool(toolId)
      toast.success('AI tool deleted successfully')
      loadTools()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete AI tool')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateAIToolRequest | UpdateAIToolRequest) => {
    try {
      if (selectedTool) {
        await aiToolsService.updateAITool(selectedTool.id, formData as UpdateAIToolRequest)
        toast.success('AI tool updated successfully')
      } else {
        await aiToolsService.createAITool(formData as CreateAIToolRequest)
        toast.success('AI tool created successfully')
      }
      setIsModalOpen(false)
      setSelectedTool(null)
      loadTools()
      loadStats()
    } catch (error) {
      toast.error(selectedTool ? 'Failed to update AI tool' : 'Failed to create AI tool')
      console.error(error)
    }
  }

  const handleExecuteTool = async () => {
    if (!executingTool || !input.trim()) {
      toast.error('Please enter input for the AI tool')
      return
    }

    try {
      setOutput('Processing...')
      const request: AIToolRequest = {
        toolId: executingTool.id,
        input: input,
      }
      const response = await aiToolsService.executeAITool(request)
      setOutput(response.output)
      if (response.status === 'error') {
        toast.error(response.error || 'AI tool execution failed')
      } else {
        toast.success('AI tool executed successfully')
        loadTools()
        loadStats()
      }
    } catch (error) {
      toast.error('Failed to execute AI tool')
      console.error(error)
      setOutput('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'text':
        return 'bg-blue-100 text-blue-800'
      case 'image':
        return 'bg-purple-100 text-purple-800'
      case 'code':
        return 'bg-green-100 text-green-800'
      case 'analysis':
        return 'bg-yellow-100 text-yellow-800'
      case 'automation':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading AI tools...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Tools</h1>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          New AI Tool
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Tools</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Usage</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Categories</div>
            <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byCategory).length}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search AI tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="code">Code</option>
              <option value="analysis">Analysis</option>
              <option value="automation">Automation</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTools.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tool.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(tool.category)}`}>
                      {tool.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tool.status)}`}>
                      {tool.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tool.usage}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExecute(tool)}
                        className="text-green-600 hover:text-green-900"
                        title="Execute"
                        disabled={tool.status !== 'active'}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(tool)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id)}
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
          {filteredTools.length === 0 && (
            <div className="text-center py-8 text-gray-500">No AI tools found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <AIToolModal
          tool={selectedTool}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedTool(null)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {isExecuteModalOpen && executingTool && (
        <ExecuteAIToolModal
          tool={executingTool}
          input={input}
          output={output}
          onInputChange={setInput}
          onExecute={handleExecuteTool}
          onClose={() => {
            setIsExecuteModalOpen(false)
            setExecutingTool(null)
            setInput('')
            setOutput('')
          }}
        />
      )}
    </div>
  )
}

function AIToolModal({
  tool,
  onClose,
  onSubmit,
}: {
  tool: AITool | null
  onClose: () => void
  onSubmit: (data: CreateAIToolRequest | UpdateAIToolRequest) => void
}) {
  const [formData, setFormData] = useState<CreateAIToolRequest | UpdateAIToolRequest>({
    name: tool?.name || '',
    description: tool?.description || '',
    category: tool?.category || 'text',
  } as CreateAIToolRequest)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{tool ? 'Edit AI Tool' : 'New AI Tool'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="code">Code</option>
              <option value="analysis">Analysis</option>
              <option value="automation">Automation</option>
            </select>
          </div>
          {tool && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={(formData as UpdateAIToolRequest).status || tool.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {tool ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExecuteAIToolModal({
  tool,
  input,
  output,
  onInputChange,
  onExecute,
  onClose,
}: {
  tool: AITool
  input: string
  output: string
  onInputChange: (value: string) => void
  onExecute: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Execute AI Tool: {tool.name}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Input</label>
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={6}
              placeholder="Enter input for the AI tool..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Output</label>
            <textarea
              value={output}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              rows={6}
              placeholder="Output will appear here..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onExecute}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

