import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export interface TermsSection {
  id: string;
  order: number;
  headerKa: string;
  headerEn: string;
  headerRu: string;
  contentKa: string;
  contentEn: string;
  contentRu: string;
}

@Entity('terms_conditions')
@Index('IDX_TERMS_CONDITIONS_ACTIVE', ['isActive'])
@Index('IDX_TERMS_CONDITIONS_VERSION', ['version'])
export class TermsConditions {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'json',
    nullable: false,
    default: '[]'
  })
  sections!: TermsSection[];

  @Column({
    type: 'int',
    default: 1,
    nullable: false
  })
  version!: number;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active'
  })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}