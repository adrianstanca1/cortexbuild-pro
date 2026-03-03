import { Request, Response, NextFunction } from 'express'
import { drawingService } from '../services/drawingService.js'
import { mapService } from '../services/mapService.js'
import { ApiError } from '../utils/ApiError.js'

export const mapController = {
  async uploadDrawing(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ApiError('No file uploaded', 400)
      }

      const { projectId } = req.body
      if (!projectId) {
        throw new ApiError('Project ID is required', 400)
      }

      const drawingMap = await drawingService.processDrawing(
        req.file.path,
        projectId,
        req.file.originalname
      )

      res.json({
        success: true,
        drawingMap,
      })
    } catch (error) {
      next(error)
    }
  },

  async getDrawingMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params
      const drawingMap = await drawingService.getDrawingMap(projectId)

      if (!drawingMap) {
        throw new ApiError('Drawing map not found', 404)
      }

      res.json({
        success: true,
        drawingMap,
      })
    } catch (error) {
      next(error)
    }
  },

  async getAllDrawingMaps(_req: Request, res: Response, next: NextFunction) {
    try {
      const drawingMaps = await drawingService.getAllDrawingMaps()
      res.json({
        success: true,
        drawingMaps,
      })
    } catch (error) {
      next(error)
    }
  },

  async deleteDrawingMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params
      await drawingService.deleteDrawingMap(projectId)

      res.json({
        success: true,
        message: 'Drawing map deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  },

  async generateRealWorldMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { center, zoom = 15 } = req.body
      const mapView = await mapService.generateRealWorldMap(center, zoom)

      res.json({
        success: true,
        mapView,
      })
    } catch (error) {
      next(error)
    }
  },

  async reverseGeocode(req: Request, res: Response, next: NextFunction) {
    try {
      const { center } = req.body
      const address = await mapService.reverseGeocode(center)

      res.json({
        success: true,
        address,
      })
    } catch (error) {
      next(error)
    }
  },
}

