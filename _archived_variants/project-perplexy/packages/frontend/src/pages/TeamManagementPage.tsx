import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Search, Filter } from 'lucide-react'
import { teamService, TeamMember, CreateTeamMemberRequest, UpdateTeamMemberRequest, TeamStats } from '../services/teamService'
import toast from 'react-hot-toast'

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    loadMembers()
    loadStats()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data = await teamService.getTeamMembers()
      setMembers(data)
    } catch (error) {
      toast.error('Failed to load team members')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await teamService.getTeamStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreate = () => {
    setSelectedMember(null)
    setIsModalOpen(true)
  }

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member)
    setIsModalOpen(true)
  }

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return

    try {
      await teamService.deleteTeamMember(memberId)
      toast.success('Team member deleted successfully')
      loadMembers()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete team member')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateTeamMemberRequest | UpdateTeamMemberRequest) => {
    try {
      if (selectedMember) {
        await teamService.updateTeamMember(selectedMember.id, formData as UpdateTeamMemberRequest)
        toast.success('Team member updated successfully')
      } else {
        await teamService.createTeamMember(formData as CreateTeamMemberRequest)
        toast.success('Team member created successfully')
      }
      setIsModalOpen(false)
      setSelectedMember(null)
      loadMembers()
      loadStats()
    } catch (error) {
      toast.error(selectedMember ? 'Failed to update team member' : 'Failed to create team member')
      console.error(error)
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'away':
        return 'bg-yellow-100 text-yellow-800'
      case 'offline':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading team members...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Member
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Members</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Average Efficiency</div>
            <div className="text-2xl font-bold text-blue-600">{stats.averageEfficiency.toFixed(1)}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Average Rate</div>
            <div className="text-2xl font-bold text-green-600">£{stats.averageRate.toFixed(2)}/hr</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Projects</div>
            <div className="text-2xl font-bold text-purple-600">{stats.activeProjects}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search team members..."
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
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{member.rate.toFixed(2)}/hr</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${member.efficiency}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{member.efficiency}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
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
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No team members found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <TeamMemberModal
          member={selectedMember}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedMember(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function TeamMemberModal({
  member,
  onClose,
  onSubmit,
}: {
  member: TeamMember | null
  onClose: () => void
  onSubmit: (data: CreateTeamMemberRequest | UpdateTeamMemberRequest) => void
}) {
  const [formData, setFormData] = useState<CreateTeamMemberRequest | UpdateTeamMemberRequest>({
    name: member?.name || '',
    role: member?.role || '',
    rate: member?.rate || 0,
    email: member?.email || '',
    phone: member?.phone || '',
    skills: member?.skills || [],
  } as CreateTeamMemberRequest)

  const [skill, setSkill] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addSkill = () => {
    if (skill.trim()) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), skill.trim()],
      })
      setSkill('')
    }
  }

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{member ? 'Edit Team Member' : 'New Team Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate (£/hr)</label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {member && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={(formData as UpdateTeamMemberRequest).efficiency || member.efficiency}
                  onChange={(e) => setFormData({ ...formData, efficiency: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {member && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={(formData as UpdateTeamMemberRequest).status || member.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add skill"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((sk, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
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
              {member ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

