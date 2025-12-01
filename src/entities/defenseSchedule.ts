import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { DefenseSubmission } from "./defenses";

@Entity("defense_schedules")
@Index(["defense_submission"])
@Index(["scheduled_date"])
@Index(["status"])
export class DefenseSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  // Link to original defense submission
  @ManyToOne(() => DefenseSubmission, { onDelete: "CASCADE" })
  @JoinColumn({ name: "defense_submission_id" })
  defense_submission!: DefenseSubmission;

  // Scheduled date (from scheduler output)
  @Column({ type: "date" })
  scheduled_date!: string;

  // Start time (HH:mm format)
  @Column({ type: "varchar", length: 5 })
  start_time!: string;

  // End time (HH:mm format)
  @Column({ type: "varchar", length: 5 })
  end_time!: string;

  // Status dari scheduler
  @Column({ type: "text" })
  scheduler_status!: string;

  // Room/location (opsional)
  @Column({ type: "varchar", length: 255, nullable: true, default: "Prodi" })
  room?: string;

  // Notes (opsional)
  @Column({ type: "text", nullable: true })
  notes?: string;

  // Status penjadwalan
  @Column({
    type: "enum",
    enum: ["scheduled", "rescheduled", "cancelled", "completed"],
    default: "scheduled",
  })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
