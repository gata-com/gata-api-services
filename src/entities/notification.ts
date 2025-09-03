import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

//  enum NotificationType {
//   INFO = "info",
//   WARNING = "warning",
//   ERROR = "error",
//   SUCCESS = "success",
// }

@Entity("notifications")
export default class Notifications {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "boolean", default: false })
  isRead!: boolean;

  @Column({
    type: "enum",
    enum: ["info", "warning", "error", "success"],
    default: "info",
  })
  type!: Array<string>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // *** Relationships ***
  // Add any necessary relationships here

  // *** Methods ***
  // Add any necessary methods here
}
