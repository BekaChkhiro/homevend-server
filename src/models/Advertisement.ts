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

export enum AdStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PAUSED = 'paused',
}

@Entity('advertisements')
@Index(['placementId', 'status', 'startDate', 'endDate'])
@Index(['status', 'startDate', 'endDate'])
export class Advertisement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255 })
  advertiser!: string;

  @Column({ name: 'placement_id', type: 'varchar', length: 50 })
  placementId!: string;

  @Column({ name: 'start_date', type: 'timestamp with time zone' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone' })
  endDate!: Date;

  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl!: string;

  @Column({ name: 'target_url', type: 'varchar', length: 500 })
  targetUrl!: string;

  @Column({
    type: 'enum',
    enum: AdStatus,
    default: AdStatus.PENDING,
  })
  status!: AdStatus;

  @Column({ type: 'integer', default: 0 })
  views!: number;

  @Column({ type: 'integer', default: 0 })
  clicks!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy?: User;

  @Column({ name: 'uploaded_by', type: 'integer', nullable: true })
  uploadedById?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Helper method to check if ad is currently active
  get isActive(): boolean {
    const now = new Date();
    return (
      this.status === AdStatus.ACTIVE &&
      now >= this.startDate &&
      now <= this.endDate
    );
  }

  // Helper method to check if ad has expired
  get isExpired(): boolean {
    return new Date() > this.endDate;
  }

  // Helper method to get click-through rate
  get ctr(): number {
    return this.views > 0 ? (this.clicks / this.views) * 100 : 0;
  }
}
