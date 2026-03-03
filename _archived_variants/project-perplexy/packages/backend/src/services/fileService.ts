import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { ApiError } from '../utils/ApiError.js'
import logger from '../config/logger.js'

const STORAGE_PATH = process.env.FILE_STORAGE_PATH || './storage'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB

interface FileNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileNode[]
  content?: string
  size?: number
  modified?: string
}

async function ensureStorageDirectory() {
  try {
    await fs.mkdir(STORAGE_PATH, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

export const fileService = {
  async listFiles(dirPath: string = ''): Promise<FileNode[]> {
    await ensureStorageDirectory()
    const fullPath = path.join(STORAGE_PATH, dirPath)

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true })
      const files: FileNode[] = []

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name)
        const fullEntryPath = path.join(fullPath, entry.name)

        if (entry.isDirectory()) {
          files.push({
            id: uuidv4(),
            name: entry.name,
            type: 'directory',
            path: entryPath,
          })
        } else {
          const stats = await fs.stat(fullEntryPath)
          files.push({
            id: uuidv4(),
            name: entry.name,
            type: 'file',
            path: entryPath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          })
        }
      }

      return files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []
      }
      throw new ApiError(`Failed to list files: ${error.message}`, 500)
    }
  },

  async getFileContent(filePath: string): Promise<FileNode> {
    await ensureStorageDirectory()
    const fullPath = path.join(STORAGE_PATH, filePath)

    try {
      const stats = await fs.stat(fullPath)
      if (stats.isDirectory()) {
        throw new ApiError('Path is a directory, not a file', 400)
      }

      const content = await fs.readFile(fullPath, 'utf-8')
      return {
        id: uuidv4(),
        name: path.basename(filePath),
        type: 'file',
        path: filePath,
        content,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new ApiError('File not found', 404)
      }
      throw new ApiError(`Failed to read file: ${error.message}`, 500)
    }
  },

  async createFile(name: string, content: string = '', dirPath: string = ''): Promise<FileNode> {
    await ensureStorageDirectory()
    const filePath = path.join(dirPath, name)
    const fullPath = path.join(STORAGE_PATH, filePath)

    try {
      // Ensure directory exists
      const dir = path.dirname(fullPath)
      await fs.mkdir(dir, { recursive: true })

      await fs.writeFile(fullPath, content, 'utf-8')
      const stats = await fs.stat(fullPath)

      return {
        id: uuidv4(),
        name,
        type: 'file',
        path: filePath,
        content,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      }
    } catch (error: any) {
      throw new ApiError(`Failed to create file: ${error.message}`, 500)
    }
  },

  async updateFile(filePath: string, content: string): Promise<void> {
    await ensureStorageDirectory()
    const fullPath = path.join(STORAGE_PATH, filePath)

    try {
      const stats = await fs.stat(fullPath)
      if (stats.size + content.length > MAX_FILE_SIZE) {
        throw new ApiError('File size exceeds maximum allowed size', 400)
      }

      await fs.writeFile(fullPath, content, 'utf-8')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new ApiError('File not found', 404)
      }
      throw new ApiError(`Failed to update file: ${error.message}`, 500)
    }
  },

  async deleteFile(filePath: string): Promise<void> {
    await ensureStorageDirectory()
    const fullPath = path.join(STORAGE_PATH, filePath)

    try {
      const stats = await fs.stat(fullPath)
      if (stats.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true })
      } else {
        await fs.unlink(fullPath)
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new ApiError('File not found', 404)
      }
      throw new ApiError(`Failed to delete file: ${error.message}`, 500)
    }
  },

  async uploadFile(file: Express.Multer.File, dirPath: string = ''): Promise<FileNode> {
    await ensureStorageDirectory()
    const filePath = path.join(dirPath, file.originalname)
    const fullPath = path.join(STORAGE_PATH, filePath)

    try {
      // Ensure directory exists
      const dir = path.dirname(fullPath)
      await fs.mkdir(dir, { recursive: true })

      await fs.rename(file.path, fullPath)
      const stats = await fs.stat(fullPath)

      return {
        id: uuidv4(),
        name: file.originalname,
        type: 'file',
        path: filePath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      }
    } catch (error: any) {
      throw new ApiError(`Failed to upload file: ${error.message}`, 500)
    }
  },

  async getFileStats(): Promise<{
    totalFiles: number
    totalSize: number
    totalDirectories: number
    fileTypes: Record<string, number>
  }> {
    await ensureStorageDirectory()

    let totalFiles = 0
    let totalSize = 0
    let totalDirectories = 0
    const fileTypes: Record<string, number> = {}

    const countFiles = async (dirPath: string = ''): Promise<void> => {
      try {
        const fullPath = path.join(STORAGE_PATH, dirPath)
        const entries = await fs.readdir(fullPath, { withFileTypes: true })

        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name)
          const fullEntryPath = path.join(fullPath, entry.name)

          if (entry.isDirectory()) {
            totalDirectories++
            await countFiles(entryPath)
          } else {
            totalFiles++
            const stats = await fs.stat(fullEntryPath)
            totalSize += stats.size

            const ext = path.extname(entry.name).toLowerCase() || 'no-extension'
            fileTypes[ext] = (fileTypes[ext] || 0) + 1
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          logger.error('Error counting files:', { error: error.message, code: error.code })
        }
      }
    }

    await countFiles()

    return {
      totalFiles,
      totalSize,
      totalDirectories,
      fileTypes,
    }
  },
}

