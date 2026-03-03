import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit, Trash2, Map, Folder, Calendar, MoreVertical, FileText } from 'lucide-react'
import { projectService, Project } from '../services/projectService'
import { mapService } from '../services/mapService'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const projectsList = await projectService.getProjects()
      setProjects(projectsList)
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      const project = await projectService.createProject(formData.name, formData.description)
      setProjects([...projects, project])
      setShowCreateModal(false)
      setFormData({ name: '', description: '' })
      toast.success('Project created successfully')
    } catch (error: any) {
      console.error('Failed to create project:', error)
      toast.error(error.response?.data?.message || 'Failed to create project')
    }
  }

  const handleUpdate = async () => {
    if (!editingProject) return
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      const updatedProject = await projectService.updateProject(
        editingProject.id,
        formData.name || undefined,
        formData.description || undefined
      )
      setProjects(projects.map((p) => (p.id === editingProject.id ? updatedProject : p)))
      setEditingProject(null)
      setFormData({ name: '', description: '' })
      setShowCreateModal(false)
      toast.success('Project updated successfully')
    } catch (error: any) {
      console.error('Failed to update project:', error)
      toast.error(error.response?.data?.message || 'Failed to update project')
    }
  }

  const handleDelete = async (projectId: string, projectName: string) => {
    if (projectId === 'default-project') {
      toast.error('Cannot delete the default project')
      return
    }

    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await projectService.deleteProject(projectId)
      setProjects(projects.filter((p) => p.id !== projectId))
      toast.success('Project deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete project:', error)
      toast.error(error.response?.data?.message || 'Failed to delete project')
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({ name: project.name, description: project.description || '' })
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingProject(null)
    setFormData({ name: '', description: '' })
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-gray-400">Manage your construction projects</p>
          </div>
          <button
            onClick={() => {
              setEditingProject(null)
              setFormData({ name: '', description: '' })
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      to={`/map?project=${project.id}`}
                      className="block group"
                    >
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                        {project.name}
                      </h3>
                    </Link>
                    {project.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-10 bg-gray-700 border border-gray-600 rounded-lg shadow-lg py-2 min-w-[120px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                      <button
                        onClick={() => handleEdit(project)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-600 flex items-center space-x-2 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      {project.id !== 'default-project' && (
                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          className="w-full px-4 py-2 text-left hover:bg-red-600 flex items-center space-x-2 text-sm text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{project.createdAt?.toLocaleDateString() || 'Unknown'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Details</span>
                  </Link>
                  <Link
                    to={`/map?project=${project.id}`}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Map className="w-4 h-4" />
                    <span>View Map</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingProject(null)
                  setFormData({ name: '', description: '' })
                  setShowCreateModal(true)
                }}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create your first project</span>
              </button>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter project name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProject ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

