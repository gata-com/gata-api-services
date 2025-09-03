import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from "typeorm";
import Admin from "./role";

// enum AnnouncementPriority {
//   LOW = "low",
//   HIGH = "high",
// }

@Entity("announcements")
@Index(["isPublished", "createdAt"])
export default class Announcements {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "boolean", default: false })
  isPublished!: boolean;

  @Column({ type: "enum", enum: ["low", "high"] })
  priority!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // *** Relationships ***
  @ManyToOne(() => Admin)
  admin_id!: Admin;
  // *** Methods ***
}
