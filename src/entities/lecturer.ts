import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import User from "./user";
import { LecturerExpertise } from "./lecturerExpertise";
import { FinalProjects } from "./finalProject";
import { GuidanceAvailability } from "./guidance";
import { Signature } from "./signature";

// Lecturer
@Entity("lecturer")
@Index("IDX_nip_index", ["nip"])
@Index(["lecturer_code"])
export class Lecturer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50, unique: true })
  nip!: string;

  @Column({ length: 10, nullable: true })
  lecturer_code!: string;

  @Column({ default: 0 })
  current_supervised_1!: number;

  @Column({ default: 0 })
  current_supervised_2!: number;

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

  @OneToMany(() => LecturerExpertise, (le) => le.lecturer, {
    cascade: true,
    eager: true,
  })
  expertises!: LecturerExpertise[];

  @OneToMany(() => FinalProjects, (fp) => fp.supervisor_1)
  supervisor_1!: FinalProjects[];

  @OneToMany(() => FinalProjects, (fp) => fp.supervisor_2)
  supervisor_2!: FinalProjects[];

  @OneToMany(() => GuidanceAvailability, (ga) => ga.lecturer)
  guidance_availability!: GuidanceAvailability[];

  @OneToOne(() => Signature, (signature) => signature.lecturer, {
    cascade: true,
    eager: true,
  })
  signature?: Signature;

  // *** Method ***
}
