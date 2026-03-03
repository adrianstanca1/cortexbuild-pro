import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Map,
  Users,
  FileText,
  Calendar,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { projectService, Project } from '../services/projectService'
import { locationService, ActiveUser } from '../services/locationService'
import { mapService } from '../services/mapService'
import { fileService } from '../services/fileService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrawings: 0,
    totalFiles: 0,
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (projectId) {
      loadProjectDetails()
    }
  }, [projectId])

  const loadProjectDetails = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      const [projectData, users, drawings, fileStats] = await Promise.all([
        projectService.getProject(projectId),
        locationService.getActiveUsers(projectId).catch(() => []),
        mapService.getDrawingMap(projectId).catch(() => null),
        fileService.getFileStats().catch(() => ({ totalFiles: 0, totalSize: 0, totalDirectories: 0, fileTypes: {} })),
      ])

      setProject(projectData)
      setActiveUsers(users)

      setStats({
        totalUsers: users.length,
        totalDrawings: drawings ? 1 : 0,
        totalFiles: fileStats.totalFiles,
      })

      if (projectData) {
        setEditForm({
          name: projectData.name,
          description: projectData.description || '',
        })
      }
    } catch (error) {
      console.error('Failed to load project details:', error)
      toast.error('Failed to load project details')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }, [projectId, navigate])

  const handleUpdate = async () => {
    if (!projectId) return
    if (!editForm.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      const updatedProject = await projectService.updateProject(
        projectId,
        editForm.name || undefined,
        editForm.description || undefined
      )
      setProject(updatedProject)
      setShowEditModal(false)
      toast.success('Project updated successfully')
    } catch (error: any) {
      console.error('Failed to update project:', error)
      toast.error(error.response?.data?.message || 'Failed to update project')
    }
  }

  const handleDelete = async () => {
    if (!projectId) return

    if (projectId === 'default-project') {
      toast.error('Cannot delete the default project')
      return
    }

    if (!confirm(`Are you sure you want to delete "${project?.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await projectService.deleteProject(projectId)
      toast.success('Project deleted successfully')
      navigate('/projects')
    } catch (error: any) {
      console.error('Failed to delete project:', error)
      toast.error(error.response?.data?.message || 'Failed to delete project')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading project details..." />
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Project not found</p>
          <Link
            to="/projects"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-gray-400 text-lg">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              {projectId !== 'default-project' && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-lg">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.totalUsers}</h3>
            <p className="text-gray-400 text-sm">Active Users</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 bg-opacity-20 rounded-lg">
                <Map className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.totalDrawings}</h3>
            <p className="text-gray-400 text-sm">Construction Drawings</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.totalFiles}</h3>
            <p className="text-gray-400 text-sm">Total Files</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Link
            to={`/map?project=${projectId}`}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-primary-500 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-500 bg-opacity-20 rounded-lg group-hover:bg-primary-500 transition-colors">
                <Map className="w-6 h-6 text-primary-400 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Live Project Map</h3>
                <p className="text-gray-400 text-sm">View real-time project tracking</p>
              </div>
            </div>
          </Link>

          <Link
            to="/files"
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-primary-500 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg group-hover:bg-blue-500 transition-colors">
                <FileText className="w-6 h-6 text-blue-400 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">File Manager</h3>
                <p className="text-gray-400 text-sm">Manage project files</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Active Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeUsers.map((user) => (
                <div
                  key={user.userId}
                  className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{user.userName}</p>
                    <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Information */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Project Information</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="font-medium">
                  {project.createdAt?.toLocaleString() || 'Unknown'}
                </p>
              </div>
            </div>
            {project.updatedAt && (
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Last Updated</p>
                  <p className="font-medium">
                    {project.updatedAt.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Edit Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter project name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

