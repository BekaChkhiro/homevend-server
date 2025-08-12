import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { Property } from './Property.js';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  code!: string;

  @Column({ name: 'name_georgian', type: 'varchar', length: 100, nullable: false })
  nameGeorgian!: string;

  @Column({ name: 'name_english', type: 'varchar', length: 100, nullable: true })
  nameEnglish?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => Property, property => property.city)
  properties!: Property[];
}