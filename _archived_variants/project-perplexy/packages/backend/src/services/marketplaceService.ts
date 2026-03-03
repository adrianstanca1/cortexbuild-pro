import { v4 as uuidv4 } from 'uuid'
import { MarketplaceApp, PublishAppRequest } from '../types/marketplace.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
const apps: MarketplaceApp[] = []
const installedApps: Map<string, Set<string>> = new Map() // userId -> Set<appId>

export const marketplaceService = {
  async getApps(category?: string, search?: string): Promise<MarketplaceApp[]> {
    let filteredApps = apps.filter((app) => app.status === 'approved')

    if (category) {
      filteredApps = filteredApps.filter((app) => app.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredApps = filteredApps.filter(
        (app) =>
          app.name.toLowerCase().includes(searchLower) ||
          app.description.toLowerCase().includes(searchLower)
      )
    }

    return filteredApps.sort((a, b) => b.downloads - a.downloads)
  },

  async getApp(appId: string): Promise<MarketplaceApp | null> {
    return apps.find((app) => app.id === appId) || null
  },

  async publishApp(app: PublishAppRequest, authorId: string = 'anonymous', author: string = 'Anonymous'): Promise<MarketplaceApp> {
    // Validate app
    if (!app.name || !app.description || !app.code || !app.language || !app.category) {
      throw new ApiError('All fields are required', 400)
    }

    // Create new app
    const newApp: MarketplaceApp = {
      id: uuidv4(),
      name: app.name,
      description: app.description,
      code: app.code,
      language: app.language,
      category: app.category,
      author,
      authorId,
      version: '1.0.0',
      status: 'pending', // Requires review
      createdAt: new Date(),
      updatedAt: new Date(),
      downloads: 0,
    }

    apps.push(newApp)
    return newApp
  },

  async approveApp(appId: string): Promise<MarketplaceApp> {
    const app = apps.find((a) => a.id === appId)
    if (!app) {
      throw new ApiError('App not found', 404)
    }

    app.status = 'approved'
    app.updatedAt = new Date()
    return app
  },

  async rejectApp(appId: string): Promise<MarketplaceApp> {
    const app = apps.find((a) => a.id === appId)
    if (!app) {
      throw new ApiError('App not found', 404)
    }

    app.status = 'rejected'
    app.updatedAt = new Date()
    return app
  },

  async installApp(appId: string, userId: string = 'anonymous'): Promise<void> {
    const app = apps.find((a) => a.id === appId)
    if (!app) {
      throw new ApiError('App not found', 404)
    }

    if (app.status !== 'approved') {
      throw new ApiError('App is not approved', 400)
    }

    if (!installedApps.has(userId)) {
      installedApps.set(userId, new Set())
    }

    installedApps.get(userId)!.add(appId)
    app.downloads++
    app.updatedAt = new Date()
  },

  async uninstallApp(appId: string, userId: string = 'anonymous'): Promise<void> {
    const userInstalled = installedApps.get(userId)
    if (userInstalled) {
      userInstalled.delete(appId)
    }
  },

  async getInstalledApps(userId: string = 'anonymous'): Promise<MarketplaceApp[]> {
    const userInstalled = installedApps.get(userId) || new Set()
    return apps.filter((app) => userInstalled.has(app.id))
  },

  async getMyApps(authorId: string = 'anonymous'): Promise<MarketplaceApp[]> {
    return apps.filter((app) => app.authorId === authorId)
  },
}

