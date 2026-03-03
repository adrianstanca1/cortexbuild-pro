import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, MessageSquare, Users, Search } from 'lucide-react'
import { collaborationService, CollaborationRoom, CreateCollaborationRoomRequest, UpdateCollaborationRoomRequest, CollaborationMessage, CreateCollaborationMessageRequest, CollaborationStats } from '../services/collaborationService'
import toast from 'react-hot-toast'

export default function CollaborationHubPage() {
  const [rooms, setRooms] = useState<CollaborationRoom[]>([])
  const [stats, setStats] = useState<CollaborationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<CollaborationRoom | null>(null)
  const [messages, setMessages] = useState<CollaborationMessage[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    loadRooms()
    loadStats()
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id)
    }
  }, [selectedRoom])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const data = await collaborationService.getRooms()
      setRooms(data)
      if (data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0])
      }
    } catch (error) {
      toast.error('Failed to load collaboration rooms')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await collaborationService.getCollaborationStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const loadMessages = async (roomId: string) => {
    try {
      const data = await collaborationService.getMessages(roomId)
      setMessages(data)
    } catch (error) {
      toast.error('Failed to load messages')
      console.error(error)
    }
  }

  const handleCreateRoom = () => {
    setIsModalOpen(true)
  }

  const handleSubmitRoom = async (formData: CreateCollaborationRoomRequest, isEdit: boolean = false) => {
    try {
      if (isEdit && selectedRoom) {
        const updates: UpdateCollaborationRoomRequest = {
          name: formData.name,
          description: formData.description,
          members: formData.members,
        }
        await collaborationService.updateRoom(selectedRoom.id, updates)
        toast.success('Room updated successfully')
      } else {
        await collaborationService.createRoom(formData as CreateCollaborationRoomRequest)
        toast.success('Room created successfully')
      }
      setIsModalOpen(false)
      setSelectedRoom(null)
      loadRooms()
      loadStats()
    } catch (error) {
      toast.error('Failed to save room')
      console.error(error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedRoom || !newMessage.trim()) return

    try {
      const message: CreateCollaborationMessageRequest = {
        roomId: selectedRoom.id,
        userId: 'user-1',
        userName: 'Current User',
        content: newMessage,
        type: 'message',
      }
      await collaborationService.createMessage(message)
      setNewMessage('')
      loadMessages(selectedRoom.id)
      loadStats()
    } catch (error) {
      toast.error('Failed to send message')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading collaboration rooms...</div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Collaboration Hub</h1>
        </div>
        <button
          onClick={handleCreateRoom}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Room
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Rooms</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalRooms}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Messages</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Rooms</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeRooms}</div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Rooms</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{room.name}</div>
                <div className="text-sm text-gray-500 mt-1">{room.description}</div>
                <div className="text-xs text-gray-400 mt-2">
                  <Users className="w-3 h-3 inline mr-1" />
                  {room.members.length} members
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-lg shadow flex flex-col">
          {selectedRoom ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">{selectedRoom.name}</h2>
                <div className="text-sm text-gray-500">{selectedRoom.description}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{message.userName}</span>
                      <span className="text-xs text-gray-500">{message.createdAt.toLocaleTimeString()}</span>
                    </div>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">{message.content}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a room to view messages
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CollaborationRoomModal
          room={null}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedRoom(null)
          }}
          onSubmit={(data) => handleSubmitRoom(data, false)}
        />
      )}
    </div>
  )
}

function CollaborationRoomModal({
  room,
  onClose,
  onSubmit,
}: {
  room: CollaborationRoom | null
  onClose: () => void
  onSubmit: (data: CreateCollaborationRoomRequest) => void
}) {
  const [formData, setFormData] = useState<CreateCollaborationRoomRequest>({
    name: room?.name || '',
    description: room?.description || '',
    type: room?.type || 'general',
    projectId: room?.projectId || undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{room ? 'Edit Room' : 'New Room'}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="general">General</option>
              <option value="project">Project</option>
              <option value="team">Team</option>
            </select>
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
              {room ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

