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
import { Rubrik } from "./rubrik";
import { Pertanyaan } from "./pertanyaan";

@Entity("rubrik_groups")
export class RubrikGroup {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  rubrikId!: string;

  @Column({ length: 255 })
  nama!: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  bobotTotal!: number;

  @Column({ type: "int" })
  urutan!: number;

  @Column({ type: "boolean", default: false })
  isDefault!: boolean;

  @ManyToOne(() => Rubrik, (rubrik) => rubrik.groups, { onDelete: "CASCADE" })
  @JoinColumn({ name: "rubrikId" })
  rubrik!: Rubrik;

  @OneToMany(() => Pertanyaan, (pertanyaan) => pertanyaan.group, {
    cascade: true,
  })
  pertanyaans!: Pertanyaan[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
