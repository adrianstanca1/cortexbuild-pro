/**
 * AI Agent API Routes
 * Execute and manage AI agents
 */

import { Router } from 'express'
import { authenticate, scopeFilter } from '../../middleware/auth.js'
import { aiAgentController } from '../../controllers/v1/aiAgentController.js'
import { validateRequest } from '../../middleware/validation.js'
import { z } from 'zod'

const router: Router = Router()

// All routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Execute agent
router.post(
  '/execute',
  validateRequest({
    body: z.object({
      agentType: z.enum([
        'PROCUREMENT',
        'COMPLIANCE',
        'SAFETY',
        'RESOURCE',
        'DOCUMENT',
        'DECISION',
        'COMMUNICATION',
        'DUE_DILIGENCE',
        'SCHEDULING',
      ]),
      context: z.record(z.any()),
      input: z.record(z.any()),
    }),
  }),
  aiAgentController.executeAgent
)

// Get execution history
router.get('/executions', aiAgentController.getExecutionHistory)

// Get execution by ID
router.get('/executions/:id', aiAgentController.getExecutionById)

// Review execution
router.post('/executions/:id/review', aiAgentController.reviewExecution)

export { router as aiAgentRouter }

