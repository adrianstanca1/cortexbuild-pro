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

