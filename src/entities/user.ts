import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from "typeorm";
import bcrypt from "bcryptjs";
import { config } from "../config/config";

//  enum UserRole {
//   STUDENT = "student",
//   ADMIN = "admin",
//   LECTURER = "lecturer",
// }

@Entity("users")
@Index(["resetToken"]) // Index untuk reset token
export default class User {
  @PrimaryGeneratedColumn()
  id!: number;

  // MySQL: Use ENUM for better performance and data integrity
  @Column({
    type: "enum",
    enum: ["student", "admin", "lecturer"],
    default: "student",
  })
  role!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255, select: false })
  password!: string;

  @Column({ length: 20, nullable: true })
  whatsapp_number?: string;

  // Kolom untuk reset password
  @Column({ name: "reset_token", length: 255, nullable: true, select: false })
  resetToken?: string;

  // MySQL: Use DATETIME instead of datetime
  @Column({
    name: "reset_token_expires",
    type: "datetime",
    nullable: true,
    select: false,
  })
  resetTokenExpires?: Date;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "last_login", type: "datetime", nullable: true })
  lastLogin?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
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

  // Helper methods untuk role checking
  isStudent(): boolean {
    return this.role === "student";
  }

  isAdmin(): boolean {
    return this.role === "admin";
  }

  isLecturer(): boolean {
    return this.role === "lecturer";
  }

  // Remove sensitive data when converting to JSON
  toJSON() {
    const { password, resetToken, resetTokenExpires, ...user } = this;
    return user;
  }
}
