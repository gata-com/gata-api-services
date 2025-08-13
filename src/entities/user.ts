import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { IsEmail, IsNotEmpty, Length, Matches, Min, Max } from 'class-validator';
import { config } from '../config/config';

@Entity('users')
@Index(['email'])
@Index(['nim'])
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 12 })
  @Length(8, 12, { message: 'NIM must be 8-12 characters' })
  @Matches(/^[0-9]+$/, { message: 'NIM must contain only numbers' })
  nim!: string;

  @Column({ length: 100 })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 100, { message: 'Name must be between 2-100 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' })
  nama!: string;

  @Column({ type: 'tinyint' })
  @Min(1, { message: 'Semester must be at least 1' })
  @Max(14, { message: 'Semester cannot exceed 14' })
  semester!: number;

  @Column({ name: 'nomor_whatsapp', length: 20 })
  @Matches(/^(\+62|62|0)[0-9]{9,13}$/, { message: 'Invalid WhatsApp number format' })
  nomorWhatsapp!: string;

  @Column({ unique: true, length: 255 })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @Column({ length: 255, select: false })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, undefined, { message: 'Password must be at least 6 characters' })
  password!: string;

  @Column({
    type: 'enum',
    enum: ['student', 'dosen', 'admin'],
    default: 'student'
  })
  role!: 'student' | 'admin';

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Hash password before insert or update
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
    }
  }

  // Compare password method
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Remove sensitive data when converting to JSON
  toJSON() {
    const { password, ...user } = this;
    return user;
  }
}