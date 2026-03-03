/**
 * Communication Page
 * Real-time chat with project context preservation
 */

import { useState, useEffect, useRef } from 'react'
import { communicationService } from '../services/communicationService'
import { useAuth } from '../contexts/AuthContext'
import { Send, Paperclip, Smile, Video, Phone, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

export default function CommunicationPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<any[]>([])
  const [selectedThread, setSelectedThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    loadThreads()

    // Initialize Socket.IO connection
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
        transports: ['websocket'],
      })
    }

    const socket = socketRef.current

    // Socket.IO listeners
    socket.on('connect', () => {
      console.log('Connected to server')
      if (user?.id) {
        socket.emit('join', user.id)
      }
    })

    socket.on('message:new', (message) => {
      if (message.threadId === selectedThread?.id) {
        setMessages((prev) => [...prev, message])
      }
      // Update thread list
      loadThreads()
    })

    socket.on('message:typing', (data) => {
      if (data.threadId === selectedThread?.id && data.userId !== user?.id) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }
    })

    return () => {
      socket.off('message:new')
      socket.off('message:typing')
      socket.off('connect')
    }
  }, [selectedThread, user])

  useEffect(() => {
    if (selectedThread && socketRef.current) {
      loadMessages(selectedThread.id)
      socketRef.current.emit('join-thread', selectedThread.id)
    }
    return () => {
      if (selectedThread && socketRef.current) {
        socketRef.current.emit('leave-thread', selectedThread.id)
      }
    }
  }, [selectedThread])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadThreads = async () => {
    try {
      const response = await communicationService.getThreads()
      setThreads(response.threads || [])
      if (!selectedThread && response.threads?.length > 0) {
        setSelectedThread(response.threads[0])
      }
    } catch (error) {
      toast.error('Failed to load threads')
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      const response = await communicationService.getMessages(threadId)
      setMessages(response.messages || [])
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user) return

    try {
      const message = await communicationService.sendMessage({
        threadId: selectedThread.id,
        content: newMessage,
      })

      setMessages((prev) => [...prev, message])
      setNewMessage('')
      if (socketRef.current) {
        socketRef.current.emit('message:sent', {
          threadId: selectedThread.id,
          message,
        })
      }

      // Mark as read
      await communicationService.markAsRead(selectedThread.id, message.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    }
  }

  const handleTyping = () => {
    if (selectedThread && user && socketRef.current) {
      socketRef.current.emit('message:typing', {
        threadId: selectedThread.id,
        userId: user.id,
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Threads Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                selectedThread?.id === thread.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="font-semibold">{thread.title}</div>
              <div className="text-sm text-gray-400 mt-1">
                {thread.lastMessageAt
                  ? new Date(thread.lastMessageAt).toLocaleDateString()
                  : 'No messages'}
              </div>
              {thread.participants && (
                <div className="text-xs text-gray-500 mt-1">
                  {thread.participants.length} participants
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedThread.title}</h3>
                <div className="text-sm text-gray-400">
                  {selectedThread.participants?.length || 0} participants
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-700 rounded">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-700 rounded">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-700 rounded">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.userId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-md rounded-lg p-3 ${
                      message.userId === user?.id
                        ? 'bg-primary-600'
                        : 'bg-gray-800'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {message.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-700 rounded">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 p-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="p-2 hover:bg-gray-700 rounded">
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">Choose a thread from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
