/**
 * AI Agent Types and Interfaces
 */

export enum AIAgentType {
  PROCUREMENT = 'PROCUREMENT',
  COMPLIANCE = 'COMPLIANCE',
  SAFETY = 'SAFETY',
  RESOURCE = 'RESOURCE',
  DOCUMENT = 'DOCUMENT',
  DECISION = 'DECISION',
  COMMUNICATION = 'COMMUNICATION',
  DUE_DILIGENCE = 'DUE_DILIGENCE',
  SCHEDULING = 'SCHEDULING',
}

export enum AIAgentStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
}

export interface AgentContext {
  organizationId?: string
  projectId?: string
  tenderId?: string
  taskId?: string
  documentId?: string
  userId?: string
  [key: string]: any
}

export interface AgentResult {
  output: any
  confidence?: number
  requiresReview?: boolean
  tokensUsed?: number
  metadata?: Record<string, any>
}

