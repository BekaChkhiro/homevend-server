import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User.js';

@Entity('properties')
@Index('IDX_PROPERTY_USER', ['userId'])
@Index('IDX_PROPERTY_STATUS', ['status'])
@Index('IDX_PROPERTY_CITY', ['city'])
@Index('IDX_PROPERTY_DEAL_TYPE', ['dealType'])
@Index('IDX_PROPERTY_PROPERTY_TYPE', ['propertyType'])
export class Property {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'integer',
    nullable: false
  })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  // Basic Info
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false
  })
  title!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false
  })
  propertyType!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false
  })
  dealType!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false
  })
  city!: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false
  })
  street!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true
  })
  streetNumber?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true
  })
  cadastralCode?: string;

  // Property Details
  @Column({ type: 'varchar', length: 20, nullable: true })
  rooms?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bedrooms?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bathrooms?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  totalFloors?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  buildingStatus?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  constructionYear?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  condition?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  projectType?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ceilingHeight?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  heating?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  parking?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hotWater?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  buildingMaterial?: string;

  // Conditional fields
  @Column({ type: 'boolean', default: false })
  hasBalcony!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  balconyCount?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  balconyArea?: string;

  @Column({ type: 'boolean', default: false })
  hasPool!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  poolType?: string;

  @Column({ type: 'boolean', default: false })
  hasLivingRoom!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  livingRoomArea?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  livingRoomType?: string;

  @Column({ type: 'boolean', default: false })
  hasLoggia!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  loggiaArea?: string;

  @Column({ type: 'boolean', default: false })
  hasVeranda!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  verandaArea?: string;

  @Column({ type: 'boolean', default: false })
  hasYard!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  yardArea?: string;

  @Column({ type: 'boolean', default: false })
  hasStorage!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  storageArea?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  storageType?: string;

  // Features and amenities
  @Column({
    type: 'text',
    array: true,
    default: []
  })
  features!: string[];

  @Column({
    type: 'text',
    array: true,
    default: []
  })
  advantages!: string[];

  @Column({
    type: 'text',
    array: true,
    default: []
  })
  furnitureAppliances!: string[];

  @Column({
    type: 'text',
    array: true,
    default: []
  })
  tags!: string[];

  // Price & Area
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false
  })
  area!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false
  })
  totalPrice!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true
  })
  pricePerSqm?: string;

  // Contact Info
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false
  })
  contactName!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false
  })
  contactPhone!: string;

  // Descriptions
  @Column({ type: 'text', nullable: true })
  descriptionGeorgian?: string;

  @Column({ type: 'text', nullable: true })
  descriptionEnglish?: string;

  @Column({ type: 'text', nullable: true })
  descriptionRussian?: string;

  // Photos
  @Column({
    type: 'text',
    array: true,
    default: []
  })
  photos!: string[];

  // Status and metadata
  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'pending', 'sold'],
    default: 'active'
  })
  status!: 'active' | 'inactive' | 'pending' | 'sold';

  @Column({
    type: 'integer',
    default: 0
  })
  viewCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}