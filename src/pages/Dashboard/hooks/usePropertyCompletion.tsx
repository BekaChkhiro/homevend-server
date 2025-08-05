import { useMemo } from "react";

interface PropertyFormData {
  // Basic info
  propertyType: string;
  transactionType: string;
  city: string;
  street: string;
  
  // Property details
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  floor: string;
  
  // Price info
  totalPrice: string;
  totalArea: string;
  
  // Contact info
  contactName: string;
  phoneNumber: string;
  
  // Description
  georgianDescription: string;
  
  // Photos
  photos: any[];
  
  // Additional optional fields
  title: string;
  description: string;
  features: string[];
  amenities: string[];
}

// Define field categories with different weights
const CRITICAL_FIELDS = [
  'propertyType',
  'transactionType', 
  'city',
  'contactName',
  'phoneNumber'
] as const;

const IMPORTANT_FIELDS = [
  'street',
  'rooms',
  'area',
  'totalPrice',
  'georgianDescription',
  'photos'
] as const;

const USEFUL_FIELDS = [
  'bedrooms',
  'bathrooms', 
  'floor',
  'totalArea',
  'title',
  'description',
  'streetNumber',
  'cadastralCode',
  'totalFloors',
  'status',
  'constructionYear',
  'condition'
] as const;

const ADDITIONAL_FIELDS = [
  'ceilingHeight',
  'projectType',
  'heating',
  'parking',
  'hotWater',
  'buildingMaterial',
  'balconyCount',
  'balconyType',
  'loggiaCount',
  'verandaCount',
  'storageArea',
  'storageType',
  'features',
  'amenities',
  'furniture',
  'badges',
  'pricePerSqm',
  'englishDescription',
  'russianDescription'
] as const;

export const usePropertyCompletion = (formData?: Partial<PropertyFormData>) => {
  const completionPercentage = useMemo(() => {
    if (!formData) return 0;

    let totalScore = 0;
    let maxScore = 0;

    // Helper function to check if field has value
    const hasValue = (field: string) => {
      if (field === 'photos') {
        return formData.photos && formData.photos.length > 0;
      }
      if (field === 'features' || field === 'amenities' || field === 'furniture' || field === 'badges') {
        return formData[field as keyof PropertyFormData] && (formData[field as keyof PropertyFormData] as string[]).length > 0;
      }
      if (field === 'hasYard') {
        return formData.hasYard !== undefined;
      }
      return formData[field as keyof PropertyFormData] && String(formData[field as keyof PropertyFormData]).trim() !== '';
    };

    // Critical fields (40% weight) - 8 points each
    CRITICAL_FIELDS.forEach(field => {
      maxScore += 8;
      if (hasValue(field)) {
        totalScore += 8;
      }
    });

    // Important fields (35% weight) - 6 points each
    IMPORTANT_FIELDS.forEach(field => {
      maxScore += 6;
      if (hasValue(field)) {
        totalScore += 6;
      }
    });

    // Useful fields (20% weight) - 3 points each
    USEFUL_FIELDS.forEach(field => {
      maxScore += 3;
      if (hasValue(field)) {
        totalScore += 3;
      }
    });

    // Additional fields (5% weight) - 1 point each
    ADDITIONAL_FIELDS.forEach(field => {
      maxScore += 1;
      if (hasValue(field)) {
        totalScore += 1;
      }
    });

    return Math.round((totalScore / maxScore) * 100);
  }, [formData]);

  const missingCriticalFields = useMemo(() => {
    if (!formData) return CRITICAL_FIELDS.slice();

    const missing: string[] = [];
    const fieldLabels: Record<string, string> = {
      propertyType: 'ქონების ტიპი',
      transactionType: 'გარიგების ტიპი',
      city: 'ქალაქი',
      contactName: 'საკონტაქტო პირი',
      phoneNumber: 'ტელეფონის ნომერი'
    };

    // Helper function to check if field has value
    const hasValue = (field: string) => {
      if (field === 'photos') {
        return formData.photos && formData.photos.length > 0;
      }
      if (field === 'features' || field === 'amenities' || field === 'furniture' || field === 'badges') {
        return formData[field as keyof PropertyFormData] && (formData[field as keyof PropertyFormData] as string[]).length > 0;
      }
      if (field === 'hasYard') {
        return formData.hasYard !== undefined;
      }
      return formData[field as keyof PropertyFormData] && String(formData[field as keyof PropertyFormData]).trim() !== '';
    };

    CRITICAL_FIELDS.forEach(field => {
      if (!hasValue(field)) {
        missing.push(fieldLabels[field] || field);
      }
    });

    return missing;
  }, [formData]);

  const missingImportantFields = useMemo(() => {
    if (!formData) return IMPORTANT_FIELDS.slice();

    const missing: string[] = [];
    const fieldLabels: Record<string, string> = {
      street: 'ქუჩა',
      rooms: 'ოთახების რაოდენობა',
      area: 'ფართი',
      totalPrice: 'ფასი',
      georgianDescription: 'აღწერა ქართულად',
      photos: 'ფოტოები'
    };

    // Helper function to check if field has value
    const hasValue = (field: string) => {
      if (field === 'photos') {
        return formData.photos && formData.photos.length > 0;
      }
      if (field === 'features' || field === 'amenities' || field === 'furniture' || field === 'badges') {
        return formData[field as keyof PropertyFormData] && (formData[field as keyof PropertyFormData] as string[]).length > 0;
      }
      if (field === 'hasYard') {
        return formData.hasYard !== undefined;
      }
      return formData[field as keyof PropertyFormData] && String(formData[field as keyof PropertyFormData]).trim() !== '';
    };

    IMPORTANT_FIELDS.forEach(field => {
      if (!hasValue(field)) {
        missing.push(fieldLabels[field] || field);
      }
    });

    return missing;
  }, [formData]);

  return {
    completionPercentage,
    missingCriticalFields,
    missingImportantFields,
    isComplete: completionPercentage === 100,
    canPublish: missingCriticalFields.length === 0
  };
};