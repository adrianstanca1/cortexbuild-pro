import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { taskService } from '../services/taskService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function TaskCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    assignedToRoles: [] as string[],
    targetRoles: [] as string[],
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate: '',
    location: '',
  })

  useEffect(() => {
    loadProjects()
    loadUsers()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`)
      setProjects(response.data.projects || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks/assignment/users`)
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.projectId) {
      toast.error('Title and project are required')
      return
    }

    try {
      setLoading(true)
      await taskService.createTask({
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        assignedTo: formData.assignedTo || undefined,
        assignedToRoles: formData.assignedToRoles.length > 0 ? formData.assignedToRoles : undefined,
        targetRoles: formData.targetRoles.length > 0 ? formData.targetRoles : undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        location: formData.location || undefined,
      })
      toast.success('Task created successfully')
      navigate('/tasks')
    } catch (error: any) {
      console.error('Failed to create task:', error)
      toast.error(error.response?.data?.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = (role: string, field: 'assignedToRoles' | 'targetRoles') => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(role)
        ? prev[field].filter((r) => r !== role)
        : [...prev[field], role],
    }))
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>

        <h1 className="text-3xl font-bold mb-6">Create New Task</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Task Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Project *</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Task location"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Assign to User</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value, assignedToRoles: [] })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select user (optional)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-400 text-center">OR</div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Assign to Roles</label>
                <div className="space-y-2">
                  {['OPERATIVE', 'SUPERVISOR'].map((role) => (
                    <label key={role} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                      <input
                        type="checkbox"
                        checked={formData.assignedToRoles.includes(role)}
                        onChange={() => {
                          toggleRole(role, 'assignedToRoles')
                          if (formData.assignedToRoles.includes(role) || formData.assignedToRoles.length === 0) {
                            setFormData({ ...formData, assignedTo: '' })
                          }
                        }}
                        className="w-4 h-4 text-primary-500"
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  All users with selected roles in the project will be assigned this task
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Visible to Roles</label>
                <div className="space-y-2">
                  {['OPERATIVE', 'SUPERVISOR', 'COMPANY_ADMIN'].map((role) => (
                    <label key={role} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                      <input
                        type="checkbox"
                        checked={formData.targetRoles.includes(role)}
                        onChange={() => toggleRole(role, 'targetRoles')}
                        className="w-4 h-4 text-primary-500"
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select which roles can see this task
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              to="/tasks"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

