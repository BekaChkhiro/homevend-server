import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { uploadLogo } from '../middleware/upload.js';
import { UniversalUploadController } from '../controllers/UniversalUploadController.js';

const router = Router();


const universalUploadController = new UniversalUploadController();

// Configure multer for memory storage (S3 uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
    files: 15, // Max 15 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/svg+xml',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Universal routes that work with any entity
// Temporary debug route without authentication
router.post(
  '/debug/:entityType/:entityId',
  upload.array('images'),
  universalUploadController.uploadImages.bind(universalUploadController)
);

router.post(
  '/:entityType/:entityId',
  authenticate,
  upload.array('images'),
  universalUploadController.uploadImages.bind(universalUploadController)
);

router.get(
  '/:entityType/:entityId/images',
  universalUploadController.getEntityImages.bind(universalUploadController)
);

router.delete(
  '/image/:imageId',
  authenticate,
  universalUploadController.deleteImage.bind(universalUploadController)
);

router.put(
  '/:entityType/:entityId/reorder',
  authenticate,
  universalUploadController.reorderImages.bind(universalUploadController)
);

router.put(
  '/image/:imageId/set-primary',
  authenticate,
  universalUploadController.setPrimaryImage.bind(universalUploadController)
);

router.post(
  '/presigned-url',
  authenticate,
  universalUploadController.getPresignedUrl.bind(universalUploadController)
);


// Legacy route - keep for backward compatibility
router.post('/agency/logo', 
  authenticate, 
  uploadLogo.single('logo'), 
  (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;
      
      console.log('Logo uploaded:', {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        url: logoUrl
      });

      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logoUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo'
      });
    }
  }
);

export default router;