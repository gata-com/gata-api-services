import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
  OneToMany,
} from "typeorm";
import bcrypt from "bcryptjs";
import { config } from "../config/config";
import { OneToOne } from "typeorm";
import { Student } from "./student";
import { Lecturer } from "./lecturer";
import Announcements from "./announcement";
@Entity("users")
@Index(["role"])
@Index(["reset_token"])
@Index(["email"])
export default class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  googleId?: string;

  // MySQL: Use ENUM for better performance and data integrity
  @Column({
    type: "enum",
    enum: ["student", "admin", "lecturer"],
    default: "student",
    nullable: true,
  })
  role?: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ length: 20, nullable: true })
  whatsapp_number?: string;

  // Kolom untuk reset password
  @Column({ length: 255, nullable: true, select: false })
  reset_token?: string;

  @Column({
    type: "datetime",
    nullable: true,
    select: false,
  })
  reset_token_expires?: Date;

  @Column({ type: "boolean", default: true, nullable: true })
  is_active?: boolean;

  @Column({ type: "datetime", nullable: true })
  last_login?: Date;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  /** Relationships **/
  @OneToOne(() => Student, (student) => student.user, { onDelete: "CASCADE" })
  student: Student;

  @OneToOne(() => Lecturer, (lecturer) => lecturer.user, {
    onDelete: "CASCADE",
  })
  lecturer: Lecturer;

  @OneToMany(() => Announcements, (announcement) => announcement.user, {
    onDelete: "CASCADE",
  })
  announcements!: Announcements[];

  /** Method **/
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
    return /^\$2[abxy]\$/.test(this.password ? this.password : "");
  }

  // Compare password method
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(
      candidatePassword,
      this.password ? this.password : ""
    );
  }

  // Method untuk check apakah reset token masih valid
  isResetTokenValid(): boolean {
    if (!this.reset_token || !this.reset_token_expires) {
      return false;
    }
    return this.reset_token_expires > new Date();
  }

  // Method untuk clear reset token
  clearResetToken(): void {
    this.reset_token = undefined;
    this.reset_token_expires = undefined;
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
    const { password, reset_token, reset_token_expires, ...user } = this;
    return user;
  }
}
