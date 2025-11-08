// scripts/seed.ts
import "reflect-metadata";
import AppDataSource from "../config/data-source";

// sesuaikan path import entity sesuai struktur proyek Anda
import User from "../entities/user";
import { Lecturer } from "../entities/lecturer";
import { Student } from "../entities/student";
import ExpertisesGroup from "../entities/expertisesGroup";
import { LecturerExpertise } from "../entities/lecturerExpertise";

const expertiseList = [
  { name: "MLTR", description: "Traditional Machine Learning (All Domain)" },
  { name: "DLCV", description: "Deep Learning – Citra" },
  { name: "DLNL", description: "Deep Learning – NLP" },
  { name: "CYBR", description: "Keamanan Siber" },
  { name: "NETW", description: "Jaringan Komputer" },
  {
    name: "IOTC",
    description: "Internet of Things & Embedded System & Cloud Computing",
  },
  { name: "MOBL", description: "Pengembangan Perangkat Lunak – Mobile" },
  {
    name: "WEBI",
    description: "Pengembangan Perangkat Lunak – Web & Sistem Informasi",
  },
  { name: "DSKT", description: "Pengembangan Perangkat Lunak – Desktop" },
  {
    name: "PPMP",
    description: "Pengembangan Perangkat Lunak – Multi Platform",
  },
  { name: "DATA", description: "Basis Data & Data Mining & Data Warehouse" },
  { name: "LITR", description: "Riset Literatur" },
  { name: "GAME", description: "Game" },
  { name: "VRAR", description: "Virtual Reality / Augmented Reality" },
  { name: "ROBO", description: "Robotika / Kontrol Kendali Cerdas" },
  { name: "ALGO", description: "Strategi dan Algoritma" },
  { name: "MMED", description: "Multimedia" },
  { name: "COMP", description: "Teknologi Kompresi" },
  { name: "HCIU", description: "Interaksi Manusia dan Komputer, UI, UX" },
  { name: "SIGN", description: "Pengolahan Sinyal" },
  { name: "IMAG", description: "Pengolahan Citra" },
  { name: "TEXT", description: "Pemrosesan Teks" },
  { name: "VISD", description: "Visualisasi Data" },
  { name: "KRIP", description: "Kriptografi" },
];

function pad(n: number, width = 3) {
  return n.toString().padStart(width, "0");
}

async function main() {
  await AppDataSource.initialize();
  console.log("DataSource initialized.");

  const egRepo = AppDataSource.getRepository(ExpertisesGroup);
  const userRepo = AppDataSource.getRepository(User);
  const lecturerRepo = AppDataSource.getRepository(Lecturer);
  const studentRepo = AppDataSource.getRepository(Student);
  const lecturerExpertiseRepo = AppDataSource.getRepository(LecturerExpertise);

  // 1) Masukkan/ensure ExpertisesGroup
  const createdEG: ExpertisesGroup[] = [];
  for (const e of expertiseList) {
    let found = await egRepo.findOne({ where: { name: e.name } });
    if (!found) {
      found = egRepo.create(e);
      await egRepo.save(found);
      console.log(`Inserted ExpertisesGroup ${e.name}`);
    } else {
      console.log(`ExpertisesGroup ${e.name} already exists, skipping`);
    }
    createdEG.push(found);
  }

  // 2) Buat 1 admin user
  const adminEmail = "admin@example.com";
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = userRepo.create({
      name: "Administrator",
      email: adminEmail,
      password: "password123", // akan di-hash oleh entity hook
      role: "admin",
      is_active: true,
    } as Partial<User>);
    await userRepo.save(adminUser);
    console.log("Created admin user:", adminEmail);
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  // 3) Buat 5 lecturers (User + Lecturer + Multiple Expertises)
  for (let i = 1; i <= 5; i++) {
    const email = `lecturer${i}@example.com`;
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = userRepo.create({
        name: `Lecturer ${pad(i, 2)}`,
        email,
        password: "password123",
        role: "lecturer",
        is_active: true,
      } as Partial<User>);
      await userRepo.save(user);
      console.log(`Created User for lecturer ${email}`);
    } else {
      console.log(`User ${email} exists, reusing`);
    }

    // check if Lecturer exists by user's id
    const existingLect = await lecturerRepo.findOne({
      where: { user: { id: (user as any).id } },
      relations: ["user", "expertises"],
    });
    if (existingLect) {
      console.log(`Lecturer for user ${email} already exists, skipping`);
      continue;
    }

    // pilih random expertise untuk default (backward compatibility)
    const eg = createdEG[Math.floor(Math.random() * createdEG.length)];

    const lecturer = lecturerRepo.create({
      nip: "100000" + i.toString(), // pastikan unik di DB Anda
      lecturer_code: `L${pad(i, 3)}`,
      user: user,
      expertises_group: eg, // tetap ada untuk backward compatibility
    } as Partial<Lecturer>);

    await lecturerRepo.save(lecturer);
    console.log(`Created Lecturer record for ${email}`);

    // Tambahkan 4 expertise ke lecturer (atau kurang dari 4 jika tidak cukup expertise)
    const numExpertises = Math.min(4, createdEG.length);
    const selectedExpertises: ExpertisesGroup[] = [];

    // Ambil expertises secara random (tanpa duplikat)
    const availableIndices = Array.from(
      { length: createdEG.length },
      (_, i) => i
    );
    for (let j = 0; j < numExpertises; j++) {
      const randomIdx = Math.floor(Math.random() * availableIndices.length);
      const idx = availableIndices.splice(randomIdx, 1)[0];
      selectedExpertises.push(createdEG[idx]);
    }

    // Simpan relasi lecturer-expertise
    for (const expertise of selectedExpertises) {
      // Check if already exists
      const existingRelation = await lecturerExpertiseRepo.findOne({
        where: {
          lecturer: { id: (lecturer as any).id },
          expertises_group: { id: expertise.id },
        },
      });

      if (!existingRelation) {
        const lecturerExpertise = lecturerExpertiseRepo.create({
          lecturer: lecturer,
          expertises_group: expertise,
        });
        await lecturerExpertiseRepo.save(lecturerExpertise);
        console.log(`  ✓ Added expertise: ${expertise.name}`);
      }
    }
  }

  // 4) Buat 20 students (User + Student)
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
      console.log(`Created User for student ${email}`);
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
    const nimCore = pad(i, 5); // contoh: 00001..00020
    const nim = (yearPrefix + nimCore).slice(0, 9);

    const student = studentRepo.create({
      nim,
      semester: 7,
      user: user,
    } as Partial<Student>);

    await studentRepo.save(student);
    console.log(`Created Student record for ${email} with NIM ${nim}`);
  }

  console.log("Seeding complete.");
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
