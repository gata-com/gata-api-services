import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("temp_export_csv")
export class TempExportCsv {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  nama!: string;

  @Column({ type: "varchar", length: 255 })
  nim!: string;

  @Column({ type: "text" })
  judul!: string;

  @Column({ type: "varchar", length: 6 })
  capstone_code!: string;

  @Column({ type: "enum", enum: ["Proposal", "Sidang Akhir"] })
  type!: string;

  @Column({ type: "varchar", length: 10 })
  field_1!: string;

  @Column({ type: "varchar", length: 10 })
  field_2!: string;

  @Column({ type: "varchar", length: 10 })
  spv_1!: string;

  @Column({ type: "varchar", length: 10 })
  spv_2!: string;

  @Column({ nullable: true })
  date_time!: string;

  @Column({ type: "varchar", length: 10 })
  examiner_1!: string;

  @Column({ type: "varchar", length: 10 })
  examiner_2!: string;

  @Column({ nullable: true })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
