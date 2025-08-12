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
import { City } from './City.js';

@Entity('area')
@Index('IDX_AREA_NAME_KA', ['nameKa'], { unique: true })
@Index('IDX_AREA_NAME_EN', ['nameEn'], { unique: true })
@Index('IDX_AREA_NAME_RU', ['nameRu'], { unique: true })
@Index('IDX_AREA_CITY', ['cityId'])
export class Area {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'integer',
    nullable: false,
    name: 'city_id'
  })
  cityId!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
    name: 'name_ka'
  })
  nameKa!: string; // Georgian name

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
    name: 'name_en'
  })
  nameEn!: string; // English name

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
    name: 'name_ru'
  })
  nameRu!: string; // Russian name

  @Column({
    type: 'text',
    nullable: true
  })
  description?: string;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active'
  })
  isActive!: boolean;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'city_id' })
  city!: City;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}