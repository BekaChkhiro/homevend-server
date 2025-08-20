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
import type { District } from './District.js';

@Entity('price_statistics')
@Index('IDX_PRICE_STAT_DISTRICT', ['districtId'])
@Index('IDX_PRICE_STAT_PROPERTY_TYPE', ['propertyType'])
@Index('IDX_PRICE_STAT_DEAL_TYPE', ['dealType'])
@Index('IDX_PRICE_STAT_ACTIVE', ['isActive'])
export class PriceStatistic {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'integer',
    nullable: false,
    name: 'district_id'
  })
  districtId!: number;

  @ManyToOne('District', 'priceStatistics', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'district_id' })
  district!: District;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'property_type'
  })
  propertyType!: string; // apartment, house, commercial, etc.

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    name: 'deal_type'
  })
  dealType!: string; // sale, rent

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'average_price_per_sqm'
  })
  averagePricePerSqm!: number; // Average price per square meter

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'min_price_per_sqm'
  })
  minPricePerSqm?: number; // Minimum price per square meter

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'max_price_per_sqm'
  })
  maxPricePerSqm?: number; // Maximum price per square meter

  @Column({
    type: 'varchar',
    length: 3,
    default: 'USD'
  })
  currency!: string; // USD, GEL, EUR

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true
  })
  period?: string; // monthly, yearly for rent

  @Column({
    type: 'integer',
    default: 0,
    name: 'sample_size'
  })
  sampleSize!: number; // Number of properties used for calculation

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active'
  })
  isActive!: boolean;

  @Column({
    type: 'text',
    nullable: true
  })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}