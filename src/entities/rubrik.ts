import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { RubrikGroup } from "./rubrikGroup";

@Entity("rubriks")
export class Rubrik {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  nama!: string;

  @Column({ type: "text", nullable: true })
  deskripsi?: string;

  @Column({
    type: "enum",
    enum: ["SID", "SEM"],
    comment: "SID=Sidang, SEM=Seminar",
  })
  type!: "SID" | "SEM";

  @Column({ type: "boolean", default: false })
  isDefault!: boolean;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @OneToMany(() => RubrikGroup, (group) => group.rubrik, { cascade: true })
  groups!: RubrikGroup[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
