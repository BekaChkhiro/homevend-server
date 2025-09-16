import { Request, Response } from 'express';
import { EntityType } from '../models/Image.js';
import universalImageService from '../services/UniversalImageService.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string;
  };
}

export class UniversalUploadController {
  /**
   * Upload images for any entity
   */
  async uploadImages(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const { purpose = 'gallery', altText, caption, tags } = req.body;
      const files = req.files as Express.Multer.File[];


      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        return res.status(400).json({ error: 'Invalid entity type' });
      }

      // Handle debug route (no authentication required)
      const isDebugRoute = req.path.includes('/debug/');
      const userId = isDebugRoute ? 1 : req.user?.id; // Use user ID 1 for debug

      if (!isDebugRoute) {
        // Check permissions based on entity type
        const hasPermission = await this.checkUploadPermission(
          entityType as EntityType,
          parseInt(entityId),
          req.user.id,
          req.user.role
        );

        if (!hasPermission) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      }


      // Upload images
      const images = await universalImageService.uploadMultiple({
        entityType: entityType as EntityType,
        entityId: parseInt(entityId),
        purpose,
        files,
        userId: userId!,
      });

      return res.json({
        success: true,
        images,
        message: `${images.length} images uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }

  /**
   * Get images for entity
   */
  async getEntityImages(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const { purpose } = req.query;


      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        return res.status(400).json({ error: 'Invalid entity type' });
      }

      const images = await universalImageService.getEntityImages(
        entityType as EntityType,
        parseInt(entityId),
        purpose as string
      );


      return res.json({ images });
    } catch (error: any) {
      console.error('Get images error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete image
   */
  async deleteImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { imageId } = req.params;

      await universalImageService.deleteImage(
        parseInt(imageId),
        req.user.id,
        req.user.role
      );

      return res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error: any) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Reorder images
   */
  async reorderImages(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const { purpose, imageOrders } = req.body;

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        return res.status(400).json({ error: 'Invalid entity type' });
      }

      await universalImageService.reorderImages(
        entityType as EntityType,
        parseInt(entityId),
        purpose,
        imageOrders
      );

      return res.json({ success: true, message: 'Images reordered successfully' });
    } catch (error: any) {
      console.error('Reorder error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Set primary image
   */
  async setPrimaryImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { imageId } = req.params;

      await universalImageService.setPrimaryImage(parseInt(imageId));

      return res.json({ success: true, message: 'Primary image updated' });
    } catch (error: any) {
      console.error('Set primary error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get pre-signed upload URL
   */
  async getPresignedUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId, purpose, fileName, contentType } = req.body;

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        return res.status(400).json({ error: 'Invalid entity type' });
      }

      const result = await universalImageService.getPresignedUploadUrl({
        entityType: entityType as EntityType,
        entityId: parseInt(entityId),
        purpose,
        fileName,
        contentType,
      });

      return res.json(result);
    } catch (error: any) {
      console.error('Presigned URL error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Check upload permissions based on entity type
   */
  private async checkUploadPermission(
    entityType: EntityType,
    entityId: number,
    userId: number,
    userRole: string
  ): Promise<boolean> {
    // Admins can upload for any entity
    if (userRole === 'admin') {
      return true;
    }

    // Entity-specific permission checks
    switch (entityType) {
      case EntityType.PROPERTY:
        // For now, allow all authenticated users
        // You can add property ownership checks here
        return true;

      case EntityType.USER:
        // Users can only upload to their own profile
        return entityId === userId;

      case EntityType.AGENCY:
        // For now, allow all authenticated users
        // You can add agency ownership checks here
        return true;

      case EntityType.PROJECT:
        // For now, allow all authenticated users
        // You can add project ownership checks here
        return true;

      case EntityType.DEVELOPER:
        // For now, allow all authenticated users
        // You can add developer ownership checks here
        return true;

      case EntityType.DISTRICT:
        // For now, allow all authenticated users
        // You can add district ownership checks here
        return true;

      case EntityType.ADVERTISEMENT:
        // For now, allow all authenticated users
        // You can add advertisement ownership checks here
        return true;

      default:
        return false;
    }
  }
}