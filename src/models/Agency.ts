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

@Entity('agencies')
export class Agency {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid!: string;

  // Owner of the agency (user with role 'agency')
  @Column({ name: 'owner_id', type: 'integer', nullable: false })
  ownerId!: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  // Agency Information
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
  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @Column({ name: 'city_id', type: 'integer', nullable: true })
  cityId?: number;

  // Logo and branding
  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl?: string;

  // Business details
  @Column({ name: 'tax_number', type: 'varchar', length: 50, nullable: true })
  taxNumber?: string;

  @Column({ name: 'license_number', type: 'varchar', length: 50, nullable: true })
  licenseNumber?: string;

  // Status
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Statistics
  @Column({ name: 'agent_count', type: 'integer', default: 0 })
  agentCount!: number;

  @Column({ name: 'property_count', type: 'integer', default: 0 })
  propertyCount!: number;

  @Column({ name: 'total_sales', type: 'integer', default: 0 })
  totalSales!: number;

  // Relationships
  @OneToMany('User', 'agency', { cascade: false, lazy: true })
  agents!: Promise<any[]>;

  @OneToMany('Property', 'agency', { cascade: false, lazy: true })
  properties!: Promise<any[]>;

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}