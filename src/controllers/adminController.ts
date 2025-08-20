import { Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User, UserRoleEnum } from '../models/User.js';
import { Property } from '../models/Property.js';
import { Project } from '../models/Project.js';
import { City } from '../models/City.js';
import { Area } from '../models/Area.js';
import { ProjectPricing } from '../models/ProjectPricing.js';
import { ProjectAmenity, AmenityDistanceEnum } from '../models/ProjectAmenity.js';
import { Agency } from '../models/Agency.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    
    const userRepository = AppDataSource.getRepository(User);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const where: any = {};
    if (role) where.role = role;
    
    const [users, total] = await userRepository.findAndCount({
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { createdAt: 'DESC' },
      select: ['id', 'fullName', 'email', 'phone', 'role', 'createdAt', 'updatedAt']
    });
    
    // Fetch property count for each user
    const usersWithPropertyCount = await Promise.all(
      users.map(async (user) => {
        const propertyCount = await propertyRepository.count({
          where: { userId: user.id }
        });
        return {
          ...user,
          propertyCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        users: usersWithPropertyCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const user = await userRepository.findOne({
      where: { id: Number(id) },
      select: ['id', 'fullName', 'email', 'phone', 'role', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    const propertyCount = await propertyRepository.count({
      where: { userId: Number(id) }
    });
    
    res.status(200).json({
      success: true,
      data: {
        ...user,
        propertyCount
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
      return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    if (user.id === req.user!.id) {
      res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
      return;
    }
    
    user.role = role;
    await userRepository.save(user);
    
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

export const updateUserAsAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role } = req.body;
    
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Prevent admin from changing their own role
    if (user.id === req.user!.id && role && role !== user.role) {
      res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
      return;
    }
    
    // Validate role if provided
    if (role && !['user', 'admin', 'developer', 'agency'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
      return;
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await userRepository.findOne({
        where: { email: email }
      });
      
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
        return;
      }
    }
    
    // Update user fields
    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    
    await userRepository.save(user);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user as admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    if (user.id === req.user!.id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
      return;
    }
    
    await userRepository.remove(user);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const propertyRepository = AppDataSource.getRepository(Property);
    const projectRepository = AppDataSource.getRepository(Project);
    
    // Get current date for monthly stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      totalUsers,
      totalAdmins,
      totalDevelopers,
      totalAgencies,
      totalProperties,
      totalProjects,
      monthlyUsers,
      monthlyProperties
    ] = await Promise.all([
      userRepository.count({ where: { role: 'user' } }),
      userRepository.count({ where: { role: 'admin' } }),
      userRepository.count({ where: { role: 'developer' } }),
      userRepository.count({ where: { role: 'agency' } }),
      propertyRepository.count(),
      projectRepository.count(),
      userRepository.createQueryBuilder('user')
        .where('user.createdAt >= :firstDay', { firstDay: firstDayOfMonth })
        .getCount(),
      propertyRepository.createQueryBuilder('property')
        .where('property.createdAt >= :firstDay', { firstDay: firstDayOfMonth })
        .getCount()
    ]);
    
    const recentUsers = await userRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      select: ['id', 'fullName', 'email', 'role', 'createdAt']
    });
    
    const recentProperties = await propertyRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      relations: ['user', 'city'],
      select: {
        id: true,
        title: true,
        propertyType: true,
        dealType: true,
        totalPrice: true,
        street: true,
        streetNumber: true,
        createdAt: true,
        user: {
          id: true,
          fullName: true
        },
        city: {
          id: true,
          nameGeorgian: true
        }
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers + totalAdmins + totalDevelopers + totalAgencies,
          totalAdmins,
          totalDevelopers,
          totalAgencies,
          totalProperties,
          totalProjects,
          monthlyUsers,
          monthlyProperties
        },
        recentUsers: recentUsers.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString()
        })),
        recentProperties: recentProperties.map(p => ({
          id: p.id,
          title: p.title || `${p.propertyType} ${p.dealType}`,
          propertyType: p.propertyType,
          dealType: p.dealType,
          price: p.totalPrice,
          location: `${p.city?.nameGeorgian || ''} ${p.street || ''} ${p.streetNumber || ''}`.trim(),
          createdAt: p.createdAt.toISOString(),
          user: {
            id: p.user.id,
            fullName: p.user.fullName
          }
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Admin Project Management Functions

export const getAllProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const projectRepository = AppDataSource.getRepository(Project);
    
    const [projects, total] = await projectRepository.findAndCount({
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { createdAt: 'DESC' },
      relations: ['developer', 'city', 'areaData']
    });
    
    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectRepository = AppDataSource.getRepository(Project);
    
    const project = await projectRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['developer', 'city', 'areaData', 'pricing', 'amenities']
    });
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    // Convert amenities to the format expected by the frontend
    let customAmenities: Record<string, string> = {};
    if (project.amenities && project.amenities.length > 0) {
      project.amenities.forEach((amenity: any) => {
        let distanceKey: string;
        switch (amenity.distance) {
          case 'on_site':
            distanceKey = 'onSite';
            break;
          case 'within_300m':
            distanceKey = '300m';
            break;
          case 'within_500m':
            distanceKey = '500m';
            break;
          case 'within_1km':
            distanceKey = '1km';
            break;
          default:
            distanceKey = amenity.distance;
        }
        customAmenities[amenity.amenityType] = distanceKey;
      });
    }

    res.status(200).json({
      ...project,
      customAmenities
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
};

export const updateProjectAsAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Use a database transaction to ensure data consistency
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    console.log('Admin updating project:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Admin user:', req.user?.id, req.user?.role);
    
    const projectRepository = queryRunner.manager.getRepository(Project);
    const projectPricingRepository = queryRunner.manager.getRepository(ProjectPricing);
    const projectAmenityRepository = queryRunner.manager.getRepository(ProjectAmenity);
    const cityRepository = queryRunner.manager.getRepository(City);
    const areaRepository = queryRunner.manager.getRepository(Area);
    const { id } = req.params;

    // Admin can update any project - no ownership check
    const project = await projectRepository.findOne({
      where: { id: parseInt(id) }
    });

    console.log('Found project:', project ? `ID: ${project.id}, Name: ${project.projectName}` : 'Not found');

    if (!project) {
      await queryRunner.rollbackTransaction();
      res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
      return;
    }

    const {
      projectName,
      description,
      cityId,
      areaId,
      street,
      streetNumber,
      latitude,
      longitude,
      projectType,
      deliveryStatus,
      deliveryDate,
      numberOfBuildings,
      totalApartments,
      numberOfFloors,
      parkingSpaces,
      pricing,
      customAmenities,
      ...amenities
    } = req.body;

    // Verify city exists if changed
    if (cityId && cityId !== project.cityId) {
      const city = await cityRepository.findOne({ where: { id: cityId } });
      if (!city) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ 
          success: false, 
          message: 'Invalid city ID' 
        });
        return;
      }
    }

    // Verify area exists if provided
    if (areaId && areaId !== project.areaId) {
      const area = await areaRepository.findOne({ where: { id: areaId } });
      if (!area) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ 
          success: false, 
          message: 'Invalid area ID' 
        });
        return;
      }
    }

    console.log('Project before update:', {
      id: project.id,
      projectName: project.projectName,
      description: project.description,
      cityId: project.cityId,
      street: project.street
    });

    // Update project fields
    if (projectName !== undefined) {
      console.log('Updating projectName from', project.projectName, 'to', projectName);
      project.projectName = projectName;
    }
    if (description !== undefined) {
      console.log('Updating description from', project.description, 'to', description);
      project.description = description;
    }
    if (cityId !== undefined) {
      console.log('Updating cityId from', project.cityId, 'to', cityId);
      project.cityId = cityId;
    }
    if (areaId !== undefined) {
      console.log('Updating areaId from', project.areaId, 'to', areaId);
      project.areaId = areaId;
    }
    if (street !== undefined) {
      console.log('Updating street from', project.street, 'to', street);
      project.street = street;
    }
    if (streetNumber !== undefined) project.streetNumber = streetNumber;
    if (latitude !== undefined) project.latitude = latitude;
    if (longitude !== undefined) project.longitude = longitude;
    if (projectType !== undefined) project.projectType = projectType;
    if (deliveryStatus !== undefined) project.deliveryStatus = deliveryStatus;
    if (deliveryDate !== undefined) project.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    if (numberOfBuildings !== undefined) project.numberOfBuildings = numberOfBuildings;
    if (totalApartments !== undefined) project.totalApartments = totalApartments;
    if (numberOfFloors !== undefined) project.numberOfFloors = numberOfFloors;
    if (parkingSpaces !== undefined) project.parkingSpaces = parkingSpaces;

    // Update boolean amenity fields that exist in the entity
    const booleanFields = [
      'hasGroceryStore', 'hasBikePath', 'hasSportsField', 'hasChildrenArea', 'hasSquare',
      'hasGym', 'hasSwimmingPool', 'hasGarden', 'hasParking', 'hasRestaurant', 'hasLaundry', 'hasStorage',
      'pharmacy300m', 'kindergarten300m', 'school300m', 'busStop300m', 'groceryStore300m',
      'bikePath300m', 'sportsField300m', 'stadium300m', 'square300m',
      'pharmacy500m', 'kindergarten500m', 'school500m', 'university500m', 'busStop500m',
      'groceryStore500m', 'bikePath500m', 'sportsField500m', 'stadium500m', 'square500m',
      'hospital1km', 'securityService', 'hasLobby', 'hasConcierge', 'videoSurveillance',
      'hasLighting', 'landscaping', 'yardCleaning', 'entranceCleaning', 'hasDoorman',
      'fireSystem', 'mainDoorLock', 'maintenance'
    ];

    booleanFields.forEach(field => {
      if (amenities[field] !== undefined) {
        (project as any)[field] = amenities[field];
      }
    });

    console.log('Project after field updates:', {
      id: project.id,
      projectName: project.projectName,
      description: project.description,
      cityId: project.cityId,
      street: project.street
    });

    console.log('Saving project to database...');
    const savedProject = await projectRepository.save(project);
    console.log('Project saved successfully:', savedProject.id);

    // Verify the data was actually saved by querying it again
    const verifyProject = await projectRepository.findOne({
      where: { id: parseInt(id) }
    });
    console.log('Verification - project after save:', {
      id: verifyProject?.id,
      projectName: verifyProject?.projectName,
      description: verifyProject?.description,
      cityId: verifyProject?.cityId,
      street: verifyProject?.street
    });

    // Handle custom amenities if provided
    if (customAmenities !== undefined) {
      console.log('Updating custom amenities:', customAmenities);
      
      // Remove existing amenities for this project
      await projectAmenityRepository.delete({ projectId: project.id });
      
      // Add new amenities
      if (customAmenities && typeof customAmenities === 'object') {
        const amenityEntries = [];

        for (const [amenityType, distance] of Object.entries(customAmenities)) {
          if (distance && typeof distance === 'string') {
            // Convert distance format from frontend to enum
            let distanceEnum: AmenityDistanceEnum;
            switch (distance) {
              case 'onSite':
                distanceEnum = AmenityDistanceEnum.ON_SITE;
                break;
              case '300m':
                distanceEnum = AmenityDistanceEnum.WITHIN_300M;
                break;
              case '500m':
                distanceEnum = AmenityDistanceEnum.WITHIN_500M;
                break;
              case '1km':
                distanceEnum = AmenityDistanceEnum.WITHIN_1KM;
                break;
              default:
                console.warn(`Unknown distance: ${distance} for amenity: ${amenityType}`);
                continue;
            }

            amenityEntries.push(
              projectAmenityRepository.create({
                projectId: project.id,
                amenityType: amenityType,
                distance: distanceEnum
              })
            );
          }
        }

        if (amenityEntries.length > 0) {
          console.log(`Saving ${amenityEntries.length} amenity entries:`, amenityEntries);
          await projectAmenityRepository.save(amenityEntries);
        }
      }
    }

    // Handle pricing updates if provided
    if (pricing && Array.isArray(pricing)) {
      // Remove existing pricing
      await projectPricingRepository.delete({ projectId: project.id });
      
      // Add new pricing
      const pricingEntities = pricing.map((p: any) => 
        projectPricingRepository.create({
          projectId: project.id,
          bedrooms: p.bedrooms,
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          minArea: p.minArea,
          maxArea: p.maxArea
        })
      );
      
      await projectPricingRepository.save(pricingEntities);
    }

    // Commit the transaction
    await queryRunner.commitTransaction();

    console.log('Transaction committed successfully');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully by admin',
      data: savedProject
    });
  } catch (error: any) {
    console.error('Admin update project error:', error);
    await queryRunner.rollbackTransaction();
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  } finally {
    await queryRunner.release();
  }
};

export const deleteProjectAsAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectRepository = AppDataSource.getRepository(Project);
    
    const project = await projectRepository.findOne({
      where: { id: parseInt(id) }
    });
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    await projectRepository.remove(project);
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully by admin'
    });
  } catch (error) {
    console.error('Admin delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
};

export const getAllProperties = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, developerId } = req.query;
    
    const propertyRepository = AppDataSource.getRepository(Property);
    
    // Build where clause
    const whereClause: any = {};
    if (developerId) {
      whereClause.userId = Number(developerId);
    }
    
    const [properties, total] = await propertyRepository.findAndCount({
      where: whereClause,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { createdAt: 'DESC' },
      relations: ['user', 'city', 'areaData']
    });
    
    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
};

// Agency Management Functions

export const getAllAgencies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const agencyRepository = AppDataSource.getRepository(Agency);
    
    // Build where clause for filtering
    const whereClause: any = {};
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    } else if (status === 'pending') {
      whereClause.isVerified = false;
      whereClause.isActive = true;
    }
    
    const [agencies, total] = await agencyRepository.findAndCount({
      where: whereClause,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { createdAt: 'DESC' },
      relations: ['owner'],
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        logoUrl: true,
        isVerified: true,
        isActive: true,
        agentCount: true,
        propertyCount: true,
        totalSales: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          id: true,
          fullName: true,
          email: true
        }
      }
    });
    
    // Transform data to match frontend expectations
    const transformedAgencies = agencies.map(agency => {
      let status: string;
      if (!agency.isActive) {
        status = 'inactive';
      } else if (!agency.isVerified) {
        status = 'pending';
      } else {
        status = 'active';
      }
      
      return {
        id: agency.id,
        name: agency.name,
        description: agency.description || '',
        address: agency.address || 'მისამართი არ არის მითითებული',
        phone: agency.phone || 'ტელეფონი არ არის მითითებული',
        email: agency.email || 'ელ. ფოსტა არ არის მითითებული',
        website: agency.website,
        status,
        totalListings: agency.propertyCount,
        activeListings: agency.propertyCount, // Assuming all are active for now
        totalAgents: agency.agentCount,
        owner: {
          id: agency.owner.id,
          name: agency.owner.fullName,
          email: agency.owner.email,
          phone: agency.phone || ''
        },
        createdAt: agency.createdAt.toISOString(),
        logo: agency.logoUrl
      };
    });
    
    res.status(200).json({
      success: true,
      data: transformedAgencies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all agencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agencies'
    });
  }
};

export const getAgencyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const agencyRepository = AppDataSource.getRepository(Agency);
    
    const agency = await agencyRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['owner'],
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
        website: true,
        socialMediaUrl: true,
        phone: true,
        email: true,
        address: true,
        cityId: true,
        logoUrl: true,
        bannerUrl: true,
        taxNumber: true,
        licenseNumber: true,
        isVerified: true,
        isActive: true,
        agentCount: true,
        propertyCount: true,
        totalSales: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      }
    });
    
    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Get agency by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agency'
    });
  }
};

export const updateAgencyAsAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const agencyRepository = AppDataSource.getRepository(Agency);
    
    const agency = await agencyRepository.findOne({
      where: { id: parseInt(id) }
    });
    
    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }
    
    // Update agency fields
    Object.assign(agency, updateData);
    
    const updatedAgency = await agencyRepository.save(agency);
    
    res.status(200).json({
      success: true,
      message: 'Agency updated successfully',
      data: updatedAgency
    });
  } catch (error) {
    console.error('Update agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agency'
    });
  }
};

export const deleteAgencyAsAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const agencyRepository = AppDataSource.getRepository(Agency);
    
    const agency = await agencyRepository.findOne({
      where: { id: parseInt(id) }
    });
    
    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }
    
    await agencyRepository.remove(agency);
    
    res.status(200).json({
      success: true,
      message: 'Agency deleted successfully'
    });
  } catch (error) {
    console.error('Delete agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agency'
    });
  }
};