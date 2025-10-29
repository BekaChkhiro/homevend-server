import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User.js';
import { City } from './City.js';
import { Area } from './Area.js';
import { Feature } from './Feature.js';
import { Advantage } from './Advantage.js';
import { FurnitureAppliance } from './FurnitureAppliance.js';
import { Tag } from './Tag.js';
import { PropertyPhoto } from './PropertyPhoto.js';

export enum PropertyTypeEnum {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  COTTAGE = 'cottage',
  LAND = 'land',
  COMMERCIAL = 'commercial',
  OFFICE = 'office',
  HOTEL = 'hotel'
}

export enum DealTypeEnum {
  SALE = 'sale',
  RENT = 'rent',
  MORTGAGE = 'mortgage',
  LEASE = 'lease',
  DAILY = 'daily'
}

export enum BuildingStatusEnum {
  OLD_BUILT = 'old-built',
  NEW_BUILT = 'new-built',
  UNDER_CONSTRUCTION = 'under-construction'
}

export enum ConstructionYearEnum {
  BEFORE_1955 = 'before-1955',
  FROM_1955_TO_2000 = '1955-2000',
  AFTER_2000 = 'after-2000'
}

export enum VipStatusEnum {
  NONE = 'none',
  VIP = 'vip',
  VIP_PLUS = 'vip_plus',
  SUPER_VIP = 'super_vip'
}

export enum ServiceTypeEnum {
  VIP = 'vip',
  VIP_PLUS = 'vip_plus',
  SUPER_VIP = 'super_vip',
  AUTO_RENEW = 'auto_renew',
  COLOR_SEPARATION = 'color_separation',
  FREE = 'free'
}

export enum ConditionEnum {
  EXCELLENT = 'excellent',
  VERY_GOOD = 'very-good',
  GOOD = 'good',
  NEEDS_RENOVATION = 'needs-renovation',
  UNDER_RENOVATION = 'under-renovation',
  OLD_RENOVATED = 'old-renovated',
  NEWLY_RENOVATED = 'newly-renovated',
  BLACK_FRAME = 'black-frame',
  WHITE_FRAME = 'white-frame',
  GREEN_FRAME = 'green-frame'
}

// PropertyStatusEnum removed as requested

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid!: string;

  @Column({ name: 'user_id', type: 'integer', nullable: false })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Agency relationship (optional - properties can belong to agencies)
  @Column({ name: 'agency_id', type: 'integer', nullable: true })
  agencyId?: number;

  @ManyToOne('Agency', { onDelete: 'SET NULL', lazy: true })
  @JoinColumn({ name: 'agency_id' })
  agency?: Promise<any>;

  // Project relationship (optional - properties can belong to projects)
  @Column({ name: 'project_id', type: 'integer', nullable: true })
  projectId?: number;

  @ManyToOne('Project', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project?: any;

  // Developer relationship (optional - properties can belong to developers directly)
  // @ManyToOne(() => Developer, { onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'developer_id' })
  // developer?: Developer;

  // Basic Information
  @Column({ type: 'varchar', length: 300, nullable: false })
  title!: string;

  @Column({
    type: 'enum',
    enum: PropertyTypeEnum,
    name: 'property_type',
    nullable: false
  })
  propertyType!: PropertyTypeEnum;

  @Column({
    type: 'enum',
    enum: DealTypeEnum,
    name: 'deal_type',
    nullable: false
  })
  dealType!: DealTypeEnum;

  @Column({ name: 'daily_rental_subcategory', type: 'varchar', length: 50, nullable: true })
  dailyRentalSubcategory?: string;

  // Location
  @Column({ name: 'city_id', type: 'integer', nullable: false })
  cityId!: number;

  @ManyToOne(() => City, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'city_id' })
  city!: City;

  @Column({ name: 'area_id', type: 'integer', nullable: true })
  areaId?: number;

  @ManyToOne(() => Area, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id' })
  areaData?: Area;

  @Column({ type: 'varchar', length: 200, nullable: false })
  street!: string;

  @Column({ name: 'street_number', type: 'varchar', length: 20, nullable: true })
  streetNumber?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 10, nullable: true })
  postalCode?: string;

  @Column({ name: 'cadastral_code', type: 'varchar', length: 50, nullable: true })
  cadastralCode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // Property Details
  @Column({ type: 'varchar', length: 10, nullable: true })
  rooms?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  bedrooms?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  bathrooms?: string;

  @Column({ name: 'total_floors', type: 'varchar', length: 10, nullable: true })
  totalFloors?: string;

  @Column({ name: 'property_floor', type: 'varchar', length: 10, nullable: true })
  propertyFloor?: string;

  @Column({
    name: 'building_status',
    type: 'enum',
    enum: BuildingStatusEnum,
    nullable: true
  })
  buildingStatus?: BuildingStatusEnum;

  @Column({
    name: 'construction_year',
    type: 'enum',
    enum: ConstructionYearEnum,
    nullable: true
  })
  constructionYear?: ConstructionYearEnum;

  @Column({
    type: 'enum',
    enum: ConditionEnum,
    nullable: true
  })
  condition?: ConditionEnum;

  @Column({ name: 'project_type', type: 'varchar', length: 100, nullable: true })
  projectType?: string;

  @Column({ name: 'ceiling_height', type: 'decimal', precision: 4, scale: 2, nullable: true })
  ceilingHeight?: number;

  // Infrastructure
  @Column({ type: 'varchar', length: 100, nullable: true })
  heating?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  parking?: string;

  @Column({ name: 'hot_water', type: 'varchar', length: 100, nullable: true })
  hotWater?: string;

  @Column({ name: 'building_material', type: 'varchar', length: 100, nullable: true })
  buildingMaterial?: string;

  // Conditional Features
  @Column({ name: 'has_balcony', type: 'boolean', default: false })
  hasBalcony!: boolean;

  @Column({ name: 'balcony_count', type: 'integer', nullable: true })
  balconyCount?: number;

  @Column({ name: 'balcony_area', type: 'decimal', precision: 6, scale: 2, nullable: true })
  balconyArea?: number;

  @Column({ name: 'has_pool', type: 'boolean', default: false })
  hasPool!: boolean;

  @Column({ name: 'pool_type', type: 'varchar', length: 100, nullable: true })
  poolType?: string;

  @Column({ name: 'has_living_room', type: 'boolean', default: false })
  hasLivingRoom!: boolean;

  @Column({ name: 'living_room_area', type: 'decimal', precision: 6, scale: 2, nullable: true })
  livingRoomArea?: number;

  @Column({ name: 'living_room_type', type: 'varchar', length: 100, nullable: true })
  livingRoomType?: string;

  @Column({ name: 'has_loggia', type: 'boolean', default: false })
  hasLoggia!: boolean;

  @Column({ name: 'loggia_area', type: 'decimal', precision: 6, scale: 2, nullable: true })
  loggiaArea?: number;

  @Column({ name: 'has_veranda', type: 'boolean', default: false })
  hasVeranda!: boolean;

  @Column({ name: 'veranda_area', type: 'decimal', precision: 6, scale: 2, nullable: true })
  verandaArea?: number;

  @Column({ name: 'has_yard', type: 'boolean', default: false })
  hasYard!: boolean;

  @Column({ name: 'yard_area', type: 'decimal', precision: 8, scale: 2, nullable: true })
  yardArea?: number;

  @Column({ name: 'has_storage', type: 'boolean', default: false })
  hasStorage!: boolean;

  @Column({ name: 'storage_area', type: 'decimal', precision: 6, scale: 2, nullable: true })
  storageArea?: number;

  @Column({ name: 'storage_type', type: 'varchar', length: 100, nullable: true })
  storageType?: string;

  // Many-to-many relationships for features, advantages, furniture/appliances, and tags
  @ManyToMany(() => Feature, { cascade: true })
  @JoinTable({
    name: 'property_features',
    joinColumn: { name: 'property_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'feature_id', referencedColumnName: 'id' }
  })
  features!: Feature[];

  @ManyToMany(() => Advantage, { cascade: true })
  @JoinTable({
    name: 'property_advantages',
    joinColumn: { name: 'property_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'advantage_id', referencedColumnName: 'id' }
  })
  advantages!: Advantage[];

  @ManyToMany(() => FurnitureAppliance, { cascade: true })
  @JoinTable({
    name: 'property_furniture_appliances',
    joinColumn: { name: 'property_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'furniture_appliance_id', referencedColumnName: 'id' }
  })
  furnitureAppliances!: FurnitureAppliance[];

  @ManyToMany(() => Tag, { cascade: true })
  @JoinTable({
    name: 'property_tags',
    joinColumn: { name: 'property_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
  })
  tags!: Tag[];

  // Pricing
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false })
  area!: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, nullable: false })
  totalPrice!: number;

  @Column({ name: 'price_per_sqm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerSqm?: number;

  @Column({ type: 'varchar', length: 3, default: 'GEL' })
  currency!: string;

  // Contact Information
  @Column({ name: 'contact_name', type: 'varchar', length: 200, nullable: false })
  contactName!: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: false })
  contactPhone!: string;

  // Descriptions
  @Column({ name: 'description_georgian', type: 'text', nullable: true })
  descriptionGeorgian?: string;

  @Column({ name: 'description_english', type: 'text', nullable: true })
  descriptionEnglish?: string;

  @Column({ name: 'description_russian', type: 'text', nullable: true })
  descriptionRussian?: string;

  // SEO & Meta
  @Column({ name: 'meta_title', type: 'varchar', length: 300, nullable: true })
  metaTitle?: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription?: string;

  @Column({ type: 'varchar', length: 300, unique: true, nullable: true })
  slug?: string;

  // Status & Metrics section - status field removed as requested

  @Column({ name: 'view_count', type: 'integer', default: 0 })
  viewCount!: number;

  @Column({ name: 'favorite_count', type: 'integer', default: 0 })
  favoriteCount!: number;

  @Column({ name: 'inquiry_count', type: 'integer', default: 0 })
  inquiryCount!: number;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'featured_until', type: 'timestamp with time zone', nullable: true })
  featuredUntil?: Date;

  // Photos - One-to-many relationship
  @OneToMany(() => PropertyPhoto, photo => photo.property, { cascade: true })
  photos!: PropertyPhoto[];

  // Services relationship
  @OneToMany('PropertyService', 'property', { cascade: true })
  services!: any[];

  // VIP Status
  @Column({
    name: 'vip_status',
    type: 'enum',
    enum: VipStatusEnum,
    default: VipStatusEnum.NONE
  })
  vipStatus!: VipStatusEnum;

  @Column({ name: 'vip_expires_at', type: 'timestamp with time zone', nullable: true })
  vipExpiresAt?: Date;

  // Additional Services
  @Column({ name: 'auto_renew_enabled', type: 'boolean', default: false })
  autoRenewEnabled!: boolean;

  @Column({ name: 'auto_renew_expires_at', type: 'timestamp with time zone', nullable: true })
  autoRenewExpiresAt?: Date;

  @Column({ name: 'color_separation_enabled', type: 'boolean', default: false })
  colorSeparationEnabled!: boolean;

  @Column({ name: 'color_separation_expires_at', type: 'timestamp with time zone', nullable: true })
  colorSeparationExpiresAt?: Date;

  // Dates
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @Column({ name: 'published_at', type: 'timestamp with time zone', nullable: true })
  publishedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;
}
