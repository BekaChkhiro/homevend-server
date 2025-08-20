import { Router } from 'express';
import { 
  getAgencies, 
  getAgencyById, 
  updateAgency, 
  addAgentToAgency, 
  removeAgentFromAgency,
  getMyAgencyUsers,
  addUserToMyAgency,
  removeUserFromMyAgency
} from '../controllers/agencyController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAgencies);
router.get('/:id', getAgencyById);

// Protected routes (require authentication)
router.put('/:id', authenticate, updateAgency);
router.post('/:id/agents', authenticate, addAgentToAgency);
router.delete('/:id/agents/:agentId', authenticate, removeAgentFromAgency);

// My agency user management routes
router.get('/my/users', authenticate, getMyAgencyUsers);
router.post('/my/users', authenticate, addUserToMyAgency);
router.delete('/my/users/:userIdToRemove', authenticate, removeUserFromMyAgency);

export default router;