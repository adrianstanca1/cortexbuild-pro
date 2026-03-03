import { Router } from 'express'
import { teamController } from '../controllers/teamController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All team routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Team management routes
router.get('/', teamController.getTeamMembers)
router.post('/', teamController.createTeamMember)
router.get('/:memberId', teamController.getTeamMember)
router.put('/:memberId', teamController.updateTeamMember)
router.delete('/:memberId', teamController.deleteTeamMember)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'team routes active', route: '/api/team' })
})

export { router as teamRouter }

