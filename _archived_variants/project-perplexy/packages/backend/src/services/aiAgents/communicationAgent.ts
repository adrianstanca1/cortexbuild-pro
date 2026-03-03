/**
 * Communication Agent
 * Natural language processing, sentiment analysis, and automated notifications
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

type ConversationMessage = {
  userId: string
  content: string
  createdAt: Date
  isDecision?: boolean
  decisionData?: any
}

class CommunicationAgent extends BaseAgent {
  constructor() {
    super('Communication Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['action'])

    const { action } = input

    try {
      switch (action) {
        case 'analyze_sentiment':
          return await this.analyzeSentiment(input.messageId, context)
        case 'generate_notification':
          return await this.generateNotification(input.event, context)
        case 'summarize_conversation':
          return await this.summarizeConversation(input.threadId, context)
        case 'extract_intent':
          return await this.extractIntent(input.message, context)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      this.log('error', 'Communication processing failed', { error: error.message })
      throw error
    }
  }

  private async analyzeSentiment(
    messageId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const message = await prisma.communicationMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      throw new Error('Message not found')
    }

    const sentiment = this.analyzeTextSentiment(message.content)

    await prisma.communicationMessage.update({
      where: { id: messageId },
      data: {
        sentiment: sentiment as any,
      },
    })

    return {
      output: sentiment,
      confidence: 0.85,
      tokensUsed: this.estimateTokens(message.content),
    }
  }

  private async generateNotification(
    event: any,
    context: AgentContext
  ): Promise<AgentResult> {
    const notification = {
      title: this.generateNotificationTitle(event),
      message: this.generateNotificationMessage(event),
      priority: this.determinePriority(event),
      recipients: this.determineRecipients(event, context),
      deliveryMethod: this.determineDeliveryMethod(event),
    }

    return {
      output: notification,
      confidence: 0.9,
      tokensUsed: this.estimateTokens(JSON.stringify(notification)),
    }
  }

  private async summarizeConversation(
    threadId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const messages: ConversationMessage[] = await prisma.communicationMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    })

    const summary = {
      totalMessages: messages.length,
      participants: [...new Set(messages.map((m: ConversationMessage) => m.userId))],
      keyPoints: this.extractKeyPoints(messages),
      sentiment: this.analyzeConversationSentiment(messages),
      decisions: this.extractDecisions(messages),
      actionItems: this.extractActionItems(messages),
    }

    return {
      output: summary,
      confidence: 0.8,
      tokensUsed: this.estimateTokens(JSON.stringify(summary)),
    }
  }

  private async extractIntent(
    message: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const intent = {
      intent: this.classifyIntent(message),
      entities: this.extractEntities(message),
      urgency: this.determineUrgency(message),
      category: this.categorizeMessage(message),
    }

    return {
      output: intent,
      confidence: 0.85,
      tokensUsed: this.estimateTokens(message),
    }
  }

  // Helper methods
  private analyzeTextSentiment(text: string): any {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'approved', 'success']
    const negativeWords = ['bad', 'poor', 'failed', 'rejected', 'problem', 'issue']
    
    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length

    let score = 0.5 // neutral
    if (positiveCount > negativeCount) score = 0.7
    if (negativeCount > positiveCount) score = 0.3

    return {
      score,
      label: score > 0.6 ? 'positive' : score < 0.4 ? 'negative' : 'neutral',
      confidence: 0.8,
    }
  }

  private generateNotificationTitle(event: any): string {
    return `${event.type}: ${event.title || 'New event'}`
  }

  private generateNotificationMessage(event: any): string {
    return event.description || 'A new event requires your attention'
  }

  private determinePriority(event: any): string {
    if (event.severity === 'critical') return 'urgent'
    if (event.severity === 'high') return 'high'
    return 'normal'
  }

  private determineRecipients(event: any, context: AgentContext): string[] {
    return []
  }

  private determineDeliveryMethod(event: any): string[] {
    return ['in-app']
  }

  private extractKeyPoints(messages: ConversationMessage[]): string[] {
    return messages.slice(0, 3).map((m: ConversationMessage) => m.content.substring(0, 100))
  }

  private analyzeConversationSentiment(messages: ConversationMessage[]): any {
    const sentiments = messages.map((m: ConversationMessage) => this.analyzeTextSentiment(m.content))
    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length
    return {
      average: avgScore,
      trend: 'stable',
    }
  }

  private extractDecisions(messages: ConversationMessage[]): any[] {
    return messages
      .filter((m: ConversationMessage) => m.isDecision)
      .map((m: ConversationMessage) => ({
        decision: m.decisionData,
        timestamp: m.createdAt,
      }))
  }

  private extractActionItems(messages: ConversationMessage[]): string[] {
    return []
  }

  private classifyIntent(message: string): string {
    const lower = message.toLowerCase()
    if (lower.includes('question') || lower.includes('?')) return 'question'
    if (lower.includes('request')) return 'request'
    if (lower.includes('approve') || lower.includes('approval')) return 'approval'
    return 'general'
  }

  private extractEntities(message: string): string[] {
    return []
  }

  private determineUrgency(message: string): string {
    const urgentKeywords = ['urgent', 'asap', 'immediate', 'critical']
    const lower = message.toLowerCase()
    return urgentKeywords.some((k) => lower.includes(k)) ? 'high' : 'normal'
  }

  private categorizeMessage(message: string): string {
    return 'general'
  }
}

export const communicationAgent = new CommunicationAgent()

