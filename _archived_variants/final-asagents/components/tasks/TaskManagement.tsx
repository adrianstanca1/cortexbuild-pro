import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Task,
  Project,
  TodoStatus as TaskStatus,
  TodoPriority as TaskPriority,
  Permission,
  View
} from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewHeader } from '../layout/ViewHeader';
import { hasPermission } from '../../services/auth';
import { api } from '../../services/mockApi';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Calendar,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Tag as TagIcon
} from 'lucide-react';
import { format, isOverdue, differenceInDays } from '../../utils/date';

interface TaskManagementProps {
  user: User;
  addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  setActiveView: (view: View) => void;
}

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  priority: TaskPriority;
  dueDate: string;
  startDate: string;
  estimatedHours: number;
  tags: string[];
}

const TaskCard: React.FC<{
  task: Task;
  project?: Project;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  canEdit: boolean;
  canDelete: boolean;
}> = ({ task, project, onEdit, onDelete, onToggleStatus, canEdit, canDelete }) => {
  const statusColors = {
    [TaskStatus.PENDING]: 'bg-gray-100 text-gray-800',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [TaskStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    [TaskPriority.LOW]: 'bg-green-100 text-green-800',
    [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [TaskPriority.HIGH]: 'bg-red-100 text-red-800',
  };

  const dueDate = new Date(task.dueDate);
  const isTaskOverdue = isOverdue(dueDate) && task.status !== TaskStatus.COMPLETED;
  const daysUntilDue = differenceInDays(dueDate, new Date());

  const getProgressPercentage = () => {
    if (task.status === TaskStatus.COMPLETED) return 100;
    if (task.status === TaskStatus.IN_PROGRESS) return 50;
    return 0;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{task.title}</h3>
            {isTaskOverdue && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          {project && (
            <p className="text-xs text-gray-500">Project: {project.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <UserIcon className="w-4 h-4" />
          <span>Assigned to: {task.assignedTo}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span className={isTaskOverdue ? 'text-red-600 font-medium' : ''}>
            Due: {format(dueDate, 'MMM dd, yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{task.estimatedHours}h estimated</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={isTaskOverdue ? 'text-red-600' : daysUntilDue <= 3 ? 'text-yellow-600' : 'text-gray-600'}>
            {isTaskOverdue ? 'Overdue' : daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`}
          </span>
        </div>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          size="sm"
          variant={task.status === TaskStatus.COMPLETED ? "outline" : "primary"}
          onClick={() => onToggleStatus(task)}
        >
          {task.status === TaskStatus.COMPLETED ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Completed
            </>
          ) : (
            'Mark Complete'
          )}
        </Button>

        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => onDelete(task)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const TaskModal: React.FC<{
  task: Task | null;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
  title: string;
}> = ({ task, projects, isOpen, onClose, onSave, title }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    startDate: '',
    estimatedHours: 8,
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assignedTo: task.assignedTo,
        priority: task.priority,
        dueDate: task.dueDate?.substring(0, 10) || '',
        startDate: task.startDate?.substring(0, 10) || '',
        estimatedHours: task.estimatedHours || 8,
        tags: task.tags || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        projectId: projects[0]?.id || '',
        assignedTo: '',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        startDate: '',
        estimatedHours: 8,
        tags: [],
      });
    }
  }, [task, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="outline" onClick={onClose}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              title="Task Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              title="Task Description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                aria-label="Select project"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                placeholder="Enter assignee name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                aria-label="Select priority"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                title="Start Date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                title="Due Date"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 8 }))}
              title="Estimated Hours"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag}>
                <TagIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded cursor-pointer hover:bg-blue-100"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TaskManagement: React.FC<TaskManagementProps> = ({
  user,
  addToast,
  setActiveView
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const canCreateTasks = hasPermission(user, Permission.MANAGE_ALL_TASKS);
  const canEditTasks = hasPermission(user, Permission.MANAGE_ALL_TASKS);
  const canDeleteTasks = hasPermission(user, Permission.MANAGE_ALL_TASKS);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [taskData, projectData] = await Promise.all([
        api.getTasks(),
        api.getProjects()
      ]);
      setTasks(taskData);
      setProjects(projectData);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast('Failed to load tasks and projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateTask = () => {
    setSelectedTask(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        addToast('Task deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete task:', error);
        addToast('Failed to delete task', 'error');
      }
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED;
      const updatedTask = await api.updateTask(task.id, {
        status: newStatus,
        completedDate: newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : null
      });
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      addToast(`Task marked as ${newStatus === TaskStatus.COMPLETED ? 'completed' : 'in progress'}`, 'success');
    } catch (error) {
      console.error('Failed to update task status:', error);
      addToast('Failed to update task status', 'error');
    }
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      if (modalMode === 'create') {
        const newTask = await api.createTask({
          ...taskData,
          status: TaskStatus.PENDING,
          actualHours: 0,
          dueDate: taskData.dueDate ? `${taskData.dueDate}T23:59:59Z` : '',
          startDate: taskData.startDate ? `${taskData.startDate}T08:00:00Z` : '',
          createdBy: user.id
        });
        setTasks(prev => [...prev, newTask]);
        addToast('Task created successfully', 'success');
      } else if (selectedTask) {
        const updatedTask = await api.updateTask(selectedTask.id, {
          ...taskData,
          dueDate: taskData.dueDate ? `${taskData.dueDate}T23:59:59Z` : '',
          startDate: taskData.startDate ? `${taskData.startDate}T08:00:00Z` : ''
        });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
        addToast('Task updated successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      addToast('Failed to save task', 'error');
    }
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    overdue: tasks.filter(t => t.dueDate && isOverdue(new Date(t.dueDate)) && t.status !== TaskStatus.COMPLETED).length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ViewHeader
        title="Task Management"
        description={`${taskStats.total} total tasks • ${taskStats.overdue} overdue`}
        actions={
          canCreateTasks && (
            <Button onClick={handleCreateTask}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          )
        }
      />

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold">{taskStats.total}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold">{taskStats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{taskStats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold">{taskStats.overdue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
              aria-label="Filter by status"
            >
              <option value="ALL">All Status</option>
              <option value={TaskStatus.PENDING}>Pending</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
              <option value={TaskStatus.CANCELLED}>Cancelled</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
              aria-label="Filter by priority"
            >
              <option value="ALL">All Priority</option>
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            {tasks.length === 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                <p className="mb-4">Get started by creating your first task</p>
                {canCreateTasks && (
                  <Button onClick={handleCreateTask}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">No tasks match your search</h3>
                <p>Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              project={projects.find(p => p.id === task.projectId)}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleStatus={handleToggleTaskStatus}
              canEdit={canEditTasks}
              canDelete={canDeleteTasks}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        projects={projects}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        title={modalMode === 'create' ? 'Create New Task' : 'Edit Task'}
      />
    </div>
  );
};