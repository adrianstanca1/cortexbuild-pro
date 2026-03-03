import { Request, Response, NextFunction } from 'express'
import { contractService } from '../services/contractService.js'
import { ApiError } from '../utils/ApiError.js'

export const contractController = {
  async getContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const contracts = await contractService.getContracts()
      res.json({ success: true, contracts })
    } catch (error) {
      next(error)
    }
  },

  async getContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractId } = req.params
      const contract = await contractService.getContract(contractId)
      if (!contract) {
        throw new ApiError('Contract not found', 404)
      }
      res.json({ success: true, contract })
    } catch (error) {
      next(error)
    }
  },

  async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await contractService.createContract(req.body)
      res.json({ success: true, contract, message: 'Contract created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractId } = req.params
      const contract = await contractService.updateContract(contractId, req.body)
      res.json({ success: true, contract, message: 'Contract updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractId } = req.params
      await contractService.deleteContract(contractId)
      res.json({ success: true, message: 'Contract deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getContractStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await contractService.getContractStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

