import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Property, PropertyTypeEnum, DealTypeEnum, BuildingStatusEnum, ConstructionYearEnum, ConditionEnum } from '../models/Property.js';
import { City } from '../models/City.js';
import { Feature } from '../models/Feature.js';
import { Advantage } from '../models/Advantage.js';
import { FurnitureAppliance } from '../models/FurnitureAppliance.js';
import { Tag } from '../models/Tag.js';
import { PropertyPhoto } from '../models/PropertyPhoto.js';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { FindManyOptions, Like, ILike, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export const createProperty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const propertyRepository = AppDataSource.getRepository(Property);
    const cityRepository = AppDataSource.getRepository(City);
    const featureRepository = AppDataSource.getRepository(Feature);
    const advantageRepository = AppDataSource.getRepository(Advantage);
    const furnitureRepository = AppDataSource.getRepository(FurnitureAppliance);
    const tagRepository = AppDataSource.getRepository(Tag);
    
    // Verify junction tables exist
    try {
      await propertyRepository.query('SELECT COUNT(*) FROM property_features LIMIT 1');
      await propertyRepository.query('SELECT COUNT(*) FROM property_advantages LIMIT 1');
      await propertyRepository.query('SELECT COUNT(*) FROM property_furniture_appliances LIMIT 1');
      await propertyRepository.query('SELECT COUNT(*) FROM property_tags LIMIT 1');
      console.log('✅ All junction tables exist and are accessible');
    } catch (tableError) {
      console.error('❌ Junction table error:', tableError);
    }
    
    const {
      cityId,
      city: cityName, // For backward compatibility
      features = [],
      advantages = [],
      furnitureAppliances = [],
      tags = [],
      photos = [],
      ...propertyData
    } = req.body;

    let resolvedCityId = cityId;

    // Handle backward compatibility: if cityName is provided but cityId is not
    if (!cityId && cityName) {
      // Try to find city by name (Georgian or English) - case insensitive
      const city = await cityRepository.findOne({
        where: [
          { nameGeorgian: ILike(cityName) },
          { nameEnglish: ILike(cityName) },
          { code: ILike(cityName.toLowerCase().replace(/\s+/g, '_')) }
        ]
      });
      
      if (city) {
        resolvedCityId = city.id;
      } else {
        // Double-check with exact code match to prevent duplicates
        const cityCode = cityName.toLowerCase().replace(/\s+/g, '_');
        const existingCity = await cityRepository.findOne({
          where: { code: cityCode }
        });
        
        if (existingCity) {
          resolvedCityId = existingCity.id;
        } else {
          // Only create city if user is admin or if we allow dynamic city creation
          // For now, let's return an error suggesting available cities
          const availableCities = await cityRepository.find({
            select: ['id', 'nameGeorgian', 'nameEnglish'],
            where: { isActive: true },
            take: 10
          });
          
          res.status(400).json({
            success: false,
            message: `City "${cityName}" not found. Please use one of the available cities or provide a valid cityId.`,
            availableCities,
            suggestion: 'Use cityId instead of city name for better reliability'
          });
          return;
        }
      }
    }

    // Validate city exists
    if (!resolvedCityId) {
      res.status(400).json({
        success: false,
        message: 'City is required. Please provide either cityId or city name.',
        availableCities: await cityRepository.find({
          select: ['id', 'nameGeorgian', 'nameEnglish'],
          where: { isActive: true },
          take: 10
        })
      });
      return;
    }

    const city = await cityRepository.findOne({ where: { id: resolvedCityId } });
    if (!city) {
      res.status(400).json({
        success: false,
        message: `Invalid city ID: ${resolvedCityId}`,
        availableCities: await cityRepository.find({
          select: ['id', 'nameGeorgian', 'nameEnglish'],
          where: { isActive: true },
          take: 10
        })
      });
      return;
    }

    // Validate required fields first
    const requiredFieldErrors: string[] = [];
    
    if (!propertyData.title) {
      requiredFieldErrors.push('Title is required');
    }
    if (!propertyData.street) {
      requiredFieldErrors.push('Street is required');
    }
    if (!propertyData.area) {
      requiredFieldErrors.push('Area is required');
    }
    if (!propertyData.totalPrice) {
      requiredFieldErrors.push('Total price is required');
    }
    if (!propertyData.contactName) {
      requiredFieldErrors.push('Contact name is required');
    }
    if (!propertyData.contactPhone) {
      requiredFieldErrors.push('Contact phone is required');
    }
    if (!propertyData.propertyType) {
      requiredFieldErrors.push('Property type is required');
    }
    if (!propertyData.dealType) {
      requiredFieldErrors.push('Deal type is required');
    }
    
    if (requiredFieldErrors.length > 0) {
      console.error('🚨 =================================');
      console.error('❌ Missing required fields validation failed');
      console.error('❌ Errors:', requiredFieldErrors);
      console.error('❌ Property data received:', JSON.stringify(propertyData, null, 2));
      console.error('🚨 =================================');
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: requiredFieldErrors
      });
      return;
    }
    
    // Validate enum values and numeric ranges before creating property
    const enumValidationErrors: string[] = [];
    const numericValidationErrors: string[] = [];

    if (propertyData.propertyType && !Object.values(PropertyTypeEnum).includes(propertyData.propertyType)) {
      enumValidationErrors.push(`Invalid propertyType: "${propertyData.propertyType}". Valid values: ${Object.values(PropertyTypeEnum).join(', ')}`);
    }

    if (propertyData.dealType && !Object.values(DealTypeEnum).includes(propertyData.dealType)) {
      enumValidationErrors.push(`Invalid dealType: "${propertyData.dealType}". Valid values: ${Object.values(DealTypeEnum).join(', ')}`);
    }

    if (propertyData.buildingStatus && !Object.values(BuildingStatusEnum).includes(propertyData.buildingStatus)) {
      enumValidationErrors.push(`Invalid buildingStatus: "${propertyData.buildingStatus}". Valid values: ${Object.values(BuildingStatusEnum).join(', ')}`);
    }

    if (propertyData.constructionYear && !Object.values(ConstructionYearEnum).includes(propertyData.constructionYear)) {
      enumValidationErrors.push(`Invalid constructionYear: "${propertyData.constructionYear}". Valid values: ${Object.values(ConstructionYearEnum).join(', ')}`);
    }

    if (propertyData.condition && !Object.values(ConditionEnum).includes(propertyData.condition)) {
      enumValidationErrors.push(`Invalid condition: "${propertyData.condition}". Valid values: ${Object.values(ConditionEnum).join(', ')}`);
    }

    // Validate numeric field ranges to prevent overflow errors
    if (propertyData.ceilingHeight !== undefined) {
      const height = Number(propertyData.ceilingHeight);
      if (isNaN(height) || height < 0 || height > 99.99) {
        numericValidationErrors.push(`Invalid ceilingHeight: "${propertyData.ceilingHeight}". Must be between 0 and 99.99 meters`);
      }
    }

    if (propertyData.latitude !== undefined) {
      const lat = Number(propertyData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        numericValidationErrors.push(`Invalid latitude: "${propertyData.latitude}". Must be between -90 and 90`);
      }
    }

    if (propertyData.longitude !== undefined) {
      const lng = Number(propertyData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        numericValidationErrors.push(`Invalid longitude: "${propertyData.longitude}". Must be between -180 and 180`);
      }
    }

    if (propertyData.area !== undefined) {
      const area = Number(propertyData.area);
      if (isNaN(area) || area <= 0 || area > 999999.99) {
        numericValidationErrors.push(`Invalid area: "${propertyData.area}". Must be between 0.01 and 999999.99 square meters`);
      }
    }

    if (propertyData.totalPrice !== undefined) {
      const price = Number(propertyData.totalPrice);
      if (isNaN(price) || price <= 0 || price > 9999999999.99) {
        numericValidationErrors.push(`Invalid totalPrice: "${propertyData.totalPrice}". Must be between 0.01 and 9999999999.99`);
      }
    }

    // Check for validation errors
    const allErrors = [...enumValidationErrors, ...numericValidationErrors];
    if (allErrors.length > 0) {
      console.error('❌ Validation errors:', allErrors);
      console.error('📝 Property data that failed validation:', propertyData);
      res.status(400).json({
        success: false,
        message: 'Invalid values provided',
        errors: allErrors
      });
      return;
    }

    // Create property - explicitly map all fields for better reliability
    const property = new Property();
    
    // Required fields
    property.userId = req.user!.id;
    property.cityId = resolvedCityId;
    property.title = propertyData.title;
    property.propertyType = propertyData.propertyType;
    property.dealType = propertyData.dealType;
    if (propertyData.dailyRentalSubcategory) property.dailyRentalSubcategory = propertyData.dailyRentalSubcategory;
    property.street = propertyData.street;
    property.area = propertyData.area;
    property.totalPrice = propertyData.totalPrice;
    property.contactName = propertyData.contactName;
    property.contactPhone = propertyData.contactPhone;
    
    // Optional location fields
    if (propertyData.areaId !== undefined) property.areaId = propertyData.areaId;
    if (propertyData.projectId !== undefined) property.projectId = propertyData.projectId;
    if (propertyData.streetNumber) property.streetNumber = propertyData.streetNumber;
    if (propertyData.postalCode) property.postalCode = propertyData.postalCode;
    if (propertyData.cadastralCode) property.cadastralCode = propertyData.cadastralCode;
    if (propertyData.latitude !== undefined) property.latitude = propertyData.latitude;
    if (propertyData.longitude !== undefined) property.longitude = propertyData.longitude;
    
    // Optional property details
    if (propertyData.rooms) property.rooms = propertyData.rooms;
    if (propertyData.bedrooms) property.bedrooms = propertyData.bedrooms;
    if (propertyData.bathrooms) property.bathrooms = propertyData.bathrooms;
    if (propertyData.totalFloors) property.totalFloors = propertyData.totalFloors;
    if (propertyData.propertyFloor) property.propertyFloor = propertyData.propertyFloor;
    if (propertyData.buildingStatus) property.buildingStatus = propertyData.buildingStatus;
    if (propertyData.constructionYear) property.constructionYear = propertyData.constructionYear;
    if (propertyData.condition) property.condition = propertyData.condition;
    if (propertyData.projectType) property.projectType = propertyData.projectType;
    if (propertyData.ceilingHeight !== undefined) property.ceilingHeight = propertyData.ceilingHeight;
    
    // Infrastructure fields
    if (propertyData.heating) property.heating = propertyData.heating;
    if (propertyData.parking) property.parking = propertyData.parking;
    if (propertyData.hotWater) property.hotWater = propertyData.hotWater;
    if (propertyData.buildingMaterial) property.buildingMaterial = propertyData.buildingMaterial;
    
    // Conditional features with defaults
    property.hasBalcony = propertyData.hasBalcony || false;
    if (propertyData.balconyCount !== undefined) property.balconyCount = propertyData.balconyCount;
    if (propertyData.balconyArea !== undefined) property.balconyArea = propertyData.balconyArea;
    
    property.hasPool = propertyData.hasPool || false;
    if (propertyData.poolType) property.poolType = propertyData.poolType;
    
    property.hasLivingRoom = propertyData.hasLivingRoom || false;
    if (propertyData.livingRoomArea !== undefined) property.livingRoomArea = propertyData.livingRoomArea;
    if (propertyData.livingRoomType) property.livingRoomType = propertyData.livingRoomType;
    
    property.hasLoggia = propertyData.hasLoggia || false;
    if (propertyData.loggiaArea !== undefined) property.loggiaArea = propertyData.loggiaArea;
    
    property.hasVeranda = propertyData.hasVeranda || false;
    if (propertyData.verandaArea !== undefined) property.verandaArea = propertyData.verandaArea;
    
    property.hasYard = propertyData.hasYard || false;
    if (propertyData.yardArea !== undefined) property.yardArea = propertyData.yardArea;
    
    property.hasStorage = propertyData.hasStorage || false;
    if (propertyData.storageArea !== undefined) property.storageArea = propertyData.storageArea;
    if (propertyData.storageType) property.storageType = propertyData.storageType;
    
    // Pricing
    if (propertyData.pricePerSqm !== undefined) property.pricePerSqm = propertyData.pricePerSqm;
    property.currency = propertyData.currency || 'GEL';
    
    // Contact
    if (propertyData.contactEmail) property.contactEmail = propertyData.contactEmail;
    
    // Descriptions
    if (propertyData.descriptionGeorgian) property.descriptionGeorgian = propertyData.descriptionGeorgian;
    if (propertyData.descriptionEnglish) property.descriptionEnglish = propertyData.descriptionEnglish;
    if (propertyData.descriptionRussian) property.descriptionRussian = propertyData.descriptionRussian;
    
    // SEO & Meta
    if (propertyData.metaTitle) property.metaTitle = propertyData.metaTitle;
    if (propertyData.metaDescription) property.metaDescription = propertyData.metaDescription;
    if (propertyData.slug) property.slug = propertyData.slug;
    
    // Metrics with defaults
    property.viewCount = 0;
    property.favoriteCount = 0;
    property.inquiryCount = 0;
    property.isFeatured = propertyData.isFeatured || false;
    if (propertyData.featuredUntil) property.featuredUntil = propertyData.featuredUntil;
    
    // Dates
    if (propertyData.publishedAt) property.publishedAt = propertyData.publishedAt;
    if (propertyData.expiresAt) property.expiresAt = propertyData.expiresAt;

    // Calculate price per sqm if not provided
    if (!property.pricePerSqm && property.totalPrice && property.area) {
      property.pricePerSqm = Number(property.totalPrice) / Number(property.area);
    }

    const savedProperty = await propertyRepository.save(property);

    // Handle related entities - support both IDs and names for backward compatibility
    console.log('🔗 Relationship data received:', {
      features: features,
      advantages: advantages,
      furnitureAppliances: furnitureAppliances,
      tags: tags
    });

    // Handle features relationship
    if (features.length > 0) {
      let featureEntities = [];
      
      // Separate IDs from names
      const featureIds = features.filter(f => typeof f === 'number' || !isNaN(Number(f)));
      const featureNames = features.filter(f => typeof f === 'string' && isNaN(Number(f)));
      
      // Get features by IDs
      if (featureIds.length > 0) {
        console.log('🔍 Looking for features by IDs:', featureIds);
        const featuresById = await featureRepository.findBy({ id: In(featureIds.map(Number)) });
        console.log('✅ Found features by ID:', featuresById.length, featuresById.map(f => `${f.id}: ${f.nameEnglish}`));
        featureEntities.push(...featuresById);
      }
      
      // Get features by names/codes
      if (featureNames.length > 0) {
        console.log('🔍 Looking for features by names:', featureNames);
        const featuresByName = await featureRepository.find({
          where: featureNames.map(name => [
            { code: name },
            { nameGeorgian: name },
            { nameEnglish: name }
          ]).flat()
        });
        console.log('✅ Found features by name:', featuresByName.length, featuresByName.map(f => `${f.id}: ${f.nameEnglish}`));
        featureEntities.push(...featuresByName);
      }
      
      // Remove duplicates by ID
      featureEntities = featureEntities.filter((item, index, self) => 
        index === self.findIndex(entity => entity.id === item.id)
      );
      
      console.log('✅ Features found and assigned:', featureEntities.length, featureEntities.map(f => `${f.id}: ${f.nameEnglish || f.code}`));
      savedProperty.features = featureEntities;
    } else {
      savedProperty.features = [];
      console.log('ℹ️  No features provided');
    }

    // Handle advantages relationship
    if (advantages.length > 0) {
      let advantageEntities = [];
      
      const advantageIds = advantages.filter(a => typeof a === 'number' || !isNaN(Number(a)));
      const advantageNames = advantages.filter(a => typeof a === 'string' && isNaN(Number(a)));
      
      if (advantageIds.length > 0) {
        const advantagesById = await advantageRepository.findBy({ id: In(advantageIds.map(Number)) });
        advantageEntities.push(...advantagesById);
      }
      
      if (advantageNames.length > 0) {
        const advantagesByName = await advantageRepository.find({
          where: advantageNames.map(name => [
            { code: name },
            { nameGeorgian: name },
            { nameEnglish: name }
          ]).flat()
        });
        advantageEntities.push(...advantagesByName);
      }
      
      // Remove duplicates by ID
      advantageEntities = advantageEntities.filter((item, index, self) => 
        index === self.findIndex(entity => entity.id === item.id)
      );
      
      savedProperty.advantages = advantageEntities;
    } else {
      savedProperty.advantages = [];
    }

    // Handle furniture/appliances relationship
    if (furnitureAppliances.length > 0) {
      let furnitureEntities = [];
      
      const furnitureIds = furnitureAppliances.filter(f => typeof f === 'number' || !isNaN(Number(f)));
      const furnitureNames = furnitureAppliances.filter(f => typeof f === 'string' && isNaN(Number(f)));
      
      if (furnitureIds.length > 0) {
        const furnitureById = await furnitureRepository.findBy({ id: In(furnitureIds.map(Number)) });
        furnitureEntities.push(...furnitureById);
      }
      
      if (furnitureNames.length > 0) {
        const furnitureByName = await furnitureRepository.find({
          where: furnitureNames.map(name => [
            { code: name },
            { nameGeorgian: name },
            { nameEnglish: name }
          ]).flat()
        });
        furnitureEntities.push(...furnitureByName);
      }
      
      // Remove duplicates by ID
      furnitureEntities = furnitureEntities.filter((item, index, self) => 
        index === self.findIndex(entity => entity.id === item.id)
      );
      
      savedProperty.furnitureAppliances = furnitureEntities;
    } else {
      savedProperty.furnitureAppliances = [];
    }

    // Handle tags relationship
    if (tags.length > 0) {
      let tagEntities = [];
      
      const tagIds = tags.filter(t => typeof t === 'number' || !isNaN(Number(t)));
      const tagNames = tags.filter(t => typeof t === 'string' && isNaN(Number(t)));
      
      if (tagIds.length > 0) {
        const tagsById = await tagRepository.findBy({ id: In(tagIds.map(Number)) });
        tagEntities.push(...tagsById);
      }
      
      if (tagNames.length > 0) {
        const tagsByName = await tagRepository.find({
          where: tagNames.map(name => [
            { code: name },
            { nameGeorgian: name },
            { nameEnglish: name }
          ]).flat()
        });
        tagEntities.push(...tagsByName);
      }
      
      // Remove duplicates by ID
      tagEntities = tagEntities.filter((item, index, self) => 
        index === self.findIndex(entity => entity.id === item.id)
      );
      
      savedProperty.tags = tagEntities;
    } else {
      savedProperty.tags = [];
    }

    // Handle photos
    if (photos.length > 0) {
      const photoRepository = AppDataSource.getRepository(PropertyPhoto);
      const photoEntities = photos.map((photo: any, index: number) => {
        const photoEntity = new PropertyPhoto();
        Object.assign(photoEntity, photo);
        photoEntity.propertyId = savedProperty.id;
        photoEntity.sortOrder = index;
        return photoEntity;
      });
      await photoRepository.save(photoEntities);
    }

    // Final save with all relationships
    console.log('💾 About to save property with relationships:', {
      propertyId: savedProperty.id,
      featuresCount: savedProperty.features?.length || 0,
      advantagesCount: savedProperty.advantages?.length || 0,
      furnitureCount: savedProperty.furnitureAppliances?.length || 0,
      tagsCount: savedProperty.tags?.length || 0
    });

    // Save the property with all relationships using transaction
    const finalSavedProperty = await propertyRepository.manager.transaction(async manager => {
      // Save the property entity first
      const saved = await manager.save(Property, savedProperty);
      
      // Explicitly save the many-to-many relationships
      if (savedProperty.features && savedProperty.features.length > 0) {
        await manager.createQueryBuilder()
          .insert()
          .into('property_features')
          .values(savedProperty.features.map(feature => ({
            property_id: saved.id,
            feature_id: feature.id
          })))
          .orIgnore()
          .execute();
      }
      
      if (savedProperty.advantages && savedProperty.advantages.length > 0) {
        await manager.createQueryBuilder()
          .insert()
          .into('property_advantages')
          .values(savedProperty.advantages.map(advantage => ({
            property_id: saved.id,
            advantage_id: advantage.id
          })))
          .orIgnore()
          .execute();
      }
      
      if (savedProperty.furnitureAppliances && savedProperty.furnitureAppliances.length > 0) {
        await manager.createQueryBuilder()
          .insert()
          .into('property_furniture_appliances')
          .values(savedProperty.furnitureAppliances.map(furniture => ({
            property_id: saved.id,
            furniture_appliance_id: furniture.id
          })))
          .orIgnore()
          .execute();
      }
      
      if (savedProperty.tags && savedProperty.tags.length > 0) {
        await manager.createQueryBuilder()
          .insert()
          .into('property_tags')
          .values(savedProperty.tags.map(tag => ({
            property_id: saved.id,
            tag_id: tag.id
          })))
          .orIgnore()
          .execute();
      }
      
      return saved;
    });
    console.log('✅ Property saved with ID:', finalSavedProperty.id);
    
    // Verify relationships were actually saved to database
    const verifyProperty = await propertyRepository.findOne({
      where: { id: finalSavedProperty.id },
      relations: ['features', 'advantages', 'furnitureAppliances', 'tags']
    });
    
    console.log('🔍 Database verification - Relationships actually saved:', {
      propertyId: verifyProperty?.id,
      featuresInDB: verifyProperty?.features?.length || 0,
      advantagesInDB: verifyProperty?.advantages?.length || 0,
      furnitureInDB: verifyProperty?.furnitureAppliances?.length || 0,
      tagsInDB: verifyProperty?.tags?.length || 0,
      featureNames: verifyProperty?.features?.map(f => f.nameEnglish || f.code) || [],
      advantageNames: verifyProperty?.advantages?.map(a => a.nameEnglish || a.code) || [],
      furnitureNames: verifyProperty?.furnitureAppliances?.map(fa => fa.nameEnglish || fa.code) || [],
      tagNames: verifyProperty?.tags?.map(t => t.nameEnglish || t.code) || []
    });
    
    // Also check junction tables directly
    const junctionTableCounts = await Promise.all([
      propertyRepository.query('SELECT COUNT(*) FROM property_features WHERE property_id = $1', [finalSavedProperty.id]),
      propertyRepository.query('SELECT COUNT(*) FROM property_advantages WHERE property_id = $1', [finalSavedProperty.id]),
      propertyRepository.query('SELECT COUNT(*) FROM property_furniture_appliances WHERE property_id = $1', [finalSavedProperty.id]),
      propertyRepository.query('SELECT COUNT(*) FROM property_tags WHERE property_id = $1', [finalSavedProperty.id])
    ]);
    
    console.log('🗄️ Junction table row counts for property', finalSavedProperty.id, ':', {
      property_features: parseInt(junctionTableCounts[0][0].count),
      property_advantages: parseInt(junctionTableCounts[1][0].count),
      property_furniture_appliances: parseInt(junctionTableCounts[2][0].count),
      property_tags: parseInt(junctionTableCounts[3][0].count)
    });
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: verifyProperty || finalSavedProperty
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property'
    });
  }
};

export const getProperties = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      cityId,
      propertyType,
      dealType,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      areaId,
      rooms,
      bedrooms,
      bathrooms,
      features,
      advantages,
      tags,
      isFeatured
    } = req.query;
    
    const propertyRepository = AppDataSource.getRepository(Property);

    const where: any = {};
    
    // Location filters
    if (cityId) where.cityId = cityId;
    if (areaId) where.areaId = areaId;
    
    // Basic filters
    if (propertyType) where.propertyType = propertyType;
    if (dealType) where.dealType = dealType;

    
    // Price range
    if (minPrice && maxPrice) {
      where.totalPrice = Between(Number(minPrice), Number(maxPrice));
    } else if (minPrice) {
      where.totalPrice = MoreThanOrEqual(Number(minPrice));
    } else if (maxPrice) {
      where.totalPrice = LessThanOrEqual(Number(maxPrice));
    }
    
    // Area range
    if (minArea && maxArea) {
      where.area = Between(Number(minArea), Number(maxArea));
    } else if (minArea) {
      where.area = MoreThanOrEqual(Number(minArea));
    } else if (maxArea) {
      where.area = LessThanOrEqual(Number(maxArea));
    }
    
    // Property details
    if (rooms) where.rooms = rooms;
    if (bedrooms) where.bedrooms = bedrooms;
    if (bathrooms) where.bathrooms = bathrooms;

    // Featured filter
    if (isFeatured === 'true') where.isFeatured = true;
    
    const options: FindManyOptions<Property> = {
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { 
        isFeatured: 'DESC',
        createdAt: 'DESC' 
      },
      relations: ['user', 'city', 'areaData'],
      select: {
        id: true,
        uuid: true,
        title: true,
        propertyType: true,
        dealType: true,
        area: true,
        totalPrice: true,
        pricePerSqm: true,
        currency: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        isFeatured: true,
        createdAt: true,
        street: true,
        areaId: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          phone: true
        },
        city: {
          id: true,
          code: true,
          nameGeorgian: true,
          nameEnglish: true
        },
        areaData: {
          id: true,
          nameKa: true,
          nameEn: true,
          nameRu: true
        }
      }
    };

    const [properties, total] = await propertyRepository.findAndCount(options);
    
    // Get property IDs for batch photo query
    const propertyIds = properties.map(p => p.id);
    
    // Load primary photos for all properties in one query
    const primaryPhotos = await AppDataSource.getRepository('PropertyPhoto')
      .find({
        where: { 
          propertyId: In(propertyIds), 
          isPrimary: true 
        },
        select: ['propertyId', 'filePath']
      });
    
    // Create a map for quick lookup
    const photoMap = new Map(primaryPhotos.map(photo => [photo.propertyId, photo.filePath]));
    
    // Build response without additional queries
    const propertiesWithPhotos = properties.map(property => ({
      id: property.id,
      uuid: property.uuid,
      title: property.title,
      propertyType: property.propertyType,
      dealType: property.dealType,
      area: property.area,
      totalPrice: property.totalPrice,
      pricePerSqm: property.pricePerSqm,
      currency: property.currency,
      rooms: property.rooms,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      isFeatured: property.isFeatured,
      createdAt: property.createdAt,
      street: property.street,
      city: property.city?.nameEnglish || property.city?.nameGeorgian || '',
      cityData: {
        id: property.city?.id,
        code: property.city?.code,
        nameGeorgian: property.city?.nameGeorgian,
        nameEnglish: property.city?.nameEnglish
      },
      areaData: property.areaData ? {
        id: property.areaData.id,
        nameKa: property.areaData.nameKa,
        nameEn: property.areaData.nameEn,
        nameRu: property.areaData.nameRu
      } : null,
      district: property.areaData?.nameKa || '',
      user: {
        id: property.user.id,
        fullName: property.user.fullName,
        email: property.user.email,
        phone: property.user.phone
      },
      photos: photoMap.get(property.id) ? [photoMap.get(property.id)] : [],
      // Empty arrays for list view - full data loaded on detail view
      features: [],
      advantages: [],
      furnitureAppliances: [],
      tags: []
    }));
    
    res.status(200).json({
      success: true,
      data: {
        properties: propertiesWithPhotos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
};

export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);
    
    if (!propertyId || isNaN(propertyId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
      return;
    }
    
    const propertyRepository = AppDataSource.getRepository(Property);
    
    // First get the property with numeric fields
    const propertyWithNumbers = await propertyRepository.findOne({
      where: { id: propertyId }
    });
    
    // Then get the property with relationships
    const property = await propertyRepository.findOne({
      where: { id: propertyId },
      relations: [
        'user',
        'city',
        'areaData', 
        'features',
        'advantages',
        'furnitureAppliances',
        'tags',
        'photos',
        'project',
        'project.city'
      ]
    });
    
    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }

    // Track view if user provided (optional for public access)
    const user = (req as any).user; // Cast to access user property if it exists
    if (user) {
      const propertyViewRepository = AppDataSource.getRepository('PropertyView');
      try {
        await propertyViewRepository.save({
          propertyId: property.id,
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          referrer: req.get('Referer')
        });
      } catch (error) {
        // Don't fail the request if view tracking fails
        console.error('Failed to track property view:', error);
      }
    }
    
    // Increment view count
    await propertyRepository.increment({ id: propertyId }, 'viewCount', 1);
    
    // Debug: Log what we're sending to frontend
    console.log('📤 Sending to frontend - Property relationships:', {
      propertyId: property.id,
      features: property.features?.map(f => f.nameEnglish || f.code) || [],
      advantages: property.advantages?.map(a => a.nameEnglish || a.code) || [], 
      furnitureAppliances: property.furnitureAppliances?.map(fa => fa.nameEnglish || fa.code) || [],
      tags: property.tags?.map(t => t.nameEnglish || t.code) || []
    });

    // Check if this is for editing (form usage) or display
    const isForEditing = req.query.edit === 'true';
    
    res.status(200).json({
      success: true,
      data: {
        ...property,
        // Fix naming conflict: use numeric area from query without relationships
        area: propertyWithNumbers?.area,
        // Return codes for editing, display names for viewing
        features: isForEditing 
          ? property.features?.map(f => f.code) || []
          : property.features?.map(f => f.nameEnglish || f.code) || [],
        advantages: isForEditing
          ? property.advantages?.map(a => a.code) || []
          : property.advantages?.map(a => a.nameEnglish || a.code) || [],
        furnitureAppliances: isForEditing
          ? property.furnitureAppliances?.map(fa => fa.code) || []
          : property.furnitureAppliances?.map(fa => fa.nameEnglish || fa.code) || [],
        tags: isForEditing
          ? property.tags?.map(t => t.code) || []
          : property.tags?.map(t => t.nameEnglish || t.code) || [],
        city: property.city?.nameEnglish || property.city?.nameGeorgian || '',
        user: { 
          id: property.user.id, 
          fullName: property.user.fullName, 
          email: property.user.email,
          phone: property.user.phone 
        },
        cityData: {
          id: property.city?.id,
          code: property.city?.code,
          nameGeorgian: property.city?.nameGeorgian,
          nameEnglish: property.city?.nameEnglish
        },
        areaData: property.areaData ? {
          id: property.areaData.id,
          cityId: property.areaData.cityId,
          nameKa: property.areaData.nameKa,
          nameEn: property.areaData.nameEn,
          nameRu: property.areaData.nameRu
        } : null,
        district: property.areaData?.nameKa || '', // For backward compatibility
        photos: property.photos?.sort((a, b) => a.sortOrder - b.sortOrder)?.map(photo => photo.filePath) || []
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    });
  }
};

export const getUserProperties = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('getUserProperties called for user:', req.user!.id, 'role:', req.user!.role);
    
    const userId = req.user!.id;
    const propertyRepository = AppDataSource.getRepository(Property);
    
    // Only fetch properties created by the current user (agency or regular user)
    const whereCondition = { userId };

    console.log('Fetching properties with condition:', whereCondition);

    const properties = await propertyRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      relations: [
        'user',
        'city',
        'areaData',
        'photos'
      ]
    });

    console.log(`Found ${properties.length} properties`);
    console.log('Sample property projectId:', properties[0]?.projectId);
    
    const mappedProperties = properties.map(p => ({
      id: p.id,
      uuid: p.uuid,
      title: p.title,
      propertyType: p.propertyType,
      dealType: p.dealType,
      area: p.area,
      totalPrice: p.totalPrice,
      pricePerSqm: p.pricePerSqm,
      currency: p.currency,
      rooms: p.rooms,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      isFeatured: p.isFeatured,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      street: p.street,
      city: p.city?.nameGeorgian || p.city?.nameEnglish || '',
      projectId: p.projectId,
      // Include property owner info for agency dashboards
      owner: p.user ? {
        id: p.user.id,
        fullName: p.user.fullName,
        email: p.user.email
      } : null,
      isOwnProperty: p.userId === userId,
      cityData: p.city ? {
        id: p.city.id,
        code: p.city.code,
        nameGeorgian: p.city.nameGeorgian,
        nameEnglish: p.city.nameEnglish
      } : null,
      areaData: p.areaData ? {
        id: p.areaData.id,
        nameKa: p.areaData.nameKa,
        nameEn: p.areaData.nameEn,
        nameRu: p.areaData.nameRu
      } : null,
      district: p.areaData?.nameKa || '',
      photos: p.photos ? p.photos.map(photo => photo.filePath) : [],
      // Empty arrays for compatibility
      features: [],
      advantages: [],
      furnitureAppliances: [],
      tags: []
    }));

    res.status(200).json({
      success: true,
      data: mappedProperties
    });
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user properties'
    });
  }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {    
    const { id } = req.params;
    console.log('UPDATE Property:', id, 'Body:', req.body);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = await propertyRepository.findOne({
      where: { id: Number(id) },
      relations: ['features', 'advantages', 'furnitureAppliances', 'tags']
    });
    
    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }
    
    if (property.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this property'
      });
      return;
    }

    const {
      cityId,
      city: cityName, // For backward compatibility
      features = [],
      advantages = [],
      furnitureAppliances = [],
      tags = [],
      photos = [],
      ...propertyData
    } = req.body;

    let resolvedCityId = cityId;

    // Handle backward compatibility: if cityName is provided but cityId is not
    if (!cityId && cityName) {
      const cityRepository = AppDataSource.getRepository(City);
      // Try to find city by name (Georgian or English) - case insensitive
      const city = await cityRepository.findOne({
        where: [
          { nameGeorgian: ILike(cityName) },
          { nameEnglish: ILike(cityName) },
          { code: ILike(cityName.toLowerCase().replace(/\s+/g, '_')) }
        ]
      });
      
      if (city) {
        resolvedCityId = city.id;
      } else {
        res.status(400).json({
          success: false,
          message: `City "${cityName}" not found. Please use one of the available cities.`,
          availableCities: await cityRepository.find({
            select: ['id', 'nameGeorgian', 'nameEnglish'],
            where: { isActive: true },
            take: 10
          })
        });
        return;
      }
    }

    // Validate city if changed
    if (resolvedCityId && resolvedCityId !== property.cityId) {
      const cityRepository = AppDataSource.getRepository(City);
      const city = await cityRepository.findOne({ where: { id: resolvedCityId } });
      if (!city) {
        res.status(400).json({
          success: false,
          message: 'Invalid city ID'
        });
        return;
      }
      property.cityId = resolvedCityId;
    }

    // Update basic property data - explicitly map all fields
    if (propertyData.title !== undefined) property.title = propertyData.title;
    if (propertyData.propertyType !== undefined) property.propertyType = propertyData.propertyType;
    if (propertyData.dealType !== undefined) property.dealType = propertyData.dealType;
    if (propertyData.dailyRentalSubcategory !== undefined) property.dailyRentalSubcategory = propertyData.dailyRentalSubcategory;
    if (propertyData.street !== undefined) property.street = propertyData.street;
    if (propertyData.area !== undefined) property.area = propertyData.area;
    if (propertyData.totalPrice !== undefined) property.totalPrice = propertyData.totalPrice;
    if (propertyData.contactName !== undefined) property.contactName = propertyData.contactName;
    if (propertyData.contactPhone !== undefined) property.contactPhone = propertyData.contactPhone;
    
    // Optional location fields
    if (propertyData.areaId !== undefined) property.areaId = propertyData.areaId;
    if (propertyData.streetNumber !== undefined) property.streetNumber = propertyData.streetNumber;
    if (propertyData.postalCode !== undefined) property.postalCode = propertyData.postalCode;
    if (propertyData.cadastralCode !== undefined) property.cadastralCode = propertyData.cadastralCode;
    if (propertyData.latitude !== undefined) property.latitude = propertyData.latitude;
    if (propertyData.longitude !== undefined) property.longitude = propertyData.longitude;
    
    // Project linking
    if (propertyData.projectId !== undefined) property.projectId = propertyData.projectId;
    
    // Optional property details
    if (propertyData.rooms !== undefined) property.rooms = propertyData.rooms;
    if (propertyData.bedrooms !== undefined) property.bedrooms = propertyData.bedrooms;
    if (propertyData.bathrooms !== undefined) property.bathrooms = propertyData.bathrooms;
    if (propertyData.totalFloors !== undefined) property.totalFloors = propertyData.totalFloors;
    if (propertyData.propertyFloor !== undefined) property.propertyFloor = propertyData.propertyFloor;
    if (propertyData.buildingStatus !== undefined) property.buildingStatus = propertyData.buildingStatus;
    if (propertyData.constructionYear !== undefined) property.constructionYear = propertyData.constructionYear;
    if (propertyData.condition !== undefined) property.condition = propertyData.condition;
    if (propertyData.projectType !== undefined) property.projectType = propertyData.projectType;
    if (propertyData.ceilingHeight !== undefined) property.ceilingHeight = propertyData.ceilingHeight;
    
    // Infrastructure fields
    if (propertyData.heating !== undefined) property.heating = propertyData.heating;
    if (propertyData.parking !== undefined) property.parking = propertyData.parking;
    if (propertyData.hotWater !== undefined) property.hotWater = propertyData.hotWater;
    if (propertyData.buildingMaterial !== undefined) property.buildingMaterial = propertyData.buildingMaterial;
    
    // Conditional features
    if (propertyData.hasBalcony !== undefined) property.hasBalcony = propertyData.hasBalcony;
    if (propertyData.balconyCount !== undefined) property.balconyCount = propertyData.balconyCount;
    if (propertyData.balconyArea !== undefined) property.balconyArea = propertyData.balconyArea;
    
    if (propertyData.hasPool !== undefined) property.hasPool = propertyData.hasPool;
    if (propertyData.poolType !== undefined) property.poolType = propertyData.poolType;
    
    if (propertyData.hasLivingRoom !== undefined) property.hasLivingRoom = propertyData.hasLivingRoom;
    if (propertyData.livingRoomArea !== undefined) property.livingRoomArea = propertyData.livingRoomArea;
    if (propertyData.livingRoomType !== undefined) property.livingRoomType = propertyData.livingRoomType;
    
    if (propertyData.hasLoggia !== undefined) property.hasLoggia = propertyData.hasLoggia;
    if (propertyData.loggiaArea !== undefined) property.loggiaArea = propertyData.loggiaArea;
    
    if (propertyData.hasVeranda !== undefined) property.hasVeranda = propertyData.hasVeranda;
    if (propertyData.verandaArea !== undefined) property.verandaArea = propertyData.verandaArea;
    
    if (propertyData.hasYard !== undefined) property.hasYard = propertyData.hasYard;
    if (propertyData.yardArea !== undefined) property.yardArea = propertyData.yardArea;
    
    if (propertyData.hasStorage !== undefined) property.hasStorage = propertyData.hasStorage;
    if (propertyData.storageArea !== undefined) property.storageArea = propertyData.storageArea;
    if (propertyData.storageType !== undefined) property.storageType = propertyData.storageType;
    
    // Pricing
    if (propertyData.pricePerSqm !== undefined) property.pricePerSqm = propertyData.pricePerSqm;
    if (propertyData.currency !== undefined) property.currency = propertyData.currency;
    
    // Contact
    if (propertyData.contactEmail !== undefined) property.contactEmail = propertyData.contactEmail;
    
    // Descriptions
    if (propertyData.descriptionGeorgian !== undefined) property.descriptionGeorgian = propertyData.descriptionGeorgian;
    if (propertyData.descriptionEnglish !== undefined) property.descriptionEnglish = propertyData.descriptionEnglish;
    if (propertyData.descriptionRussian !== undefined) property.descriptionRussian = propertyData.descriptionRussian;
    
    // SEO & Meta
    if (propertyData.metaTitle !== undefined) property.metaTitle = propertyData.metaTitle;
    if (propertyData.metaDescription !== undefined) property.metaDescription = propertyData.metaDescription;
    if (propertyData.slug !== undefined) property.slug = propertyData.slug;
    
    // Metrics
    if (propertyData.isFeatured !== undefined) property.isFeatured = propertyData.isFeatured;
    if (propertyData.featuredUntil !== undefined) property.featuredUntil = propertyData.featuredUntil;
    
    // Dates
    if (propertyData.publishedAt !== undefined) property.publishedAt = propertyData.publishedAt;
    if (propertyData.expiresAt !== undefined) property.expiresAt = propertyData.expiresAt;

    // Calculate price per sqm if price or area changed
    if (property.totalPrice && property.area) {
      property.pricePerSqm = Number(property.totalPrice) / Number(property.area);
    }

    // Update related entities - support both IDs and names for backward compatibility
    if (features.length >= 0) {
      const featureRepository = AppDataSource.getRepository(Feature);
      let featureEntities = [];
      
      if (features.length > 0) {
        const featureIds = features.filter(f => typeof f === 'number' || !isNaN(Number(f)));
        const featureNames = features.filter(f => typeof f === 'string' && isNaN(Number(f)));
        
        if (featureIds.length > 0) {
          const featuresById = await featureRepository.findBy({ id: In(featureIds.map(Number)) });
          featureEntities.push(...featuresById);
        }
        
        if (featureNames.length > 0) {
          const featuresByName = await featureRepository.find({
            where: featureNames.map(name => [
              { code: name },
              { nameGeorgian: name },
              { nameEnglish: name }
            ]).flat()
          });
          featureEntities.push(...featuresByName);
        }
        
        // Remove duplicates by ID
        featureEntities = featureEntities.filter((item, index, self) => 
          index === self.findIndex(entity => entity.id === item.id)
        );
      }
      
      property.features = featureEntities;
    }

    if (advantages.length >= 0) {
      const advantageRepository = AppDataSource.getRepository(Advantage);
      let advantageEntities = [];
      
      if (advantages.length > 0) {
        const advantageIds = advantages.filter(a => typeof a === 'number' || !isNaN(Number(a)));
        const advantageNames = advantages.filter(a => typeof a === 'string' && isNaN(Number(a)));
        
        if (advantageIds.length > 0) {
          const advantagesById = await advantageRepository.findBy({ id: In(advantageIds.map(Number)) });
          advantageEntities.push(...advantagesById);
        }
        
        if (advantageNames.length > 0) {
          const advantagesByName = await advantageRepository.find({
            where: advantageNames.map(name => [
              { code: name },
              { nameGeorgian: name },
              { nameEnglish: name }
            ]).flat()
          });
          advantageEntities.push(...advantagesByName);
        }
        
        // Remove duplicates by ID
        advantageEntities = advantageEntities.filter((item, index, self) => 
          index === self.findIndex(entity => entity.id === item.id)
        );
      }
      
      property.advantages = advantageEntities;
    }

    if (furnitureAppliances.length >= 0) {
      const furnitureRepository = AppDataSource.getRepository(FurnitureAppliance);
      let furnitureEntities = [];
      
      if (furnitureAppliances.length > 0) {
        const furnitureIds = furnitureAppliances.filter(f => typeof f === 'number' || !isNaN(Number(f)));
        const furnitureNames = furnitureAppliances.filter(f => typeof f === 'string' && isNaN(Number(f)));
        
        if (furnitureIds.length > 0) {
          const furnitureById = await furnitureRepository.findBy({ id: In(furnitureIds.map(Number)) });
          furnitureEntities.push(...furnitureById);
        }
        
        if (furnitureNames.length > 0) {
          const furnitureByName = await furnitureRepository.find({
            where: furnitureNames.map(name => [
              { code: name },
              { nameGeorgian: name },
              { nameEnglish: name }
            ]).flat()
          });
          furnitureEntities.push(...furnitureByName);
        }
        
        // Remove duplicates by ID
        furnitureEntities = furnitureEntities.filter((item, index, self) => 
          index === self.findIndex(entity => entity.id === item.id)
        );
      }
      
      property.furnitureAppliances = furnitureEntities;
    }

    if (tags.length >= 0) {
      const tagRepository = AppDataSource.getRepository(Tag);
      let tagEntities = [];
      
      if (tags.length > 0) {
        const tagIds = tags.filter(t => typeof t === 'number' || !isNaN(Number(t)));
        const tagNames = tags.filter(t => typeof t === 'string' && isNaN(Number(t)));
        
        if (tagIds.length > 0) {
          const tagsById = await tagRepository.findBy({ id: In(tagIds.map(Number)) });
          tagEntities.push(...tagsById);
        }
        
        if (tagNames.length > 0) {
          const tagsByName = await tagRepository.find({
            where: tagNames.map(name => [
              { code: name },
              { nameGeorgian: name },
              { nameEnglish: name }
            ]).flat()
          });
          tagEntities.push(...tagsByName);
        }
        
        // Remove duplicates by ID
        tagEntities = tagEntities.filter((item, index, self) => 
          index === self.findIndex(entity => entity.id === item.id)
        );
      }
      
      property.tags = tagEntities;
    }

    // Handle photos update
    if (photos && photos.length >= 0) {
      const photoRepository = AppDataSource.getRepository(PropertyPhoto);
      
      // Remove existing photos
      await photoRepository.delete({ propertyId: property.id });

      // Add new photos
      if (photos.length > 0) {
        const photoEntities = photos.map((photo: any, index: number) => {
          const photoEntity = new PropertyPhoto();
          Object.assign(photoEntity, photo);
          photoEntity.propertyId = property.id;
          photoEntity.sortOrder = index;
          return photoEntity;
        });
        await photoRepository.save(photoEntities);
      }
    }

    await propertyRepository.save(property);
    console.log('Property saved with projectId:', property.projectId);
    
    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property'
    });
  }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = await propertyRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }
    
    if (property.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property'
      });
      return;
    }
    
    await propertyRepository.remove(property);
    
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property'
    });
  }
};

