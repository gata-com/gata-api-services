// scripts/seed.ts
import "reflect-metadata";
import AppDataSource from "../config/data-source";

// sesuaikan path import entity sesuai struktur proyek Anda
import User from "../entities/user";
import { Lecturer } from "../entities/lecturer";
import ExpertisesGroup from "../entities/expertisesGroup";
import { LecturerExpertise } from "../entities/lecturerExpertise";
import { lecturers, expertiseList, lecturerAdminCodes } from "./seedData";

async function main() {
  await AppDataSource.initialize();
  console.log("DataSource initialized.");

  const egRepo = AppDataSource.getRepository(ExpertisesGroup);
  const userRepo = AppDataSource.getRepository(User);
  const lecturerRepo = AppDataSource.getRepository(Lecturer);
  const lecturerExpertiseRepo = AppDataSource.getRepository(LecturerExpertise);

  // 1) Masukkan/ensure ExpertisesGroup
  const createdEG: ExpertisesGroup[] = [];
  for (const e of expertiseList) {
    let found = await egRepo.findOne({ where: { name: e.name } });
    if (!found) {
      found = egRepo.create(e);
      await egRepo.save(found);
    } else {
      console.log(`ExpertisesGroup ${e.name} already exists, skipping`);
    }
    createdEG.push(found);
  }

  // 3) Buat lecturers (User + Lecturer + Multiple Expertises), termasuk admin lecturers
  for (const lecturer of lecturers) {
    const email = lecturer.email;
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = userRepo.create({
        name: lecturer.name,
        email: lecturer.email,
        password: "password." + lecturer.code,
        role: lecturerAdminCodes.includes(lecturer.code) ? "admin" : "lecturer",
        is_active: true,
      } as Partial<User>);
      await userRepo.save(user);
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

    // Buat Lecturer tanpa expertises_group (karena sudah menggunakan junction table)
    const lc = lecturerRepo.create({
      nip: lecturer.nip,
      lecturer_code: lecturer.code,
      user: user,
    } as Partial<Lecturer>);

    await lecturerRepo.save(lc);

    // Tambahkan expertises sesuai dengan data kk di seedData
    if (lecturer.kk && lecturer.kk.length > 0) {
      for (const kkCode of lecturer.kk) {
        // Cari expertise berdasarkan name (kk code)
        const expertise = await egRepo.findOne({ where: { name: kkCode } });

        if (expertise) {
          // Check if relation already exists
          const existingRelation = await lecturerExpertiseRepo.findOne({
            where: {
              lecturer: { id: lc.id },
              expertises_group: { id: expertise.id },
            },
          });

          if (!existingRelation) {
            const lecturerExpertise = lecturerExpertiseRepo.create({
              lecturer: lc,
              expertises_group: expertise,
            });
            await lecturerExpertiseRepo.save(lecturerExpertise);
            console.log(`  ✓ Added expertise: ${kkCode} to ${lecturer.code}`);
          }
        } else {
          console.warn(
            `  ✗ Expertise ${kkCode} not found in database for ${lecturer.code}`
          );
        }
      }
    } else {
      console.log(`  - No expertises defined for ${lecturer.code}`);
    }
  }

  console.log("\n✅ Seeding complete.");
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
