import { v4 as uuidv4 } from "uuid";
import AppDataSource from "../config/data-source";
import { Rubrik } from "../entities/rubrik";
import { RubrikGroup } from "../entities/rubrikGroup";
import { Pertanyaan } from "../entities/pertanyaan";
import { OpsiJawaban } from "../entities/opsiJawaban";

/**
 * Seed default rubrik for Sidang (SID) and Seminar (SEM)
 */
export async function seedDefaultRubrik(): Promise<void> {
  const rubrikRepo = AppDataSource.getRepository(Rubrik);

  // Check if already seeded
  const existing = await rubrikRepo.count();
  if (existing > 0) {
    console.log("⏭️  Rubrik already seeded, skipping...");
    return;
  }

  // ========== RUBRIK SIDANG (SID) ==========
  const rubrikSidang = rubrikRepo.create({
    id: uuidv4(),
    nama: "Rubrik Penilaian Sidang Tugas Akhir",
    deskripsi: "Rubrik default untuk penilaian sidang tugas akhir",
    type: "SID",
    isDefault: true,
    isActive: true,
  });

  await rubrikRepo.save(rubrikSidang);

  // Group 1: Presentasi (Bobot 30)
  const groupPresentasi = AppDataSource.getRepository(RubrikGroup).create({
    id: uuidv4(),
    rubrikId: rubrikSidang.id,
    nama: "Presentasi",
    bobotTotal: 30,
    urutan: 1,
  });

  await AppDataSource.getRepository(RubrikGroup).save(groupPresentasi);

  // Pertanyaan untuk Presentasi
  const pertanyaanPresentasi = [
    { text: "Kemampuan menyampaikan materi", bobot: 10, urutan: 1 },
    { text: "Penggunaan media presentasi", bobot: 10, urutan: 2 },
    { text: "Penguasaan waktu presentasi", bobot: 10, urutan: 3 },
  ];

  for (const p of pertanyaanPresentasi) {
    const pertanyaan = AppDataSource.getRepository(Pertanyaan).create({
      id: uuidv4(),
      groupId: groupPresentasi.id,
      text: p.text,
      bobot: p.bobot,
      urutan: p.urutan,
    });

    await AppDataSource.getRepository(Pertanyaan).save(pertanyaan);

    // Opsi jawaban standar (0-5)
    const opsiJawabans = [
      { text: "Sangat Baik", nilai: 5, urutan: 1 },
      { text: "Baik", nilai: 4, urutan: 2 },
      { text: "Cukup", nilai: 3, urutan: 3 },
      { text: "Kurang", nilai: 2, urutan: 4 },
      { text: "Sangat Kurang", nilai: 1, urutan: 5 },
    ];

    for (const opsi of opsiJawabans) {
      await AppDataSource.getRepository(OpsiJawaban).save({
        id: uuidv4(),
        pertanyaanId: pertanyaan.id,
        text: opsi.text,
        nilai: opsi.nilai,
        urutan: opsi.urutan,
      });
    }
  }

  // Group 2: Penguasaan Materi (Bobot 40)
  const groupMateri = AppDataSource.getRepository(RubrikGroup).create({
    id: uuidv4(),
    rubrikId: rubrikSidang.id,
    nama: "Penguasaan Materi",
    bobotTotal: 40,
    urutan: 2,
  });

  await AppDataSource.getRepository(RubrikGroup).save(groupMateri);

  const pertanyaanMateri = [
    { text: "Pemahaman konsep dan teori", bobot: 20, urutan: 1 },
    { text: "Kemampuan menjawab pertanyaan", bobot: 20, urutan: 2 },
  ];

  for (const p of pertanyaanMateri) {
    const pertanyaan = AppDataSource.getRepository(Pertanyaan).create({
      id: uuidv4(),
      groupId: groupMateri.id,
      text: p.text,
      bobot: p.bobot,
      urutan: p.urutan,
    });

    await AppDataSource.getRepository(Pertanyaan).save(pertanyaan);

    // Opsi jawaban standar
    const opsiJawabans = [
      { text: "Sangat Baik", nilai: 5, urutan: 1 },
      { text: "Baik", nilai: 4, urutan: 2 },
      { text: "Cukup", nilai: 3, urutan: 3 },
      { text: "Kurang", nilai: 2, urutan: 4 },
      { text: "Sangat Kurang", nilai: 1, urutan: 5 },
    ];

    for (const opsi of opsiJawabans) {
      await AppDataSource.getRepository(OpsiJawaban).save({
        id: uuidv4(),
        pertanyaanId: pertanyaan.id,
        text: opsi.text,
        nilai: opsi.nilai,
        urutan: opsi.urutan,
      });
    }
  }

  // Group 3: Kualitas Karya (Bobot 30)
  const groupKarya = AppDataSource.getRepository(RubrikGroup).create({
    id: uuidv4(),
    rubrikId: rubrikSidang.id,
    nama: "Kualitas Karya",
    bobotTotal: 30,
    urutan: 3,
  });

  await AppDataSource.getRepository(RubrikGroup).save(groupKarya);

  const pertanyaanKarya = [
    { text: "Kualitas implementasi sistem", bobot: 15, urutan: 1 },
    { text: "Dokumentasi dan laporan", bobot: 15, urutan: 2 },
  ];

  for (const p of pertanyaanKarya) {
    const pertanyaan = AppDataSource.getRepository(Pertanyaan).create({
      id: uuidv4(),
      groupId: groupKarya.id,
      text: p.text,
      bobot: p.bobot,
      urutan: p.urutan,
    });

    await AppDataSource.getRepository(Pertanyaan).save(pertanyaan);

    // Opsi jawaban standar
    const opsiJawabans = [
      { text: "Sangat Baik", nilai: 5, urutan: 1 },
      { text: "Baik", nilai: 4, urutan: 2 },
      { text: "Cukup", nilai: 3, urutan: 3 },
      { text: "Kurang", nilai: 2, urutan: 4 },
      { text: "Sangat Kurang", nilai: 1, urutan: 5 },
    ];

    for (const opsi of opsiJawabans) {
      await AppDataSource.getRepository(OpsiJawaban).save({
        id: uuidv4(),
        pertanyaanId: pertanyaan.id,
        text: opsi.text,
        nilai: opsi.nilai,
        urutan: opsi.urutan,
      });
    }
  }

  // ========== RUBRIK SEMINAR (SEM) ==========
  const rubrikSeminar = rubrikRepo.create({
    id: uuidv4(),
    nama: "Rubrik Penilaian Seminar Proposal",
    deskripsi: "Rubrik default untuk penilaian seminar proposal",
    type: "SEM",
    isDefault: true,
    isActive: true,
  });

  await rubrikRepo.save(rubrikSeminar);

  // Group 1: Presentasi (Bobot 30)
  const groupSemPres = AppDataSource.getRepository(RubrikGroup).create({
    id: uuidv4(),
    rubrikId: rubrikSeminar.id,
    nama: "Presentasi",
    bobotTotal: 30,
    urutan: 1,
  });

  await AppDataSource.getRepository(RubrikGroup).save(groupSemPres);

  for (const p of pertanyaanPresentasi) {
    const pertanyaan = AppDataSource.getRepository(Pertanyaan).create({
      id: uuidv4(),
      groupId: groupSemPres.id,
      text: p.text,
      bobot: p.bobot,
      urutan: p.urutan,
    });

    await AppDataSource.getRepository(Pertanyaan).save(pertanyaan);

    const opsiJawabans = [
      { text: "Sangat Baik", nilai: 5, urutan: 1 },
      { text: "Baik", nilai: 4, urutan: 2 },
      { text: "Cukup", nilai: 3, urutan: 3 },
      { text: "Kurang", nilai: 2, urutan: 4 },
      { text: "Sangat Kurang", nilai: 1, urutan: 5 },
    ];

    for (const opsi of opsiJawabans) {
      await AppDataSource.getRepository(OpsiJawaban).save({
        id: uuidv4(),
        pertanyaanId: pertanyaan.id,
        text: opsi.text,
        nilai: opsi.nilai,
        urutan: opsi.urutan,
      });
    }
  }

  // Group 2: Kualitas Proposal (Bobot 70)
  const groupProposal = AppDataSource.getRepository(RubrikGroup).create({
    id: uuidv4(),
    rubrikId: rubrikSeminar.id,
    nama: "Kualitas Proposal",
    bobotTotal: 70,
    urutan: 2,
  });

  await AppDataSource.getRepository(RubrikGroup).save(groupProposal);

  const pertanyaanProposal = [
    { text: "Latar belakang dan rumusan masalah", bobot: 20, urutan: 1 },
    { text: "Tinjauan pustaka dan landasan teori", bobot: 20, urutan: 2 },
    { text: "Metodologi penelitian", bobot: 15, urutan: 3 },
    { text: "Rencana implementasi", bobot: 15, urutan: 4 },
  ];

  for (const p of pertanyaanProposal) {
    const pertanyaan = AppDataSource.getRepository(Pertanyaan).create({
      id: uuidv4(),
      groupId: groupProposal.id,
      text: p.text,
      bobot: p.bobot,
      urutan: p.urutan,
    });

    await AppDataSource.getRepository(Pertanyaan).save(pertanyaan);

    const opsiJawabans = [
      { text: "Sangat Baik", nilai: 5, urutan: 1 },
      { text: "Baik", nilai: 4, urutan: 2 },
      { text: "Cukup", nilai: 3, urutan: 3 },
      { text: "Kurang", nilai: 2, urutan: 4 },
      { text: "Sangat Kurang", nilai: 1, urutan: 5 },
    ];

    for (const opsi of opsiJawabans) {
      await AppDataSource.getRepository(OpsiJawaban).save({
        id: uuidv4(),
        pertanyaanId: pertanyaan.id,
        text: opsi.text,
        nilai: opsi.nilai,
        urutan: opsi.urutan,
      });
    }
  }

  console.log("✅ Default rubrik seeded successfully!");
  console.log("  - Rubrik Sidang (SID): 3 groups, 7 questions");
  console.log("  - Rubrik Seminar (SEM): 2 groups, 7 questions");
}
