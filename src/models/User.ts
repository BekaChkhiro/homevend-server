import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import bcrypt from 'bcrypt';

export enum UserRoleEnum {
  USER = 'user',
  AGENT = 'agent',
  AGENCY = 'agency',
  DEVELOPER = 'developer',
  ADMIN = 'admin'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true
  })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: false
  })
  password!: string;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 200,
    nullable: false
  })
  fullName!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true
  })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.USER
  })
  role!: UserRoleEnum;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'profile_image_url', type: 'text', nullable: true })
  profileImageUrl?: string;

  @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  // Agency relationship for agents
  @Column({ name: 'agency_id', type: 'integer', nullable: true })
  agencyId?: number;

  @ManyToOne('Agency', { onDelete: 'SET NULL', lazy: true })
  @JoinColumn({ name: 'agency_id' })
  agency?: Promise<any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  }

  toJSON() {
    const { password, ...result } = this;
    return result;
  }
}