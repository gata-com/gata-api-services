import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { FinalProjects } from "./finalProject";
import { DefenseSubmission } from "./defenses";

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
  @OneToMany(
    () => FinalProjects,
    (finalProject) => finalProject.expertises_group_1,
    {
      onDelete: "CASCADE",
    }
  )
  expertises_group_1!: FinalProjects[];

  @OneToMany(
    () => FinalProjects,
    (finalProject) => finalProject.expertises_group_2,
    {
      onDelete: "CASCADE",
    }
  )
  expertises_group_2!: FinalProjects[];

  @OneToMany(() => DefenseSubmission, (defense) => defense.expertises_group_1, {
    onDelete: "CASCADE",
  })
  defense_submission_1!: DefenseSubmission[];

  @OneToMany(() => DefenseSubmission, (defense) => defense.expertises_group_2, {
    onDelete: "CASCADE",
  })
  defense_submission_2!: DefenseSubmission[];

  // *** Methods ***
}
