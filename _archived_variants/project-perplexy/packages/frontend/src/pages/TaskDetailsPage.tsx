import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Edit, CheckCircle, Clock, Upload, AlertTriangle, Save } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function TaskDetailsPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [timeLog, setTimeLog] = useState({ hours: 0, notes: '' })

  useEffect(() => {
    if (taskId) {
      loadTask()
    }
  }, [taskId])

  const loadTask = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks/${taskId}`)
      setTask(response.data.task)
    } catch (error: any) {
      console.error('Failed to load task:', error)
      toast.error('Failed to load task')
      navigate('/tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitUpdate = async () => {
    if (!updateText.trim()) {
      toast.error('Please enter an update')
      return
    }

    try {
      setUpdating(true)
      await axios.post(`${API_URL}/api/tasks/${taskId}/update`, {
        update: updateText,
        timeLog: timeLog.hours > 0 ? timeLog : undefined,
      })
      toast.success('Task updated successfully')
      setUpdateText('')
      setTimeLog({ hours: 0, notes: '' })
      loadTask()
    } catch (error: any) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task')
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      await axios.put(`${API_URL}/api/tasks/${taskId}`, { status })
      toast.success('Task status updated')
      loadTask()
    } catch (error: any) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading task...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Task not found</p>
      </div>
    )
  }

  const canEdit = hasPermission('edit:task') || task.assignedTo === user?.id
  const canSubmitUpdate = hasPermission('submit:task:update') || task.assignedTo === user?.id

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className={`px-3 py-1 rounded ${
                  task.status === 'COMPLETED' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                  'bg-yellow-500 bg-opacity-20 text-yellow-400'
                }`}>
                  {task.status?.replace('_', ' ')}
                </span>
                {task.project && <span>Project: {task.project.name}</span>}
              </div>
            </div>
            {canEdit && (
              <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-300">{task.description || 'No description provided'}</p>
            </div>

            {/* Updates Section */}
            {canSubmitUpdate && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Submit Update</h2>
                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder="Enter your task update..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg mb-4 focus:outline-none focus:border-primary-500"
                  rows={4}
                />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Hours</label>
                    <input
                      type="number"
                      value={timeLog.hours}
                      onChange={(e) => setTimeLog({ ...timeLog, hours: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Notes</label>
                    <input
                      type="text"
                      value={timeLog.notes}
                      onChange={(e) => setTimeLog({ ...timeLog, notes: e.target.value })}
                      placeholder="Time log notes"
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSubmitUpdate}
                  disabled={updating || !updateText.trim()}
                  className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {updating ? 'Submitting...' : 'Submit Update'}
                </button>
              </div>
            )}

            {/* Time Logs */}
            {task.timeLogs && task.timeLogs.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Time Logs</h2>
                <div className="space-y-3">
                  {task.timeLogs.map((log: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{log.userName}</span>
                        <span className="text-sm text-gray-400">{log.hours}h</span>
                      </div>
                      {log.notes && <p className="text-sm text-gray-400">{log.notes}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            {canEdit && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Status</h3>
                <div className="space-y-2">
                  {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                        task.status === status
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Task Info */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Task Information</h3>
              <div className="space-y-3 text-sm">
                {task.assignedToUser && (
                  <div>
                    <span className="text-gray-400">Assigned to:</span>
                    <p className="text-white">{task.assignedToUser.name}</p>
                  </div>
                )}
                {task.createdByUser && (
                  <div>
                    <span className="text-gray-400">Created by:</span>
                    <p className="text-white">{task.createdByUser.name}</p>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <span className="text-gray-400">Due date:</span>
                    <p className="text-white">{new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                {task.location && (
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <p className="text-white">{task.location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Safety Issues */}
            {task.isSafetyIssue && (
              <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-red-400">Safety Issue</h3>
                </div>
                <p className="text-sm text-gray-300">{task.observations}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

