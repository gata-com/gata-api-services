import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("rentang_nilais")
export class RentangNilai {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 5 })
  grade!: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  minScore!: number;

  @Column({ type: "int" })
  urutan!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
