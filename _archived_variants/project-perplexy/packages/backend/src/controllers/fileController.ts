import { Request, Response, NextFunction } from 'express'
import { fileService } from '../services/fileService.js'
import { ApiError } from '../utils/ApiError.js'

export const fileController = {
  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const path = (req.query.path as string) || ''
      const files = await fileService.listFiles(path)
      res.json(files)
    } catch (error) {
      next(error)
    }
  },

  async getFileContent(req: Request, res: Response, next: NextFunction) {
    try {
      const path = req.query.path as string
      if (!path) {
        throw new ApiError('Path is required', 400)
      }
      const file = await fileService.getFileContent(path)
      res.json(file)
    } catch (error) {
      next(error)
    }
  },

  async createFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, content = '', path = '' } = req.body
      const file = await fileService.createFile(name, content, path)
      res.status(201).json(file)
    } catch (error) {
      next(error)
    }
  },

  async updateFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { path, content } = req.body
      await fileService.updateFile(path, content)
      res.json({ message: 'File updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const path = req.query.path as string
      if (!path) {
        throw new ApiError('Path is required', 400)
      }
      await fileService.deleteFile(path)
      res.json({ message: 'File deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ApiError('No file uploaded', 400)
      }
      const path = (req.body.path as string) || ''
      const file = await fileService.uploadFile(req.file, path)
      res.status(201).json(file)
    } catch (error) {
      next(error)
    }
  },

  async getFileStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await fileService.getFileStats()
      res.json({
        success: true,
        stats,
      })
    } catch (error) {
      next(error)
    }
  },
}

