import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Lecturer } from "./lecturer";
import { FinalProjects } from "./finalProject";
import { ExpertisesGroup as expertGroupType } from "../types/user";

@Entity("expertises_group")
export default class ExpertisesGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  // *** Relationships ***
  @OneToMany(() => Lecturer, (lecturer) => lecturer.expertises_group, {
    onDelete: "CASCADE",
  })
  lecturers!: Lecturer[];

  @OneToMany(
    () => FinalProjects,
    (finalProject) => finalProject.expertises_group,
    {
      onDelete: "CASCADE",
    }
  )
  final_projects!: FinalProjects[];

  // *** Methods ***
}
