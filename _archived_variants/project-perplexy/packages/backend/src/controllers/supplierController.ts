import { Request, Response, NextFunction } from 'express'
import { supplierService } from '../services/supplierService.js'
import { ApiError } from '../utils/ApiError.js'

export const supplierController = {
  async getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await supplierService.getSuppliers()
      res.json({ success: true, suppliers })
    } catch (error) {
      next(error)
    }
  },

  async getSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const { supplierId } = req.params
      const supplier = await supplierService.getSupplier(supplierId)
      if (!supplier) {
        throw new ApiError('Supplier not found', 404)
      }
      res.json({ success: true, supplier })
    } catch (error) {
      next(error)
    }
  },

  async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.createSupplier(req.body)
      res.json({ success: true, supplier, message: 'Supplier created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const { supplierId } = req.params
      const supplier = await supplierService.updateSupplier(supplierId, req.body)
      res.json({ success: true, supplier, message: 'Supplier updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const { supplierId } = req.params
      await supplierService.deleteSupplier(supplierId)
      res.json({ success: true, message: 'Supplier deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getSupplierStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await supplierService.getSupplierStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

