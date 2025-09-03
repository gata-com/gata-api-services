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

//  Final Projects
@Entity("final_projects")
@Index(["supervisor_1_status"])
@Index(["supervisor_2_status"])
@Index(["admin_status"])
@Index(["type"])
@Index(["supervisor_1_id"])
@Index(["supervisor_2_id"])
export default class FinalProjects {
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
  supervisor_1_status: Array<string>;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  supervisor_2_status: Array<string>;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  admin_status: Array<string>;

  @Column({ type: "text", nullable: true })
  supervisor_1_note: string;

  @Column({ type: "text", nullable: true })
  supervisor_2_note: string;

  @Column({ type: "text", nullable: true })
  admin_note: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column()
  supervisor_1_id!: number;

  @Column({ nullable: true })
  supervisor_2_id!: number;

  // *** Relationships ***
  @ManyToOne(() => ExpertisesGroup)
  expertises_group_id: ExpertisesGroup;

  @OneToMany(() => FinalProjectMembers, (member) => member.final_project_id)
  members: FinalProjectMembers[];

  // *** Method ***
}

// Final Project Members
@Entity("final_project_members")
@Index(["final_project_id"])
@Index(["student_id"])
export class FinalProjectMembers {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  sub_title: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // *** Relationships ***
  @ManyToOne(() => FinalProjects)
  final_project_id!: FinalProjects;

  @OneToOne(() => Student)
  @JoinColumn()
  student_id!: Student;

  // *** Method ***
}
