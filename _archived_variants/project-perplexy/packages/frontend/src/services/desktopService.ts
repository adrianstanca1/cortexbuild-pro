import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface DesktopApp {
  id: string
  name: string
  icon?: string
  component: string
  code: string
  language: string
  windowState: {
    x: number
    y: number
    width: number
    height: number
    minimized: boolean
    maximized: boolean
    zIndex: number
  }
}

export interface WindowState {
  id: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  zIndex: number
}

export interface DesktopMessage {
  id: string
  from: string
  to: string
  subject: string
  content: string
  timestamp: Date
  read: boolean
}

export const desktopService = {
  async getInstalledApps(): Promise<DesktopApp[]> {
    const response = await axios.get(`${API_URL}/api/desktop/apps`)
    return response.data.apps.map((app: any) => ({
      ...app,
      windowState: app.windowState || {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        minimized: false,
        maximized: false,
        zIndex: 1,
      },
    }))
  },

  async installApp(app: any): Promise<DesktopApp> {
    const response = await axios.post(`${API_URL}/api/desktop/apps/install`, {
      appId: app.id,
      name: app.name,
      code: app.code,
      language: app.language,
    })
    return {
      ...response.data.app,
      windowState: response.data.app.windowState || {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        minimized: false,
        maximized: false,
        zIndex: 1,
      },
    }
  },

  async uninstallApp(appId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/desktop/apps/${appId}`)
  },

  async updateWindowState(appId: string, state: Partial<WindowState>): Promise<void> {
    await axios.put(`${API_URL}/api/desktop/apps/${appId}/window`, state)
  },

  async executeApp(appId: string, data?: any): Promise<any> {
    const response = await axios.post(`${API_URL}/api/desktop/apps/${appId}/execute`, { data })
    return response.data
  },

  async getMessages(): Promise<DesktopMessage[]> {
    const response = await axios.get(`${API_URL}/api/desktop/messages`)
    return response.data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))
  },

  async sendMessage(message: Omit<DesktopMessage, 'id' | 'timestamp' | 'read'>): Promise<DesktopMessage> {
    const response = await axios.post(`${API_URL}/api/desktop/messages`, message)
    return {
      ...response.data.message,
      timestamp: new Date(response.data.message.timestamp),
    }
  },

  async markMessageAsRead(messageId: string): Promise<void> {
    await axios.put(`${API_URL}/api/desktop/messages/${messageId}/read`)
  },
}

