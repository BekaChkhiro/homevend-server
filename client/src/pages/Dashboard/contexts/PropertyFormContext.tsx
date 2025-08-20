import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PropertyFormData {
  title: string;
  price: string;
  propertyType: string;
  transactionType: string;
  description: string;
  area: string;
  floor: string;
  city: string;
  street: string;
  streetNumber: string;
  cadastralCode: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  totalFloors: string;
  status: string;
  constructionYear: string;
  condition: string;
  ceilingHeight: string;
  projectType: string;
  heating: string;
  parking: string;
  hotWater: string;
  buildingMaterial: string;
  balconyCount: string;
  balconyType: string;
  loggiaCount: string;
  verandaCount: string;
  hasYard: boolean;
  storageArea: string;
  storageType: string;
  features: string[];
  amenities: string[];
  furniture: string[];
  badges: string[];
  totalArea: string;
  totalPrice: string;
  pricePerSqm: string;
  contactName: string;
  phoneNumber: string;
  georgianDescription: string;
  englishDescription: string;
  russianDescription: string;
  photos: any[];
}

interface PropertyFormContextType {
  formData: PropertyFormData;
  updateFormData: (field: string, value: string | boolean | string[] | any[]) => void;
  resetForm: () => void;
}

const initialFormData: PropertyFormData = {
  title: "",
  price: "",
  propertyType: "",
  transactionType: "",
  description: "",
  area: "",
  floor: "",
  city: "",
  street: "",
  streetNumber: "",
  cadastralCode: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  totalFloors: "",
  status: "",
  constructionYear: "",
  condition: "",
  ceilingHeight: "",
  projectType: "",
  heating: "",
  parking: "",
  hotWater: "",
  buildingMaterial: "",
  balconyCount: "",
  balconyType: "",
  loggiaCount: "",
  verandaCount: "",
  hasYard: false,
  storageArea: "",
  storageType: "",
  features: [],
  amenities: [],
  furniture: [],
  badges: [],
  totalArea: "",
  totalPrice: "",
  pricePerSqm: "",
  contactName: "",
  phoneNumber: "",
  georgianDescription: "",
  englishDescription: "",
  russianDescription: "",
  photos: []
};

const PropertyFormContext = createContext<PropertyFormContextType | undefined>(undefined);

export const PropertyFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);

  const updateFormData = (field: string, value: string | boolean | string[] | any[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return (
    <PropertyFormContext.Provider value={{ formData, updateFormData, resetForm }}>
      {children}
    </PropertyFormContext.Provider>
  );
};

export const usePropertyForm = () => {
  const context = useContext(PropertyFormContext);
  if (!context) {
    throw new Error('usePropertyForm must be used within a PropertyFormProvider');
  }
  return context;
};