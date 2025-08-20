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
import { IsEmail, IsNotEmpty, Length, Matches, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { config } from '../config/config';

// Import UserRole type
import { UserRole, KelompokKeahlian } from '../types/user';

@Entity('users')
@Index(['email'])
@Index(['nim'])
@Index(['resetToken']) // Index untuk reset token
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

  @Column({ type: 'tinyint', nullable: true })
  @IsOptional()
  @Min(1, { message: 'Semester must be at least 1' })
  @Max(14, { message: 'Semester cannot exceed 14' })
  semester?: number;

  @Column({ name: 'nomor_whatsapp', length: 20, nullable: true })
  @IsOptional()
  @Matches(/^(\+62|62|0)[0-9]{9,13}$/, { message: 'Invalid WhatsApp number format' })
  nomorWhatsapp?: string;

  @Column({ unique: true, length: 255 })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @Column({ length: 255, select: false })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, undefined, { message: 'Password must be at least 6 characters' })
  password!: string;

  @Column({
    type: 'enum',
    enum: ['student', 'admin', 'dosen'],
    default: 'student'
  })
  role!: UserRole;

  @Column({
    name: 'kelompok_keahlian',
    type: 'enum',
    enum: ['RPLSI', 'AICE', 'KMSI'],
    nullable: true
  })
  @IsOptional()
  @IsEnum(['RPLSI', 'AICE', 'KMSI'], { message: 'Kelompok keahlian must be RPLSI, AICE, or KMSI' })
  kelompokKeahlian?: KelompokKeahlian;

  // Kolom untuk reset password
  @Column({ name: 'reset_token', length: 255, nullable: true, select: false })
  resetToken?: string;

  @Column({ name: 'reset_token_expires', type: 'datetime', nullable: true, select: false })
  resetTokenExpires?: Date;

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
    if (this.password && !this.isPasswordHashed()) {
      this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
    }
  }

  // Helper method to check if password is already hashed
  private isPasswordHashed(): boolean {
    // bcrypt hashes always start with $2a$, $2b$, $2x$, or $2y$
    return /^\$2[abxy]\$/.test(this.password);
  }

  // Compare password method
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Method untuk check apakah reset token masih valid
  isResetTokenValid(): boolean {
    if (!this.resetToken || !this.resetTokenExpires) {
      return false;
    }
    return this.resetTokenExpires > new Date();
  }

  // Method untuk clear reset token
  clearResetToken(): void {
    this.resetToken = undefined;
    this.resetTokenExpires = undefined;
  }

  // Remove sensitive data when converting to JSON
  toJSON() {
    const { password, resetToken, resetTokenExpires, ...user } = this;
    return user;
  }
}