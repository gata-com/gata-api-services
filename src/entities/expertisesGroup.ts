import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Lecturer } from "./role";
import { ExpertisesGroup as expertGroupType } from "../types/user";

@Entity("expertises_group")
export default class ExpertisesGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: ["RPLSI", "AIDE", "KMSI"], unique: true })
  name!: expertGroupType;

  // Relationships
  @OneToMany(() => Lecturer, (lecturer) => lecturer.expertises_group_id)
  lecturers!: Lecturer[];

  // *** Methods ***
}
