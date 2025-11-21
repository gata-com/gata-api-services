import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import User from "./user";
import { FinalProjectMembers } from "./finalProject";
import { DefenseSubmissionDocument } from "./defenses";

// Student
@Entity("student")
@Index(["semester"])
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 9, nullable: true })
  nim?: string; // Nomor Induk Mahasiswa

  @Column({ default: 7, nullable: true })
  semester?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @OneToOne(() => User, (user) => user.student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @OneToOne(() => FinalProjectMembers, (fpm) => fpm.student, {
    onDelete: "CASCADE",
  })
  final_project_members!: FinalProjectMembers;

  @OneToMany(() => DefenseSubmissionDocument, (ds) => ds.student, {
    onDelete: "CASCADE",
  })
  defense_submission_documents!: DefenseSubmissionDocument[];

  // *** Methods ***
}
