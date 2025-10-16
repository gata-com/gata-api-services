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

import ExpertisesGroup from "./expertisesGroup";
import User from "./user";
import { FinalProjects, FinalProjectMembers } from "./finalProject";

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

  // *** Methods ***
}
