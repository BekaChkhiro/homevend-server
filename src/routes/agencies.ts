import { Router } from 'express';
import { 
  getAgencies, 
  getAgencyById, 
  updateAgency, 
  addAgentToAgency, 
  removeAgentFromAgency,
  getCurrentAgency,
  getMyAgencyUsers,
  addUserToMyAgency,
  removeUserFromMyAgency
} from '../controllers/agencyController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAgencies);

// My agency management routes (must come BEFORE /:id routes)
router.get('/my', authenticate, getCurrentAgency);
router.get('/my/users', authenticate, getMyAgencyUsers);
router.post('/my/users', authenticate, addUserToMyAgency);
router.delete('/my/users/:userIdToRemove', authenticate, removeUserFromMyAgency);

// Public route with ID parameter (must come AFTER specific routes)
router.get('/:id', getAgencyById);

// Protected routes (require authentication)
router.put('/:id', authenticate, updateAgency);
router.post('/:id/agents', authenticate, addAgentToAgency);
router.delete('/:id/agents/:agentId', authenticate, removeAgentFromAgency);

export default router;