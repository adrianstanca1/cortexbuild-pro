import { useState, useEffect, useCallback } from 'react'
import { Monitor, X, Minus, Square, Maximize2, Mail, Folder, Package, Code, Bell } from 'lucide-react'
import { desktopService, DesktopApp, WindowState, DesktopMessage } from '../services/desktopService'
import { codeService } from '../services/codeService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

interface Window extends WindowState {
  appId: string
  appName: string
  content?: string
  code?: string
  language?: string
}

export default function MyAppDesktopPage() {
  const [apps, setApps] = useState<DesktopApp[]>([])
  const [windows, setWindows] = useState<Window[]>([])
  const [messages, setMessages] = useState<DesktopMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAppLauncher, setShowAppLauncher] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [loading, setLoading] = useState(true)
  const [maxZIndex, setMaxZIndex] = useState(1)

  const loadDesktop = useCallback(async () => {
    try {
      setLoading(true)
      const [installedApps, desktopMessages] = await Promise.all([
        desktopService.getInstalledApps().catch(() => []),
        desktopService.getMessages().catch(() => []),
      ])
      setApps(installedApps)
      setMessages(desktopMessages)
      setUnreadCount(desktopMessages.filter((msg) => !msg.read).length)
    } catch (error) {
      console.error('Failed to load desktop:', error)
      toast.error('Failed to load desktop')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDesktop()
  }, [loadDesktop])

  const openApp = useCallback(async (app: DesktopApp) => {
    // Check if app is already open
    const existingWindow = windows.find((w) => w.appId === app.id)
    if (existingWindow) {
      // Bring to front
      focusWindow(existingWindow.id)
      return
    }

    // Create new window
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      appId: app.id,
      appName: app.name,
      code: app.code,
      language: app.language,
      x: 100 + windows.length * 30,
      y: 100 + windows.length * 30,
      width: 800,
      height: 600,
      minimized: false,
      maximized: false,
      zIndex: maxZIndex + 1,
    }

    setWindows((prev) => [...prev, newWindow])
    setMaxZIndex((prev) => prev + 1)
    setShowAppLauncher(false)
    toast.success(`Opened ${app.name}`)
  }, [windows, maxZIndex])

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId))
    toast.success('Window closed')
  }, [])

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, minimized: true } : w))
    )
  }, [])

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              maximized: !w.maximized,
              x: w.maximized ? 100 : 0,
              y: w.maximized ? 100 : 0,
            width: w.maximized ? 800 : globalThis.innerWidth,
            height: w.maximized ? 600 : globalThis.innerHeight - 60,
            }
          : w
      )
    )
  }, [])

  const focusWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, zIndex: maxZIndex + 1, minimized: false } : w
      )
    )
    setMaxZIndex((prev) => prev + 1)
  }, [maxZIndex])

  const updateWindowPosition = useCallback((windowId: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, x, y } : w))
    )
  }, [])

  const updateWindowSize = useCallback((windowId: string, width: number, height: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, width, height } : w))
    )
  }, [])

  const executeApp = useCallback(async (appId: string, code: string, language: string) => {
    try {
      const result = await codeService.executeCode(code, undefined, language)
      return result
    } catch (error: any) {
      console.error('Failed to execute app:', error)
      toast.error(error.response?.data?.message || 'Failed to execute app')
      throw error
    }
  }, [])

  const handleMarkMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await desktopService.markMessageAsRead(messageId)
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark message as read:', error)
    }
  }, [])

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading desktop..." />
  }

  const visibleWindows = windows.filter((w) => !w.minimized)

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Desktop Background */}
      <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
        {/* Desktop Icons */}
        <div className="absolute top-4 left-4 space-y-4">
          <button
            onClick={() => setShowAppLauncher(true)}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-800 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all cursor-pointer group"
          >
            <Package className="w-12 h-12 text-primary-400 group-hover:text-primary-300" />
            <span className="text-sm text-gray-300">Apps</span>
          </button>
          <button
            onClick={() => setShowFileManager(true)}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-800 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all cursor-pointer group"
          >
            <Folder className="w-12 h-12 text-blue-400 group-hover:text-blue-300" />
            <span className="text-sm text-gray-300">Files</span>
          </button>
        </div>

        {/* Windows */}
        {visibleWindows.map((window) => (
          <WindowComponent
            key={window.id}
            window={window}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            onMaximize={() => maximizeWindow(window.id)}
            onFocus={() => focusWindow(window.id)}
            onMove={(x, y) => updateWindowPosition(window.id, x, y)}
            onResize={(width, height) => updateWindowSize(window.id, width, height)}
            onExecute={executeApp}
          />
        ))}

        {/* App Launcher Modal */}
        {showAppLauncher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Package className="w-6 h-6 text-primary-400" />
                  <span>App Launcher</span>
                </h2>
                <button
                  onClick={() => setShowAppLauncher(false)}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app)}
                    className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                  >
                    <Code className="w-8 h-8 text-primary-400 mb-2" />
                    <p className="font-medium text-sm">{app.name}</p>
                  </button>
                ))}
                {apps.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No apps installed</p>
                    <p className="text-sm mt-2">Install apps from the marketplace</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Taskbar */}
      <div className="h-14 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAppLauncher(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="App Launcher"
          >
            <Package className="w-5 h-5 text-primary-400" />
          </button>
          <button
            onClick={() => setShowFileManager(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="File Manager"
          >
            <Folder className="w-5 h-5 text-blue-400" />
          </button>
          <button
            onClick={() => {
              setShowMessages(true)
              setUnreadCount(0)
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative"
            title="Messages"
          >
            <Mail className="w-5 h-5 text-green-400" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-1">
          {windows.map((window) => (
            <button
              key={window.id}
              onClick={() => {
                if (window.minimized) {
                  minimizeWindow(window.id)
                } else {
                  focusWindow(window.id)
                }
              }}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                !window.minimized ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {window.appName}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Messages Modal */}
      {showMessages && (
        <MessagesPanel
          messages={messages}
          onClose={() => setShowMessages(false)}
          onMarkAsRead={handleMarkMessageAsRead}
        />
      )}
    </div>
  )
}

// Window Component
interface WindowComponentProps {
  window: Window
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number) => void
  onExecute: (appId: string, code: string, language: string) => Promise<any>
}

function WindowComponent({
  window: win,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  onExecute,
}: WindowComponentProps) {
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('window-header')) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - win.x,
        y: e.clientY - win.y,
      })
      onFocus()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !win.maximized) {
      onMove(e.clientX - dragOffset.x, e.clientY - dragOffset.y)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleRun = async () => {
    if (!win.code) return
    try {
      setIsRunning(true)
      const result = await onExecute(win.appId, win.code, win.language || 'python')
      setOutput(result.output || result.error || '')
    } catch (error) {
      console.error('Failed to execute:', error)
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!win.maximized) {
          onMove(e.clientX - dragOffset.x, e.clientY - dragOffset.y)
        }
      }
      const handleGlobalMouseUp = () => {
        setIsDragging(false)
      }
      window.addEventListener('mousemove', handleGlobalMouseMove)
      window.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove)
        window.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragOffset, win.maximized, onMove])

  return (
    <div
      className="absolute bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col"
      style={{
        left: win.maximized ? 0 : `${win.x}px`,
        top: win.maximized ? 0 : `${win.y}px`,
        width: win.maximized ? '100%' : `${win.width}px`,
        height: win.maximized ? 'calc(100% - 56px)' : `${win.height}px`,
        zIndex: win.zIndex,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Window Header */}
      <div className="window-header bg-gray-700 px-4 py-2 flex items-center justify-between rounded-t-lg cursor-move">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-primary-400" />
          <span className="font-medium text-sm">{win.appName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-gray-600 rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onMaximize}
            className="p-1 hover:bg-gray-600 rounded transition-colors"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-900">
        {win.code ? (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {win.code}
              </pre>
            </div>
            {win.language && (
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Run'}
              </button>
            )}
            {output && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-green-300 font-mono whitespace-pre-wrap">{output}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No content available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Messages Panel Component
interface MessagesPanelProps {
  messages: DesktopMessage[]
  onClose: () => void
  onMarkAsRead: (messageId: string) => void
}

function MessagesPanel({ messages, onClose, onMarkAsRead }: MessagesPanelProps) {
  return (
    <div className="fixed bottom-16 right-4 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col max-h-[500px]">
      <div className="bg-gray-700 px-4 py-2 flex items-center justify-between rounded-t-lg">
        <h3 className="font-semibold flex items-center space-x-2">
          <Mail className="w-5 h-5 text-green-400" />
          <span>Messages</span>
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-600 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                message.read ? 'bg-gray-700' : 'bg-primary-900 bg-opacity-30 border border-primary-700'
              }`}
              onClick={() => {
                if (!message.read) {
                  onMarkAsRead(message.id)
                }
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{message.from}</span>
                <span className="text-xs text-gray-400">{message.timestamp.toLocaleTimeString()}</span>
              </div>
              <p className="text-sm font-semibold mb-1">{message.subject}</p>
              <p className="text-xs text-gray-400 line-clamp-2">{message.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages</p>
          </div>
        )}
      </div>
    </div>
  )
}

