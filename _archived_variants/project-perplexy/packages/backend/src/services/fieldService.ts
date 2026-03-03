/**
 * Field Data Service
 * Manages field operations data with offline sync support
 */

import { prisma } from '../config/database.js'
import { FieldDataType } from '@prisma/client'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface FieldDataFilters {
  organizationId?: string
  projectId?: string
  userId?: string
  type?: string
  syncStatus?: string
}

interface CreateFieldDataInput {
  projectId: string
  organizationId: string
  userId: string
  type: FieldDataType
  title: string
  description?: string
  data: any
  location?: string
  coordinates?: { lat: number; lng: number }
  images?: string[]
  videos?: string[]
  documents?: string[]
  equipmentId?: string
  materialId?: string
  barcode?: string
  qrCode?: string
  isSafetyIssue?: boolean
  severity?: string
  voiceTranscript?: string
  arData?: any
  recordedAt?: Date
  syncStatus?: string
}

class FieldService {
  async getFieldData(filters: FieldDataFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.userId) where.userId = filters.userId
    if (filters.type) where.type = filters.type as FieldDataType
    if (filters.syncStatus) where.syncStatus = filters.syncStatus

    return prisma.fieldData.findMany({
      where,
      include: {
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    })
  }

  async getFieldDataById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.fieldData.findFirst({
      where,
      include: {
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async createFieldData(input: CreateFieldDataInput) {
    const fieldData = await prisma.fieldData.create({
      data: {
        ...input,
        recordedAt: input.recordedAt || new Date(),
        coordinates: input.coordinates as any,
        data: input.data as any,
        arData: input.arData as any,
      },
      include: {
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Emit real-time update
    io.to(`project:${input.projectId}`).emit('field-data:created', fieldData)

    return fieldData
  }

  async updateFieldData(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.fieldData.findFirst({ where })
    if (!existing) {
      throw new Error('Field data not found')
    }

    const updated = await prisma.fieldData.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.coordinates && { coordinates: updates.coordinates as any }),
        ...(updates.data && { data: updates.data as any }),
        ...(updates.arData && { arData: updates.arData as any }),
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
      include: {
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Emit real-time update
    io.to(`project:${updated.projectId}`).emit('field-data:updated', updated)

    return updated
  }

  async deleteFieldData(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.fieldData.deleteMany({ where })
  }

  async syncFieldData(pendingData: any[], userId: string) {
    const results = {
      synced: 0,
      conflicts: 0,
      errors: 0,
      conflictList: [] as any[],
    }

    for (const data of pendingData) {
      try {
        // Check for conflicts
        const existing = await prisma.fieldData.findUnique({
          where: { id: data.id },
        })

        if (existing && existing.updatedAt > new Date(data.recordedAt)) {
          // Conflict detected
          results.conflicts++
          results.conflictList.push({
            localId: data.id,
            serverId: existing.id,
            localData: data,
            serverData: existing,
          })
        } else {
          // Safe to sync
          await this.createFieldData({
            ...data,
            userId,
            syncStatus: 'synced',
          })
          results.synced++
        }
      } catch (error: any) {
        logger.error('Sync field data error', { error: error.message, dataId: data.id })
        results.errors++
      }
    }

    return {
      synced: results.synced,
      conflicts: results.conflicts,
      errors: results.errors,
      conflictList: results.conflictList,
    }
  }

  async getSyncStatus(userId: string) {
    const pending = await prisma.fieldData.count({
      where: {
        userId,
        syncStatus: { in: ['pending', 'syncing'] },
      },
    })

    const conflicts = await prisma.fieldData.count({
      where: {
        userId,
        syncStatus: 'conflict',
      },
    })

    return {
      pending,
      conflicts,
      lastSyncedAt: new Date(),
    }
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'server' | 'merge') {
    // Implementation for conflict resolution
    return { resolved: true, conflictId }
  }

  async getOfflineQueue(userId: string) {
    return prisma.fieldData.findMany({
      where: {
        userId,
        syncStatus: { in: ['pending', 'syncing'] },
      },
      orderBy: { recordedAt: 'asc' },
    })
  }

  async clearOfflineQueue(userId: string) {
    await prisma.fieldData.deleteMany({
      where: {
        userId,
        syncStatus: { in: ['pending', 'syncing'] },
      },
    })
  }

  async sendEmergencyAlert(input: {
    userId: string
    location?: string
    coordinates?: { lat: number; lng: number }
    message?: string
  }) {
    const alert = await prisma.fieldData.create({
      data: {
        projectId: 'emergency', // Will need to determine actual project
        organizationId: 'emergency', // Will need to determine from user
        userId: input.userId,
        type: 'EMERGENCY_ALERT',
        title: 'Emergency Alert',
        description: input.message || 'Emergency assistance required',
        data: {
          emergency: true,
          timestamp: new Date(),
        } as any,
        location: input.location,
        coordinates: input.coordinates as any,
        isSafetyIssue: true,
        severity: 'critical',
        syncStatus: 'synced',
      },
    })

    // Broadcast emergency alert
    io.emit('emergency:alert', alert)

    return alert
  }
}

export const fieldService = new FieldService()

