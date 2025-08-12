import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import type { PriceStatistic } from './PriceStatistic.js';

@Entity('districts')
@Index('IDX_DISTRICT_NAME_KA', ['nameKa'], { unique: true })
@Index('IDX_DISTRICT_NAME_EN', ['nameEn'], { unique: true })
@Index('IDX_DISTRICT_NAME_RU', ['nameRu'], { unique: true })
export class District {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @OneToMany('PriceStatistic', 'district')
  priceStatistics!: PriceStatistic[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}