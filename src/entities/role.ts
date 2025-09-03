import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";

import ExpertisesGroup from "./expertisesGroup";
import User from "./user";
import Announcements from "./announcement";

// Admin
@Entity("admin")
export default class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // *** Relationships ***
  @OneToOne(() => User)
  @JoinColumn()
  user_id!: User;

  @OneToMany(() => Announcements, (announcement) => announcement.admin_id)
  admin_id!: Announcements[];

  // *** Methods ***
}

// Lecturer
@Entity("lecturer")
export class Lecturer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  nip!: number;

  @Column({ length: 10, nullable: true })
  lecturer_code!: string;

  @Column({ default: 15 })
  max_supervised_1!: number;

  @Column({ default: 15 })
  max_supervised_2!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // *** Relationships ***
  @OneToOne(() => User)
  @JoinColumn()
  user_id!: User;

  @ManyToOne(() => ExpertisesGroup)
  expertises_group_id!: ExpertisesGroup;

  // *** Method ***
}

// Student
@Entity("student")
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 9 })
  nim!: string; // Nomor Induk Mahasiswa

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // *** Relationships ***
  @OneToOne(() => User)
  @JoinColumn()
  user_id!: User;

  // *** Methods ***
}
