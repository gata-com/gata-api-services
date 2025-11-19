import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { RubrikGroup } from "./rubrikGroup";
import { OpsiJawaban } from "./opsiJawaban";

@Entity("pertanyaans")
export class Pertanyaan {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  groupId!: string;

  @Column({ type: "text" })
  text!: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  bobot!: number;

  @Column({ type: "int" })
  urutan!: number;

  @ManyToOne(() => RubrikGroup, (group) => group.pertanyaans, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "groupId" })
  group!: RubrikGroup;

  @OneToMany(() => OpsiJawaban, (opsi) => opsi.pertanyaan, { cascade: true })
  opsiJawabans!: OpsiJawaban[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
