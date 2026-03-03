/**
 * Document Agent
 * OCR processing, automatic categorization, and intelligent routing
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

class DocumentAgent extends BaseAgent {
  constructor() {
    super('Document Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['action'])

    const { action } = input

    try {
      switch (action) {
        case 'process_ocr':
          return await this.processOCR(input.documentId, context)
        case 'categorize':
          return await this.categorizeDocument(input.documentId, context)
        case 'route':
          return await this.routeDocument(input.documentId, context)
        case 'extract_metadata':
          return await this.extractMetadata(input.documentId, context)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      this.log('error', 'Document processing failed', { error: error.message })
      throw error
    }
  }

  private async processOCR(
    documentId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const document = await prisma.documentStore.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Simulated OCR processing
    const ocrText = this.simulateOCR(document)
    const extractedData = this.extractStructuredData(ocrText)

    await prisma.documentStore.update({
      where: { id: documentId },
      data: {
        ocrProcessed: true,
        ocrText,
        aiMetadata: extractedData as any,
      },
    })

    return {
      output: {
        ocrText,
        extractedData,
        confidence: 0.9,
      },
      confidence: 0.9,
      tokensUsed: this.estimateTokens(ocrText),
    }
  }

  private async categorizeDocument(
    documentId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const document = await prisma.documentStore.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const category = this.determineCategory(document)
    const tags = this.generateTags(document)

    await prisma.documentStore.update({
      where: { id: documentId },
      data: {
        category,
        aiTags: tags,
      },
    })

    return {
      output: { category, tags },
      confidence: 0.85,
      tokensUsed: 200,
    }
  }

  private async routeDocument(
    documentId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const document = await prisma.documentStore.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const routing = {
      targetProject: this.determineTargetProject(document, context),
      targetUsers: this.determineTargetUsers(document, context),
      priority: this.determinePriority(document),
      action: this.determineAction(document),
    }

    return {
      output: routing,
      confidence: 0.8,
      tokensUsed: 150,
    }
  }

  private async extractMetadata(
    documentId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const document = await prisma.documentStore.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const metadata = {
      documentType: this.inferDocumentType(document),
      keyDates: this.extractDates(document.ocrText || ''),
      amounts: this.extractAmounts(document.ocrText || ''),
      parties: this.extractParties(document.ocrText || ''),
      references: this.extractReferences(document.ocrText || ''),
    }

    await prisma.documentStore.update({
      where: { id: documentId },
      data: {
        aiMetadata: metadata as any,
      },
    })

    return {
      output: metadata,
      confidence: 0.85,
      tokensUsed: this.estimateTokens(JSON.stringify(metadata)),
    }
  }

  // Helper methods
  private simulateOCR(document: any): string {
    // Placeholder - would integrate with actual OCR service
    return `Extracted text from ${document.name}`
  }

  private extractStructuredData(text: string): any {
    return {
      entities: [],
      keyValuePairs: {},
    }
  }

  private determineCategory(document: any): string {
    const name = document.name.toLowerCase()
    if (name.includes('contract')) return 'contract'
    if (name.includes('invoice')) return 'invoice'
    if (name.includes('drawing')) return 'drawing'
    if (name.includes('report')) return 'report'
    return 'other'
  }

  private generateTags(document: any): string[] {
    const tags: string[] = []
    const name = document.name.toLowerCase()
    if (name.includes('safety')) tags.push('safety')
    if (name.includes('compliance')) tags.push('compliance')
    return tags
  }

  private determineTargetProject(document: any, context: AgentContext): string | null {
    return document.projectId || context.projectId || null
  }

  private determineTargetUsers(document: any, context: AgentContext): string[] {
    return []
  }

  private determinePriority(document: any): string {
    return 'normal'
  }

  private determineAction(document: any): string {
    return 'review'
  }

  private inferDocumentType(document: any): string {
    return document.type || 'unknown'
  }

  private extractDates(text: string): string[] {
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/g
    return text.match(dateRegex) || []
  }

  private extractAmounts(text: string): number[] {
    const amountRegex = /£[\d,]+\.?\d*/g
    const matches = text.match(amountRegex) || []
    return matches.map((m) => parseFloat(m.replace(/[£,]/g, '')))
  }

  private extractParties(text: string): string[] {
    return []
  }

  private extractReferences(text: string): string[] {
    return []
  }
}

export const documentAgent = new DocumentAgent()

