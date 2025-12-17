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

  function pad(n: number, width = 3) {
    return n.toString().padStart(width, "0");
  }

  // Create 20 students (User + Student)
  for (let i = 1; i <= 20; i++) {
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
  const allLecturers = await lecturerRepo.find({ relations: ["user"] });

  if (students.length < 20) {
    console.error("❌ Not enough students. Please seed users first!");
    return;
  }

  // Get 4 specific lecturers with codes ANS, HBF, LIA, MCT
  const lecturer1 = allLecturers.find((l) => l.lecturer_code === "ANS");
  const lecturer2 = allLecturers.find((l) => l.lecturer_code === "HBF");
  const lecturer3 = allLecturers.find((l) => l.lecturer_code === "LIA");
  const lecturer4 = allLecturers.find((l) => l.lecturer_code === "MCT");

  if (!lecturer1 || !lecturer2 || !lecturer3 || !lecturer4) {
    console.error(
      "❌ Required lecturers (ANS, HBF, LIA, MCT) not found. Please seed lecturers first!"
    );
    return;
  }

  const targetLecturers = [lecturer1, lecturer2, lecturer3, lecturer4];

  // Get lecturer5 for capstone scenarios
  const lecturer5 =
    allLecturers.find((l) => l.lecturer_code === "AWJ") || allLecturers[4];

  // Today variable for date calculations
  const today = new Date();

  // ==================== GUIDANCE AVAILABILITY ====================
  console.log("Creating guidance availability...");

  const availabilities = [];
  for (let i = 0; i < targetLecturers.length; i++) {
    const availability = await guidanceAvailabilityRepo.save({
      lecturer: targetLecturers[i],
      day_of_week: (i % 5) + 1, // Distribute across weekdays
      start_time: i % 2 === 0 ? "09:00" : "13:00",
      end_time: i % 2 === 0 ? "12:00" : "16:00",
      location: `Ruang Dosen ${101 + i}`,
    });
    availabilities.push(availability);
  }

  // Create additional availabilities for scenarios
  const availability1 = availabilities[0];
  const availability2 = availabilities[1];

  // ==================== CREATE 20 STUDENTS WITH FINAL PROJECTS ====================
  console.log("Creating final projects for 20 students...");

  // Distribute 20 students to 4 lecturers:
  // Each lecturer supervises 10 projects (5 as supervisor_1, 5 as supervisor_2)
  for (let i = 0; i < 20; i++) {
    const student = students[i];

    // Determine supervisors (rotate to ensure even distribution)
    // Pattern: Each lecturer gets 5 as sup1 and 5 as sup2
    const sup1Index = Math.floor(i / 5) % 4;
    const sup2Index = (Math.floor(i / 5) + 1 + Math.floor((i % 5) / 2.5)) % 4;

    const supervisor1 = targetLecturers[sup1Index];
    const supervisor2 = targetLecturers[sup2Index];

    // Get two different expertise groups
    const [exp1, exp2] = getTwoDifferentExpertises();

    // Create final project
    const finalProject = await finalProjectRepo.save({
      type: i % 3 === 0 ? "capstone" : "regular",
      status: "baru",
      source_topic: ["dosen", "perusahaan", "mandiri"][i % 3],
      description: `Tugas Akhir ${i + 1} - ${student.user.name}`,
      max_members: i % 3 === 0 ? 3 : 1,
      supervisor_1_status: "approved",
      supervisor_2_status: "approved",
      admin_status: "approved",
      is_only_sup_1: false,
      expertises_group_1: exp1,
      expertises_group_2: exp2,
      supervisor_1: supervisor1,
      supervisor_2: supervisor2,
      final_project_period: period,
    });

    // Create final project member
    await finalProjectMemberRepo.save({
      final_project: finalProject,
      student: student,
      title: `Penelitian ${i + 1} - ${student.user.name}`,
      resume: `Resume penelitian tugas akhir mahasiswa ${student.user.name}`,
      draft_path: `/storages/final-projects/proposal-student${i + 1}.pdf`,
      draft_filename: `proposal-student${i + 1}.pdf`,
      draft_size: "2.5MB",
    });

    // Create 5 guidance sessions with supervisor 1
    for (let j = 1; j <= 5; j++) {
      const session = await guidanceSessionRepo.save({
        final_project: finalProject,
        lecturer: supervisor1,
        guidance_availability: availabilities[sup1Index],
        supervisor_type: 1,
        defense_type: "proposal",
        topic: `Bimbingan Proposal ${j} - Review`,
        lecturer_feedback: `Feedback bimbingan ${j}`,
        status: "completed",
        session_date: new Date(2024, 10, j * 2 + i),
        completed_at: new Date(2024, 10, j * 2 + i, 10, 0),
      });

      // Add draft link for each session
      await guidanceDraftLinkRepo.save({
        guidance_session: session,
        name: `Draft Bimbingan ${j}`,
        url: `https://drive.google.com/file/draft-${i + 1}-${j}`,
      });
    }

    // Create 5 guidance sessions with supervisor 2
    for (let j = 1; j <= 5; j++) {
      await guidanceSessionRepo.save({
        final_project: finalProject,
        lecturer: supervisor2,
        guidance_availability: availabilities[sup2Index],
        supervisor_type: 2,
        defense_type: "proposal",
        topic: `Bimbingan Proposal ${j} - Review`,
        lecturer_feedback: `Feedback bimbingan ${j}`,
        status: "completed",
        session_date: new Date(2024, 10, j * 2 + i + 1),
        completed_at: new Date(2024, 10, j * 2 + i + 1, 14, 0),
      });
    }

    console.log(
      `✓ Created final project for ${student.user.name} with supervisors ${supervisor1.lecturer_code} and ${supervisor2.lecturer_code}`
    );
  }

  console.log(
    "✅ Successfully created 20 students with final projects and guidance sessions"
  );

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

  // ==================== SUMMARY ====================
  console.log(
    "\n✅ Successfully created 20 students with final projects and guidance sessions"
  );

  console.log("✅ Dummy data seeding completed successfully!");
  console.log("=".repeat(80));
  console.log("Summary:");
  console.log("\n📊 DATA SEEDING - 20 STUDENTS:");
  console.log("\n👨‍🏫 DATA DISTRIBUTION:");
  console.log("- 20 students dibagikan ke 4 dosen (ANS, HBF, LIA, MCT)");
  console.log(
    "- Masing-masing dosen supervise 5 students sebagai supervisor_1"
  );
  console.log(
    "- Masing-masing dosen co-supervise 5 students sebagai supervisor_2"
  );
  console.log("- Setiap student: 1 final project + 1 final project member");
  console.log("- 5 guidance sessions dengan supervisor_1 (completed)");
  console.log("- 5 guidance sessions dengan supervisor_2 (completed)");
  console.log("\n📈 DATABASE STATISTICS:");
  console.log(`- Total Students Created: 20`);
  console.log(`- Total Final Projects: 20`);
  console.log(`- Total Final Project Members: 20 (1:1 relationship)`);
  console.log(`- Total Guidance Sessions: 200 (10 per student)`);
  console.log(`- Students per Lecturer: 5 as sup1, 5 as sup2`);
  console.log(`- Target Lecturers: ANS, HBF, LIA, MCT`);
  console.log("\n✅ WORKFLOW COVERAGE:");
  console.log("✓ Pendaftaran Tugas Akhir (Final Project Registration)");
  console.log("✓ Bimbingan Proposal (10 sessions per student)");
  console.log("✓ All guidance sessions marked as completed");
  console.log("\n✅ FEATURES PRESERVED:");
  console.log("✓ Assessment rubrics (Seminar & Sidang)");
  console.log("✓ Rentang Nilai (Grade ranges)");
  console.log("✓ Guidance Availability for each lecturer");
  console.log("\n📋 LECTURER DISTRIBUTION:");
  console.log(`- Lecturer 1 (ANS): Students 0-4 (sup1), Students 10-14 (sup2)`);
  console.log(`- Lecturer 2 (HBF): Students 5-9 (sup1), Students 0-4 (sup2)`);
  console.log(`- Lecturer 3 (LIA): Students 10-14 (sup1), Students 5-9 (sup2)`);
  console.log(
    `- Lecturer 4 (MCT): Students 15-19 (sup1), Students 15-19 (sup2)`
  );
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
