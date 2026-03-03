import { v4 as uuidv4 } from 'uuid'
import { DesktopApp, WindowState, DesktopMessage } from '../types/desktop.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
const desktopApps: Map<string, DesktopApp[]> = new Map() // userId -> DesktopApp[]
const messages: DesktopMessage[] = []

export const desktopService = {
  async getInstalledApps(userId: string = 'anonymous'): Promise<DesktopApp[]> {
    return desktopApps.get(userId) || []
  },

  async installApp(userId: string, app: { appId: string; name: string; code: string; language: string }): Promise<DesktopApp> {
    if (!desktopApps.has(userId)) {
      desktopApps.set(userId, [])
    }

    const userApps = desktopApps.get(userId)!

    // Check if app is already installed
    const existingApp = userApps.find((a) => a.id === app.appId)
    if (existingApp) {
      return existingApp
    }

    // Create new desktop app
    const desktopApp: DesktopApp = {
      id: app.appId,
      name: app.name,
      code: app.code,
      language: app.language,
      component: app.appId,
      windowState: {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        minimized: false,
        maximized: false,
        zIndex: 1,
      },
    }

    userApps.push(desktopApp)
    return desktopApp
  },

  async uninstallApp(userId: string, appId: string): Promise<void> {
    const userApps = desktopApps.get(userId)
    if (userApps) {
      const index = userApps.findIndex((app) => app.id === appId)
      if (index !== -1) {
        userApps.splice(index, 1)
      }
    }
  },

  async updateWindowState(userId: string, appId: string, state: Partial<WindowState>): Promise<void> {
    const userApps = desktopApps.get(userId)
    if (userApps) {
      const app = userApps.find((a) => a.id === appId)
      if (app) {
        app.windowState = { ...app.windowState, ...state }
      }
    }
  },

  async executeApp(userId: string, appId: string, data?: any): Promise<any> {
    const userApps = desktopApps.get(userId)
    if (!userApps) {
      throw new ApiError('No apps installed', 404)
    }

    const app = userApps.find((a) => a.id === appId)
    if (!app) {
      throw new ApiError('App not found', 404)
    }

    // Return app code and language for execution
    return {
      code: app.code,
      language: app.language,
      data,
    }
  },

  async getMessages(userId: string = 'anonymous'): Promise<DesktopMessage[]> {
    // Filter messages for the user
    return messages.filter((msg) => msg.to === userId || msg.from === userId)
  },

  async sendMessage(message: Omit<DesktopMessage, 'id' | 'timestamp' | 'read'>): Promise<DesktopMessage> {
    const newMessage: DesktopMessage = {
      id: uuidv4(),
      ...message,
      timestamp: new Date(),
      read: false,
    }

    messages.push(newMessage)
    return newMessage
  },

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = messages.find((m) => m.id === messageId)
    if (message) {
      message.read = true
    }
  },
}

