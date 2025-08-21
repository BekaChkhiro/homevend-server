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
import { User } from './User.js';

export enum TransactionTypeEnum {
  TOP_UP = 'top_up',
  VIP_PURCHASE = 'vip_purchase',
  SERVICE_PURCHASE = 'service_purchase',
  FEATURE_PURCHASE = 'feature_purchase',
  PROPERTY_POST = 'property_post',
  PROJECT_POST = 'project_post',
  REFUND = 'refund',
  ADMIN_ADJUSTMENT = 'admin_adjustment'
}

export enum TransactionStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('transactions')
@Index(['userId'])
@Index(['createdAt'])
@Index(['type'])
@Index(['status'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid!: string;

  @Column({ name: 'user_id', type: 'integer', nullable: false })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: TransactionTypeEnum,
    nullable: false
  })
  type!: TransactionTypeEnum;

  @Column({
    type: 'enum',
    enum: TransactionStatusEnum,
    default: TransactionStatusEnum.PENDING
  })
  status!: TransactionStatusEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount!: number;

  // For tracking balance before and after transaction
  @Column({ name: 'balance_before', type: 'decimal', precision: 10, scale: 2, nullable: false })
  balanceBefore!: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 10, scale: 2, nullable: false })
  balanceAfter!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Payment method details (for top-ups)
  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  // External transaction ID from payment provider
  @Column({ name: 'external_transaction_id', type: 'varchar', length: 255, nullable: true })
  externalTransactionId?: string;

  // JSON field for additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}