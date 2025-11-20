import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Advertisement, AdStatus } from '../models/Advertisement.js';
import { Image, EntityType } from '../models/Image.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

const advertisementRepository = AppDataSource.getRepository(Advertisement);
const imageRepository = AppDataSource.getRepository(Image);

// Create new advertisement
export const createAdvertisement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      advertiser,
      placementId,
      startDate,
      endDate,
      imageUrl,
      targetUrl,
    } = req.body;

    // Validation
    if (!title || !advertiser || !placementId || !startDate || !endDate || !imageUrl || !targetUrl) {
      res.status(400).json({
        success: false,
        error: 'All required fields must be provided',
      });
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      res.status(400).json({
        success: false,
        error: 'End date must be after start date',
      });
      return;
    }

    // Determine status based on dates
    const now = new Date();
    let status = AdStatus.PENDING;
    if (now >= start && now <= end) {
      status = AdStatus.ACTIVE;
    } else if (now > end) {
      status = AdStatus.EXPIRED;
    }

    // Check if there's already an active or pending ad for this placement
    const existingAd = await advertisementRepository.findOne({
      where: [
        { placementId, status: AdStatus.ACTIVE },
        { placementId, status: AdStatus.PENDING },
      ],
    });

    if (existingAd) {
      res.status(400).json({
        success: false,
        error: `There is already an ${existingAd.status} advertisement for this placement. Please delete it first or wait for it to expire.`,
      });
      return;
    }

    // Create advertisement
    const advertisement = advertisementRepository.create({
      title,
      description,
      advertiser,
      placementId,
      startDate: start,
      endDate: end,
      imageUrl,
      targetUrl,
      status,
      uploadedById: req.user?.id,
    });

    await advertisementRepository.save(advertisement);

    res.status(201).json({
      success: true,
      data: advertisement,
    });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create advertisement',
    });
  }
};

// Get all advertisements (admin)
export const getAdvertisements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { placementId, status, page = 1, limit = 50 } = req.query;

    const where: any = {};
    if (placementId) where.placementId = placementId;
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [advertisements, total] = await advertisementRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: Number(limit),
      relations: ['uploadedBy'],
    });

    // Update expired advertisements
    const now = new Date();
    for (const ad of advertisements) {
      if (ad.status === AdStatus.ACTIVE && now > ad.endDate) {
        ad.status = AdStatus.EXPIRED;
        await advertisementRepository.save(ad);
      } else if (ad.status === AdStatus.PENDING && now >= ad.startDate && now <= ad.endDate) {
        ad.status = AdStatus.ACTIVE;
        await advertisementRepository.save(ad);
      }
    }

    res.json({
      success: true,
      data: {
        advertisements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advertisements',
    });
  }
};

// Get single advertisement
export const getAdvertisementById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const advertisement = await advertisementRepository.findOne({
      where: { id: Number(id) },
      relations: ['uploadedBy'],
    });

    if (!advertisement) {
      res.status(404).json({
        success: false,
        error: 'Advertisement not found',
      });
      return;
    }

    res.json({
      success: true,
      data: advertisement,
    });
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advertisement',
    });
  }
};

// Get active advertisement for a placement (public endpoint)
export const getActiveAdvertisementByPlacement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { placementId } = req.params;
    const now = new Date();

    // Find active advertisement for the placement
    const advertisement = await advertisementRepository.findOne({
      where: {
        placementId,
        status: AdStatus.ACTIVE,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { createdAt: 'DESC' },
    });

    if (!advertisement) {
      res.status(404).json({
        success: false,
        error: 'No active advertisement found for this placement',
      });
      return;
    }

    // Fetch the image URL from the Image table
    const image = await imageRepository.findOne({
      where: {
        entityType: EntityType.ADVERTISEMENT,
        entityId: advertisement.id,
        purpose: 'ad_banner',
      },
      order: { sortOrder: 'ASC' },
    });

    // Add the image URL to the advertisement object
    const advertisementWithImage = {
      ...advertisement,
      imageUrl: image ? (image.urls.medium || image.urls.original) : advertisement.imageUrl,
    };

    res.json({
      success: true,
      data: advertisementWithImage,
    });
  } catch (error) {
    console.error('Error fetching active advertisement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active advertisement',
    });
  }
};

// Update advertisement
export const updateAdvertisement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      advertiser,
      placementId,
      startDate,
      endDate,
      imageUrl,
      targetUrl,
      status,
    } = req.body;

    const advertisement = await advertisementRepository.findOne({
      where: { id: Number(id) },
    });

    if (!advertisement) {
      res.status(404).json({
        success: false,
        error: 'Advertisement not found',
      });
      return;
    }

    // Update fields
    if (title !== undefined) advertisement.title = title;
    if (description !== undefined) advertisement.description = description;
    if (advertiser !== undefined) advertisement.advertiser = advertiser;
    if (startDate !== undefined) advertisement.startDate = new Date(startDate);
    if (endDate !== undefined) advertisement.endDate = new Date(endDate);
    if (imageUrl !== undefined) advertisement.imageUrl = imageUrl;
    if (targetUrl !== undefined) advertisement.targetUrl = targetUrl;
    if (status !== undefined) advertisement.status = status;

    // Check if placementId is being changed to one that already has an active/pending ad
    if (placementId !== undefined && placementId !== advertisement.placementId) {
      const existingAd = await advertisementRepository.findOne({
        where: [
          { placementId, status: AdStatus.ACTIVE },
          { placementId, status: AdStatus.PENDING },
        ],
      });

      if (existingAd && existingAd.id !== advertisement.id) {
        res.status(400).json({
          success: false,
          error: `There is already an ${existingAd.status} advertisement for placement ${placementId}. Please delete it first or choose a different placement.`,
        });
        return;
      }

      advertisement.placementId = placementId;
    }

    // Validate dates if both are provided
    if (advertisement.startDate >= advertisement.endDate) {
      res.status(400).json({
        success: false,
        error: 'End date must be after start date',
      });
      return;
    }

    await advertisementRepository.save(advertisement);

    res.json({
      success: true,
      data: advertisement,
    });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update advertisement',
    });
  }
};

// Delete advertisement
export const deleteAdvertisement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const advertisementId = Number(id);

    console.log(`[DELETE] Attempting to delete advertisement with ID: ${advertisementId}`);

    const advertisement = await advertisementRepository.findOne({
      where: { id: advertisementId },
    });

    if (!advertisement) {
      console.log(`[DELETE] Advertisement not found with ID: ${advertisementId}`);
      res.status(404).json({
        success: false,
        error: 'Advertisement not found',
      });
      return;
    }

    console.log(`[DELETE] Found advertisement:`, {
      id: advertisement.id,
      title: advertisement.title,
      placementId: advertisement.placementId,
      status: advertisement.status,
    });

    // First, delete any related images
    const relatedImages = await imageRepository.find({
      where: {
        entityType: EntityType.ADVERTISEMENT,
        entityId: advertisementId,
      },
    });

    console.log(`[DELETE] Found ${relatedImages.length} related images to delete`);

    if (relatedImages.length > 0) {
      await imageRepository.remove(relatedImages);
      console.log(`[DELETE] Successfully deleted ${relatedImages.length} related images`);
    }

    // Now delete the advertisement
    await advertisementRepository.remove(advertisement);
    console.log(`[DELETE] Successfully deleted advertisement with ID: ${advertisementId}`);

    // Verify deletion
    const stillExists = await advertisementRepository.findOne({
      where: { id: advertisementId },
    });

    if (stillExists) {
      console.error(`[DELETE] ERROR: Advertisement still exists after deletion! ID: ${advertisementId}`);
      res.status(500).json({
        success: false,
        error: 'Advertisement was not properly deleted',
      });
      return;
    }

    console.log(`[DELETE] Verified: Advertisement ${advertisementId} no longer exists in database`);

    res.json({
      success: true,
      message: 'Advertisement deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE] Error deleting advertisement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete advertisement',
    });
  }
};

// Track advertisement click
export const trackClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const advertisement = await advertisementRepository.findOne({
      where: { id: Number(id) },
    });

    if (!advertisement) {
      res.status(404).json({
        success: false,
        error: 'Advertisement not found',
      });
      return;
    }

    advertisement.clicks += 1;
    await advertisementRepository.save(advertisement);

    res.json({
      success: true,
      message: 'Click tracked',
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track click',
    });
  }
};

// Track advertisement view
export const trackView = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const advertisement = await advertisementRepository.findOne({
      where: { id: Number(id) },
    });

    if (!advertisement) {
      res.status(404).json({
        success: false,
        error: 'Advertisement not found',
      });
      return;
    }

    advertisement.views += 1;
    await advertisementRepository.save(advertisement);

    res.json({
      success: true,
      message: 'View tracked',
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track view',
    });
  }
};
