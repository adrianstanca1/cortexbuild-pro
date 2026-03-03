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

