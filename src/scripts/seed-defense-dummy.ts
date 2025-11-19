import "reflect-metadata";
import AppDataSource from "../config/database";
import { DefenseSubmission } from "../entities/defenses";
import { FinalProjects, FinalProjectMembers } from "../entities/finalProject";
import { Student } from "../entities/student";
import { Lecturer } from "../entities/lecturer";
import User from "../entities/user";
import ExpertisesGroup from "../entities/expertisesGroup";
import { generateCapstoneCode } from "../utils/capstoneCode";

async function seedDefenseDummy() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    const userRepo = AppDataSource.getRepository(User);
    const studentRepo = AppDataSource.getRepository(Student);
    const lecturerRepo = AppDataSource.getRepository(Lecturer);
    const expertiseRepo = AppDataSource.getRepository(ExpertisesGroup);
    const finalProjectRepo = AppDataSource.getRepository(FinalProjects);
    const memberRepo = AppDataSource.getRepository(FinalProjectMembers);
    const defenseRepo = AppDataSource.getRepository(DefenseSubmission);

    console.log("\n📊 Creating dummy data for defense export testing...\n");

    // 1. Get or Create Expertise Groups
    console.log("1️⃣ Setting up Expertise Groups...");
    let expertise1 = await expertiseRepo.findOne({
      where: { name: "WEBI" },
    });
    if (!expertise1) {
      expertise1 = expertiseRepo.create({
        name: "WEBI",
        description: "Web Development & Information Systems",
      });
      await expertiseRepo.save(expertise1);
      console.log("   ✅ Created WEBI expertise");
    }

    let expertise2 = await expertiseRepo.findOne({
      where: { name: "DLNL" },
    });
    if (!expertise2) {
      expertise2 = expertiseRepo.create({
        name: "DLNL",
        description: "Deep Learning & Natural Language Processing",
      });
      await expertiseRepo.save(expertise2);
      console.log("   ✅ Created DLNL expertise");
    }

    let expertise3 = await expertiseRepo.findOne({
      where: { name: "DSKT" },
    });
    if (!expertise3) {
      expertise3 = expertiseRepo.create({
        name: "DSKT",
        description: "Data Science & Knowledge Technology",
      });
      await expertiseRepo.save(expertise3);
      console.log("   ✅ Created DSKT expertise");
    }

    // 2. Create Dummy Lecturers
    console.log("\n2️⃣ Creating Dummy Lecturers...");
    const lecturers = [];

    const lecturerData = [
      { name: "AAF", email: "aaf@lecturer.itera.ac.id", nip: "199001011" },
      { name: "IFA", email: "ifa@lecturer.itera.ac.id", nip: "199001012" },
      { name: "MHA", email: "mha@lecturer.itera.ac.id", nip: "199001013" },
      { name: "RIK", email: "rik@lecturer.itera.ac.id", nip: "199001014" },
      { name: "LIA", email: "lia@lecturer.itera.ac.id", nip: "199001015" },
      { name: "EDN", email: "edn@lecturer.itera.ac.id", nip: "199001016" },
    ];

    for (const ld of lecturerData) {
      let lecturer = await lecturerRepo.findOne({
        where: { nip: ld.nip },
        relations: ["user"],
      });

      if (!lecturer) {
        const user = userRepo.create({
          name: ld.name,
          email: ld.email,
          password: "hashedpassword123",
          role: "lecturer",
          is_active: true,
        });
        await userRepo.save(user);

        lecturer = lecturerRepo.create({
          nip: ld.nip,
          user: user,
        });
        await lecturerRepo.save(lecturer);
        console.log(`   ✅ Created lecturer: ${ld.name}`);
      }
      lecturers.push(lecturer);
    }

    // 3. Create Dummy Students
    console.log("\n3️⃣ Creating Dummy Students...");
    const students = [];

    const studentData = [
      {
        name: "Aisa Setia Primastuti",
        nim: "121140092",
        email: "121140092@student.itera.ac.id",
      },
      {
        name: "Muhammad Alfarizi",
        nim: "121140093",
        email: "121140093@student.itera.ac.id",
      },
      {
        name: "Moratua Putra Pardede",
        nim: "121140079",
        email: "121140079@student.itera.ac.id",
      },
      {
        name: "Shakira Putri Abrar",
        nim: "121140053",
        email: "121140053@student.itera.ac.id",
      },
      {
        name: "Raja Josua Simanungkalit",
        nim: "120140134",
        email: "120140134@student.itera.ac.id",
      },
    ];

    for (const sd of studentData) {
      let student = await studentRepo.findOne({
        where: { nim: sd.nim },
        relations: ["user"],
      });

      if (!student) {
        const user = userRepo.create({
          name: sd.name,
          email: sd.email,
          password: "hashedpassword123",
          role: "student",
          is_active: true,
        });
        await userRepo.save(user);

        student = studentRepo.create({
          nim: sd.nim,
          user: user,
        });
        await studentRepo.save(student);
        console.log(`   ✅ Created student: ${sd.name} (${sd.nim})`);
      }
      students.push(student);
    }

    // 4. Create Final Projects with Members
    console.log("\n4️⃣ Creating Final Projects...");
    const finalProjects = [];

    const projectData = [
      {
        title:
          "PERANCANGAN HUMAN RESOURCE INFORMATION SYSTEM (HRIS) SUB-MODUL LOGBOOK DAN PENJADWALAN BERBASIS PWA",
        student: students[0],
        supervisor1: lecturers[0], // AAF
        supervisor2: lecturers[1], // IFA
        expertise1: expertise1, // WEBI
        expertise2: expertise3, // DSKT
      },
      {
        title:
          "PERANCANGAN HUMAN RESOURCE INFORMATION SYSTEM (HRIS) SUB-MODUL KEHADIRAN DAN PENGGAJIAN BERBASIS PWA",
        student: students[1],
        supervisor1: lecturers[0], // AAF
        supervisor2: lecturers[1], // IFA
        expertise1: expertise1, // WEBI
        expertise2: expertise3, // DSKT
      },
      {
        title:
          "Pengembangan Sistem Informasi Pembukuan Digital Berbasis Web Menggunakan Metode Modified Waterfall",
        student: students[2],
        supervisor1: lecturers[2], // MHA
        supervisor2: lecturers[0], // AAF
        expertise1: expertise1, // WEBI
        expertise2: expertise3, // DSKT
      },
      {
        title:
          "Penerapan Deep Learning Pada Model Klasifikasi Emosi Berbasis Data Social Media Twitter (X)",
        student: students[3],
        supervisor1: lecturers[4], // LIA
        supervisor2: null,
        expertise1: expertise2, // DLNL
        expertise2: expertise3, // DSKT
      },
      {
        title:
          "PERANCANGAN SISTEM INFORMASI PERPUSTAKAAN SMA NEGERI 12 BANDAR LAMPUNG DENGAN METODE MODIFIED WATERFALL",
        student: students[4],
        supervisor1: lecturers[2], // MHA
        supervisor2: lecturers[4], // LIA
        expertise1: expertise1, // WEBI
        expertise2: expertise3, // DSKT
      },
    ];

    for (const pd of projectData) {
      const finalProject = finalProjectRepo.create({
        type: "regular",
        status: "baru",
        source_topic: "mandiri",
        max_members: 1,
        supervisor_1_status: "approved",
        supervisor_2_status: pd.supervisor2 ? "approved" : "pending",
        admin_status: "approved",
        is_only_sup_1: !pd.supervisor2,
        supervisor_1: pd.supervisor1,
        supervisor_2: pd.supervisor2 || undefined,
        expertises_group_1: pd.expertise1,
        expertises_group_2: pd.expertise2,
      });

      await finalProjectRepo.save(finalProject);

      // Create member
      const member = memberRepo.create({
        title: pd.title,
        resume: "Resume dummy untuk testing",
        draft_path: "/path/to/draft.pdf",
        draft_filename: "draft.pdf",
        draft_size: "1024",
        final_project: finalProject,
        student: pd.student,
      });

      await memberRepo.save(member);

      finalProjects.push(finalProject);
      console.log(`   ✅ Created project: ${pd.title.substring(0, 50)}...`);
    }

    // 5. Create Defense Submissions - PROPOSAL
    console.log("\n5️⃣ Creating Defense Submissions (PROPOSAL)...");
    const proposalDefenses = [];

    for (let i = 0; i < finalProjects.length; i++) {
      const fp = finalProjects[i];

      const proposalDefense = defenseRepo.create({
        defense_type: "proposal",
        status: "approved",
        guidance_sup_1_count: 4,
        guidance_sup_2_count: fp.supervisor_2 ? 2 : 0,
        min_guidance_sup_1_proposal: 4,
        min_guidance_sup_2_proposal: 2,
        min_guidance_hasil: 2,
        capstone_code: await generateCapstoneCode(),
        // defense_date is null - will be filled by scheduler
        final_project: fp,
        lecturer: fp.supervisor_1,
        expertises_group_1: fp.expertises_group_1,
        expertises_group_2: fp.expertises_group_2,
        examiner_1: lecturers[3], // RIK
        examiner_2: lecturers[2], // MHA
        processed_at: new Date(),
      });

      await defenseRepo.save(proposalDefense);
      proposalDefenses.push(proposalDefense);
      console.log(
        `   ✅ Created proposal defense for project ${i + 1} (Code: ${
          proposalDefense.capstone_code
        })`
      );
    }

    // 6. Create Defense Submissions - HASIL (for first 3 projects)
    console.log("\n6️⃣ Creating Defense Submissions (SIDANG AKHIR)...");

    for (let i = 0; i < 3; i++) {
      const fp = finalProjects[i];
      const proposalDefense = proposalDefenses[i];

      const hasilDefense = defenseRepo.create({
        defense_type: "hasil",
        status: "approved",
        guidance_sup_1_count: 6,
        guidance_sup_2_count: fp.supervisor_2 ? 3 : 0,
        min_guidance_sup_1_proposal: 4,
        min_guidance_sup_2_proposal: 2,
        min_guidance_hasil: 2,
        capstone_code: await generateCapstoneCode(),
        // defense_date is null - will be filled by scheduler
        final_project: fp,
        lecturer: fp.supervisor_1,
        expertises_group_1: fp.expertises_group_1,
        expertises_group_2: fp.expertises_group_2,
        // For hasil, examiners will be fetched from proposal during export
        examiner_1: proposalDefense.examiner_1,
        examiner_2: proposalDefense.examiner_2,
        processed_at: new Date(),
      });

      await defenseRepo.save(hasilDefense);
      console.log(
        `   ✅ Created hasil defense for project ${i + 1} (Code: ${
          hasilDefense.capstone_code
        })`
      );
    }

    console.log("\n✅ All dummy data created successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Lecturers: ${lecturers.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Final Projects: ${finalProjects.length}`);
    console.log(`   - Proposal Defenses: ${proposalDefenses.length}`);
    console.log(`   - Hasil Defenses: 3`);
    console.log(
      `   - Total Defense Submissions: ${proposalDefenses.length + 3}`
    );

    console.log("\n🧪 Ready to test export CSV:");
    console.log("   GET /admin/defense/export-csv");
    console.log("   GET /admin/defense/export-csv?type=proposal");
    console.log("   GET /admin/defense/export-csv?type=hasil");

    await AppDataSource.destroy();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding defense dummy data:", error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the seed
seedDefenseDummy();
