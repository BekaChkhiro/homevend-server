import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Agency } from '../models/Agency.js';
import { User, UserRoleEnum } from '../models/User.js';
import { Property } from '../models/Property.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { FindManyOptions, ILike } from 'typeorm';

// Get all agencies
export const getAgencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      city,
      isVerified
    } = req.query;
    
    const agencyRepository = AppDataSource.getRepository(Agency);

    const where: any = {
      isActive: true
    };
    
    if (search) {
      where.name = ILike(`%${search}%`);
    }
    
    if (city) {
      where.cityId = city;
    }
    
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    const options: FindManyOptions<Agency> = {
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { 
        isVerified: 'DESC',
        agentCount: 'DESC',
        createdAt: 'DESC' 
      },
      relations: ['owner'],
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
        logoUrl: true,
        phone: true,
        email: true,
        website: true,
        socialMediaUrl: true,
        address: true,
        isVerified: true,
        agentCount: true,
        propertyCount: true,
        totalSales: true,
        createdAt: true,
        owner: {
          id: true,
          fullName: true,
          email: true
        }
      }
    };

    const [agencies, total] = await agencyRepository.findAndCount(options);
    
    res.status(200).json({
      success: true,
      data: {
        agencies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agencies'
    });
  }
};

// Get agency by ID
export const getAgencyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const agencyRepository = AppDataSource.getRepository(Agency);
    const userRepository = AppDataSource.getRepository(User);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const agency = await agencyRepository.findOne({
      where: { id: Number(id), isActive: true },
      relations: ['owner'],
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        phone: true,
        email: true,
        website: true,
        socialMediaUrl: true,
        address: true,
        isVerified: true,
        agentCount: true,
        propertyCount: true,
        totalSales: true,
        createdAt: true,
        owner: {
          id: true,
          fullName: true,
          email: true,
          phone: true
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
    
    // Fetch agents separately due to lazy loading
    const agents = await userRepository.find({
      where: { agencyId: agency.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });
    
    // Fetch agency properties separately
    const agencyProperties = await propertyRepository.find({
      where: { agencyId: agency.id },
      relations: ['city', 'areaData', 'user'],
      select: {
        id: true,
        uuid: true,
        title: true,
        propertyType: true,
        dealType: true,
        area: true,
        totalPrice: true,
        street: true,
        streetNumber: true,
        createdAt: true,
        city: {
          id: true,
          nameGeorgian: true
        },
        areaData: {
          id: true,
          nameKa: true
        },
        user: {
          id: true,
          fullName: true
        }
      }
    });
    
    // Fetch properties from all agents in the agency
    const agentIds = agents.map(agent => agent.id);
    let agentProperties: Property[] = [];
    
    if (agentIds.length > 0) {
      agentProperties = await propertyRepository
        .createQueryBuilder('property')
        .leftJoinAndSelect('property.city', 'city')
        .leftJoinAndSelect('property.areaData', 'areaData')
        .leftJoinAndSelect('property.user', 'user')
        .where('property.userId IN (:...agentIds)', { agentIds })
        .select([
          'property.id',
          'property.uuid',
          'property.title',
          'property.propertyType',
          'property.dealType',
          'property.area',
          'property.totalPrice',
          'property.street',
          'property.streetNumber',
          'property.createdAt',
          'property.userId',
          'city.id',
          'city.nameGeorgian',
          'areaData.id',
          'areaData.nameKa',
          'user.id',
          'user.fullName'
        ])
        .getMany();
    }
    
    // Add agents to the agency object with their properties
    const agentsWithProperties = agents.map(agent => ({
      ...agent,
      properties: agentProperties.filter(p => p.userId === agent.id)
    }));
    
    // Combine agency properties with agent properties
    const allProperties = [
      ...agencyProperties,
      ...agentProperties
    ];
    
    const agencyWithAgentsAndProperties = {
      ...agency,
      properties: agencyProperties,
      agents: agentsWithProperties,
      allProperties: allProperties
    };
    
    res.status(200).json({
      success: true,
      data: agencyWithAgentsAndProperties
    });
  } catch (error) {
    console.error('Get agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agency'
    });
  }
};

// Update agency (only by owner)
export const updateAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      phone,
      email,
      website,
      socialMediaUrl,
      address,
      logoUrl,
      bannerUrl
    } = req.body;
    
    const agencyRepository = AppDataSource.getRepository(Agency);
    
    const agency = await agencyRepository.findOne({
      where: { id: Number(id) },
      relations: ['owner']
    });
    
    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }
    
    // Check if user is the owner or admin
    if (agency.ownerId !== req.user!.id && req.user!.role !== UserRoleEnum.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this agency'
      });
      return;
    }
    
    // Update agency data
    if (name !== undefined) agency.name = name;
    if (description !== undefined) agency.description = description;
    if (phone !== undefined) agency.phone = phone;
    if (email !== undefined) agency.email = email;
    if (website !== undefined) agency.website = website;
    if (socialMediaUrl !== undefined) agency.socialMediaUrl = socialMediaUrl;
    if (address !== undefined) agency.address = address;
    if (logoUrl !== undefined) agency.logoUrl = logoUrl;
    if (bannerUrl !== undefined) agency.bannerUrl = bannerUrl;
    
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

// Add agent to agency (only by agency owner)
export const addAgentToAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // agency id
    const { userEmail } = req.body;
    
    const agencyRepository = AppDataSource.getRepository(Agency);
    const userRepository = AppDataSource.getRepository(User);
    
    const agency = await agencyRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }
    
    // Check if user is the owner or admin
    if (agency.ownerId !== req.user!.id && req.user!.role !== UserRoleEnum.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to add agents to this agency'
      });
      return;
    }
    
    // Find the user to add as agent
    const userToAdd = await userRepository.findOne({
      where: { email: userEmail }
    });
    
    if (!userToAdd) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Check if user is already part of an agency
    if (userToAdd.agencyId) {
      res.status(400).json({
        success: false,
        message: 'User is already part of an agency'
      });
      return;
    }
    
    // Add user to agency
    userToAdd.agencyId = agency.id;
    userToAdd.role = UserRoleEnum.AGENT;
    
    await userRepository.save(userToAdd);
    
    // Update agency agent count
    agency.agentCount = agency.agentCount + 1;
    await agencyRepository.save(agency);
    
    res.status(200).json({
      success: true,
      message: 'Agent added to agency successfully'
    });
  } catch (error) {
    console.error('Add agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add agent to agency'
    });
  }
};

// Remove agent from agency (only by agency owner)
export const removeAgentFromAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, agentId } = req.params;
    
    const agencyRepository = AppDataSource.getRepository(Agency);
    const userRepository = AppDataSource.getRepository(User);
    
    const agency = await agencyRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }
    
    // Check if user is the owner or admin
    if (agency.ownerId !== req.user!.id && req.user!.role !== UserRoleEnum.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to remove agents from this agency'
      });
      return;
    }
    
    // Find the agent to remove
    const agentToRemove = await userRepository.findOne({
      where: { id: Number(agentId), agencyId: agency.id }
    });
    
    if (!agentToRemove) {
      res.status(404).json({
        success: false,
        message: 'Agent not found in this agency'
      });
      return;
    }
    
    // Remove agent from agency
    agentToRemove.agencyId = null;
    agentToRemove.role = UserRoleEnum.USER;
    
    await userRepository.save(agentToRemove);
    
    // Update agency agent count
    agency.agentCount = Math.max(0, agency.agentCount - 1);
    await agencyRepository.save(agency);
    
    res.status(200).json({
      success: true,
      message: 'Agent removed from agency successfully'
    });
  } catch (error) {
    console.error('Remove agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove agent from agency'
    });
  }
};

// Get current user's agency users
export const getMyAgencyUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRepository = AppDataSource.getRepository(User);
    const agencyRepository = AppDataSource.getRepository(Agency);

    // Find the agency owned by the current user
    const agency = await agencyRepository.findOne({
      where: { ownerId: userId }
    });

    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }

    // Get all users associated with this agency (excluding the owner)
    const agencyUsers = await userRepository.find({
      where: { agencyId: agency.id },
      select: ['id', 'fullName', 'email', 'role', 'createdAt'],
      order: { createdAt: 'DESC' }
    });

    res.status(200).json({
      success: true,
      message: 'Agency users retrieved successfully',
      data: agencyUsers
    });
  } catch (error) {
    console.error('Get my agency users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add user to current user's agency by email
export const addUserToMyAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const agencyRepository = AppDataSource.getRepository(Agency);

    // Find the agency owned by the current user
    const agency = await agencyRepository.findOne({
      where: { ownerId: userId }
    });

    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }

    // Find the user to add
    const userToAdd = await userRepository.findOne({
      where: { email }
    });

    if (!userToAdd) {
      res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
      return;
    }

    // Check if user is already part of an agency
    if (userToAdd.agencyId) {
      res.status(400).json({
        success: false,
        message: 'User is already part of an agency'
      });
      return;
    }

    // Check if user is not an agency owner
    if (userToAdd.role === UserRoleEnum.AGENCY) {
      res.status(400).json({
        success: false,
        message: 'Cannot add agency owners as agents'
      });
      return;
    }

    // Add user to agency
    userToAdd.agencyId = agency.id;
    await userRepository.save(userToAdd);

    // Update agency agent count
    agency.agentCount = agency.agentCount + 1;
    await agencyRepository.save(agency);

    res.status(200).json({
      success: true,
      message: 'User added to agency successfully',
      data: {
        id: userToAdd.id,
        fullName: userToAdd.fullName,
        email: userToAdd.email,
        role: userToAdd.role,
        createdAt: userToAdd.createdAt
      }
    });
  } catch (error) {
    console.error('Add user to my agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove user from current user's agency
export const removeUserFromMyAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { userIdToRemove } = req.params;

    const userRepository = AppDataSource.getRepository(User);
    const agencyRepository = AppDataSource.getRepository(Agency);

    // Find the agency owned by the current user
    const agency = await agencyRepository.findOne({
      where: { ownerId: userId }
    });

    if (!agency) {
      res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
      return;
    }

    // Find the user to remove
    const userToRemove = await userRepository.findOne({
      where: { 
        id: parseInt(userIdToRemove),
        agencyId: agency.id 
      }
    });

    if (!userToRemove) {
      res.status(404).json({
        success: false,
        message: 'User not found in this agency'
      });
      return;
    }

    // Remove user from agency
    userToRemove.agencyId = null;
    await userRepository.save(userToRemove);

    // Update agency agent count
    agency.agentCount = Math.max(0, agency.agentCount - 1);
    await agencyRepository.save(agency);

    res.status(200).json({
      success: true,
      message: 'User removed from agency successfully'
    });
  } catch (error) {
    console.error('Remove user from my agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};