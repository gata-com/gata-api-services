import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  OneToMany,
} from "typeorm";
import { Lecturer } from "./lecturer";
import { FinalProjects } from "./finalProject";
import ExpertisesGroup from "./expertisesGroup";

@Entity("defense_submissions")
@Index(["final_project"])
@Index(["lecturer"])
@Index(["defense_type"])
@Index(["status"])
@Index(["created_at"])
export class DefenseSubmission {
  @PrimaryGeneratedColumn()
  id!: number;

  // Jenis sidang
  @Column({
    type: "enum",
    enum: ["proposal", "hasil"],
    comment: "Type of defense: proposal, hasil (result)",
  })
  defense_type!: string;

  // Status pengajuan
  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status!: string;

  // Jumlah bimbingan yang sudah dilakukan
  @Column({
    type: "int",
    default: 0,
  })
  guidance_sup_1_count!: number;

  @Column({
    type: "int",
    default: 0,
    nullable: true,
  })
  guidance_sup_2_count!: number;

  // Minimal bimbingan yang diperlukan
  @Column({
    type: "int",
    default: 4,
  })
  min_guidance_sup_1_proposal!: number;

  @Column({
    type: "int",
    default: 2,
    nullable: true,
  })
  min_guidance_sup_2_proposal!: number;

  @Column({
    type: "int",
    default: 2,
  })
  min_guidance_hasil!: number;

  // Catatan mahasiswa saat pengajuan
  @Column({
    type: "text",
    nullable: true,
  })
  student_notes?: string;

  // Catatan penolakan dari dosen
  @Column({
    type: "text",
    nullable: true,
  })
  rejection_notes?: string;

  @Column({
    type: "datetime",
    nullable: true,
  })
  processed_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***

  @ManyToOne(() => FinalProjects, { onDelete: "CASCADE" })
  final_project!: FinalProjects;

  // Dosen yang memproses (pembimbing 1 atau 2)
  @ManyToOne(() => Lecturer, { onDelete: "CASCADE" })
  lecturer!: Lecturer;

  @OneToMany(() => DefenseSubmissionDocument, (doc) => doc.defense_submission, {
    cascade: true,
  })
  documents!: DefenseSubmissionDocument[];

  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group_1!: ExpertisesGroup;

  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group_2!: ExpertisesGroup;

  // *** Methods ***
}

@Entity("defense_submission_documents")
@Index(["defense_submission"])
export class DefenseSubmissionDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  // Nama dokumen
  @Column({
    type: "varchar",
    length: 255,
  })
  name!: string;

  // URL dokumen
  @Column({
    type: "text",
  })
  url!: string;

  @CreateDateColumn()
  uploaded_at!: Date;

  // *** Relationships ***

  @ManyToOne(() => DefenseSubmission, { onDelete: "CASCADE" })
  defense_submission!: DefenseSubmission;

  // *** Methods ***
}
