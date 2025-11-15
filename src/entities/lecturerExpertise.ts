import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from "typeorm";
import { Lecturer } from "./lecturer";
import ExpertisesGroup from "./expertisesGroup";

@Entity("lecturer_expertise")
@Index(["lecturer", "expertises_group"], { unique: true })
export class LecturerExpertise {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Lecturer, (lecturer) => lecturer.expertises, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "lecturer_id" })
  lecturer!: Lecturer;

  @ManyToOne(() => ExpertisesGroup, {
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn({ name: "expertise_id" })
  expertises_group!: ExpertisesGroup;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
