import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { uploadLogo } from '../middleware/upload.js';

const router = Router();

// Upload agency logo
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