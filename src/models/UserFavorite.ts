import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique
} from 'typeorm';
import { User } from './User.js';
import { Property } from './Property.js';

@Entity('user_favorites')
@Unique(['userId', 'propertyId'])
export class UserFavorite {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'integer', nullable: false })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'property_id', type: 'integer', nullable: false })
  propertyId!: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}