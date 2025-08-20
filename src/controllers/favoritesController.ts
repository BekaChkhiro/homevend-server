import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { UserFavorite } from '../models/UserFavorite.js';
import { Property } from '../models/Property.js';
import { User } from '../models/User.js';

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const favoritesController = {
  // Get user's favorite properties
  getFavorites: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const favoriteRepository = AppDataSource.getRepository(UserFavorite);
      
      const favorites = await favoriteRepository.find({
        where: { userId },
        relations: [
          'property', 
          'property.city', 
          'property.areaData',
          'property.project',
          'property.project.city',
          'property.user'
        ],
        order: { createdAt: 'DESC' }
      });

      const formattedFavorites = favorites.map(fav => ({
        id: fav.property.id,
        title: fav.property.title,
        propertyType: fav.property.propertyType,
        dealType: fav.property.dealType,
        city: fav.property.city?.nameGeorgian || fav.property.city?.nameEnglish || '',
        district: fav.property.areaData?.nameKa || '',
        street: fav.property.street,
        area: fav.property.area,
        totalPrice: fav.property.totalPrice,
        bedrooms: fav.property.bedrooms,
        bathrooms: fav.property.bathrooms,
        photos: fav.property.photos || [],
        contactPhone: fav.property.contactPhone,
        createdAt: fav.property.createdAt,
        favoriteAddedAt: fav.createdAt,
        user: {
          id: fav.property.user.id,
          fullName: fav.property.user.fullName,
          email: fav.property.user.email,
          role: fav.property.user.role
        }
      }));

      return res.json({
        success: true,
        data: {
          favorites: formattedFavorites,
          total: formattedFavorites.length
        }
      });

    } catch (error) {
      console.error('Error fetching favorites:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Add property to favorites
  addToFavorites: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { propertyId } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!propertyId) {
        return res.status(400).json({ success: false, message: 'Property ID is required' });
      }

      // Check if property exists
      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      // Check if already in favorites
      const favoriteRepository = AppDataSource.getRepository(UserFavorite);
      const existingFavorite = await favoriteRepository.findOne({
        where: { userId, propertyId }
      });

      if (existingFavorite) {
        return res.status(409).json({ success: false, message: 'Property already in favorites' });
      }

      // Add to favorites
      const favorite = new UserFavorite();
      favorite.userId = userId;
      favorite.propertyId = propertyId;

      await favoriteRepository.save(favorite);

      return res.status(201).json({
        success: true,
        message: 'Property added to favorites',
        data: { favoriteId: favorite.id }
      });

    } catch (error) {
      console.error('Error adding to favorites:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Remove property from favorites
  removeFromFavorites: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const propertyId = parseInt(req.params.propertyId);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!propertyId || isNaN(propertyId)) {
        return res.status(400).json({ success: false, message: 'Invalid property ID' });
      }

      const favoriteRepository = AppDataSource.getRepository(UserFavorite);
      const favorite = await favoriteRepository.findOne({
        where: { userId, propertyId }
      });

      if (!favorite) {
        return res.status(404).json({ success: false, message: 'Property not in favorites' });
      }

      await favoriteRepository.remove(favorite);

      return res.json({
        success: true,
        message: 'Property removed from favorites'
      });

    } catch (error) {
      console.error('Error removing from favorites:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Check if property is in favorites
  isFavorite: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const propertyId = parseInt(req.params.propertyId);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!propertyId || isNaN(propertyId)) {
        return res.status(400).json({ success: false, message: 'Invalid property ID' });
      }

      const favoriteRepository = AppDataSource.getRepository(UserFavorite);
      const favorite = await favoriteRepository.findOne({
        where: { userId, propertyId }
      });

      return res.json({
        success: true,
        data: { isFavorite: !!favorite }
      });

    } catch (error) {
      console.error('Error checking favorite status:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};