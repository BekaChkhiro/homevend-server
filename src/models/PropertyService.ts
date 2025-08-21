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
import { Property, ServiceTypeEnum } from './Property.js';

@Entity('property_services')
@Index(['propertyId', 'serviceType'], { unique: true })
export class PropertyService {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'property_id', type: 'integer', nullable: false })
  propertyId!: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  @Column({
    name: 'service_type',
    type: 'enum',
    enum: ServiceTypeEnum,
    nullable: false
  })
  serviceType!: ServiceTypeEnum;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // For auto-renew service
  @Column({ name: 'auto_renew_enabled', type: 'boolean', default: false })
  autoRenewEnabled!: boolean;

  // For color separation service - store the color
  @Column({ name: 'color_code', type: 'varchar', length: 7, nullable: true })
  colorCode?: string; // e.g., "#FF5733"

  // Transaction reference for purchase history
  @Column({ name: 'transaction_id', type: 'integer', nullable: true })
  transactionId?: number;

  @ManyToOne('Transaction', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transaction_id' })
  transaction?: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}