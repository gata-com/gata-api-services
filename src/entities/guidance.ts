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

@Entity("guidance_availability")
@Index(["lecturer"])
@Index(["day_of_week"])
export class GuidanceAvailability {
  @PrimaryGeneratedColumn()
  id!: number;

  // Hari dalam seminggu (1=Senin, 2=Selasa, ..., 5=Jumat)
  @Column({
    type: "enum",
    enum: ["1", "2", "3", "4", "5"],
    comment:
      "Day of the week: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday",
  })
  day_of_week!: number;

  // Jam mulai (format: HH:mm)
  @Column({
    type: "time",
  })
  start_time!: string;

  // Jam selesai (format: HH:mm)
  @Column({
    type: "time",
  })
  end_time!: string;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***

  @OneToMany(() => GuidanceSession, (gs) => gs.guidance_availability)
  sessions!: GuidanceSession[];

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE" })
  lecturer!: Lecturer;

  // *** Methods ***
}

@Entity("guidance_sessions")
@Index(["final_project"])
@Index(["lecturer"])
@Index(["session_date"])
@Index(["status"])
@Index(["supervisor_type"])
export class GuidanceSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: ["proposal", "hasil"] })
  defense_type!: string;

  // Tipe pembimbing (1 = Pembimbing 1, 2 = Pembimbing 2)
  @Column({
    type: "enum",
    enum: [1, 2],
    comment: "Supervisor type: 1=Pembimbing 1, 2=Pembimbing 2",
  })
  supervisor_type!: number;

  // Topik bimbingan
  @Column({
    type: "text",
    comment: "Topic of the guidance session",
  })
  topic!: string;

  // Catatan feedback dari dosen
  @Column({ type: "text", nullable: true })
  lecturer_feedback?: string;

  // Status bimbingan
  @Column({
    type: "enum",
    enum: [
      "scheduled", // Terjadwal
      "ongoing", // Sedang berlangsung
      "completed", // Selesai dilaksanakan
      "no_show", // Mahasiswa tidak hadir
      "cancelled", // Dibatalkan
    ],
    default: "scheduled", // auto terjadwal
  })
  status!: string;

  // Tanggal bimbingan (YYYY-MM-DD)
  @Column({
    type: "date",
    comment: "Specific date of the guidance session",
  })
  session_date!: Date;

  @Column({
    type: "datetime",
    nullable: true,
  })
  cancelled_at?: Date;

  @Column({
    type: "datetime",
    nullable: true,
  })
  completed_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***

  @ManyToOne(() => GuidanceAvailability, { onDelete: "CASCADE" })
  guidance_availability!: GuidanceAvailability;

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE" })
  lecturer!: Lecturer;

  @ManyToOne(() => FinalProjects, { onDelete: "CASCADE" })
  final_project!: FinalProjects;

  @OneToMany(() => GuidanceDraftLink, (link) => link.guidance_session, {
    cascade: true,
  })
  draft_links!: GuidanceDraftLink[];

  // *** Methods ***
}

@Entity("guidance_draft_links")
@Index(["guidance_session"])
export class GuidanceDraftLink {
  @PrimaryGeneratedColumn()
  id!: number;

  // Nama file/dokumen
  @Column({
    type: "varchar",
    length: 255,
  })
  name!: string;

  // URL Google Drive atau link lainnya
  @Column({
    type: "text",
  })
  url!: string;

  @CreateDateColumn()
  uploaded_at!: Date;

  // *** Relationships ***

  @ManyToOne(() => GuidanceSession, { onDelete: "CASCADE" })
  guidance_session!: GuidanceSession;

  // *** Methods ***
}
