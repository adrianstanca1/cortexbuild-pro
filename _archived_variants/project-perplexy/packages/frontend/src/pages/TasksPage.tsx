import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Filter, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function TasksPage() {
  const { user, hasPermission } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTasks()
  }, [filter])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filter !== 'all') {
        params.status = filter.toUpperCase()
      }
      const response = await axios.get(`${API_URL}/api/tasks`, { params })
      setTasks(response.data.tasks || [])
    } catch (error: any) {
      console.error('Failed to load tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery) {
      return task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const canCreateTask = hasPermission('create:task')

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tasks</h1>
              <p className="text-gray-400">Manage and track your tasks</p>
            </div>
            {canCreateTask && (
              <Link
                to="/tasks/new"
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Task
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-primary-500'
                }`}
              >
                {status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tasks...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="block p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === 'COMPLETED' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                        'bg-yellow-500 bg-opacity-20 text-yellow-400'
                      }`}>
                        {task.status?.replace('_', ' ')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {task.assignedToUser && (
                        <span>Assigned to: {task.assignedToUser.name}</span>
                      )}
                      {task.dueDate && (
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                      {task.project && (
                        <span>Project: {task.project.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : task.status === 'IN_PROGRESS' ? (
                      <Clock className="w-6 h-6 text-blue-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-400" />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  )
}

