import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';

export enum EntityType {
  PROPERTY = 'property',
  USER = 'user',
  AGENCY = 'agency',
  PROJECT = 'project',
  ADVERTISEMENT = 'advertisement',
  DISTRICT = 'district',
  DEVELOPER = 'developer',
}

export interface ImageUrls {
  original: string;
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  watermarked?: string;
  [key: string]: string | undefined;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  orientation?: number;
  dpi?: number;
  [key: string]: any;
}

@Entity('images')
@Index(['entityType', 'entityId', 'purpose'])
@Index(['entityType', 'entityId', 'isPrimary'])
export class Image {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: EntityType,
  })
  entityType!: EntityType;

  @Column({ name: 'entity_id', type: 'integer' })
  entityId!: number;

  @Column({ type: 'varchar', length: 50 })
  purpose!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ name: 's3_key', type: 'varchar', length: 500 })
  s3Key!: string;

  @Column({ type: 'jsonb' })
  urls!: ImageUrls;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: ImageMetadata;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'file_size', type: 'integer' })
  fileSize!: number;

  @Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
  altText?: string;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Column({ type: 'jsonb', default: '[]' })
  tags!: string[];

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy?: User;

  @Column({ name: 'uploaded_by', type: 'integer', nullable: true })
  uploadedById?: number;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Virtual properties for convenience
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get url(): string {
    return this.urls.medium || this.urls.original;
  }

  get thumbnailUrl(): string {
    return this.urls.thumbnail || this.urls.small || this.urls.original;
  }
}