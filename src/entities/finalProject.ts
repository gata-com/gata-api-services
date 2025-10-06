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
import { Student } from "./role";

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

  @Column({ type: "date" })
  start_date: string;

  @Column({ type: "date" })
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
@Index(["supervisor_1_id"])
@Index(["supervisor_2_id"])
export class FinalProjects {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "text",
  })
  title: string;

  @Column({ type: "enum", enum: ["regular", "capstone"] })
  type: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column()
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

  @Column()
  supervisor_1_id!: number;

  @Column({ nullable: true })
  supervisor_2_id!: number;

  // *** Relationships ***
  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group!: ExpertisesGroup;

  @OneToMany(() => FinalProjectMembers, (member) => member.final_project, {
    onDelete: "CASCADE",
  })
  members!: FinalProjectMembers[];

  @ManyToOne(() => FinalProjectPeriods, { onDelete: "CASCADE" })
  final_project_period!: FinalProjectPeriods;

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
  sub_title: string;

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
