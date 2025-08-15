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
import { Project } from './Project.js';

export enum RoomTypeEnum {
  STUDIO = 'studio',
  ONE_BEDROOM = 'one_bedroom',
  TWO_BEDROOM = 'two_bedroom',
  THREE_BEDROOM = 'three_bedroom',
  FOUR_BEDROOM = 'four_bedroom',
  FIVE_PLUS_BEDROOM = 'five_plus_bedroom'
}

@Entity('project_pricing')
@Index(['projectId', 'roomType'], { unique: true }) // Unique constraint for project-room type combination
export class ProjectPricing {
  @PrimaryGeneratedColumn()
  id!: number;

  // Project relationship
  @Column({ name: 'project_id', type: 'integer', nullable: false })
  projectId!: number;

  @ManyToOne(() => Project, project => project.pricing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  // Room configuration
  @Column({
    name: 'room_type',
    type: 'enum',
    enum: RoomTypeEnum,
    nullable: false
  })
  roomType!: RoomTypeEnum;

  @Column({ name: 'number_of_rooms', type: 'integer', nullable: false })
  numberOfRooms!: number;

  // Area information
  @Column({ name: 'total_area', type: 'decimal', precision: 10, scale: 2, nullable: false })
  totalArea!: number;

  @Column({ name: 'living_area', type: 'decimal', precision: 10, scale: 2, nullable: true })
  livingArea?: number;

  @Column({ name: 'balcony_area', type: 'decimal', precision: 10, scale: 2, nullable: true })
  balconyArea?: number;

  // Pricing information
  @Column({ name: 'price_per_sqm', type: 'decimal', precision: 10, scale: 2, nullable: false })
  pricePerSqm!: number;

  @Column({ name: 'total_price_from', type: 'decimal', precision: 12, scale: 2, nullable: false })
  totalPriceFrom!: number;

  @Column({ name: 'total_price_to', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalPriceTo?: number;

  // Availability
  @Column({ name: 'available_units', type: 'integer', nullable: false, default: 1 })
  availableUnits!: number;

  @Column({ name: 'total_units', type: 'integer', nullable: false, default: 1 })
  totalUnits!: number;

  // Additional features
  @Column({ name: 'has_balcony', type: 'boolean', default: false })
  hasBalcony!: boolean;

  @Column({ name: 'has_terrace', type: 'boolean', default: false })
  hasTerrace!: boolean;

  @Column({ name: 'has_loggia', type: 'boolean', default: false })
  hasLoggia!: boolean;

  @Column({ name: 'floor_from', type: 'integer', nullable: true })
  floorFrom?: number;

  @Column({ name: 'floor_to', type: 'integer', nullable: true })
  floorTo?: number;

  // Status
  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable!: boolean;

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}