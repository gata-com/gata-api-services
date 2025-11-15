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
  is_read!: boolean;

  @Column({
    type: "enum",
    enum: ["info", "warning", "error", "success"],
    default: "info",
  })
  type!: Array<string>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  // Add any necessary relationships here

  // *** Methods ***
  // Add any necessary methods here
}
