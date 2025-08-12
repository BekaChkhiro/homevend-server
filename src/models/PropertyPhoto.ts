import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Property } from './Property.js';

@Entity('property_photos')
export class PropertyPhoto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'property_id', type: 'integer', nullable: false })
  propertyId!: number;

  @ManyToOne(() => Property, property => property.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: false })
  fileName!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255, nullable: true })
  originalName?: string;

  @Column({ name: 'file_path', type: 'text', nullable: false })
  filePath!: string;

  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize?: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: 'integer', nullable: true })
  width?: number;

  @Column({ type: 'integer', nullable: true })
  height?: number;

  @Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
  altText?: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}