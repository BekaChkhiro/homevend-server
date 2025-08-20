import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User.js';
import { City } from './City.js';
import { Area } from './Area.js';
import { ProjectPricing } from './ProjectPricing.js';
import { ProjectAmenity } from './ProjectAmenity.js';

export enum ProjectTypeEnum {
  PRIVATE_HOUSE = 'private_house',
  APARTMENT_BUILDING = 'apartment_building'
}

export enum DeliveryStatusEnum {
  COMPLETED_WITH_RENOVATION = 'completed_with_renovation',
  GREEN_FRAME = 'green_frame',
  BLACK_FRAME = 'black_frame',
  WHITE_FRAME = 'white_frame'
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid!: string;

  // Developer/Owner
  @Column({ name: 'developer_id', type: 'integer', nullable: false })
  developerId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'developer_id' })
  developer!: User;

  // Basic Information
  @Column({ name: 'project_name', type: 'varchar', length: 300, nullable: false })
  projectName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

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

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // Project Details
  @Column({
    name: 'project_type',
    type: 'enum',
    enum: ProjectTypeEnum,
    nullable: false
  })
  projectType!: ProjectTypeEnum;

  @Column({
    name: 'delivery_status',
    type: 'enum',
    enum: DeliveryStatusEnum,
    nullable: false
  })
  deliveryStatus!: DeliveryStatusEnum;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate?: Date;

  @Column({ name: 'number_of_buildings', type: 'integer', nullable: false })
  numberOfBuildings!: number;

  @Column({ name: 'total_apartments', type: 'integer', nullable: false })
  totalApartments!: number;

  @Column({ name: 'number_of_floors', type: 'integer', nullable: false })
  numberOfFloors!: number;

  @Column({ name: 'parking_spaces', type: 'integer', nullable: true })
  parkingSpaces?: number;

  // Amenities in Project Area (JSON boolean fields)
  @Column({ name: 'has_grocery_store', type: 'boolean', default: false })
  hasGroceryStore!: boolean;

  @Column({ name: 'has_bike_path', type: 'boolean', default: false })
  hasBikePath!: boolean;

  @Column({ name: 'has_sports_field', type: 'boolean', default: false })
  hasSportsField!: boolean;

  @Column({ name: 'has_children_area', type: 'boolean', default: false })
  hasChildrenArea!: boolean;

  @Column({ name: 'has_square', type: 'boolean', default: false })
  hasSquare!: boolean;

  @Column({ name: 'has_gym', type: 'boolean', default: false })
  hasGym!: boolean;

  @Column({ name: 'has_swimming_pool', type: 'boolean', default: false })
  hasSwimmingPool!: boolean;

  @Column({ name: 'has_garden', type: 'boolean', default: false })
  hasGarden!: boolean;

  @Column({ name: 'has_parking', type: 'boolean', default: false })
  hasParking!: boolean;

  @Column({ name: 'has_restaurant', type: 'boolean', default: false })
  hasRestaurant!: boolean;

  @Column({ name: 'has_laundry', type: 'boolean', default: false })
  hasLaundry!: boolean;

  @Column({ name: 'has_storage', type: 'boolean', default: false })
  hasStorage!: boolean;

  // Within 300 meters
  @Column({ name: 'pharmacy_300m', type: 'boolean', default: false })
  pharmacy300m!: boolean;

  @Column({ name: 'kindergarten_300m', type: 'boolean', default: false })
  kindergarten300m!: boolean;

  @Column({ name: 'school_300m', type: 'boolean', default: false })
  school300m!: boolean;

  @Column({ name: 'bus_stop_300m', type: 'boolean', default: false })
  busStop300m!: boolean;

  @Column({ name: 'grocery_store_300m', type: 'boolean', default: false })
  groceryStore300m!: boolean;

  @Column({ name: 'bike_path_300m', type: 'boolean', default: false })
  bikePath300m!: boolean;

  @Column({ name: 'sports_field_300m', type: 'boolean', default: false })
  sportsField300m!: boolean;

  @Column({ name: 'stadium_300m', type: 'boolean', default: false })
  stadium300m!: boolean;

  @Column({ name: 'square_300m', type: 'boolean', default: false })
  square300m!: boolean;

  // Within 500 meters
  @Column({ name: 'pharmacy_500m', type: 'boolean', default: false })
  pharmacy500m!: boolean;

  @Column({ name: 'kindergarten_500m', type: 'boolean', default: false })
  kindergarten500m!: boolean;

  @Column({ name: 'school_500m', type: 'boolean', default: false })
  school500m!: boolean;

  @Column({ name: 'university_500m', type: 'boolean', default: false })
  university500m!: boolean;

  @Column({ name: 'bus_stop_500m', type: 'boolean', default: false })
  busStop500m!: boolean;

  @Column({ name: 'grocery_store_500m', type: 'boolean', default: false })
  groceryStore500m!: boolean;

  @Column({ name: 'bike_path_500m', type: 'boolean', default: false })
  bikePath500m!: boolean;

  @Column({ name: 'sports_field_500m', type: 'boolean', default: false })
  sportsField500m!: boolean;

  @Column({ name: 'stadium_500m', type: 'boolean', default: false })
  stadium500m!: boolean;

  @Column({ name: 'square_500m', type: 'boolean', default: false })
  square500m!: boolean;

  // Within 1 kilometer
  @Column({ name: 'hospital_1km', type: 'boolean', default: false })
  hospital1km!: boolean;

  // Post-handover services
  @Column({ name: 'security_service', type: 'boolean', default: false })
  securityService!: boolean;

  @Column({ name: 'has_lobby', type: 'boolean', default: false })
  hasLobby!: boolean;

  @Column({ name: 'has_concierge', type: 'boolean', default: false })
  hasConcierge!: boolean;

  @Column({ name: 'video_surveillance', type: 'boolean', default: false })
  videoSurveillance!: boolean;

  @Column({ name: 'has_lighting', type: 'boolean', default: false })
  hasLighting!: boolean;

  @Column({ name: 'landscaping', type: 'boolean', default: false })
  landscaping!: boolean;

  @Column({ name: 'yard_cleaning', type: 'boolean', default: false })
  yardCleaning!: boolean;

  @Column({ name: 'entrance_cleaning', type: 'boolean', default: false })
  entranceCleaning!: boolean;

  @Column({ name: 'has_doorman', type: 'boolean', default: false })
  hasDoorman!: boolean;

  // Security
  @Column({ name: 'fire_system', type: 'boolean', default: false })
  fireSystem!: boolean;

  @Column({ name: 'main_door_lock', type: 'boolean', default: false })
  mainDoorLock!: boolean;

  // Maintenance
  @Column({ name: 'maintenance', type: 'boolean', default: false })
  maintenance!: boolean;

  // Status
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'view_count', type: 'integer', default: 0 })
  viewCount!: number;

  // Relationships
  @OneToMany(() => ProjectPricing, pricing => pricing.project, { cascade: true })
  pricing!: ProjectPricing[];

  @OneToMany('Property', 'project', { lazy: true })
  properties?: Promise<any[]>;

  @OneToMany(() => ProjectAmenity, amenity => amenity.project, { cascade: true })
  amenities!: ProjectAmenity[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}