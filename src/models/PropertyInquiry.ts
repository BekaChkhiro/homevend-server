import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User.js';
import { Property } from './Property.js';

@Entity('property_inquiries')
export class PropertyInquiry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'property_id', type: 'integer', nullable: false })
  propertyId!: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId?: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'full_name', type: 'varchar', length: 200, nullable: false })
  fullName!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ name: 'inquiry_type', type: 'varchar', length: 50, default: 'general' })
  inquiryType!: string;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  response?: string;

  @Column({ name: 'responded_at', type: 'timestamp with time zone', nullable: true })
  respondedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}