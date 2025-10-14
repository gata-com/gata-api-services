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
} from "typeorm";
import ExpertisesGroup from "./expertisesGroup";
import { Student, Lecturer } from "./role";

// enum FinalProjectType {
//   REGULAR = "regular",
//   CAPSTONE = "capstone",
// }

// enum FinalProjectStatus {
//   PENDING = "pending",
//   APPROVED = "approved",
//   REJECTED = "rejected",
// }

// Final Project Periods
@Entity("final_project_periods")
export class FinalProjectPeriods {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  start_date: string;

  @Column()
  end_date: string;

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
@Index(["type"])
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
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // *** Relationships ***
  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group!: ExpertisesGroup;

  @OneToMany(() => FinalProjectMembers, (member) => member.final_project, {
    onDelete: "CASCADE",
  })
  members!: FinalProjectMembers[];

  @ManyToOne(() => FinalProjectPeriods, { onDelete: "CASCADE" })
  final_project_period!: FinalProjectPeriods;

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE" })
  supervisor_1!: Lecturer;

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE", nullable: true })
  supervisor_2!: Lecturer;

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
  dispen_path: string;

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
