import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { TermsConditions, TermsSection } from '../models/TermsConditions.js';

// Get active terms and conditions (public endpoint)
export const getActiveTermsConditions = async (req: Request, res: Response) => {
  try {
    const { lang } = req.query;
    const termsRepository = AppDataSource.getRepository(TermsConditions);

    const terms = await termsRepository.findOne({
      where: { isActive: true },
      order: { version: 'DESC' }
    });

    if (!terms) {
      res.status(404).json({
        success: false,
        message: 'Terms and conditions not found'
      });
      return;
    }

    // Parse sections if it's a string
    let sections = terms.sections;
    if (typeof sections === 'string') {
      try {
        sections = JSON.parse(sections);
      } catch (e) {
        sections = [];
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: terms.id,
        sections: sections || [],
        version: terms.version,
        updatedAt: terms.updatedAt
      }
    });
  } catch (error) {
    console.error('Get terms and conditions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms and conditions'
    });
  }
};

// Get all terms and conditions versions (admin endpoint)
export const getAllTermsConditions = async (req: Request, res: Response) => {
  try {
    const termsRepository = AppDataSource.getRepository(TermsConditions);

    const terms = await termsRepository.find({
      order: { version: 'DESC' }
    });

    res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get all terms and conditions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms and conditions'
    });
  }
};

// Get current terms and conditions for admin editing
export const getTermsConditionsForAdmin = async (req: Request, res: Response) => {
  try {
    const termsRepository = AppDataSource.getRepository(TermsConditions);

    const terms = await termsRepository.findOne({
      where: { isActive: true },
      order: { version: 'DESC' }
    });

    if (terms) {
      // Parse sections if it's a string
      let sections = terms.sections;
      if (typeof sections === 'string') {
        try {
          sections = JSON.parse(sections);
        } catch (e) {
          sections = [];
        }
      }
      terms.sections = sections || [];
    }

    res.status(200).json({
      success: true,
      data: terms || {
        sections: [],
        version: 0,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Get terms for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms and conditions'
    });
  }
};

// Create new terms and conditions
export const createTermsConditions = async (req: Request, res: Response) => {
  try {
    const { sections } = req.body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Sections array is required'
      });
      return;
    }

    const termsRepository = AppDataSource.getRepository(TermsConditions);

    // Deactivate all existing versions
    await termsRepository.update({ isActive: true }, { isActive: false });

    // Get the latest version number
    const latestTerms = await termsRepository.findOne({
      order: { version: 'DESC' }
    });

    const newVersion = latestTerms ? latestTerms.version + 1 : 1;

    const terms = termsRepository.create({
      sections: sections,
      version: newVersion,
      isActive: true
    });

    await termsRepository.save(terms);

    res.status(201).json({
      success: true,
      message: 'Terms and conditions created successfully',
      data: terms
    });
  } catch (error) {
    console.error('Create terms and conditions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create terms and conditions'
    });
  }
};

// Update terms and conditions
export const updateTermsConditions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections, isActive } = req.body;

    if (!sections || !Array.isArray(sections)) {
      res.status(400).json({
        success: false,
        message: 'Sections array is required'
      });
      return;
    }

    const termsRepository = AppDataSource.getRepository(TermsConditions);

    const terms = await termsRepository.findOne({
      where: { id: Number(id) }
    });

    if (!terms) {
      res.status(404).json({
        success: false,
        message: 'Terms and conditions not found'
      });
      return;
    }

    // If activating this version, deactivate all others
    if (isActive === true && !terms.isActive) {
      await termsRepository.update({ isActive: true }, { isActive: false });
    }

    terms.sections = sections;
    if (isActive !== undefined) {
      terms.isActive = isActive;
    }

    await termsRepository.save(terms);

    res.status(200).json({
      success: true,
      message: 'Terms and conditions updated successfully',
      data: terms
    });
  } catch (error) {
    console.error('Update terms and conditions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update terms and conditions'
    });
  }
};

// Delete terms and conditions version
export const deleteTermsConditions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const termsRepository = AppDataSource.getRepository(TermsConditions);

    const terms = await termsRepository.findOne({
      where: { id: Number(id) }
    });

    if (!terms) {
      res.status(404).json({
        success: false,
        message: 'Terms and conditions not found'
      });
      return;
    }

    if (terms.isActive) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete active terms and conditions'
      });
      return;
    }

    await termsRepository.remove(terms);

    res.status(200).json({
      success: true,
      message: 'Terms and conditions deleted successfully'
    });
  } catch (error) {
    console.error('Delete terms and conditions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete terms and conditions'
    });
  }
};