import { Router } from 'express';
import { 
  createProject, 
  getProjects, 
  getProjectById,
  getUserProjects,
  getProjectsByDeveloperId,
  updateProject, 
  deleteProject
} from '../controllers/projectController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { projectSchema } from '../utils/validation.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', getProjects);
router.get('/developer/:developerId', getProjectsByDeveloperId);

// Specific authenticated routes (must come before /:id)
router.get('/my-projects', authenticate, getUserProjects);

// Public route for project by ID (must come after specific routes)
router.get('/:id', getProjectById);

// Apply authentication middleware for remaining routes
router.use(authenticate);
router.post('/', validate(projectSchema), createProject);
router.put('/:id', validate(projectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;