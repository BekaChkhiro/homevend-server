import { Router } from 'express';
import { 
  getFeatures, 
  getAdvantages, 
  getFurnitureAppliances, 
  getTags, 
  getAllLookupData,
  getEnums 
} from '../controllers/lookupController.js';

const router = Router();

// Lookup data routes (public)
router.get('/features', getFeatures);
router.get('/advantages', getAdvantages);
router.get('/furniture-appliances', getFurnitureAppliances);
router.get('/tags', getTags);
router.get('/enums', getEnums);
router.get('/all', getAllLookupData);

export default router;