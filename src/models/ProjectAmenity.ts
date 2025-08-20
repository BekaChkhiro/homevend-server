import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Project } from './Project.js';

export enum AmenityDistanceEnum {
  ON_SITE = 'on_site',        // ტერიტორიაზე
  WITHIN_300M = 'within_300m', // 300მ-მდე
  WITHIN_500M = 'within_500m', // 500მ-მდე
  WITHIN_1KM = 'within_1km'    // 1კმ-მდე
}

@Entity('project_amenities')
@Index(['projectId', 'amenityType'], { unique: true }) // One amenity type per project
export class ProjectAmenity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'project_id', type: 'integer' })
  projectId!: number;

  @ManyToOne(() => Project, project => project.amenities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'amenity_type', type: 'varchar', length: 50 })
  amenityType!: string; // e.g., 'pharmacy', 'school', 'metro', etc.

  @Column({
    name: 'distance',
    type: 'enum',
    enum: AmenityDistanceEnum
  })
  distance!: AmenityDistanceEnum;

  @Column({ name: 'name_georgian', type: 'varchar', length: 100, nullable: true })
  nameGeorgian?: string; // Optional: specific name like "ფარმადეპო"

  @Column({ name: 'name_english', type: 'varchar', length: 100, nullable: true })
  nameEnglish?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string; // Optional notes or details

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// Predefined amenity types for consistency
export const AMENITY_TYPES = {
  // Healthcare
  PHARMACY: 'pharmacy',
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  DENTIST: 'dentist',
  VETERINARY: 'veterinary',
  
  // Education
  KINDERGARTEN: 'kindergarten',
  SCHOOL: 'school',
  UNIVERSITY: 'university',
  LIBRARY: 'library',
  
  // Transport
  BUS_STOP: 'bus_stop',
  METRO: 'metro',
  GAS_STATION: 'gas_station',
  CAR_WASH: 'car_wash',
  
  // Shopping
  GROCERY_STORE: 'grocery_store',
  SUPERMARKET: 'supermarket',
  MALL: 'mall',
  BAKERY: 'bakery',
  
  // Services
  BANK: 'bank',
  ATM: 'atm',
  POST_OFFICE: 'post_office',
  BEAUTY_CENTER: 'beauty_center',
  
  // Food & Entertainment
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  CINEMA: 'cinema',
  THEATER: 'theater',
  
  // Sports & Recreation
  SPORTS_CENTER: 'sports_center',
  STADIUM: 'stadium',
  SWIMMING_POOL: 'swimming_pool',
  PARK: 'park',
  SQUARE: 'square',
  BIKE_PATH: 'bike_path',
  SPORTS_FIELD: 'sports_field',
  
  // On-site amenities (usually ON_SITE distance)
  GYM: 'gym',
  GARDEN: 'garden',
  PARKING: 'parking',
  LAUNDRY: 'laundry',
  STORAGE: 'storage',
  CHILDREN_AREA: 'children_area'
} as const;

export type AmenityType = typeof AMENITY_TYPES[keyof typeof AMENITY_TYPES];