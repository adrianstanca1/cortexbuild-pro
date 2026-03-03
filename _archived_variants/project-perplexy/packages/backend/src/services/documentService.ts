/**
 * Document Service
 * Manages document storage and processing
 */

import { prisma } from '../config/database.js'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface DocumentFilters {
  organizationId?: string
  projectId?: string
  type?: string
  category?: string
}

interface CreateDocumentInput {
  name: string
  description?: string
  type: string
  category?: string
  projectId?: string
  organizationId: string
  file: Express.Multer.File
  accessLevel?: string
}

class DocumentService {
  async getDocuments(filters: DocumentFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.type) where.type = filters.type
    if (filters.category) where.category = filters.category

    return prisma.documentStore.findMany({
      where,
      include: {
        project: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getDocumentById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.documentStore.findFirst({
      where,
      include: {
        project: true,
        organization: true,
      },
    })
  }

  async createDocument(input: CreateDocumentInput) {
    // In production, upload to cloud storage (e.g., Google Cloud Storage)
    const fileUrl = `/uploads/${input.file.filename}` // Placeholder

    const document = await prisma.documentStore.create({
      data: {
        name: input.name,
        originalName: input.file.originalname,
        description: input.description,
        type: input.type,
        category: input.category,
        fileUrl,
        size: input.file.size,
        mimeType: input.file.mimetype,
        extension: input.file.originalname.split('.').pop() || '',
        organizationId: input.organizationId,
        projectId: input.projectId,
        accessLevel: input.accessLevel || 'organization',
        version: 1,
        isLatest: true,
      },
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${input.organizationId}`).emit('document:created', document)

    return document
  }

  async updateDocument(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.documentStore.findFirst({ where })
    if (!existing) {
      throw new Error('Document not found')
    }

    const updated = await prisma.documentStore.update({
      where: { id },
      data: updates,
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${updated.organizationId}`).emit('document:updated', updated)

    return updated
  }

  async deleteDocument(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.documentStore.deleteMany({ where })
  }

  async getVersions(documentId: string) {
    return prisma.documentStore.findMany({
      where: {
        OR: [
          { id: documentId },
          { parentVersionId: documentId },
        ],
      },
      orderBy: { version: 'desc' },
    })
  }

  async createVersion(documentId: string, file: Express.Multer.File) {
    const parent = await prisma.documentStore.findUnique({
      where: { id: documentId },
    })

    if (!parent) {
      throw new Error('Parent document not found')
    }

    // Mark parent as not latest
    await prisma.documentStore.update({
      where: { id: documentId },
      data: { isLatest: false },
    })

    const fileUrl = `/uploads/${file.filename}` // Placeholder

    const version = await prisma.documentStore.create({
      data: {
        name: parent.name,
        originalName: file.originalname,
        description: parent.description,
        type: parent.type,
        category: parent.category,
        fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        extension: file.originalname.split('.').pop() || '',
        version: parent.version + 1,
        parentVersionId: documentId,
        isLatest: true,
        organizationId: parent.organizationId,
        projectId: parent.projectId,
        accessLevel: parent.accessLevel,
      },
    })

    return version
  }
}

export const documentService = new DocumentService()

