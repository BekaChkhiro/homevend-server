import { z } from "zod";

export const propertyFormSchema = z.object({
  // Basic Info
  propertyType: z.string().min(1, "უძრავი ქონების ტიპი აუცილებელია"),
  dealType: z.string().min(1, "გარიგების ტიპი აუცილებელია"),
  city: z.string().min(1, "ქალაქი აუცილებელია"),
  street: z.string().min(1, "ქუჩა აუცილებელია"),
  streetNumber: z.string().optional(),
  cadastralCode: z.string().optional(),

  // Property Details
  rooms: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  totalFloors: z.string().optional(),
  buildingStatus: z.string().optional(),
  constructionYear: z.string().optional(),
  condition: z.string().optional(),
  projectType: z.string().optional(),
  ceilingHeight: z.string().optional(),
  heating: z.string().optional(),
  parking: z.string().optional(),
  hotWater: z.string().optional(),
  buildingMaterial: z.string().optional(),

  // Conditional fields
  hasBalcony: z.boolean().default(false),
  balconyCount: z.string().optional(),
  balconyArea: z.string().optional(),
  
  hasPool: z.boolean().default(false),
  poolType: z.string().optional(),
  
  hasLivingRoom: z.boolean().default(false),
  livingRoomArea: z.string().optional(),
  livingRoomType: z.string().optional(),
  
  hasLoggia: z.boolean().default(false),
  loggiaArea: z.string().optional(),
  
  hasVeranda: z.boolean().default(false),
  verandaArea: z.string().optional(),
  
  hasYard: z.boolean().default(false),
  yardArea: z.string().optional(),
  
  hasStorage: z.boolean().default(false),
  storageArea: z.string().optional(),
  storageType: z.string().optional(),

  // Features (checkboxes)
  features: z.array(z.string()).default([]),
  
  // Advantages (checkboxes)
  advantages: z.array(z.string()).default([]),
  
  // Furniture & Appliances (checkboxes)
  furnitureAppliances: z.array(z.string()).default([]),
  
  // Tags (checkboxes)
  tags: z.array(z.string()).default([]),

  // Price & Area
  area: z.string().min(1, "ფართი აუცილებელია"),
  totalPrice: z.string().min(1, "სრული ფასი აუცილებელია"),
  pricePerSqm: z.string().optional(),

  // Contact Info
  contactName: z.string().min(1, "სახელი აუცილებელია"),
  contactPhone: z.string().min(1, "ტელეფონის ნომერი აუცილებელია"),

  // Descriptions
  descriptionGeorgian: z.string().optional(),
  descriptionEnglish: z.string().optional(),
  descriptionRussian: z.string().optional(),

  // Photos
  photos: z.array(z.instanceof(File)).default([]),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;