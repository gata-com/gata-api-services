import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import ExpertisesGroup from "./expertisesGroup";
import { Student } from "./student";
import { Lecturer } from "./lecturer";
import { GuidanceSession } from "./guidance";
import { DefenseSubmission } from "./defenses";

// Final Project Periods
@Entity("final_project_periods")
@Index(["start_date"])
@Index(["end_date"])
@Index(["approval_end_date"])
export class FinalProjectPeriods {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  start_date: string;

  @Column()
  end_date: string;

  @Column()
  approval_end_date: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @OneToMany(
    () => FinalProjects,
    (finalProject) => finalProject.final_project_period,
    {
      onDelete: "CASCADE",
    }
  )
  final_projects!: FinalProjects[];

  // *** Method ***
}

//  Final Projects
@Entity("final_projects")
@Index(["supervisor_1_status"])
@Index(["supervisor_2_status"])
@Index(["admin_status"])
export class FinalProjects {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: ["regular", "capstone"] })
  type: string;

  @Column({ type: "enum", enum: ["baru", "dispensasi"] })
  status!: string;

  @Column({ type: "enum", enum: ["dosen", "perusahaan", "mandiri"] })
  source_topic!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ default: 3, nullable: true })
  max_members: number;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  supervisor_1_status!: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  supervisor_2_status!: string;

  @Column({ type: "boolean", default: false, nullable: true })
  is_only_sup_1?: boolean;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  admin_status!: string;

  @Column({ type: "text", nullable: true })
  supervisor_1_note?: string;

  @Column({ type: "text", nullable: true })
  supervisor_2_note?: string;

  @Column({ type: "text", nullable: true })
  admin_note?: string;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  // *** Relationships ***

  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group_1!: ExpertisesGroup;

  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group_2!: ExpertisesGroup;

  @OneToMany(() => FinalProjectMembers, (member) => member.final_project, {
    onDelete: "CASCADE",
  })
  members!: FinalProjectMembers[];

  @OneToMany(() => GuidanceSession, (gs) => gs.final_project, {
    onDelete: "CASCADE",
  })
  guidance_sessions!: GuidanceSession[];

  @ManyToOne(() => FinalProjectPeriods, { onDelete: "CASCADE" })
  final_project_period!: FinalProjectPeriods;

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE" })
  supervisor_1!: Lecturer;

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE", nullable: true })
  supervisor_2!: Lecturer;

  @OneToMany(() => DefenseSubmission, (defense) => defense.final_project, {
    onDelete: "CASCADE",
  })
  defense_submissions!: DefenseSubmission[];

  // *** Method ***
}

// Final Project Members
@Entity("final_project_members")
@Index(["final_project"])
@Index(["student"])
export class FinalProjectMembers {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text" })
  resume: string;

  @Column()
  draft_path: string;

  @Column()
  draft_filename!: string;

  @Column()
  draft_size!: string;

  @Column({ nullable: true })
  dispen_path?: string;

  @Column({ nullable: true })
  dispen_filename?: string;

  @Column({ nullable: true })
  dispen_size?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @ManyToOne(() => FinalProjects, { onDelete: "CASCADE" })
  final_project!: FinalProjects;

  @OneToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn()
  student!: Student;

  // *** Method ***
}
