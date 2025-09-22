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
  Index,
} from "typeorm";

import ExpertisesGroup from "./expertisesGroup";
import User from "./user";
import Announcements from "./announcement";

// Admin
@Entity("admin")
export default class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @OneToMany(() => Announcements, (announcement) => announcement.admin, {
    onDelete: "CASCADE",
  })
  announcements!: Announcements[];

  // *** Methods ***
}

// Lecturer
@Entity("lecturer")
@Index("IDX_nip_index", ["nip"])
@Index(["lecturer_code"])
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

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @ManyToOne(() => ExpertisesGroup, { onDelete: "CASCADE" })
  expertises_group!: ExpertisesGroup;

  // *** Method ***
}

// Student
@Entity("student")
@Index(["semester"])
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 9 })
  nim!: string; // Nomor Induk Mahasiswa

  @Column({ default: 1 })
  semester!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  // *** Methods ***
}
