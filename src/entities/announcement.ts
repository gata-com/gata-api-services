import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from "typeorm";
import User from "./user";

// enum AnnouncementPriority {
//   LOW = "low",
//   HIGH = "high",
// }

@Entity("announcements")
@Index(["is_published", "created_at"])
export default class Announcements {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "boolean", default: false })
  is_published!: boolean;

  @Column({ type: "enum", enum: ["low", "high"] })
  priority!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user!: User;
  // *** Methods ***
}
