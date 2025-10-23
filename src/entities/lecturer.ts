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
import ExpertisesGroup from "./expertisesGroup";
import { FinalProjects } from "./finalProject";

// Lecturer
@Entity("lecturer")
@Index("IDX_nip_index", ["nip"])
@Index(["lecturer_code"])
export class Lecturer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 15, unique: true })
  nip!: string;

  @Column({ length: 10, nullable: true })
  lecturer_code!: string;

  @Column({ default: 15 })
  max_supervised_1!: number;

  @Column({ default: 15 })
  max_supervised_2!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group!: ExpertisesGroup;

  @OneToMany(() => FinalProjects, (fp) => fp.supervisor_1)
  supervisedProjects!: FinalProjects[];

  @OneToMany(() => FinalProjects, (fp) => fp.supervisor_2)
  coSupervisedProjects!: FinalProjects[];

  // *** Method ***
}
