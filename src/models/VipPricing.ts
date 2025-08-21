import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { VipStatusEnum } from './Property.js';

@Entity('vip_pricing')
@Index(['vipType'], { unique: true })
export class VipPricing {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'vip_type',
    type: 'enum',
    enum: VipStatusEnum,
    nullable: false
  })
  vipType!: VipStatusEnum;

  @Column({ 
    name: 'price_per_day',
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: false 
  })
  pricePerDay!: number;

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