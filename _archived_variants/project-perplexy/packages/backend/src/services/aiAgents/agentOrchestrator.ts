/**
 * AI Agent Orchestrator
 * Coordinates execution of all 9 specialized AI agents
 */

import { AIAgentType, AIAgentStatus } from '../../types/aiAgent.js'
import { procurementAgent } from './procurementAgent.js'
import { complianceAgent } from './complianceAgent.js'
import { safetyAgent } from './safetyAgent.js'
import { resourceAgent } from './resourceAgent.js'
import { documentAgent } from './documentAgent.js'
import { decisionAgent } from './decisionAgent.js'
import { communicationAgent } from './communicationAgent.js'
import { dueDiligenceAgent } from './dueDiligenceAgent.js'
import { schedulingAgent } from './schedulingAgent.js'
import { prisma } from '../../config/database.js'
import logger from '../../config/logger.js'

export interface AgentExecutionRequest {
  agentType: AIAgentType
  context: {
    organizationId?: string
    projectId?: string
    tenderId?: string
    taskId?: string
    documentId?: string
    [key: string]: any
  }
  input: Record<string, any>
  userId?: string
}

export interface AgentExecutionResult {
  success: boolean
  output?: any
  error?: string
  confidence?: number
  requiresReview?: boolean
  executionTime?: number
  tokensUsed?: number
}

class AgentOrchestrator {
  private agents: Map<AIAgentType, any> = new Map()

  constructor() {
    // Initialize all agents
    this.agents.set(AIAgentType.PROCUREMENT, procurementAgent)
    this.agents.set(AIAgentType.COMPLIANCE, complianceAgent)
    this.agents.set(AIAgentType.SAFETY, safetyAgent)
    this.agents.set(AIAgentType.RESOURCE, resourceAgent)
    this.agents.set(AIAgentType.DOCUMENT, documentAgent)
    this.agents.set(AIAgentType.DECISION, decisionAgent)
    this.agents.set(AIAgentType.COMMUNICATION, communicationAgent)
    this.agents.set(AIAgentType.DUE_DILIGENCE, dueDiligenceAgent)
    this.agents.set(AIAgentType.SCHEDULING, schedulingAgent)
  }

  /**
   * Execute an AI agent with full tracking
   */
  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const startTime = Date.now()
    const agent = this.agents.get(request.agentType)

    if (!agent) {
      throw new Error(`Unknown agent type: ${request.agentType}`)
    }

    // Create execution record
    const execution = await prisma.aIAgentExecution.create({
      data: {
        agentId: `${request.agentType}-${Date.now()}`,
        agentName: this.getAgentName(request.agentType),
        agentType: request.agentType,
        organizationId: request.context.organizationId,
        projectId: request.context.projectId,
        tenderId: request.context.tenderId,
        taskId: request.context.taskId,
        documentId: request.context.documentId,
        status: AIAgentStatus.RUNNING,
        input: request.input as any,
        startedAt: new Date(),
      },
    })

    try {
      logger.info(`Executing ${request.agentType} agent`, {
        executionId: execution.id,
        context: request.context,
      })

      // Execute the agent
      const result = await agent.execute(request.input, request.context)

      const executionTime = Date.now() - startTime

      // Update execution record
      await prisma.aIAgentExecution.update({
        where: { id: execution.id },
        data: {
          status: result.requiresReview
            ? AIAgentStatus.REQUIRES_REVIEW
            : AIAgentStatus.COMPLETED,
          output: result.output as any,
          confidence: result.confidence,
          requiresReview: result.requiresReview,
          executionTime,
          tokensUsed: result.tokensUsed,
          completedAt: new Date(),
        },
      })

      return {
        success: true,
        output: result.output,
        confidence: result.confidence,
        requiresReview: result.requiresReview,
        executionTime,
        tokensUsed: result.tokensUsed,
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime

      logger.error(`Agent execution failed: ${request.agentType}`, {
        executionId: execution.id,
        error: error.message,
      })

      await prisma.aIAgentExecution.update({
        where: { id: execution.id },
        data: {
          status: AIAgentStatus.FAILED,
          error: error.message,
          errorDetails: { stack: error.stack } as any,
          executionTime,
          completedAt: new Date(),
        },
      })

      return {
        success: false,
        error: error.message,
        executionTime,
      }
    }
  }

  /**
   * Execute multiple agents in parallel
   */
  async executeAgents(
    requests: AgentExecutionRequest[]
  ): Promise<AgentExecutionResult[]> {
    return Promise.all(requests.map((req) => this.executeAgent(req)))
  }

  /**
   * Get agent execution history
   */
  async getExecutionHistory(filters: {
    agentType?: AIAgentType
    organizationId?: string
    projectId?: string
    status?: AIAgentStatus
    limit?: number
  }) {
    return prisma.aIAgentExecution.findMany({
      where: {
        ...(filters.agentType && { agentType: filters.agentType }),
        ...(filters.organizationId && { organizationId: filters.organizationId }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.status && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    })
  }

  private getAgentName(agentType: AIAgentType): string {
    const names: Record<AIAgentType, string> = {
      [AIAgentType.PROCUREMENT]: 'Procurement Agent',
      [AIAgentType.COMPLIANCE]: 'Compliance Agent',
      [AIAgentType.SAFETY]: 'Safety Agent',
      [AIAgentType.RESOURCE]: 'Resource Agent',
      [AIAgentType.DOCUMENT]: 'Document Agent',
      [AIAgentType.DECISION]: 'Decision Agent',
      [AIAgentType.COMMUNICATION]: 'Communication Agent',
      [AIAgentType.DUE_DILIGENCE]: 'Due Diligence Agent',
      [AIAgentType.SCHEDULING]: 'Scheduling Agent',
    }
    return names[agentType] || 'Unknown Agent'
  }
}

export const agentOrchestrator = new AgentOrchestrator()

