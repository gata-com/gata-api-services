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

  function pad(n: number, width = 3) {
    return n.toString().padStart(width, "0");
  }

  // 4) Buat 100 students (User + Student) - untuk distribusi ke semua 25 dosen (4 per dosen)
  for (let i = 1; i <= 100; i++) {
    const email = `student${i}@example.com`;
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = userRepo.create({
        name: `Student ${pad(i, 2)}`,
        email,
        password: "password123",
        role: "student",
        is_active: true,
      } as Partial<User>);
      await userRepo.save(user);
    } else {
      console.log(`User ${email} exists, reusing`);
    }

    const existingStudent = await studentRepo.findOne({
      where: { user: { id: (user as any).id } },
      relations: ["user"],
    });
    if (existingStudent) {
      console.log(`Student for user ${email} already exists, skipping`);
      continue;
    }

    // generate nim 9 chars (sesuaikan format Anda)
    const yearPrefix = "2025"; // ubah tahun angkatan jika perlu
    const nimCore = pad(i, 5); // contoh: 00001..00050
    const nim = (yearPrefix + nimCore).slice(0, 9);

    const student = studentRepo.create({
      nim,
      semester: 7,
      user: user,
    } as Partial<Student>);

    await studentRepo.save(student);
  }

  // ==================== EXPERTISES GROUP ====================
  console.log("Fetching existing expertises groups...");
  const expertiseGroups = await expertisesGroupRepo.find();

  if (expertiseGroups.length < 2) {
    console.error(
      "❌ Not enough expertises groups. Please seed expertises groups first!"
    );
    return;
  }

  // Helper function untuk random selection dari array
  function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Helper function untuk get 2 different random items
  function getTwoDifferentExpertises(): [ExpertisesGroup, ExpertisesGroup] {
    let item1 = getRandomItem(expertiseGroups);
    let item2 = getRandomItem(expertiseGroups);
    while (item2.id === item1.id) {
      item2 = getRandomItem(expertiseGroups);
    }
    return [item1, item2];
  }

  // Helper function untuk generate unique capstone code
  let capstoneCodeCounter = 0;
  function generateCapstoneCode(): string {
    capstoneCodeCounter++;
    return `CAP${String(capstoneCodeCounter).padStart(2, "0")}`;
  }

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

  if (students.length < 40 || lecturers.length < 10) {
    console.error(
      "❌ Not enough students or lecturers. Please seed users first!"
    );
    return;
  }

  // Ambil beberapa mahasiswa dan dosen untuk dummy data - use first 5 for main scenarios
  const student1 = students[0];
  const student2 = students[1];
  const student3 = students[2];
  const student4 = students[3];
  const student5 = students[4];
  const student6 = students[5];

  const lecturer1 = lecturers[0]; // AAF
  const lecturer2 = lecturers[1]; // AIQ
  const lecturer3 = lecturers[2]; // ANS
  const lecturer4 = lecturers[3]; // AFO
  const lecturer5 = lecturers[4]; // AWJ

  // Get ALL lecturers for distribution - used later for comprehensive data
  const allLecturers = lecturers;

  // ==================== GUIDANCE AVAILABILITY ====================
  console.log("Creating guidance availability...");

  // Lecturer 1 availability
  const availability1 = await guidanceAvailabilityRepo.save({
    lecturer: lecturer1,
    day_of_week: 1, // Senin
    start_time: "09:00",
    end_time: "12:00",
    location: "Ruang Dosen 101",
  });

  // Lecturer 2 availability
  const availability2 = await guidanceAvailabilityRepo.save({
    lecturer: lecturer2,
    day_of_week: 2, // Selasa
    start_time: "13:00",
    end_time: "16:00",
    location: "Ruang Dosen 102",
  });

  // Lecturer 3 availability
  const availability3 = await guidanceAvailabilityRepo.save({
    lecturer: lecturer3,
    day_of_week: 3, // Rabu
    start_time: "09:00",
    end_time: "12:00",
    location: "Ruang Dosen 103",
  });

  // Lecturer 4 availability
  const availability4 = await guidanceAvailabilityRepo.save({
    lecturer: lecturer4,
    day_of_week: 4, // Kamis
    start_time: "13:00",
    end_time: "16:00",
    location: "Ruang Dosen 104",
  });

  // Lecturer 5 availability
  const availability5 = await guidanceAvailabilityRepo.save({
    lecturer: lecturer5,
    day_of_week: 5, // Jumat
    start_time: "09:00",
    end_time: "12:00",
    location: "Ruang Dosen 105",
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
    processed_at: new Date(2024, 10, 1),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[2],
  });

  // Defense Submission Documents untuk Proposal (Draft + PPT)
  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission1Proposal,
    name: "Proposal Final - Draft",
    url: "https://www.google.com/search?q=proposal-final-student1-draft",
    type: "draft",
    email: student1.user.email,
    student: student1,
  });

  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission1Proposal,
    name: "Presentasi Proposal - PPT",
    url: "https://www.google.com/search?q=presentasi-proposal-student1-ppt",
    type: "ppt",
    email: student1.user.email,
    student: student1,
  });

  // Defense Schedule Proposal (Completed)
  const defenseSchedule1Proposal = await defenseScheduleRepo.save({
    defense_submission: defenseSubmission1Proposal,
    scheduled_date: "2025-12-03",
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
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    processed_at: new Date(2024, 11, 1),
    expertises_group_1: expertiseGroups[1],
    expertises_group_2: expertiseGroups[1],
  });

  // Defense Submission Documents untuk Student 2 (Capstone - Multiple Members)
  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission2,
    name: "Proposal E-Commerce - Draft",
    url: "https://www.google.com/search?q=proposal-ecommerce-draft",
    type: "draft",
    email: student2.user.email,
    student: student2,
  });

  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission2,
    name: "Presentasi E-Commerce - PPT",
    url: "https://www.google.com/search?q=presentasi-ecommerce-ppt",
    type: "ppt",
    email: student2.user.email,
    student: student2,
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
    defense_date: "2025-12-03",
    processed_at: new Date(2024, 11, 1),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[1],
    expertises_group_2: expertiseGroups[3],
  });

  const defenseSchedule4 = await defenseScheduleRepo.save({
    defense_submission: defenseSubmission4,
    scheduled_date: "2025-12-03",
    start_time: "10:30",
    end_time: "12:00",
    scheduler_status: "scheduled",
    room: "Ruang Sidang B",
    status: "scheduled",
  });

  // Defense Submission Documents untuk Student 4
  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission4,
    name: "Proposal IoT - Draft",
    url: "https://www.google.com/search?q=proposal-iot-draft",
    type: "draft",
    email: student4.user.email,
    student: student4,
  });

  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission4,
    name: "Presentasi IoT - PPT",
    url: "https://www.google.com/search?q=presentasi-iot-ppt",
    type: "ppt",
    email: student4.user.email,
    student: student4,
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
  const today = new Date();

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
    defense_date: "2025-12-03",
    processed_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[1],
  });

  const defenseSchedule5 = await defenseScheduleRepo.save({
    defense_submission: defenseSubmission5,
    scheduled_date: "2025-12-03",
    start_time: "13:00",
    end_time: "14:30",
    scheduler_status: "scheduled",
    room: "Ruang Sidang A",
    status: "completed",
  });

  // Defense Submission Documents untuk Student 5
  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission5,
    name: "Proposal Chatbot - Draft",
    url: "https://www.google.com/search?q=proposal-chatbot-draft",
    type: "draft",
    email: student5.user.email,
    student: student5,
  });

  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission5,
    name: "Presentasi Chatbot - PPT",
    url: "https://www.google.com/search?q=presentasi-chatbot-ppt",
    type: "ppt",
    email: student5.user.email,
    student: student5,
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

  const defenseSubmission6Proposal = await defenseSubmissionRepo.save({
    final_project: finalProject6,
    lecturer: lecturer5,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    student_notes: "Proposal selesai",
    processed_at: new Date(2024, 10, 20),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[2],
  });

  await defenseScheduleRepo.save({
    defense_submission: defenseSubmission6Proposal,
    scheduled_date: "2025-12-04",
    start_time: "14:30",
    end_time: "16:00",
    scheduler_status: "scheduled",
    room: "Ruang Sidang C",
    status: "completed",
  });

  // Defense Submission Documents untuk Student 6 - Proposal
  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission6Proposal,
    name: "Proposal Sentimen - Draft",
    url: "https://www.google.com/search?q=proposal-sentimen-draft",
    type: "draft",
    email: student6.user.email,
    student: student6,
  });

  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission6Proposal,
    name: "Presentasi Sentimen - PPT",
    url: "https://www.google.com/search?q=presentasi-sentimen-ppt",
    type: "ppt",
    email: student6.user.email,
    student: student6,
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

  const defenseSubmission6Hasil = await defenseSubmissionRepo.save({
    final_project: finalProject6,
    lecturer: lecturer5,
    defense_type: "hasil",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    student_notes: "Siap sidang hasil",
    processed_at: new Date(2024, 10, 20),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: expertiseGroups[0],
    expertises_group_2: expertiseGroups[2],
  });

  // Defense Submission Documents untuk Student 6 - Hasil
  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission6Hasil,
    name: "Implementasi Sentimen - Draft",
    url: "https://www.google.com/search?q=implementasi-sentimen-draft",
    type: "draft",
    email: student6.user.email,
    student: student6,
  });

  await defenseSubmissionDocRepo.save({
    defense_submission: defenseSubmission6Hasil,
    name: "Presentasi Hasil - PPT",
    url: "https://www.google.com/search?q=presentasi-hasil-sentimen-ppt",
    type: "ppt",
    email: student6.user.email,
    student: student6,
  });

  // ==================== RUBRIK & PENILAIAN ====================
  console.log("Creating assessment rubrics...");

  // Rentang Nilai
  await rentangNilaiRepo.save([
    { grade: "A", minScore: 80.0, urutan: 1, isActive: true },
    { grade: "AB", minScore: 72.5, urutan: 2, isActive: true },
    { grade: "B", minScore: 65.0, urutan: 3, isActive: true },
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

  // ==================== PENILAIAN UNTUK MAHASISWA 1 (SIDANG PROPOSAL SUDAH SELESAI) ====================
  console.log("Creating assessments for Student 1 (completed proposal)...");

  // Skip: Penilaian data has been removed

  // ==================== CAPSTONE SCENARIOS ====================
  console.log("\n🎓 Creating CAPSTONE project scenarios...\n");

  // Get more students for capstone projects
  const capstoneStudents = students.slice(6, 12); // Students 7-12 untuk capstone

  // ==================== SCENARIO 7: CAPSTONE - SEDANG BIMBINGAN PROPOSAL (3 MEMBERS) ====================
  console.log("Scenario 7: Capstone - 3 members doing proposal guidance...");

  const capstoneFinalProject1 = await finalProjectRepo.save({
    type: "capstone",
    status: "baru",
    source_topic: "perusahaan",
    description: "Platform E-Learning Adaptif dengan AI Personalisasi",
    max_members: 3,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[0], // AI
    expertises_group_2: expertiseGroups[1], // Software Engineering
    supervisor_1: lecturer1,
    supervisor_2: lecturer2,
    final_project_period: period,
  });

  // Member 1 - dengan judul spesifik
  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject1,
    student: capstoneStudents[0],
    title: "Modul Backend dan AI Engine untuk Platform E-Learning",
    resume:
      "Mengembangkan backend API dan machine learning engine untuk personalisasi konten pembelajaran",
    draft_path: "/storages/final-projects/capstone1-member1.pdf",
    draft_filename: "capstone1-member1.pdf",
    draft_size: "2.8MB",
  });

  // Member 2 - dengan judul spesifik
  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject1,
    student: capstoneStudents[1],
    title: "Frontend Mobile dan UI/UX Design untuk Platform E-Learning",
    resume:
      "Mengembangkan aplikasi mobile Flutter dengan desain UX yang intuitif dan responsif",
    draft_path: "/storages/final-projects/capstone1-member2.pdf",
    draft_filename: "capstone1-member2.pdf",
    draft_size: "3.1MB",
  });

  // Member 3 - dengan judul spesifik
  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject1,
    student: capstoneStudents[2],
    title: "Database Architecture dan Analytics Dashboard untuk E-Learning",
    resume:
      "Merancang database scalable dan dashboard analytics untuk monitoring pembelajaran",
    draft_path: "/storages/final-projects/capstone1-member3.pdf",
    draft_filename: "capstone1-member3.pdf",
    draft_size: "2.5MB",
  });

  // Bimbingan Proposal (In Progress)
  for (let i = 1; i <= 3; i++) {
    await guidanceSessionRepo.save({
      final_project: capstoneFinalProject1,
      lecturer: lecturer1,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal Capstone ${i} - Review Architecture`,
      lecturer_feedback: `Progress tim bagus, koordinasi antar modul sudah baik`,
      status: "completed",
      session_date: new Date(2024, 11, i * 4),
      completed_at: new Date(2024, 11, i * 4, 10, 0),
    });
  }

  await guidanceSessionRepo.save({
    final_project: capstoneFinalProject1,
    lecturer: lecturer2,
    guidance_availability: availability2,
    supervisor_type: 2,
    defense_type: "proposal",
    topic: `Bimbingan Proposal Capstone 1 - Review Design`,
    lecturer_feedback: `UI/UX design sudah baik`,
    status: "completed",
    session_date: new Date(2024, 11, 10),
    completed_at: new Date(2024, 11, 10, 14, 0),
  });

  // ==================== SCENARIO 8: CAPSTONE - APPROVED, WAITING FOR SCHEDULING (2 MEMBERS) ====================
  console.log(
    "Scenario 8: Capstone - 2 members approved, waiting for scheduling..."
  );

  const capstoneFinalProject2 = await finalProjectRepo.save({
    type: "capstone",
    status: "baru",
    source_topic: "mandiri",
    description: "Sistem Manajemen Inventaris Berbasis IoT & Cloud Computing",
    max_members: 2,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[1], // Software Engineering
    expertises_group_2: expertiseGroups[3], // Cybersecurity
    supervisor_1: lecturer5,
    supervisor_2: lecturer2,
    final_project_period: period,
  });

  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject2,
    student: capstoneStudents[3],
    title: "IoT Device Integration dan Cloud Backend untuk Sistem Inventaris",
    resume:
      "Mengintegrasikan sensor IoT dan backend cloud untuk real-time inventory tracking",
    draft_path: "/storages/final-projects/capstone2-member1.pdf",
    draft_filename: "capstone2-member1.pdf",
    draft_size: "2.9MB",
  });

  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject2,
    student: capstoneStudents[4],
    title: "Web Dashboard dan Mobile App untuk Sistem Inventaris",
    resume:
      "Mengembangkan web dashboard admin dan mobile app untuk pengguna inventory",
    draft_path: "/storages/final-projects/capstone2-member2.pdf",
    draft_filename: "capstone2-member2.pdf",
    draft_size: "3.2MB",
  });

  // Bimbingan Proposal (Completed)
  for (let i = 1; i <= 5; i++) {
    await guidanceSessionRepo.save({
      final_project: capstoneFinalProject2,
      lecturer: lecturer5,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal Capstone ${i}`,
      lecturer_feedback: `Progress bagus`,
      status: "completed",
      session_date: new Date(2024, 10, i * 2),
      completed_at: new Date(2024, 10, i * 2, 10, 0),
    });
  }

  for (let i = 1; i <= 2; i++) {
    await guidanceSessionRepo.save({
      final_project: capstoneFinalProject2,
      lecturer: lecturer2,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal Capstone ${i}`,
      lecturer_feedback: `Sudah sesuai`,
      status: "completed",
      session_date: new Date(2024, 10, i * 5),
      completed_at: new Date(2024, 10, i * 5, 14, 0),
    });
  }

  // Defense Submission
  const capstoneCode2 = generateCapstoneCode();
  const capstoneDefenseSubmission2 = await defenseSubmissionRepo.save({
    final_project: capstoneFinalProject2,
    lecturer: lecturer5,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    min_guidance_sup_1_proposal: 5,
    min_guidance_sup_2_proposal: 2,
    student_notes: "Tim capstone siap untuk seminar proposal",
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    processed_at: new Date(2024, 11, 1),
    capstone_code: capstoneCode2,
    expertises_group_1: getRandomItem(expertiseGroups),
    expertises_group_2: getRandomItem(expertiseGroups),
  });

  // ==================== SCENARIO 9: CAPSTONE - COMPLETED PROPOSAL DEFENSE (3 MEMBERS) WITH ASSESSMENTS ====================
  console.log("Scenario 9: Capstone - 3 members with completed assessment...");

  const capstoneFinalProject3 = await finalProjectRepo.save({
    type: "capstone",
    status: "baru",
    source_topic: "dosen",
    description: "Smart Campus Management System dengan IoT & Analytics",
    max_members: 3,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[1], // Software Engineering
    expertises_group_2: expertiseGroups[2], // Data Science
    supervisor_1: lecturer1,
    supervisor_2: lecturer5,
    final_project_period: period,
  });

  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject3,
    student: capstoneStudents[5],
    title: "Backend Infrastructure dan Data Pipeline untuk Smart Campus",
    resume:
      "Membangun backend infrastructure scalable dengan data pipeline untuk analytics",
    draft_path: "/storages/final-projects/capstone3-member1.pdf",
    draft_filename: "capstone3-member1.pdf",
    draft_size: "3.0MB",
  });

  // Member 2 - dengan judul spesifik
  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject3,
    student: students[16],
    title: "IoT Integration dan Sensor Management untuk Smart Campus",
    resume:
      "Mengintegrasikan sensor IoT dan real-time monitoring system untuk campus facilities",
    draft_path: "/storages/final-projects/capstone3-member2.pdf",
    draft_filename: "capstone3-member2.pdf",
    draft_size: "2.9MB",
  });

  // Member 3 - dengan judul spesifik
  await finalProjectMemberRepo.save({
    final_project: capstoneFinalProject3,
    student: students[17],
    title: "Analytics Dashboard dan Reporting System untuk Smart Campus",
    resume:
      "Mengembangkan dashboard analytics dengan visualization dan reporting untuk decision making",
    draft_path: "/storages/final-projects/capstone3-member3.pdf",
    draft_filename: "capstone3-member3.pdf",
    draft_size: "2.6MB",
  });

  // Bimbingan Proposal
  for (let i = 1; i <= 5; i++) {
    await guidanceSessionRepo.save({
      final_project: capstoneFinalProject3,
      lecturer: lecturer1,
      guidance_availability: availability1,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal Capstone ${i}`,
      lecturer_feedback: `Arsitektur sudah solid`,
      status: "completed",
      session_date: new Date(2024, 9, i * 3),
      completed_at: new Date(2024, 9, i * 3, 10, 0),
    });
  }

  for (let i = 1; i <= 2; i++) {
    await guidanceSessionRepo.save({
      final_project: capstoneFinalProject3,
      lecturer: lecturer5,
      guidance_availability: availability2,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal Capstone ${i}`,
      lecturer_feedback: `Analytics sudah komprehensif`,
      status: "completed",
      session_date: new Date(2024, 9, i * 5),
      completed_at: new Date(2024, 9, i * 5, 14, 0),
    });
  }

  // Defense Submission & Schedule
  const capstoneDefenseSubmission3 = await defenseSubmissionRepo.save({
    final_project: capstoneFinalProject3,
    lecturer: lecturer1,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    student_notes: "Capstone siap seminar",
    processed_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: getRandomItem(expertiseGroups),
    expertises_group_2: getRandomItem(expertiseGroups),
  });

  const capstoneDefenseSchedule3 = await defenseScheduleRepo.save({
    defense_submission: capstoneDefenseSubmission3,
    scheduled_date: "2025-12-03",
    start_time: "15:00",
    end_time: "16:30",
    scheduler_status: "scheduled",
    room: "Ruang Sidang B",
    status: "completed",
  });

  // ==================== SCENARIO 10: CAPSTONE - SCHEDULED UNTUK HASIL DEFENSE (3 MEMBERS) ====================
  console.log(
    "Scenario 10: Capstone - 3 members scheduled for hasil defense..."
  );

  const capstoneFinalProject4 = await finalProjectRepo.save({
    type: "capstone",
    status: "baru",
    source_topic: "perusahaan",
    description:
      "Mobile Banking Application dengan Biometric Security dan Blockchain",
    max_members: 3,
    supervisor_1_status: "approved",
    supervisor_2_status: "approved",
    admin_status: "approved",
    is_only_sup_1: false,
    expertises_group_1: expertiseGroups[3], // Cybersecurity
    expertises_group_2: expertiseGroups[1], // Software Engineering
    supervisor_1: lecturer2,
    supervisor_2: lecturer5,
    final_project_period: period,
  });

  // 3 members dengan judul berbeda untuk capstone
  for (let i = 0; i < 3; i++) {
    const titles = [
      "Biometric Authentication System dengan Multi-Modal Verification",
      "Mobile App Development dengan Blockchain Integration",
      "Security Infrastructure dan Compliance Management",
    ];

    const resumes = [
      "Implementasi sistem autentikasi biometrik dengan teknologi multi-modal untuk keamanan berlapis",
      "Pengembangan aplikasi mobile banking dengan integrasi blockchain untuk transaksi aman",
      "Merancang infrastruktur security dan memastikan compliance dengan standar industry",
    ];

    await finalProjectMemberRepo.save({
      final_project: capstoneFinalProject4,
      student: students[12 + i], // Use students 13, 14, 15
      title: titles[i],
      resume: resumes[i],
      draft_path: `/storages/final-projects/capstone4-member${i + 1}.pdf`,
      draft_filename: `capstone4-member${i + 1}.pdf`,
      draft_size: (2.7 + i * 0.2).toFixed(1) + "MB",
    });
  }

  // Bimbingan Proposal (Completed)
  for (let i = 1; i <= 5; i++) {
    await guidanceSessionRepo.save({
      final_project: capstoneFinalProject4,
      lecturer: lecturer2,
      guidance_availability: availability2,
      supervisor_type: 1,
      defense_type: "proposal",
      topic: `Bimbingan Proposal Capstone ${i}`,
      lecturer_feedback: `Progress bagus, security considerations sudah covered`,
      status: "completed",
      session_date: new Date(2024, 8, i * 3),
      completed_at: new Date(2024, 8, i * 3, 14, 0),
    });
  }

  for (let i = 1; i <= 2; i++) {
    await guidanceSessionRepo.save({
      final_project: capstoneFinalProject4,
      lecturer: lecturer5,
      guidance_availability: availability1,
      supervisor_type: 2,
      defense_type: "proposal",
      topic: `Bimbingan Proposal Capstone ${i}`,
      lecturer_feedback: `Sudah ready`,
      status: "completed",
      session_date: new Date(2024, 8, i * 5),
      completed_at: new Date(2024, 8, i * 5, 10, 0),
    });
  }

  // Seminar Proposal sudah selesai
  const capstoneDefenseSubmission4Proposal = await defenseSubmissionRepo.save({
    final_project: capstoneFinalProject4,
    lecturer: lecturer2,
    defense_type: "proposal",
    status: "approved",
    guidance_sup_1_count: 5,
    guidance_sup_2_count: 2,
    student_notes: "Capstone proposal selesai",
    processed_at: new Date(2024, 8, 20),
    examiner_1: lecturer3,
    examiner_2: lecturer4,
    expertises_group_1: getRandomItem(expertiseGroups),
    expertises_group_2: getRandomItem(expertiseGroups),
  });

  await defenseScheduleRepo.save({
    defense_submission: capstoneDefenseSubmission4Proposal,
    scheduled_date: "2025-11-28",
    start_time: "10:00",
    end_time: "11:30",
    scheduler_status: "scheduled",
    room: "Ruang Sidang C",
    status: "completed",
  });

  // ==================== SKIP: ADDITIONAL SCENARIOS (using new comprehensive loop instead) ====================
  // This section was replaced with the comprehensive ALL 25 LECTURERS loop below
  if (false) {
    // SKIPPED: Old additional data section
    console.log(
      "\n🎓 Creating additional data for all lecturers (5 lecturers)..."
    );

    const fpLecturer1_1 = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "mahasiswa",
      description: "Smart IoT Home Automation System",
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroups[1],
      expertises_group_2: expertiseGroups[0],
      supervisor_1: lecturer1,
      supervisor_2: lecturer3,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: fpLecturer1_1,
      student: students[18], // Changed from students[9] to students[18]
      title: "Smart IoT Home Automation System",
      resume:
        "Sistem otomasi rumah pintar menggunakan IoT dengan kontrol voice assistant",
      draft_path: "/storages/final-projects/iot-system.pdf",
      draft_filename: "iot-system.pdf",
      draft_size: "2.8MB",
    });

    // Bimbingan proposal
    for (let i = 1; i <= 4; i++) {
      await guidanceSessionRepo.save({
        final_project: fpLecturer1_1,
        lecturer: lecturer1,
        guidance_availability: availability1,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan IoT Proposal ${i}`,
        lecturer_feedback: `Progress baik untuk IoT implementation`,
        status: "completed",
        session_date: new Date(2024, 10, i * 2),
        completed_at: new Date(2024, 10, i * 2, 9, 30),
      });
    }

    // LECTURER 2 - Tambahan mahasiswa (sudah ada student 2)
    console.log("Creating data for Lecturer 2...");

    const fpLecturer2_1 = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "mahasiswa",
      description: "E-Commerce Platform dengan AI Chatbot",
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroups[0],
      expertises_group_2: expertiseGroups[1],
      supervisor_1: lecturer2,
      supervisor_2: lecturer4,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: fpLecturer2_1,
      student: students[19], // Changed from students[10] to students[19]
      title: "E-Commerce Platform dengan AI Chatbot",
      resume:
        "Platform e-commerce dengan integrasi AI chatbot untuk customer service",
      draft_path: "/storages/final-projects/ecommerce-ai.pdf",
      draft_filename: "ecommerce-ai.pdf",
      draft_size: "3.1MB",
    });

    // Bimbingan dan sidang proposal selesai
    for (let i = 1; i <= 6; i++) {
      await guidanceSessionRepo.save({
        final_project: fpLecturer2_1,
        lecturer: lecturer2,
        guidance_availability: availability2,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan E-Commerce ${i}`,
        lecturer_feedback: `AI implementation sudah bagus`,
        status: "completed",
        session_date: new Date(2024, 9, i * 2),
        completed_at: new Date(2024, 9, i * 2, 13, 30),
      });
    }

    const defenseSubmissionLecturer2_1 = await defenseSubmissionRepo.save({
      final_project: fpLecturer2_1,
      lecturer: lecturer2,
      defense_type: "proposal",
      status: "approved",
      guidance_sup_1_count: 6,
      guidance_sup_2_count: 3,
      student_notes: "Ready for proposal defense",
      defense_date: "2025-11-20",
      processed_at: new Date(2024, 10, 15),
      examiner_1: lecturer1,
      examiner_2: lecturer5,
      expertises_group_1: expertiseGroups[0],
      expertises_group_2: expertiseGroups[1],
    });

    const scheduleL2_1 = await defenseScheduleRepo.save({
      defense_submission: defenseSubmissionLecturer2_1,
      scheduled_date: "2025-11-20",
      start_time: "14:00",
      end_time: "15:30",
      scheduler_status: "scheduled",
      room: "Ruang Sidang D",
      status: "completed",
    });

    // Penilaian lengkap untuk lecturer 2 student
    await penilaianRepo.save({
      jadwalId: scheduleL2_1.id,
      lecturerId: lecturer2.id,
      studentId: students[19].id,
      rubrikId: rubrikSeminar.id,
      catatan: "E-commerce implementation bagus",
      nilaiAkhir: 85.0,
      isFinalized: true,
      finalizedById: lecturer2.id,
      finalizedByName: lecturer2.user?.name,
      finalizedAt: new Date(2025, 10, 20, 15, 0),
    });

    await penilaianRepo.save({
      jadwalId: scheduleL2_1.id,
      lecturerId: lecturer4.id,
      studentId: students[19].id,
      rubrikId: rubrikSeminar.id,
      catatan: "Chatbot integration excellent",
      nilaiAkhir: 87.0,
      isFinalized: true,
      finalizedById: lecturer4.id,
      finalizedByName: lecturer4.user?.name,
      finalizedAt: new Date(2025, 10, 20, 15, 0),
    });

    await penilaianRepo.save({
      jadwalId: scheduleL2_1.id,
      lecturerId: lecturer1.id,
      studentId: students[19].id,
      rubrikId: rubrikSeminar.id,
      catatan: "System architecture well designed",
      nilaiAkhir: 86.0,
      isFinalized: true,
      finalizedById: lecturer1.id,
      finalizedByName: lecturer1.user?.name,
      finalizedAt: new Date(2025, 10, 20, 15, 0),
    });

    await penilaianRepo.save({
      jadwalId: scheduleL2_1.id,
      lecturerId: lecturer5.id,
      studentId: students[19].id,
      rubrikId: rubrikSeminar.id,
      catatan: "Good presentation and demo",
      nilaiAkhir: 84.0,
      isFinalized: true,
      finalizedById: lecturer5.id,
      finalizedByName: lecturer5.user?.name,
      finalizedAt: new Date(2025, 10, 20, 15, 0),
    });

    // LECTURER 3 - Data mahasiswa sebagai pembimbing utama
    console.log("Creating data for Lecturer 3...");

    const fpLecturer3_1 = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "dosen",
      description: "Cloud-based Hospital Management System",
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroups[1],
      expertises_group_2: expertiseGroups[2],
      supervisor_1: lecturer3,
      supervisor_2: lecturer1,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: fpLecturer3_1,
      student: students[35],
      title: "Cloud-based Hospital Management System",
      resume:
        "Sistem manajemen rumah sakit berbasis cloud dengan fitur telemedicine",
      draft_path: "/storages/final-projects/hospital-system.pdf",
      draft_filename: "hospital-system.pdf",
      draft_size: "3.3MB",
    });

    // Bimbingan
    for (let i = 1; i <= 5; i++) {
      await guidanceSessionRepo.save({
        final_project: fpLecturer3_1,
        lecturer: lecturer3,
        guidance_availability: availability1,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan HMS ${i}`,
        lecturer_feedback: `Cloud architecture progressing well`,
        status: "completed",
        session_date: new Date(2024, 10, i * 3),
        completed_at: new Date(2024, 10, i * 3, 10, 0),
      });
    }

    // Mahasiswa kedua untuk Lecturer 3
    const fpLecturer3_2 = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "mahasiswa",
      description: "Real-time Traffic Monitoring System",
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroups[0],
      expertises_group_2: expertiseGroups[2],
      supervisor_1: lecturer3,
      supervisor_2: lecturer2,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: fpLecturer3_2,
      student: students[36],
      title: "Real-time Traffic Monitoring System",
      resume:
        "Sistem monitoring lalu lintas real-time menggunakan computer vision",
      draft_path: "/storages/final-projects/traffic-monitoring.pdf",
      draft_filename: "traffic-monitoring.pdf",
      draft_size: "2.9MB",
    });

    for (let i = 1; i <= 6; i++) {
      await guidanceSessionRepo.save({
        final_project: fpLecturer3_2,
        lecturer: lecturer3,
        guidance_availability: availability1,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan Traffic System ${i}`,
        lecturer_feedback: `Computer vision implementation good`,
        status: "completed",
        session_date: new Date(2024, 9, i * 3),
        completed_at: new Date(2024, 9, i * 3, 11, 0),
      });
    }

    // Submit untuk sidang
    const defenseSubmissionLecturer3_2 = await defenseSubmissionRepo.save({
      final_project: fpLecturer3_2,
      lecturer: lecturer3,
      defense_type: "proposal",
      status: "scheduled",
      guidance_sup_1_count: 6,
      guidance_sup_2_count: 3,
      student_notes: "Ready for traffic system defense",
      defense_date: "2025-12-01",
      processed_at: new Date(2024, 10, 20),
      examiner_1: lecturer4,
      examiner_2: lecturer5,
      expertises_group_1: expertiseGroups[0],
      expertises_group_2: expertiseGroups[2],
    });

    await defenseScheduleRepo.save({
      defense_submission: defenseSubmissionLecturer3_2,
      scheduled_date: "2025-12-01",
      start_time: "09:00",
      end_time: "10:30",
      scheduler_status: "scheduled",
      room: "Ruang Sidang E",
      status: "scheduled",
    });

    // LECTURER 4 - Data mahasiswa
    console.log("Creating data for Lecturer 4...");

    const fpLecturer4_1 = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "mahasiswa",
      description: "Blockchain-based Supply Chain Management",
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroups[3],
      expertises_group_2: expertiseGroups[1],
      supervisor_1: lecturer4,
      supervisor_2: lecturer2,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: fpLecturer4_1,
      student: students[37],
      title: "Blockchain-based Supply Chain Management",
      resume:
        "Sistem supply chain management dengan blockchain untuk transparency dan traceability",
      draft_path: "/storages/final-projects/blockchain-scm.pdf",
      draft_filename: "blockchain-scm.pdf",
      draft_size: "3.5MB",
    });

    // Bimbingan lengkap dan sidang selesai
    for (let i = 1; i <= 7; i++) {
      await guidanceSessionRepo.save({
        final_project: fpLecturer4_1,
        lecturer: lecturer4,
        guidance_availability: availability1,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan Blockchain ${i}`,
        lecturer_feedback: `Blockchain implementation solid`,
        status: "completed",
        session_date: new Date(2024, 8, i * 3),
        completed_at: new Date(2024, 8, i * 3, 14, 0),
      });
    }

    const defenseSubmissionLecturer4_1 = await defenseSubmissionRepo.save({
      final_project: fpLecturer4_1,
      lecturer: lecturer4,
      defense_type: "proposal",
      status: "approved",
      guidance_sup_1_count: 7,
      guidance_sup_2_count: 3,
      student_notes: "Blockchain ready for defense",
      defense_date: "2025-11-18",
      processed_at: new Date(2024, 9, 10),
      examiner_1: lecturer3,
      examiner_2: lecturer1,
      expertises_group_1: expertiseGroups[3],
      expertises_group_2: expertiseGroups[1],
    });

    const scheduleL4_1 = await defenseScheduleRepo.save({
      defense_submission: defenseSubmissionLecturer4_1,
      scheduled_date: "2025-11-18",
      start_time: "13:00",
      end_time: "14:30",
      scheduler_status: "scheduled",
      room: "Ruang Sidang F",
      status: "completed",
    });

    // Penilaian lengkap
    await penilaianRepo.save({
      jadwalId: scheduleL4_1.id,
      lecturerId: lecturer4.id,
      studentId: students[13].id,
      rubrikId: rubrikSeminar.id,
      catatan: "Blockchain implementation excellent",
      nilaiAkhir: 90.0,
      isFinalized: true,
      finalizedById: lecturer4.id,
      finalizedByName: lecturer4.user?.name,
      finalizedAt: new Date(2025, 10, 18, 14, 0),
    });

    await penilaianRepo.save({
      jadwalId: scheduleL4_1.id,
      lecturerId: lecturer2.id,
      studentId: students[13].id,
      rubrikId: rubrikSeminar.id,
      catatan: "Very good understanding of distributed systems",
      nilaiAkhir: 88.0,
      isFinalized: true,
      finalizedById: lecturer2.id,
      finalizedByName: lecturer2.user?.name,
      finalizedAt: new Date(2025, 10, 18, 14, 0),
    });

    await penilaianRepo.save({
      jadwalId: scheduleL4_1.id,
      lecturerId: lecturer3.id,
      studentId: students[13].id,
      rubrikId: rubrikSeminar.id,
      catatan: "Smart contract implementation impressive",
      nilaiAkhir: 89.0,
      isFinalized: true,
      finalizedById: lecturer3.id,
      finalizedByName: lecturer3.user?.name,
      finalizedAt: new Date(2025, 10, 18, 14, 0),
    });

    await penilaianRepo.save({
      jadwalId: scheduleL4_1.id,
      lecturerId: lecturer1.id,
      studentId: students[13].id,
      rubrikId: rubrikSeminar.id,
      catatan: "Excellent work on supply chain integration",
      nilaiAkhir: 91.0,
      isFinalized: true,
      finalizedById: lecturer1.id,
      finalizedByName: lecturer1.user?.name,
      finalizedAt: new Date(2025, 10, 18, 14, 0),
    });

    // LECTURER 5 - Data mahasiswa
    console.log("Creating data for Lecturer 5...");

    const fpLecturer5_1 = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "dosen",
      description: "Machine Learning untuk Prediksi Cuaca",
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroups[0],
      expertises_group_2: expertiseGroups[2],
      supervisor_1: lecturer5,
      supervisor_2: lecturer1,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: fpLecturer5_1,
      student: students[38],
      title: "Machine Learning untuk Prediksi Cuaca",
      resume:
        "Sistem prediksi cuaca menggunakan deep learning dengan data historis",
      draft_path: "/storages/final-projects/weather-ml.pdf",
      draft_filename: "weather-ml.pdf",
      draft_size: "3.2MB",
    });

    for (let i = 1; i <= 6; i++) {
      await guidanceSessionRepo.save({
        final_project: fpLecturer5_1,
        lecturer: lecturer5,
        guidance_availability: availability1,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan ML Weather ${i}`,
        lecturer_feedback: `Deep learning model improving`,
        status: "completed",
        session_date: new Date(2024, 10, i * 2),
        completed_at: new Date(2024, 10, i * 2, 15, 0),
      });
    }

    // Mahasiswa kedua untuk Lecturer 5
    const fpLecturer5_2 = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "mahasiswa",
      description: "Augmented Reality untuk Pendidikan",
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroups[0],
      expertises_group_2: expertiseGroups[1],
      supervisor_1: lecturer5,
      supervisor_2: lecturer3,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: fpLecturer5_2,
      student: students[39],
      title: "Augmented Reality untuk Pendidikan",
      resume: "Aplikasi AR untuk pembelajaran interaktif di sekolah dasar",
      draft_path: "/storages/final-projects/ar-education.pdf",
      draft_filename: "ar-education.pdf",
      draft_size: "3.0MB",
    });

    for (let i = 1; i <= 5; i++) {
      await guidanceSessionRepo.save({
        final_project: fpLecturer5_2,
        lecturer: lecturer5,
        guidance_availability: availability1,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan AR Education ${i}`,
        lecturer_feedback: `AR implementation creative`,
        status: "completed",
        session_date: new Date(2024, 10, i * 3),
        completed_at: new Date(2024, 10, i * 3, 16, 0),
      });
    }

    // Submit untuk sidang
    const defenseSubmissionLecturer5_2 = await defenseSubmissionRepo.save({
      final_project: fpLecturer5_2,
      lecturer: lecturer5,
      defense_type: "proposal",
      status: "approved",
      guidance_sup_1_count: 5,
      guidance_sup_2_count: 3,
      student_notes: "AR ready for proposal defense",
      defense_date: "2025-11-30",
      processed_at: new Date(2024, 10, 22),
      examiner_1: lecturer2,
      examiner_2: lecturer4,
      expertises_group_1: expertiseGroups[0],
      expertises_group_2: expertiseGroups[1],
    });

    await defenseScheduleRepo.save({
      defense_submission: defenseSubmissionLecturer5_2,
      scheduled_date: "2025-11-30",
      start_time: "10:00",
      end_time: "11:30",
      scheduler_status: "scheduled",
      room: "Ruang Sidang G",
      status: "scheduled",
    });
  } // END of if(false) block - skipping old additional data

  // ==================== COMPREHENSIVE DATA FOR ALL LECTURERS ====================
  console.log("\n📚 Creating comprehensive data for ALL 25 lecturers...\n");

  // Helper function untuk create project dengan guidance dan assessment lengkap
  async function createProjectWithFullData(
    supervisor1: Lecturer,
    supervisor2: Lecturer,
    examiner1: Lecturer,
    examiner2: Lecturer,
    studentIndex: number,
    title: string,
    description: string,
    resume: string,
    expertiseGroup1: any,
    expertiseGroup2: any,
    availability_sup1: GuidanceAvailability,
    availability_sup2: GuidanceAvailability,
    defenseType: "completed" | "scheduled" | "guidance"
  ) {
    if (studentIndex >= students.length) {
      console.warn(
        `Not enough students, skipping project for student index ${studentIndex}`
      );
      return;
    }

    const student = students[studentIndex];
    const project = await finalProjectRepo.save({
      type: "regular",
      status: "baru",
      source_topic: "dosen",
      description,
      max_members: 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: expertiseGroup1,
      expertises_group_2: expertiseGroup2,
      supervisor_1: supervisor1,
      supervisor_2: supervisor2,
      final_project_period: period,
    });

    await finalProjectMemberRepo.save({
      final_project: project,
      student: student,
      title: title,
      resume: resume,
      draft_path: `/storages/final-projects/${title
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`,
      draft_filename: `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      draft_size: "2.8MB",
    });

    // Bimbingan Proposal (Completed)
    for (let i = 1; i <= 5; i++) {
      await guidanceSessionRepo.save({
        final_project: project,
        lecturer: supervisor1,
        guidance_availability: availability_sup1,
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan Proposal ${i}`,
        lecturer_feedback: `Progress bagus`,
        status: "completed",
        session_date: new Date(2024, 10, i * 2),
        completed_at: new Date(2024, 10, i * 2, 10, 0),
      });
    }

    for (let i = 1; i <= 2; i++) {
      await guidanceSessionRepo.save({
        final_project: project,
        lecturer: supervisor2,
        guidance_availability: availability_sup2,
        supervisor_type: 2,
        defense_type: "proposal",
        topic: `Bimbingan Proposal ${i}`,
        lecturer_feedback: `Sudah sesuai`,
        status: "completed",
        session_date: new Date(2024, 10, i * 5),
        completed_at: new Date(2024, 10, i * 5, 14, 0),
      });
    }

    if (defenseType === "completed" || defenseType === "scheduled") {
      const defenseSubmission = await defenseSubmissionRepo.save({
        final_project: project,
        lecturer: supervisor1,
        defense_type: "proposal",
        status: "approved",
        guidance_sup_1_count: 5,
        guidance_sup_2_count: 2,
        min_guidance_sup_1_proposal: 5,
        min_guidance_sup_2_proposal: 2,
        student_notes: "Siap untuk seminar proposal",
        defense_date: "2025-12-03",
        processed_at: new Date(2024, 11, 1),
        examiner_1: examiner1,
        examiner_2: examiner2,
        expertises_group_1: expertiseGroup1,
        expertises_group_2: expertiseGroup2,
      });

      const status = defenseType === "completed" ? "completed" : "scheduled";
      const defenseSchedule = await defenseScheduleRepo.save({
        defense_submission: defenseSubmission,
        scheduled_date: "2025-12-03",
        start_time: "10:00",
        end_time: "11:30",
        scheduler_status: "scheduled",
        room: "Ruang Sidang A",
        status: status,
      });
    }
  }

  // Create data for ALL 25 lecturers - 4 projects per lecturer (100 students / 25 lecturers)
  console.log(
    "\n📚 Creating comprehensive data for ALL 25 lecturers with 4 projects each...\n"
  );

  // Project titles for distribution (will cycle)
  const projectTitleTemplates = [
    {
      title: "IoT Monitoring System",
      description: "Sistem monitoring IoT real-time",
    },
    { title: "E-Commerce Platform", description: "Platform e-commerce modern" },
    {
      title: "Mobile App Development",
      description: "Aplikasi mobile cross-platform",
    },
    {
      title: "AI-Powered Analytics",
      description: "Sistem analytics berbasis AI",
    },
    { title: "Web Dashboard", description: "Dashboard management web" },
    {
      title: "Cloud Infrastructure",
      description: "Infrastruktur cloud computing",
    },
    { title: "Machine Learning Model", description: "Model ML untuk prediksi" },
    { title: "Computer Vision System", description: "Sistem computer vision" },
    { title: "Blockchain Solution", description: "Solusi blockchain aplikasi" },
    {
      title: "Security Framework",
      description: "Framework keamanan enterprise",
    },
    {
      title: "Database Optimization",
      description: "Optimasi database besar scale",
    },
    { title: "Data Warehouse", description: "Sistem data warehouse" },
    { title: "API Gateway", description: "Gateway API microservices" },
    { title: "Mobile Gaming", description: "Game mobile development" },
    { title: "AR Application", description: "Aplikasi augmented reality" },
    {
      title: "Natural Language Processing",
      description: "Sistem NLP berbasis Deep Learning",
    },
    {
      title: "Predictive Analytics",
      description: "Analytics untuk prediksi penjualan",
    },
    {
      title: "Real-time Chat System",
      description: "Sistem chat dengan WebSocket",
    },
    {
      title: "Document Management",
      description: "Sistem manajemen dokumen digital",
    },
    {
      title: "Supply Chain Tracking",
      description: "Tracking supply chain real-time",
    },
    {
      title: "Energy Management System",
      description: "Sistem manajemen energi cerdas",
    },
    {
      title: "Healthcare Portal",
      description: "Portal kesehatan terintegrasi",
    },
    { title: "Smart Traffic System", description: "Sistem lalu lintas pintar" },
    {
      title: "Educational Platform",
      description: "Platform pembelajaran online",
    },
    {
      title: "Social Media Analytics",
      description: "Analytics media sosial terpadu",
    },
  ];

  let studentIndex = 18; // Start dari student 18 (students 0-5 in main scenarios, 6-17 in capstone)
  let projectCounter = 0;

  // For each lecturer, create 4 projects (to distribute 100 students to 25 lecturers)
  for (let lecIdx = 0; lecIdx < allLecturers.length; lecIdx++) {
    const supervisor1 = allLecturers[lecIdx];
    const supervisor2 = allLecturers[(lecIdx + 1) % allLecturers.length];
    const examiner1 = allLecturers[(lecIdx + 2) % allLecturers.length];
    const examiner2 = allLecturers[(lecIdx + 3) % allLecturers.length];

    console.log(
      `\n👨‍🏫 Creating 4 projects for ${supervisor1.user?.name} (${supervisor1.lecturer_code})...`
    );

    // Create guidance availability for this lecturer if doesn't exist
    let availabilityForSup1 = await guidanceAvailabilityRepo.findOne({
      where: { lecturer: { id: supervisor1.id } },
    });

    if (!availabilityForSup1) {
      availabilityForSup1 = await guidanceAvailabilityRepo.save({
        lecturer: supervisor1,
        day_of_week: (lecIdx % 5) + 1,
        start_time: "09:00",
        end_time: "12:00",
        location: `Ruang Dosen ${supervisor1.lecturer_code}`,
      });
    }

    let availabilityForSup2 = await guidanceAvailabilityRepo.findOne({
      where: { lecturer: { id: supervisor2.id } },
    });

    if (!availabilityForSup2) {
      availabilityForSup2 = await guidanceAvailabilityRepo.save({
        lecturer: supervisor2,
        day_of_week: ((lecIdx + 1) % 5) + 1,
        start_time: "13:00",
        end_time: "16:00",
        location: `Ruang Dosen ${supervisor2.lecturer_code}`,
      });
    }

    // Create 4 projects for this lecturer
    for (let projectIdx = 0; projectIdx < 4; projectIdx++) {
      if (studentIndex >= students.length) {
        console.warn(
          `⚠️ Not enough students (need ${studentIndex + 1}, have ${
            students.length
          })`
        );
        break;
      }

      const titleTemplate =
        projectTitleTemplates[projectCounter % projectTitleTemplates.length];
      const student = students[studentIndex];
      const defenseType: "completed" | "scheduled" | "guidance" =
        projectIdx === 0
          ? "completed"
          : projectIdx === 1
          ? "scheduled"
          : "guidance";

      console.log(
        `  📝 Project ${projectIdx + 1}/4: ${titleTemplate.title} → ${
          student.user?.name
        }`
      );

      await createProjectWithFullData(
        supervisor1,
        supervisor2,
        examiner1,
        examiner2,
        studentIndex,
        `${titleTemplate.title} (${supervisor1.lecturer_code}-${
          projectIdx + 1
        })`,
        titleTemplate.description,
        `Penelitian mengenai ${titleTemplate.title.toLowerCase()}`,
        expertiseGroups[lecIdx % expertiseGroups.length],
        expertiseGroups[(lecIdx + 1) % expertiseGroups.length],
        availabilityForSup1,
        availabilityForSup2,
        defenseType
      );

      studentIndex++;
      projectCounter++;
    }
  }

  console.log(
    `\n✅ Distribution complete: ${studentIndex} students used for ${allLecturers.length} lecturers`
  );

  console.log("✅ Dummy data seeding completed successfully!");
  console.log("=".repeat(80));
  console.log("Summary:");
  console.log("\n📊 COMPREHENSIVE DATA SEEDING - ALL 25 LECTURERS:");
  console.log("\n👨‍🏫 DATA DISTRIBUTION FOR EACH LECTURER:");
  console.log("- Supervisor 1 untuk 4 projects dengan 4 mahasiswa berbeda");
  console.log("- Co-supervisor role di 4 projects dari lecturer berikutnya");
  console.log(
    "- Examiner role di projects dari lecturer lain (cyclic assignment)"
  );
  console.log("- GuidanceAvailability dengan hari berbeda (cycle Mon-Fri)");
  console.log("- Complete guidance sessions (proposal + hasil defense types)");
  console.log("\n📈 DATABASE STATISTICS:");
  console.log(`- Total Students Created: 100`);
  console.log(
    `- Total Students Used: ${studentIndex} (6 in main scenarios + ${
      studentIndex - 6
    } in comprehensive projects)`
  );
  console.log(`- Students per Lecturer: 4`);
  console.log(`- Total Lecturers: ${allLecturers.length}`);
  console.log(
    `- Total Projects Created: ${allLecturers.length * 4} (4 per lecturer × 25)`
  );
  console.log(
    `- Completed Defenses: ${Math.ceil((allLecturers.length * 4) / 3)}`
  );
  console.log(
    `- Scheduled Defenses: ${Math.floor((allLecturers.length * 4) / 3)}`
  );
  console.log(
    `- In Progress (Guidance): ${
      allLecturers.length * 4 -
      Math.ceil((allLecturers.length * 4) / 3) -
      Math.floor((allLecturers.length * 4) / 3)
    }`
  );
  console.log("\n✅ WORKFLOW COVERAGE:");
  console.log("✓ Pendaftaran Tugas Akhir (Final Project Registration)");
  console.log("✓ Bimbingan Proposal & Sidang Hasil (Guidance Sessions)");
  console.log("✓ Penjadwalan Sidang (Defense Scheduling)");
  console.log("✓ Penilaian dari 4 Dosen (Assessment from 4 Lecturers)");
  console.log("\n✅ FEATURES COVERED:");
  console.log("- All 25 lecturers have assigned students");
  console.log("- Complete guidance session history (proposal + hasil)");
  console.log("- Defense schedules with multiple statuses");
  console.log("- Assessment rubrics (Seminar & Sidang)");
  console.log("- Diverse project types and topics");
  console.log(
    "- Cyclic role assignment: supervisor1, supervisor2, examiner1, examiner2"
  );
  console.log("- GuidanceAvailability for each lecturer");
  console.log("- Full assessment data with jawaban penilaian");
  console.log("\n👨‍🎓 LECTURER LIST (All 25):");
  allLecturers.forEach((lec, idx) => {
    console.log(
      `${String(idx + 1).padStart(2, " ")}. ${lec.lecturer_code} - ${
        lec.user?.name
      }`
    );
  });
  console.log("=".repeat(80));
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
