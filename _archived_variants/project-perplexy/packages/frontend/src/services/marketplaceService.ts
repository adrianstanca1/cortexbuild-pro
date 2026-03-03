import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface MarketplaceApp {
  id: string
  name: string
  description: string
  code: string
  language: string
  category: string
  author: string
  authorId: string
  version: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
  downloads: number
  rating?: number
  reviews?: number
}

export interface PublishAppRequest {
  name: string
  description: string
  code: string
  language: string
  category: string
}

export const marketplaceService = {
  async getApps(category?: string, search?: string): Promise<MarketplaceApp[]> {
    const response = await axios.get(`${API_URL}/api/marketplace/apps`, {
      params: { category, search },
    })
    return response.data.apps.map((app: any) => ({
      ...app,
      createdAt: new Date(app.createdAt),
      updatedAt: new Date(app.updatedAt),
    }))
  },

  async getApp(appId: string): Promise<MarketplaceApp> {
    const response = await axios.get(`${API_URL}/api/marketplace/apps/${appId}`)
    return {
      ...response.data.app,
      createdAt: new Date(response.data.app.createdAt),
      updatedAt: new Date(response.data.app.updatedAt),
    }
  },

  async publishApp(app: PublishAppRequest): Promise<MarketplaceApp> {
    const response = await axios.post(`${API_URL}/api/marketplace/apps`, app)
    return {
      ...response.data.app,
      createdAt: new Date(response.data.app.createdAt),
      updatedAt: new Date(response.data.app.updatedAt),
    }
  },

  async installApp(appId: string): Promise<void> {
    await axios.post(`${API_URL}/api/marketplace/apps/${appId}/install`)
  },

  async uninstallApp(appId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/marketplace/apps/${appId}/install`)
  },

  async getInstalledApps(): Promise<MarketplaceApp[]> {
    const response = await axios.get(`${API_URL}/api/marketplace/installed`)
    return response.data.apps.map((app: any) => ({
      ...app,
      createdAt: new Date(app.createdAt),
      updatedAt: new Date(app.updatedAt),
    }))
  },

  async getMyApps(): Promise<MarketplaceApp[]> {
    const response = await axios.get(`${API_URL}/api/marketplace/my-apps`)
    return response.data.apps.map((app: any) => ({
      ...app,
      createdAt: new Date(app.createdAt),
      updatedAt: new Date(app.updatedAt),
    }))
  },
}

