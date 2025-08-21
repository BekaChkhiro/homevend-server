import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { ServiceTypeEnum } from './Property.js';

@Entity('service_pricing')
@Index(['serviceType'], { unique: true })
export class ServicePricing {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'service_type',
    type: 'enum',
    enum: ServiceTypeEnum,
    nullable: false
  })
  serviceType!: ServiceTypeEnum;

  @Column({ 
    name: 'price_per_day',
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: false 
  })
  pricePerDay!: number;

  @Column({ 
    name: 'name_ka',
    type: 'varchar',
    length: 100,
    nullable: false 
  })
  nameKa!: string;

  @Column({ 
    name: 'name_en',
    type: 'varchar',
    length: 100,
    nullable: false 
  })
  nameEn!: string;

  @Column({ 
    name: 'description_ka',
    type: 'text', 
    nullable: true 
  })
  descriptionKa?: string;

  @Column({ 
    name: 'description_en',
    type: 'text', 
    nullable: true 
  })
  descriptionEn?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'category', type: 'varchar', length: 50, default: 'service' })
  category!: string; // 'vip' or 'service'

  // Features/benefits as JSON array
  @Column({ 
    name: 'features',
    type: 'jsonb',
    nullable: true 
  })
  features?: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}