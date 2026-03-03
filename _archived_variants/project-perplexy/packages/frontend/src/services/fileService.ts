import axios from 'axios'

// Use relative URL when VITE_API_URL is empty (for Docker/nginx proxying)
// If VITE_API_URL is explicitly set to empty string, use relative URLs
// Otherwise, default to localhost for development
const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileNode[]
  content?: string
  size?: number
  modified?: string
}

export const fileService = {
  async listFiles(path = ''): Promise<FileNode[]> {
    const response = await axios.get(`${API_URL}/api/files`, {
      params: { path },
    })
    return response.data
  },

  async getFile(path: string): Promise<FileNode> {
    const response = await axios.get(`${API_URL}/api/files/content`, {
      params: { path },
    })
    return response.data
  },

  async createFile(name: string, content: string, path = ''): Promise<FileNode> {
    const response = await axios.post(`${API_URL}/api/files`, {
      name,
      content,
      path,
    })
    return response.data
  },

  async updateFile(path: string, content: string): Promise<void> {
    await axios.put(`${API_URL}/api/files`, {
      path,
      content,
    })
  },

  async deleteFile(path: string): Promise<void> {
    await axios.delete(`${API_URL}/api/files`, {
      params: { path },
    })
  },

  async uploadFile(file: File, path = ''): Promise<FileNode> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', path)

    const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getFileStats(): Promise<{
    totalFiles: number
    totalSize: number
    totalDirectories: number
    fileTypes: Record<string, number>
  }> {
    const response = await axios.get(`${API_URL}/api/files/stats`)
    return response.data.stats
  },
}

