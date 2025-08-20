import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserAsAdmin,
  deleteUser,
  getDashboardStats,
  getAllProjects,
  getProjectById,
  updateProjectAsAdmin,
  deleteProjectAsAdmin,
  getAllProperties,
  getAllAgencies,
  getAgencyById,
  updateAgencyAsAdmin,
  deleteAgencyAsAdmin
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { projectSchema } from '../utils/validation.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.put('/users/:id', updateUserAsAdmin);
router.delete('/users/:id', deleteUser);

// Project Management
router.get('/projects', getAllProjects);
router.get('/projects/:id', getProjectById);
router.put('/projects/:id', updateProjectAsAdmin);
router.delete('/projects/:id', deleteProjectAsAdmin);

// Property Management
router.get('/properties', getAllProperties);

// Agency Management
router.get('/agencies', getAllAgencies);
router.get('/agencies/:id', getAgencyById);
router.put('/agencies/:id', updateAgencyAsAdmin);
router.delete('/agencies/:id', deleteAgencyAsAdmin);

export default router;