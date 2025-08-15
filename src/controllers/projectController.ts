import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Project, ProjectTypeEnum, DeliveryStatusEnum } from '../models/Project.js';
import { ProjectPricing, RoomTypeEnum } from '../models/ProjectPricing.js';
import { User, UserRoleEnum } from '../models/User.js';
import { City } from '../models/City.js';
import { Area } from '../models/Area.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Get all projects with optional filtering
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const {
      city,
      area,
      projectType,
      deliveryStatus,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const queryBuilder = projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.areaData', 'areaData')
      .leftJoinAndSelect('project.developer', 'developer')
      .leftJoinAndSelect('project.pricing', 'pricing')
      .where('project.isActive = :isActive', { isActive: true })
      .select([
        'project.id', 'project.uuid', 'project.projectName', 'project.description',
        'project.street', 'project.streetNumber', 'project.projectType',
        'project.deliveryStatus', 'project.deliveryDate', 'project.numberOfBuildings',
        'project.totalApartments', 'project.numberOfFloors', 'project.viewCount',
        'project.createdAt',
        'city.id', 'city.nameGeorgian',
        'areaData.id', 'areaData.nameKa',
        'developer.id', 'developer.fullName',
        'pricing'
      ]);

    // Apply filters
    if (city) {
      queryBuilder.andWhere('project.cityId = :cityId', { cityId: city });
    }

    if (area) {
      queryBuilder.andWhere('project.areaId = :areaId', { areaId: area });
    }

    if (projectType) {
      queryBuilder.andWhere('project.projectType = :projectType', { projectType });
    }

    if (deliveryStatus) {
      queryBuilder.andWhere('project.deliveryStatus = :deliveryStatus', { deliveryStatus });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'viewCount', 'deliveryDate'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`project.${sortField}`, order);

    // Apply pagination
    const pageNumber = Math.max(1, parseInt(page as string) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
    const offset = (pageNumber - 1) * limitNumber;

    queryBuilder.skip(offset).take(limitNumber);

    const [projects, total] = await queryBuilder.getManyAndCount();

    res.json({
      projects,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const { id } = req.params;

    const project = await projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.areaData', 'areaData')
      .leftJoinAndSelect('project.developer', 'developer')
      .leftJoinAndSelect('project.pricing', 'pricing')
      .where('project.id = :id', { id })
      .andWhere('project.isActive = :isActive', { isActive: true })
      .getOne();

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Increment view count
    await projectRepository.increment({ id: project.id }, 'viewCount', 1);

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get projects by developer ID
export const getProjectsByDeveloperId = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const userRepository = AppDataSource.getRepository(User);
    const { developerId } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Verify developer exists
    const developer = await userRepository.findOne({
      where: { id: parseInt(developerId), role: UserRoleEnum.DEVELOPER }
    });

    if (!developer) {
      res.status(404).json({ message: 'Developer not found' });
      return;
    }

    const queryBuilder = projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.areaData', 'areaData')
      .leftJoinAndSelect('project.developer', 'developer')
      .leftJoinAndSelect('project.pricing', 'pricing')
      .where('project.developerId = :developerId', { developerId })
      .andWhere('project.isActive = :isActive', { isActive: true })
      .orderBy('project.createdAt', 'DESC');

    // Apply pagination
    const pageNumber = Math.max(1, parseInt(page as string) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
    const offset = (pageNumber - 1) * limitNumber;

    queryBuilder.skip(offset).take(limitNumber);

    const [projects, total] = await queryBuilder.getManyAndCount();

    res.json({
      projects,
      developer: {
        id: developer.id,
        fullName: developer.fullName,
        email: developer.email
      },
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching developer projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's projects (for developer dashboard)
export const getUserProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const userRepository = AppDataSource.getRepository(User);
    const userId = req.user!.id;

    // Verify user is a developer
    const user = await userRepository.findOne({
      where: { id: userId, role: UserRoleEnum.DEVELOPER }
    });

    if (!user) {
      res.status(403).json({ message: 'Access denied. Developer role required.' });
      return;
    }

    const projects = await projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.areaData', 'areaData')
      .leftJoinAndSelect('project.pricing', 'pricing')
      .where('project.developerId = :userId', { userId })
      .orderBy('project.createdAt', 'DESC')
      .getMany();

    res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new project
export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const projectPricingRepository = AppDataSource.getRepository(ProjectPricing);
    const userRepository = AppDataSource.getRepository(User);
    const cityRepository = AppDataSource.getRepository(City);
    const areaRepository = AppDataSource.getRepository(Area);
    const userId = req.user!.id;

    // Verify user is a developer
    const user = await userRepository.findOne({
      where: { id: userId, role: UserRoleEnum.DEVELOPER }
    });

    if (!user) {
      res.status(403).json({ message: 'Access denied. Developer role required.' });
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
      // Amenities in project area
      hasGroceryStore,
      hasBikePath,
      hasSportsField,
      hasChildrenArea,
      hasSquare,
      // Within 300 meters
      pharmacy300m,
      kindergarten300m,
      school300m,
      busStop300m,
      groceryStore300m,
      bikePath300m,
      sportsField300m,
      stadium300m,
      square300m,
      // Within 500 meters
      pharmacy500m,
      kindergarten500m,
      school500m,
      university500m,
      busStop500m,
      groceryStore500m,
      bikePath500m,
      sportsField500m,
      stadium500m,
      square500m,
      // Within 1 kilometer
      hospital1km,
      // Post-handover services
      securityService,
      hasLobby,
      hasConcierge,
      videoSurveillance,
      hasLighting,
      landscaping,
      yardCleaning,
      entranceCleaning,
      hasDoorman,
      // Security
      fireSystem,
      mainDoorLock,
      // Pricing data
      pricing
    } = req.body;

    // Verify city exists
    const city = await cityRepository.findOne({ where: { id: cityId } });
    if (!city) {
      res.status(400).json({ message: 'Invalid city ID' });
      return;
    }

    // Verify area exists if provided
    if (areaId) {
      const area = await areaRepository.findOne({ where: { id: areaId } });
      if (!area) {
        res.status(400).json({ message: 'Invalid area ID' });
        return;
      }
    }

    // Create project
    const project = projectRepository.create({
      projectName,
      description,
      developerId: userId,
      cityId,
      areaId,
      street,
      streetNumber,
      latitude,
      longitude,
      projectType,
      deliveryStatus,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      numberOfBuildings,
      totalApartments,
      numberOfFloors,
      parkingSpaces,
      // Amenities
      hasGroceryStore: hasGroceryStore || false,
      hasBikePath: hasBikePath || false,
      hasSportsField: hasSportsField || false,
      hasChildrenArea: hasChildrenArea || false,
      hasSquare: hasSquare || false,
      // 300m
      pharmacy300m: pharmacy300m || false,
      kindergarten300m: kindergarten300m || false,
      school300m: school300m || false,
      busStop300m: busStop300m || false,
      groceryStore300m: groceryStore300m || false,
      bikePath300m: bikePath300m || false,
      sportsField300m: sportsField300m || false,
      stadium300m: stadium300m || false,
      square300m: square300m || false,
      // 500m
      pharmacy500m: pharmacy500m || false,
      kindergarten500m: kindergarten500m || false,
      school500m: school500m || false,
      university500m: university500m || false,
      busStop500m: busStop500m || false,
      groceryStore500m: groceryStore500m || false,
      bikePath500m: bikePath500m || false,
      sportsField500m: sportsField500m || false,
      stadium500m: stadium500m || false,
      square500m: square500m || false,
      // 1km
      hospital1km: hospital1km || false,
      // Services
      securityService: securityService || false,
      hasLobby: hasLobby || false,
      hasConcierge: hasConcierge || false,
      videoSurveillance: videoSurveillance || false,
      hasLighting: hasLighting || false,
      landscaping: landscaping || false,
      yardCleaning: yardCleaning || false,
      entranceCleaning: entranceCleaning || false,
      hasDoorman: hasDoorman || false,
      // Security
      fireSystem: fireSystem || false,
      mainDoorLock: mainDoorLock || false
    });

    const savedProject = await projectRepository.save(project);

    // Create pricing entries if provided
    if (pricing && Array.isArray(pricing)) {
      const pricingEntries = pricing.map((priceData: any) => {
        return projectPricingRepository.create({
          projectId: savedProject.id,
          roomType: priceData.roomType,
          numberOfRooms: priceData.numberOfRooms,
          totalArea: priceData.totalArea,
          livingArea: priceData.livingArea,
          balconyArea: priceData.balconyArea,
          pricePerSqm: priceData.pricePerSqm,
          totalPriceFrom: priceData.totalPriceFrom,
          totalPriceTo: priceData.totalPriceTo,
          availableUnits: priceData.availableUnits || 1,
          totalUnits: priceData.totalUnits || 1,
          hasBalcony: priceData.hasBalcony || false,
          hasTerrace: priceData.hasTerrace || false,
          hasLoggia: priceData.hasLoggia || false,
          floorFrom: priceData.floorFrom,
          floorTo: priceData.floorTo
        });
      });

      await projectPricingRepository.save(pricingEntries);
    }

    // Fetch the complete project with relations
    const completeProject = await projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.areaData', 'areaData')
      .leftJoinAndSelect('project.developer', 'developer')
      .leftJoinAndSelect('project.pricing', 'pricing')
      .where('project.id = :id', { id: savedProject.id })
      .getOne();

    res.status(201).json(completeProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update project
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const projectPricingRepository = AppDataSource.getRepository(ProjectPricing);
    const cityRepository = AppDataSource.getRepository(City);
    const areaRepository = AppDataSource.getRepository(Area);
    const { id } = req.params;
    const userId = req.user!.id;

    // Find project and verify ownership
    const project = await projectRepository.findOne({
      where: { id: parseInt(id), developerId: userId }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or access denied' });
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
      ...amenities
    } = req.body;

    // Verify city exists if changed
    if (cityId && cityId !== project.cityId) {
      const city = await cityRepository.findOne({ where: { id: cityId } });
      if (!city) {
        res.status(400).json({ message: 'Invalid city ID' });
        return;
      }
    }

    // Verify area exists if provided
    if (areaId && areaId !== project.areaId) {
      const area = await areaRepository.findOne({ where: { id: areaId } });
      if (!area) {
        res.status(400).json({ message: 'Invalid area ID' });
        return;
      }
    }

    // Update project
    await projectRepository.update(project.id, {
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
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      numberOfBuildings,
      totalApartments,
      numberOfFloors,
      parkingSpaces,
      ...amenities
    });

    // Update pricing if provided
    if (pricing && Array.isArray(pricing)) {
      // Remove existing pricing
      await projectPricingRepository.delete({ projectId: project.id });

      // Create new pricing entries
      const pricingEntries = pricing.map((priceData: any) => {
        return projectPricingRepository.create({
          projectId: project.id,
          roomType: priceData.roomType,
          numberOfRooms: priceData.numberOfRooms,
          totalArea: priceData.totalArea,
          livingArea: priceData.livingArea,
          balconyArea: priceData.balconyArea,
          pricePerSqm: priceData.pricePerSqm,
          totalPriceFrom: priceData.totalPriceFrom,
          totalPriceTo: priceData.totalPriceTo,
          availableUnits: priceData.availableUnits || 1,
          totalUnits: priceData.totalUnits || 1,
          hasBalcony: priceData.hasBalcony || false,
          hasTerrace: priceData.hasTerrace || false,
          hasLoggia: priceData.hasLoggia || false,
          floorFrom: priceData.floorFrom,
          floorTo: priceData.floorTo
        });
      });

      await projectPricingRepository.save(pricingEntries);
    }

    // Fetch updated project
    const updatedProject = await projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.areaData', 'areaData')
      .leftJoinAndSelect('project.developer', 'developer')
      .leftJoinAndSelect('project.pricing', 'pricing')
      .where('project.id = :id', { id: project.id })
      .getOne();

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete project
export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const { id } = req.params;
    const userId = req.user!.id;

    // Find project and verify ownership
    const project = await projectRepository.findOne({
      where: { id: parseInt(id), developerId: userId }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or access denied' });
      return;
    }

    // Soft delete - set isActive to false
    await projectRepository.update(project.id, { isActive: false });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};