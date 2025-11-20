import "reflect-metadata";
import { DataSource } from "typeorm";
import AppDataSource from "../config/data-source";
import { Student } from "../entities/student";
import { Lecturer } from "../entities/lecturer";
import User from "../entities/user";
import ExpertisesGroup from "../entities/expertisesGroup";
import {
  FinalProjects,
  FinalProjectMembers,
  FinalProjectPeriods,
} from "../entities/finalProject";
import {
  GuidanceAvailability,
  GuidanceSession,
  GuidanceDraftLink,
} from "../entities/guidance";
import {
  DefenseSubmission,
  DefenseSubmissionDocument,
} from "../entities/defenses";
import { DefenseSchedule } from "../entities/defenseSchedule";
import { Rubrik } from "../entities/rubrik";
import { RubrikGroup } from "../entities/rubrikGroup";
import { Pertanyaan } from "../entities/pertanyaan";
import { OpsiJawaban } from "../entities/opsiJawaban";
import { RentangNilai } from "../entities/rentangNilai";
import { Penilaian } from "../entities/penilaian";
import { JawabanPenilaian } from "../entities/jawabanPenilaian";

export async function seedDummyData(dataSource: DataSource) {
  console.log("🌱 Seeding dummy data...");

  // Repositories
  const userRepo = dataSource.getRepository(User);
  const studentRepo = dataSource.getRepository(Student);
  const lecturerRepo = dataSource.getRepository(Lecturer);
  const expertisesGroupRepo = dataSource.getRepository(ExpertisesGroup);
  const finalProjectPeriodRepo = dataSource.getRepository(FinalProjectPeriods);
  const finalProjectRepo = dataSource.getRepository(FinalProjects);
  const finalProjectMemberRepo = dataSource.getRepository(FinalProjectMembers);
  const guidanceAvailabilityRepo =
    dataSource.getRepository(GuidanceAvailability);
  const guidanceSessionRepo = dataSource.getRepository(GuidanceSession);
  const guidanceDraftLinkRepo = dataSource.getRepository(GuidanceDraftLink);
  const defenseSubmissionRepo = dataSource.getRepository(DefenseSubmission);
  const defenseSubmissionDocRepo = dataSource.getRepository(
    DefenseSubmissionDocument
  );
  const defenseScheduleRepo = dataSource.getRepository(DefenseSchedule);
  const rubrikRepo = dataSource.getRepository(Rubrik);
  const rubrikGroupRepo = dataSource.getRepository(RubrikGroup);
  const pertanyaanRepo = dataSource.getRepository(Pertanyaan);
  const opsiJawabanRepo = dataSource.getRepository(OpsiJawaban);
  const rentangNilaiRepo = dataSource.getRepository(RentangNilai);
  const penilaianRepo = dataSource.getRepository(Penilaian);
  const jawabanPenilaianRepo = dataSource.getRepository(JawabanPenilaian);

  // ==================== EXPERTISES GROUP ====================
  console.log("Creating expertises groups...");
  const expertiseGroups = await expertisesGroupRepo.save([
    {
      name: "Artificial Intelligence",
      description: "Machine Learning, Deep Learning, Computer Vision",
    },
    {
      name: "Software Engineering",
      description: "Web Development, Mobile Development, System Design",
    },
    {
      name: "Data Science",
      description: "Data Analytics, Big Data, Data Visualization",
    },
    {
      name: "Cybersecurity",
      description: "Network Security, Application Security, Cryptography",
    },
  ]);

  // ==================== FINAL PROJECT PERIOD ====================
  console.log("Creating final project period...");
  const period = await finalProjectPeriodRepo.save({
    start_date: "2024-09-01",
    end_date: "2025-08-31",
    approval_end_date: "2024-10-15",
    description: "Periode Tugas Akhir 2024/2025",
  });

  // ==================== GET EXISTING USERS ====================
  console.log("Fetching existing users...");
  const students = await studentRepo.find({ relations: ["user"] });
  const lecturers = await lecturerRepo.find({ relations: ["user"] });

  if (students.length < 10 || lecturers.length < 5) {
    console.error(
      "❌ Not enough students or lecturers. Please seed users first!"
    );
    return;
  }

  // Ambil beberapa mahasiswa dan dosen untuk dummy data
  const student1 = students[0];
  const student2 = students[1];
  const student3 = students[2];
  const student4 = students[3];
  const student5 = students[4];
  const student6 = students[5];

  const lecturer1 = lecturers[0]; // Pembimbing 1
  const lecturer2 = lecturers[1]; // Pembimbing 2
  const lecturer3 = lecturers[2]; // Penguji 1
  const lecturer4 = lecturers[3]; // Penguji 2
  const lecturer5 = lecturers[4]; // Extra lecturer

  // ==================== GUIDANCE AVAILABILITY ====================
  console.log("Creating guidance availability...");
  const availability1 = await guidanceAvailabilityRepo.save({
    lecturer: lecturer1,
    day_of_week: 1, // Senin
    start_time: "09:00",
    end_time: "12:00",
    location: "Ruang Dosen 101",
  });

  const availability2 = await guidanceAvailabilityRepo.save({
    lecturer: lecturer2,
    day_of_week: 2, // Selasa
    start_time: "13:00",
    end_time: "16:00",
    location: "Ruang Dosen 102",
  });

  // ==================== SCENARIO 1: MAHASISWA 1 - SUDAH SELESAI SEMINAR PROPOSAL, BIMBINGAN SIDANG HASIL ====================
  console.log(
    "Scenario 1: Student 1 - Completed proposal defense, now doing hasil guidance..."
  );

  // Final Project 1
  const finalProject1 = await finalProjectRepo.save({
    type: "regular",
    status: "baru",
    source_topic: "dosen",
    description: "Sistem Rekomendasi Buku menggunakan Collaborative Filtering",
    max_members: 1,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[0], // AI
    expertises_group_2: expertiseGroups[2], // Data Science
    supervisor_1: lecturer1,
    supervisor_2: lecturer2,
    final_project_period: period,
  });

  const member1 = await finalProjectMemberRepo.save({
    final_project: finalProject1,
    student: student1,
    title: "Sistem Rekomendasi Buku menggunakan Collaborative Filtering",
    resume:
      "Penelitian ini mengembangkan sistem rekomendasi buku berbasis collaborative filtering untuk meningkatkan pengalaman pengguna.",
    draft_path: "/storages/final-projects/proposal-student1.pdf",
    draft_filename: "proposal-student1.pdf",
    draft_size: "2.5MB",
  });

  // Bimbingan Proposal (Completed)
  for (let i = 1; i <= 6; i++) {
    const session = await guidanceSessionRepo.save({
      final_project: finalProject1,
      lecturer: lecturer1,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i} - Review Bab ${i}`,
      lecturer_feedback: `Bab ${i} sudah bagus, lanjutkan ke bab berikutnya`,
      status: "completed",
      session_date: new Date(2024, 9, i * 3), // Oktober 2024
      completed_at: new Date(2024, 9, i * 3, 10, 0),
    });

    await guidanceDraftLinkRepo.save({
      guidance_session: session,
      name: `Draft Bab ${i}`,
      url: `https://drive.google.com/file/draft-bab-${i}`,
    });
  }

  for (let i = 1; i <= 3; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject1,
      lecturer: lecturer2,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i} - Review Metodologi`,
      lecturer_feedback: `Metodologi sudah sesuai`,
      status: "completed",
      session_date: new Date(2024, 9, i * 4), // Oktober 2024
      completed_at: new Date(2024, 9, i * 4, 14, 0),
    });
  }

  // Defense Submission Proposal (Approved & Scheduled)
  const defenseSubmission1Proposal = await defenseSubmissionRepo.save({
    final_project: finalProject1,
    lecturer: lecturer1,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 6,
    guidance_sup_2_count: 3,
    min_guidance_sup_1_proposal: 5,
    min_guidance_sup_2_proposal: 2,
    student_notes: "Siap untuk seminar proposal",
    capstone_code: "ABCD1",
    defense_date: new Date(2024, 10, 15, 9, 0), // 15 Nov 2024
    processed_at: new Date(2024, 10, 1),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[2],
  });

  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission1Proposal,
    name: "Proposal Final",
    url: "https://drive.google.com/file/proposal-final-student1",
  });

  // Defense Schedule Proposal (Completed)
  const defenseSchedule1Proposal = await defenseScheduleRepo.save({
    defense_submission: defenseSubmission1Proposal,
    scheduled_date: "2024-11-15",
    start_time: "09:00",
    end_time: "10:30",
    scheduler_status: "scheduled",
    room: "Ruang Sidang A",
    status: "completed",
  });

  // Bimbingan Sidang Hasil (In Progress)
  for (let i = 1; i <= 3; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject1,
      lecturer: lecturer1,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "hasil",
      topic: `Bimbingan Hasil ${i} - Review Implementasi`,
      lecturer_feedback: `Implementasi sudah baik`,
      status: "completed",
      session_date: new Date(2024, 11, i * 3), // Desember 2024
      completed_at: new Date(2024, 11, i * 3, 10, 0),
    });
  }

  await guidanceSessionRepo.save({
    final_project: finalProject1,
    lecturer: lecturer2,
    guidance_availability: availability2,
    supervisor_type: 2,
    defense_type: "hasil",
    topic: `Bimbingan Hasil 1 - Review Hasil`,
    lecturer_feedback: `Hasil sudah sesuai`,
    status: "completed",
    session_date: new Date(2024, 11, 10),
    completed_at: new Date(2024, 11, 10, 14, 0),
  });

  // ==================== SCENARIO 2: MAHASISWA 2 - SEDANG MENUNGGU PENJADWALAN SEMINAR PROPOSAL ====================
  console.log(
    "Scenario 2: Student 2 - Waiting for proposal defense scheduling..."
  );

  const finalProject2 = await finalProjectRepo.save({
    type: "capstone",
    status: "baru",
    source_topic: "perusahaan",
    description: "Aplikasi E-Commerce Mobile dengan Flutter",
    max_members: 3,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[1], // Software Engineering
    expertises_group_2: expertiseGroups[1],
    supervisor_1: lecturer1,
    supervisor_2: lecturer2,
    final_project_period: period,
  });

  await finalProjectMemberRepo.save({
    final_project: finalProject2,
    student: student2,
    title: "Aplikasi E-Commerce Mobile dengan Flutter",
    resume: "Pengembangan aplikasi e-commerce menggunakan Flutter dan Firebase",
    draft_path: "/storages/final-projects/proposal-student2.pdf",
    draft_filename: "proposal-student2.pdf",
    draft_size: "3.1MB",
  });

  // Bimbingan Proposal (Completed - memenuhi minimal)
  for (let i = 1; i <= 5; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject2,
      lecturer: lecturer1,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `Progress bagus, lanjutkan`,
      status: "completed",
      session_date: new Date(2024, 10, i * 2),
      completed_at: new Date(2024, 10, i * 2, 10, 0),
    });
  }

  for (let i = 1; i <= 2; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject2,
      lecturer: lecturer2,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `Sudah sesuai`,
      status: "completed",
      session_date: new Date(2024, 10, i * 5),
      completed_at: new Date(2024, 10, i * 5, 14, 0),
    });
  }

  // Defense Submission (Approved, waiting for scheduling)
  const defenseSubmission2 = await defenseSubmissionRepo.save({
    final_project: finalProject2,
    lecturer: lecturer1,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    min_guidance_sup_1_proposal: 5,
    min_guidance_sup_2_proposal: 2,
    student_notes: "Mohon dijadwalkan seminar proposal",
    processed_at: new Date(2024, 11, 1),
    expertises_group_1: expertiseGroups[1],
    expertises_group_2: expertiseGroups[1],
    // capstone_code dan defense_date akan diisi saat penjadwalan
  });

  // ==================== SCENARIO 3: MAHASISWA 3 - SEDANG BIMBINGAN PROPOSAL ====================
  console.log("Scenario 3: Student 3 - Currently doing proposal guidance...");

  const finalProject3 = await finalProjectRepo.save({
    type: "regular",
    status: "baru",
    source_topic: "dosen",
    description: "Deteksi Penyakit Tanaman menggunakan Deep Learning",
    max_members: 1,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[0], // AI
    expertises_group_2: expertiseGroups[0],
    supervisor_1: lecturer5,
    supervisor_2: lecturer2,
    final_project_period: period,
  });

  await finalProjectMemberRepo.save({
    final_project: finalProject3,
    student: student3,
    title: "Deteksi Penyakit Tanaman menggunakan Deep Learning",
    resume: "Sistem deteksi penyakit tanaman menggunakan CNN",
    draft_path: "/storages/final-projects/proposal-student3.pdf",
    draft_filename: "proposal-student3.pdf",
    draft_size: "2.8MB",
  });

  // Bimbingan Proposal (In Progress - belum memenuhi minimal)
  for (let i = 1; i <= 3; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject3,
      lecturer: lecturer5,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `Perlu revisi lagi`,
      status: "completed",
      session_date: new Date(2024, 11, i * 3),
      completed_at: new Date(2024, 11, i * 3, 10, 0),
    });
  }

  await guidanceSessionRepo.save({
    final_project: finalProject3,
    lecturer: lecturer2,
    guidance_availability: availability2,
    supervisor_type: 2,
    defense_type: "proposal",
    topic: `Bimbingan Proposal 1`,
    lecturer_feedback: `Metodologi perlu diperbaiki`,
    status: "completed",
    session_date: new Date(2024, 11, 5),
    completed_at: new Date(2024, 11, 5, 14, 0),
  });

  // ==================== SCENARIO 4: MAHASISWA 4 - SUDAH DIJADWALKAN SEMINAR PROPOSAL (H-10) ====================
  console.log(
    "Scenario 4: Student 4 - Scheduled for proposal defense (H-10)..."
  );

  const finalProject4 = await finalProjectRepo.save({
    type: "regular",
    status: "baru",
    source_topic: "mandiri",
    description: "Sistem Monitoring Kualitas Udara IoT",
    max_members: 2,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[1], // Software Engineering
    expertises_group_2: expertiseGroups[3], // Cybersecurity
    supervisor_1: lecturer1,
    supervisor_2: lecturer2,
    final_project_period: period,
  });

  await finalProjectMemberRepo.save({
    final_project: finalProject4,
    student: student4,
    title: "Sistem Monitoring Kualitas Udara IoT",
    resume: "Sistem monitoring real-time menggunakan IoT dan cloud computing",
    draft_path: "/storages/final-projects/proposal-student4.pdf",
    draft_filename: "proposal-student4.pdf",
    draft_size: "3.5MB",
  });

  // Bimbingan Proposal (Completed)
  for (let i = 1; i <= 6; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject4,
      lecturer: lecturer1,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `Bagus, sudah siap seminar`,
      status: "completed",
      session_date: new Date(2024, 10, i * 2),
      completed_at: new Date(2024, 10, i * 2, 10, 0),
    });
  }

  for (let i = 1; i <= 3; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject4,
      lecturer: lecturer2,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `Siap seminar`,
      status: "completed",
      session_date: new Date(2024, 10, i * 3),
      completed_at: new Date(2024, 10, i * 3, 14, 0),
    });
  }

  // Defense Submission & Schedule (H-10 dari sekarang)
  const today = new Date();
  const defenseDate4 = new Date(today);
  defenseDate4.setDate(today.getDate() + 10); // H+10

  const defenseSubmission4 = await defenseSubmissionRepo.save({
    final_project: finalProject4,
    lecturer: lecturer1,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 6,
    guidance_sup_2_count: 3,
    min_guidance_sup_1_proposal: 5,
    min_guidance_sup_2_proposal: 2,
    student_notes: "Siap seminar proposal",
    capstone_code: "WXYZ4",
    defense_date: defenseDate4,
    processed_at: new Date(2024, 11, 1),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[1],
    expertises_group_2: expertiseGroups[3],
  });

  const defenseSchedule4 = await defenseScheduleRepo.save({
    defense_submission: defenseSubmission4,
    scheduled_date: defenseDate4.toISOString().split("T")[0],
    start_time: "10:30",
    end_time: "12:00",
    scheduler_status: "scheduled",
    room: "Ruang Sidang B",
    status: "scheduled",
  });

  // ==================== SCENARIO 5: MAHASISWA 5 - SUDAH DIJADWALKAN SEMINAR PROPOSAL (H+5) ====================
  console.log(
    "Scenario 5: Student 5 - Completed proposal defense (H+5), ready for assessment..."
  );

  const finalProject5 = await finalProjectRepo.save({
    type: "regular",
    status: "baru",
    source_topic: "dosen",
    description: "Chatbot Customer Service menggunakan NLP",
    max_members: 1,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[0], // AI
    expertises_group_2: expertiseGroups[1], // Software Engineering
    supervisor_1: lecturer1,
    supervisor_2: lecturer5,
    final_project_period: period,
  });

  await finalProjectMemberRepo.save({
    final_project: finalProject5,
    student: student5,
    title: "Chatbot Customer Service menggunakan NLP",
    resume:
      "Pengembangan chatbot intelligent untuk layanan customer service otomatis",
    draft_path: "/storages/final-projects/proposal-student5.pdf",
    draft_filename: "proposal-student5.pdf",
    draft_size: "2.9MB",
  });

  // Bimbingan Proposal (Completed)
  for (let i = 1; i <= 5; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject5,
      lecturer: lecturer1,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `Sudah bagus`,
      status: "completed",
      session_date: new Date(2024, 9, i * 3),
      completed_at: new Date(2024, 9, i * 3, 10, 0),
    });
  }

  for (let i = 1; i <= 2; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject5,
      lecturer: lecturer5,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `OK`,
      status: "completed",
      session_date: new Date(2024, 9, i * 5),
      completed_at: new Date(2024, 9, i * 5, 14, 0),
    });
  }

  // Defense Submission & Schedule (H+5 dari sekarang - sudah selesai sidang)
  const defenseDate5 = new Date(today);
  defenseDate5.setDate(today.getDate() - 5); // H-5 (sudah lewat)

  const defenseSubmission5 = await defenseSubmissionRepo.save({
    final_project: finalProject5,
    lecturer: lecturer1,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    min_guidance_sup_1_proposal: 5,
    min_guidance_sup_2_proposal: 2,
    student_notes: "Siap seminar",
    capstone_code: "PQRS5",
    defense_date: defenseDate5,
    processed_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[1],
  });

  const defenseSchedule5 = await defenseScheduleRepo.save({
    defense_submission: defenseSubmission5,
    scheduled_date: defenseDate5.toISOString().split("T")[0],
    start_time: "13:00",
    end_time: "14:30",
    scheduler_status: "scheduled",
    room: "Ruang Sidang A",
    status: "completed",
  });

  // ==================== SCENARIO 6: MAHASISWA 6 - DIJADWALKAN SIDANG HASIL (H+15) ====================
  console.log("Scenario 6: Student 6 - Scheduled for hasil defense (H+15)...");

  const finalProject6 = await finalProjectRepo.save({
    type: "regular",
    status: "baru",
    source_topic: "dosen",
    description: "Analisis Sentimen Media Sosial",
    max_members: 1,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[0], // AI
    expertises_group_2: expertiseGroups[2], // Data Science
    supervisor_1: lecturer5,
    supervisor_2: lecturer2,
    final_project_period: period,
  });

  await finalProjectMemberRepo.save({
    final_project: finalProject6,
    student: student6,
    title: "Analisis Sentimen Media Sosial",
    resume: "Analisis sentimen tweet menggunakan machine learning",
    draft_path: "/storages/final-projects/proposal-student6.pdf",
    draft_filename: "proposal-student6.pdf",
    draft_size: "2.7MB",
  });

  // Bimbingan Proposal (Completed)
  for (let i = 1; i <= 5; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject6,
      lecturer: lecturer5,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `Bagus`,
      status: "completed",
      session_date: new Date(2024, 8, i * 3),
      completed_at: new Date(2024, 8, i * 3, 10, 0),
    });
  }

  for (let i = 1; i <= 2; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject6,
      lecturer: lecturer2,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal ${i}`,
      lecturer_feedback: `OK`,
      status: "completed",
      session_date: new Date(2024, 8, i * 5),
      completed_at: new Date(2024, 8, i * 5, 14, 0),
    });
  }

  // Seminar Proposal sudah selesai
  const defenseSubmission6Proposal = await defenseSubmissionRepo.save({
    final_project: finalProject6,
    lecturer: lecturer5,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    student_notes: "Proposal selesai",
    capstone_code: "MNOP6",
    defense_date: new Date(2024, 9, 20),
    processed_at: new Date(2024, 9, 10),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[2],
  });

  await defenseScheduleRepo.save({
    defense_submission: defenseSubmission6Proposal,
    scheduled_date: "2024-10-20",
    start_time: "14:30",
    end_time: "16:00",
    scheduler_status: "scheduled",
    room: "Ruang Sidang C",
    status: "completed",
  });

  // Bimbingan Hasil (Completed)
  for (let i = 1; i <= 5; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject6,
      lecturer: lecturer5,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "hasil",
      topic: `Bimbingan Hasil ${i}`,
      lecturer_feedback: `Hasil implementasi bagus`,
      status: "completed",
      session_date: new Date(2024, 10, i * 4),
      completed_at: new Date(2024, 10, i * 4, 10, 0),
    });
  }

  for (let i = 1; i <= 2; i++) {
    await guidanceSessionRepo.save({
      final_project: finalProject6,
      lecturer: lecturer2,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "hasil",
      topic: `Bimbingan Hasil ${i}`,
      lecturer_feedback: `Siap sidang`,
      status: "completed",
      session_date: new Date(2024, 10, i * 6),
      completed_at: new Date(2024, 10, i * 6, 14, 0),
    });
  }

  // Sidang Hasil dijadwalkan H+15
  const defenseDate6Hasil = new Date(today);
  defenseDate6Hasil.setDate(today.getDate() + 15);

  const defenseSubmission6Hasil = await defenseSubmissionRepo.save({
    final_project: finalProject6,
    lecturer: lecturer5,
    defense_type: "hasil",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    student_notes: "Siap sidang hasil",
    capstone_code: "LMNO6",
    defense_date: defenseDate6Hasil,
    processed_at: new Date(2024, 11, 5),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[2],
  });

  const defenseSchedule6Hasil = await defenseScheduleRepo.save({
    defense_submission: defenseSubmission6Hasil,
    scheduled_date: defenseDate6Hasil.toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:30",
    scheduler_status: "scheduled",
    room: "Ruang Sidang A",
    status: "scheduled",
  });

  // ==================== RUBRIK & PENILAIAN ====================
  console.log("Creating assessment rubrics...");

  // Rentang Nilai
  await rentangNilaiRepo.save([
    { grade: "A", minScore: 85.0, urutan: 1, isActive: true },
    { grade: "AB", minScore: 80.0, urutan: 2, isActive: true },
    { grade: "B", minScore: 75.0, urutan: 3, isActive: true },
    { grade: "BC", minScore: 70.0, urutan: 4, isActive: true },
    { grade: "C", minScore: 65.0, urutan: 5, isActive: true },
    { grade: "D", minScore: 55.0, urutan: 6, isActive: true },
    { grade: "E", minScore: 0.0, urutan: 7, isActive: true },
  ]);

  // Rubrik Seminar Proposal
  const rubrikSeminar = await rubrikRepo.save({
    nama: "Rubrik Penilaian Seminar Proposal",
    deskripsi: "Rubrik untuk penilaian seminar proposal tugas akhir",
    type: "SEM",
    isDefault: true,
    isActive: true,
  });

  // Group 1: Substansi (40%)
  const groupSubstansi = await rubrikGroupRepo.save({
    rubrikId: rubrikSeminar.id,
    nama: "Substansi Proposal",
    bobotTotal: 40.0,
    urutan: 1,
    isDefault: true,
  });

  const pertanyaan1 = await pertanyaanRepo.save({
    groupId: groupSubstansi.id,
    text: "Kejelasan latar belakang dan rumusan masalah",
    bobot: 10.0,
    urutan: 1,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan1.id,
      text: "Sangat Jelas dan Komprehensif",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan1.id,
      text: "Jelas dan Cukup Lengkap",
      nilai: 3.0,
      urutan: 2,
    },
    {
      pertanyaanId: pertanyaan1.id,
      text: "Cukup Jelas",
      nilai: 2.0,
      urutan: 3,
    },
    {
      pertanyaanId: pertanyaan1.id,
      text: "Kurang Jelas",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  const pertanyaan2 = await pertanyaanRepo.save({
    groupId: groupSubstansi.id,
    text: "Kesesuaian metodologi penelitian",
    bobot: 15.0,
    urutan: 2,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan2.id,
      text: "Sangat Sesuai dan Sistematis",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan2.id,
      text: "Sesuai dan Terstruktur",
      nilai: 3.0,
      urutan: 2,
    },
    {
      pertanyaanId: pertanyaan2.id,
      text: "Cukup Sesuai",
      nilai: 2.0,
      urutan: 3,
    },
    {
      pertanyaanId: pertanyaan2.id,
      text: "Kurang Sesuai",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  const pertanyaan3 = await pertanyaanRepo.save({
    groupId: groupSubstansi.id,
    text: "Tinjauan pustaka dan kajian teori",
    bobot: 15.0,
    urutan: 3,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan3.id,
      text: "Sangat Lengkap dan Relevan",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan3.id,
      text: "Lengkap dan Relevan",
      nilai: 3.0,
      urutan: 2,
    },
    {
      pertanyaanId: pertanyaan3.id,
      text: "Cukup Lengkap",
      nilai: 2.0,
      urutan: 3,
    },
    {
      pertanyaanId: pertanyaan3.id,
      text: "Kurang Lengkap",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  // Group 2: Presentasi (30%)
  const groupPresentasi = await rubrikGroupRepo.save({
    rubrikId: rubrikSeminar.id,
    nama: "Presentasi",
    bobotTotal: 30.0,
    urutan: 2,
    isDefault: true,
  });

  const pertanyaan4 = await pertanyaanRepo.save({
    groupId: groupPresentasi.id,
    text: "Kemampuan presentasi dan komunikasi",
    bobot: 15.0,
    urutan: 1,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan4.id,
      text: "Sangat Baik dan Komunikatif",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan4.id,
      text: "Baik dan Jelas",
      nilai: 3.0,
      urutan: 2,
    },
    { pertanyaanId: pertanyaan4.id, text: "Cukup Baik", nilai: 2.0, urutan: 3 },
    {
      pertanyaanId: pertanyaan4.id,
      text: "Kurang Baik",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  const pertanyaan5 = await pertanyaanRepo.save({
    groupId: groupPresentasi.id,
    text: "Penguasaan materi",
    bobot: 15.0,
    urutan: 2,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan5.id,
      text: "Sangat Menguasai",
      nilai: 4.0,
      urutan: 1,
    },
    { pertanyaanId: pertanyaan5.id, text: "Menguasai", nilai: 3.0, urutan: 2 },
    {
      pertanyaanId: pertanyaan5.id,
      text: "Cukup Menguasai",
      nilai: 2.0,
      urutan: 3,
    },
    {
      pertanyaanId: pertanyaan5.id,
      text: "Kurang Menguasai",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  // Group 3: Tanya Jawab (30%)
  const groupTanyaJawab = await rubrikGroupRepo.save({
    rubrikId: rubrikSeminar.id,
    nama: "Tanya Jawab",
    bobotTotal: 30.0,
    urutan: 3,
    isDefault: true,
  });

  const pertanyaan6 = await pertanyaanRepo.save({
    groupId: groupTanyaJawab.id,
    text: "Kemampuan menjawab pertanyaan",
    bobot: 30.0,
    urutan: 1,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan6.id,
      text: "Sangat Baik dan Argumentatif",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan6.id,
      text: "Baik dan Logis",
      nilai: 3.0,
      urutan: 2,
    },
    { pertanyaanId: pertanyaan6.id, text: "Cukup Baik", nilai: 2.0, urutan: 3 },
    {
      pertanyaanId: pertanyaan6.id,
      text: "Kurang Baik",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  // Rubrik Sidang Hasil
  const rubrikSidang = await rubrikRepo.save({
    nama: "Rubrik Penilaian Sidang Hasil",
    deskripsi: "Rubrik untuk penilaian sidang hasil tugas akhir",
    type: "SID",
    isDefault: true,
    isActive: true,
  });

  // Group 1: Hasil Implementasi (50%)
  const groupHasil = await rubrikGroupRepo.save({
    rubrikId: rubrikSidang.id,
    nama: "Hasil Implementasi",
    bobotTotal: 50.0,
    urutan: 1,
    isDefault: true,
  });

  const pertanyaan7 = await pertanyaanRepo.save({
    groupId: groupHasil.id,
    text: "Kualitas implementasi sistem/aplikasi",
    bobot: 25.0,
    urutan: 1,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan7.id,
      text: "Sangat Baik dan Kompleks",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan7.id,
      text: "Baik dan Fungsional",
      nilai: 3.0,
      urutan: 2,
    },
    { pertanyaanId: pertanyaan7.id, text: "Cukup Baik", nilai: 2.0, urutan: 3 },
    {
      pertanyaanId: pertanyaan7.id,
      text: "Kurang Baik",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  const pertanyaan8 = await pertanyaanRepo.save({
    groupId: groupHasil.id,
    text: "Hasil pengujian dan analisis",
    bobot: 25.0,
    urutan: 2,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan8.id,
      text: "Sangat Lengkap dan Mendalam",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan8.id,
      text: "Lengkap dan Jelas",
      nilai: 3.0,
      urutan: 2,
    },
    {
      pertanyaanId: pertanyaan8.id,
      text: "Cukup Lengkap",
      nilai: 2.0,
      urutan: 3,
    },
    {
      pertanyaanId: pertanyaan8.id,
      text: "Kurang Lengkap",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  // Group 2: Dokumentasi (20%)
  const groupDokumentasi = await rubrikGroupRepo.save({
    rubrikId: rubrikSidang.id,
    nama: "Dokumentasi",
    bobotTotal: 20.0,
    urutan: 2,
    isDefault: true,
  });

  const pertanyaan9 = await pertanyaanRepo.save({
    groupId: groupDokumentasi.id,
    text: "Kelengkapan dan kualitas dokumentasi",
    bobot: 20.0,
    urutan: 1,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan9.id,
      text: "Sangat Lengkap dan Detail",
      nilai: 4.0,
      urutan: 1,
    },
    {
      pertanyaanId: pertanyaan9.id,
      text: "Lengkap dan Jelas",
      nilai: 3.0,
      urutan: 2,
    },
    {
      pertanyaanId: pertanyaan9.id,
      text: "Cukup Lengkap",
      nilai: 2.0,
      urutan: 3,
    },
    {
      pertanyaanId: pertanyaan9.id,
      text: "Kurang Lengkap",
      nilai: 1.0,
      urutan: 4,
    },
  ]);

  // Group 3: Presentasi & Tanya Jawab (30%)
  const groupPresentasiSidang = await rubrikGroupRepo.save({
    rubrikId: rubrikSidang.id,
    nama: "Presentasi & Tanya Jawab",
    bobotTotal: 30.0,
    urutan: 3,
    isDefault: true,
  });

  const pertanyaan10 = await pertanyaanRepo.save({
    groupId: groupPresentasiSidang.id,
    text: "Presentasi dan kemampuan menjawab",
    bobot: 30.0,
    urutan: 1,
  });

  await opsiJawabanRepo.save([
    {
      pertanyaanId: pertanyaan10.id,
      text: "Sangat Baik",
      nilai: 4.0,
      urutan: 1,
    },
    { pertanyaanId: pertanyaan10.id, text: "Baik", nilai: 3.0, urutan: 2 },
    { pertanyaanId: pertanyaan10.id, text: "Cukup", nilai: 2.0, urutan: 3 },
    { pertanyaanId: pertanyaan10.id, text: "Kurang", nilai: 1.0, urutan: 4 },
  ]);

  // ==================== PENILAIAN UNTUK MAHASISWA 5 (H+5) ====================
  console.log(
    "Creating assessments for Student 5 (completed proposal defense)..."
  );

  // Ambil semua pertanyaan untuk rubrik seminar
  const allPertanyaanSeminar = await pertanyaanRepo.find({
    where: { group: { rubrikId: rubrikSeminar.id } },
    relations: ["opsiJawabans"],
  });

  // Penilaian dari Pembimbing 1
  const penilaian5Pem1 = await penilaianRepo.save({
    jadwalId: defenseSchedule5.id,
    lecturerId: lecturer1.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Presentasi bagus, metodologi sudah sesuai",
    nilaiAkhir: 85.5,
    isFinalized: true,
  });

  // Jawaban untuk setiap pertanyaan
  for (const pertanyaan of allPertanyaanSeminar) {
    const opsi = pertanyaan.opsiJawabans[0]; // Pilih opsi terbaik
    await jawabanPenilaianRepo.save({
      penilaianId: penilaian5Pem1.id,
      pertanyaanId: pertanyaan.id,
      opsiJawabanId: opsi.id,
      nilai: opsi.nilai,
    });
  }

  // Penilaian dari Pembimbing 2
  const penilaian5Pem2 = await penilaianRepo.save({
    jadwalId: defenseSchedule5.id,
    lecturerId: lecturer5.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Tinjauan pustaka perlu ditambah referensi terbaru",
    nilaiAkhir: 82.0,
    isFinalized: true,
  });

  for (const pertanyaan of allPertanyaanSeminar) {
    const opsi = pertanyaan.opsiJawabans[1]; // Pilih opsi kedua
    await jawabanPenilaianRepo.save({
      penilaianId: penilaian5Pem2.id,
      pertanyaanId: pertanyaan.id,
      opsiJawabanId: opsi.id,
      nilai: opsi.nilai,
    });
  }

  // Penilaian dari Penguji 1
  const penilaian5Exam1 = await penilaianRepo.save({
    jadwalId: defenseSchedule5.id,
    lecturerId: lecturer3.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Sangat baik, keep up the good work",
    nilaiAkhir: 88.0,
    isFinalized: true,
  });

  for (const pertanyaan of allPertanyaanSeminar) {
    const opsi = pertanyaan.opsiJawabans[0];
    await jawabanPenilaianRepo.save({
      penilaianId: penilaian5Exam1.id,
      pertanyaanId: pertanyaan.id,
      opsiJawabanId: opsi.id,
      nilai: opsi.nilai,
    });
  }

  // Penilaian dari Penguji 2
  const penilaian5Exam2 = await penilaianRepo.save({
    jadwalId: defenseSchedule5.id,
    lecturerId: lecturer4.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Baik, lanjutkan ke tahap implementasi",
    nilaiAkhir: 84.5,
    isFinalized: true,
  });

  for (const pertanyaan of allPertanyaanSeminar) {
    const opsi = pertanyaan.opsiJawabans[0];
    await jawabanPenilaianRepo.save({
      penilaianId: penilaian5Exam2.id,
      pertanyaanId: pertanyaan.id,
      opsiJawabanId: opsi.id,
      nilai: opsi.nilai,
    });
  }

  // ==================== PENILAIAN UNTUK MAHASISWA 1 (SIDANG PROPOSAL SUDAH SELESAI) ====================
  console.log("Creating assessments for Student 1 (completed proposal)...");

  // Penilaian Seminar Proposal Mahasiswa 1
  const penilaian1Pem1 = await penilaianRepo.save({
    jadwalId: defenseSchedule1Proposal.id,
    lecturerId: lecturer1.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Proposal sangat baik, sistem rekomendasi menarik",
    nilaiAkhir: 87.0,
    isFinalized: true,
  });

  for (const pertanyaan of allPertanyaanSeminar) {
    const opsi = pertanyaan.opsiJawabans[0];
    await jawabanPenilaianRepo.save({
      penilaianId: penilaian1Pem1.id,
      pertanyaanId: pertanyaan.id,
      opsiJawabanId: opsi.id,
      nilai: opsi.nilai,
    });
  }

  await penilaianRepo.save({
    jadwalId: defenseSchedule1Proposal.id,
    lecturerId: lecturer2.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Dataset perlu diperbesar untuk hasil lebih akurat",
    nilaiAkhir: 83.0,
    isFinalized: true,
  });

  await penilaianRepo.save({
    jadwalId: defenseSchedule1Proposal.id,
    lecturerId: lecturer3.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Presentasi sangat komunikatif",
    nilaiAkhir: 89.0,
    isFinalized: true,
  });

  await penilaianRepo.save({
    jadwalId: defenseSchedule1Proposal.id,
    lecturerId: lecturer4.id,
    rubrikId: rubrikSeminar.id,
    catatan: "Metodologi sudah tepat",
    nilaiAkhir: 85.0,
    isFinalized: true,
  });

  console.log("✅ Dummy data seeding completed successfully!");
  console.log("=".repeat(50));
  console.log("Summary:");
  console.log("- 6 Students with final projects");
  console.log("- Student 1: Completed proposal, doing hasil guidance");
  console.log("- Student 2: Approved for scheduling, waiting for schedule");
  console.log(
    "- Student 3: Currently doing proposal guidance (not enough yet)"
  );
  console.log("- Student 4: Scheduled for proposal defense (H+10)");
  console.log("- Student 5: Completed proposal defense (H+5) with assessments");
  console.log("- Student 6: Scheduled for hasil defense (H+15)");
  console.log("- 2 Rubrics: Seminar (SEM) and Sidang (SID)");
  console.log("- Assessment data for completed defenses");
  console.log("=".repeat(50));
}

// Run as standalone script
async function runSeed() {
  try {
    console.log("🚀 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected successfully!");

    console.log("\n📊 Starting dummy data seeding...\n");
    await seedDummyData(AppDataSource);

    console.log("\n✅ Seed completed! Closing database connection...");
    await AppDataSource.destroy();
    console.log("✅ Connection closed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  runSeed();
}
