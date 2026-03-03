/**
 * AI Agents Unit Tests
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'

const shouldRun = process.env.RUN_AGENT_TESTS === 'true'
const describeAgents = shouldRun ? describe : describe.skip

let agentOrchestrator!: typeof import('../../src/services/aiAgents/agentOrchestrator').agentOrchestrator
let AIAgentType!: typeof import('../../src/types/aiAgent').AIAgentType

describeAgents('AI Agent Orchestrator', () => {
  beforeAll(async () => {
    if (!shouldRun) return
    const agentModule = await import('../../src/services/aiAgents/agentOrchestrator')
    agentOrchestrator = agentModule.agentOrchestrator
    const typesModule = await import('../../src/types/aiAgent')
    AIAgentType = typesModule.AIAgentType
  })
  beforeEach(() => {
    // Setup
  })

  it('should execute procurement agent', async () => {
    const result = await agentOrchestrator.executeAgent({
      agentType: AIAgentType.PROCUREMENT,
      context: {
        organizationId: 'test-org',
      },
      input: {
        type: 'MATERIALS',
        requirements: ['concrete', 'steel'],
        budget: 10000,
      },
    })

    expect(result.success).toBe(true)
    expect(result.output).toBeDefined()
  })

  it('should execute safety agent', async () => {
    const result = await agentOrchestrator.executeAgent({
      agentType: AIAgentType.SAFETY,
      context: {
        organizationId: 'test-org',
        projectId: 'test-project',
      },
      input: {
        action: 'predict_risks',
      },
    })

    expect(result.success).toBe(true)
    expect(result.output).toBeDefined()
  })

  it('should handle agent execution errors', async () => {
    const result = await agentOrchestrator.executeAgent({
      agentType: AIAgentType.PROCUREMENT,
      context: {},
      input: {}, // Missing required fields
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

