import { useState, useEffect } from 'react'
import { Plus, Mail, Trash2, Search, Filter } from 'lucide-react'
import { messageService, Message, CreateMessageRequest, MessageStats } from '../services/messageService'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [isComposeOpen, setIsComposeOpen] = useState(false)

  useEffect(() => {
    loadMessages()
    loadStats()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const data = await messageService.getMessages()
      setMessages(data)
    } catch (error) {
      toast.error('Failed to load messages')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await messageService.getMessageStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCompose = () => {
    setIsComposeOpen(true)
  }

  const handleSend = async (formData: CreateMessageRequest) => {
    try {
      await messageService.createMessage(formData)
      toast.success('Message sent successfully')
      setIsComposeOpen(false)
      loadMessages()
      loadStats()
    } catch (error) {
      toast.error('Failed to send message')
      console.error(error)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId)
      loadMessages()
      loadStats()
    } catch (error) {
      toast.error('Failed to mark message as read')
      console.error(error)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await messageService.deleteMessage(messageId)
      toast.success('Message deleted successfully')
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
      loadMessages()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete message')
      console.error(error)
    }
  }

  const filteredMessages = messages.filter((message) => {
    return (
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.to.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={handleCompose}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Compose
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Messages</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Unread</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.unread}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tender Related</div>
            <div className="text-2xl font-bold text-blue-600">{stats.tenderRelated}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">This Week</div>
            <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message)
                  if (!message.read) {
                    handleMarkAsRead(message.id)
                  }
                }}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  !message.read ? 'bg-blue-50' : ''
                } ${selectedMessage?.id === message.id ? 'bg-blue-100' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-900">{message.from}</div>
                  {!message.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{message.subject}</div>
                <div className="text-xs text-gray-500 truncate">{message.content}</div>
                <div className="text-xs text-gray-400 mt-2">{message.date.toLocaleDateString()}</div>
              </div>
            ))}
            {filteredMessages.length === 0 && (
              <div className="text-center py-8 text-gray-500">No messages found</div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedMessage ? (
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h2>
                  <div className="text-sm text-gray-500">
                    <div>From: {selectedMessage.from}</div>
                    <div>To: {selectedMessage.to}</div>
                    <div>Date: {selectedMessage.date.toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 border-t border-gray-200 pt-4">
                <div className="text-gray-900 whitespace-pre-wrap">{selectedMessage.content}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a message to view
            </div>
          )}
        </div>
      </div>

      {isComposeOpen && (
        <ComposeModal
          onClose={() => setIsComposeOpen(false)}
          onSend={handleSend}
        />
      )}
    </div>
  )
}

function ComposeModal({
  onClose,
  onSend,
}: {
  onClose: () => void
  onSend: (data: CreateMessageRequest) => void
}) {
  const [formData, setFormData] = useState<CreateMessageRequest>({
    to: '',
    subject: '',
    content: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Compose Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="text"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={10}
              required
            />
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
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

