import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User.js';
import { Property } from './Property.js';
import { Project } from './Project.js';

@Entity('developers')
export class Developer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid!: string;

  // Owner of the developer company (user with role 'developer')
  @Column({ name: 'owner_id', type: 'integer', nullable: false })
  ownerId!: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  // Developer Company Information
  @Column({ type: 'varchar', length: 300, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ name: 'social_media_url', type: 'varchar', length: 255, nullable: true })
  socialMediaUrl?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  // Address
  @Column({ type: 'text', nullable: true })
  address?: string;

  // Business Information
  @Column({ name: 'tax_number', type: 'varchar', length: 50, nullable: true })
  taxNumber?: string;

  @Column({ name: 'registration_number', type: 'varchar', length: 50, nullable: true })
  registrationNumber?: string;

  // Media
  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ name: 'banner_url', type: 'varchar', length: 500, nullable: true })
  bannerUrl?: string;

  // Status
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Statistics
  @Column({ name: 'project_count', type: 'integer', default: 0 })
  projectCount!: number;

  @Column({ name: 'property_count', type: 'integer', default: 0 })
  propertyCount!: number;

  @Column({ name: 'total_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSales!: number;

  // Relationships
  // @OneToMany(() => Project, project => project.developer)
  // projects!: Project[];

  // @OneToMany(() => Property, property => property.developer)
  // properties!: Property[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}