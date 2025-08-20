import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany
} from 'typeorm';
import { Property } from './Property.js';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  code!: string;

  @Column({ name: 'name_georgian', type: 'varchar', length: 100, nullable: false })
  nameGeorgian!: string;

  @Column({ name: 'name_english', type: 'varchar', length: 100, nullable: true })
  nameEnglish?: string;

  @Column({ name: 'icon_name', type: 'varchar', length: 50, nullable: true })
  iconName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  // Relationships
  @ManyToMany(() => Property, property => property.features)
  properties!: Property[];
}