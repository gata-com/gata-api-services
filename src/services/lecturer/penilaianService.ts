import { PenilaianRepository } from "@/repositories/PenilaianRepository";
import { RubrikRepository } from "@/repositories/RubrikRepository";
import { RentangNilaiRepository } from "@/repositories/RentangNilaiRepository";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { Penilaian } from "@/entities/penilaian";
import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";
import { DefenseSubmissionRepository as DSDRepository } from "@/repositories/DefenseSubmissionDocumentsRepository";
import { PertanyaanRepository } from "@/repositories/PertanyaanRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { JawabanPenilaianRepository } from "@/repositories/JawabanPenilaianRepository";
import { BeritaAcaraPDFRepository } from "@/repositories/BeritaAcaraPDFRepository";
import { Jadwal, JadwalKomentar, JadwalRekap } from "@/types/lecturer";

interface JawabanInput {
  pertanyaanId: string;
  opsiJawabanId: string;
  nilai: number;
}

interface NilaiPerGroup {
  groupId: string;
  groupNama: string;
  nilaiGroup: number;
  bobotGroup: number;
}

interface SavePenilaianResponse {
  penilaianId: string;
  jadwalId: string;
  dosenId: string;
  nilaiAkhir: number;
  nilaiHuruf: string;
  catatanDisimpan: boolean;
  tanggalDisimpan: string;
}

export class PenilaianService {
  private penilaianRepo: PenilaianRepository;
  private rubrikRepo: RubrikRepository;
  private rentangRepo: RentangNilaiRepository;
  private scheduleRepo: DefenseScheduleRepository;
  private defenseSubmissionRepo: DefenseSubmissionRepository;
  private dsdRepo: DSDRepository;
  private pertanyaanRepo: PertanyaanRepository;
  private lecturerRepo: LecturerRepository;
  private jawabanRepo: JawabanPenilaianRepository;
  private bapPdfRepo: BeritaAcaraPDFRepository;

  constructor() {
    this.penilaianRepo = new PenilaianRepository();
    this.rubrikRepo = new RubrikRepository();
    this.rentangRepo = new RentangNilaiRepository();
    this.scheduleRepo = new DefenseScheduleRepository();
    this.defenseSubmissionRepo = new DefenseSubmissionRepository();
    this.dsdRepo = new DSDRepository();
    this.pertanyaanRepo = new PertanyaanRepository();
    this.lecturerRepo = new LecturerRepository();
    this.jawabanRepo = new JawabanPenilaianRepository();
    this.bapPdfRepo = new BeritaAcaraPDFRepository();
  }

  /**
   * Save penilaian dengan nilai yang sudah dihitung di frontend
   * Menyimpan nilai penilaian mahasiswa untuk sidang/proposal
   * tanpa melakukan perhitungan di backend
   */
  async savePenilaianWithPreCalculatedValues(
    jadwalId: number,
    nilaiPertanyaan: { [pertanyaanId: string]: number },
    nilaiAkhir: number,
    nilaiHuruf: string,
    catatan: string,
    userId: number,
    studentId: number
  ): Promise<SavePenilaianResponse> {
    // Validasi input
    if (!jadwalId) {
      throw new Error("Jadwal ID wajib diisi");
    }

    if (!nilaiPertanyaan || Object.keys(nilaiPertanyaan).length === 0) {
      throw new Error("Nilai pertanyaan wajib diisi");
    }

    if (!catatan || catatan.trim().length < 10) {
      throw new Error("Catatan tidak boleh kosong dan minimal 10 karakter");
    }

    if (isNaN(nilaiAkhir) || nilaiAkhir < 0 || nilaiAkhir > 100) {
      throw new Error("Nilai akhir harus antara 0-100");
    }

    if (!nilaiHuruf || nilaiHuruf.trim().length === 0) {
      throw new Error("Nilai huruf wajib diisi");
    }

    // Convert userId to number for lookup
    const userIdNum = typeof userId === "string" ? parseInt(userId) : userId;

    // Get lecturer from userId
    const lecturer = await this.lecturerRepo.findByUserId(userIdNum);
    if (!lecturer) {
      throw new Error("Dosen tidak ditemukan untuk user ini");
    }

    const lecturerId = lecturer.id;

    // Get jadwal
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    // Validasi bahwa lecturer adalah pembimbing atau penguji
    const submission = jadwal.defense_submission;
    const final_project = submission.final_project;

    const supervisor1Id = final_project.supervisor_1?.id;
    const supervisor2Id = final_project.supervisor_2?.id;
    const examiner1Id = submission.examiner_1?.id;
    const examiner2Id = submission.examiner_2?.id;

    // Get default rubrik based on defense type (untuk validasi pertanyaan)
    const rubrikType = submission.defense_type === "proposal" ? "SEM" : "SID";
    const rubrik = await this.rubrikRepo.findDefaultByType(rubrikType);

    if (!rubrik) {
      throw new Error("Rubrik default tidak ditemukan");
    }

    // Validasi semua pertanyaan memiliki nilai
    const allPertanyaanIds: string[] = [];
    const pertanyaanNilaiMap: { [key: string]: number } = {};

    for (const group of rubrik.groups || []) {
      for (const pertanyaan of group.pertanyaans || []) {
        allPertanyaanIds.push(pertanyaan.id);

        if (!nilaiPertanyaan[pertanyaan.id]) {
          throw new Error(
            `Semua pertanyaan harus memiliki nilai. Pertanyaan yang belum diisi: ${pertanyaan.id}`
          );
        }

        // Validasi nilai sesuai dengan opsi jawaban yang ada
        const nilaiForPertanyaan = nilaiPertanyaan[pertanyaan.id];
        const isValidNilai = (pertanyaan.opsiJawabans || []).some(
          (opsi: any) => Number(opsi.nilai) === Number(nilaiForPertanyaan)
        );

        if (!isValidNilai) {
          throw new Error(
            `Nilai ${nilaiForPertanyaan} tidak sesuai dengan opsi jawaban untuk pertanyaan ${pertanyaan.id}`
          );
        }

        pertanyaanNilaiMap[pertanyaan.id] = nilaiForPertanyaan;
      }
    }

    // Check if penilaian is locked (finalized)
    const existing = await this.penilaianRepo.findByJadwalAndLecturer(
      jadwalId,
      lecturerId
    );

    if (existing && existing.isFinalized) {
      throw new Error("Jadwal sudah terkunci");
    }

    // Convert nilaiPertanyaan to jawaban format
    const jawabanList: Array<{
      pertanyaanId: string;
      opsiJawabanId: string;
      nilai: number;
    }> = [];

    for (const group of rubrik.groups || []) {
      for (const pertanyaan of group.pertanyaans || []) {
        const nilai = nilaiPertanyaan[pertanyaan.id];
        const opsiJawaban = (pertanyaan.opsiJawabans || []).find(
          (opsi: any) => Number(opsi.nilai) === Number(nilai)
        );

        if (opsiJawaban) {
          jawabanList.push({
            pertanyaanId: pertanyaan.id,
            opsiJawabanId: opsiJawaban.id,
            nilai: nilai,
          });
        }
      }
    }

    // Save or update penilaian dengan nilai yang sudah dihitung di frontend
    let penilaian: Penilaian;

    if (existing) {
      // Update existing penilaian
      await this.penilaianRepo.update(existing.id, {
        catatan,
        nilaiAkhir, // Gunakan nilai dari frontend
      });

      // Delete old jawabans and create new ones
      await this.jawabanRepo.deleteByPenilaianId(existing.id);

      // Create new jawaban entities
      const jawabanEntities = jawabanList.map((jawaban) => ({
        penilaianId: existing.id,
        ...jawaban,
      }));
      await this.jawabanRepo.createMany(jawabanEntities);

      penilaian = (await this.penilaianRepo.findByJadwalAndLecturer(
        jadwalId,
        lecturerId
      ))!;
    } else {
      // Create new penilaian first
      penilaian = await this.penilaianRepo.create({
        jadwalId: jadwalId,
        lecturerId,
        studentId,
        rubrikId: rubrik.id,
        catatan,
        nilaiAkhir, // Gunakan nilai dari frontend
        nilaiHuruf, // Gunakan nilai huruf dari frontend
      });

      // Create jawaban entities with the penilaianId
      const jawabanEntities = jawabanList.map((jawaban) => ({
        penilaianId: penilaian.id,
        ...jawaban,
      }));
      await this.jawabanRepo.createMany(jawabanEntities);
    }

    return {
      penilaianId: penilaian.id,
      jadwalId: jadwalId.toString(),
      dosenId: userId.toString(),
      nilaiAkhir, // Return nilai dari frontend
      nilaiHuruf, // Return nilai huruf dari frontend
      catatanDisimpan: !!catatan,
      tanggalDisimpan: penilaian.updatedAt.toISOString(),
    };
  }

  /**
   * Calculate final score from rubrik and nilai pertanyaan
   */
  private hitungNilaiAkhirFromRubrik(
    rubrik: any,
    nilaiPertanyaan: { [pertanyaanId: string]: number }
  ): number {
    let totalPoin = 0;
    let totalBobot = 0;

    for (const group of rubrik.groups || []) {
      const nilaiGroup = this.hitungNilaiGroupFromRubrik(
        group,
        nilaiPertanyaan
      );
      const bobotGroup = Number(group.bobotTotal);

      totalPoin += nilaiGroup * bobotGroup;
      totalBobot += bobotGroup;
    }

    if (totalBobot === 0) {
      return 0;
    }

    // Rata-rata tertimbang × 20 untuk konversi ke skala 100
    const nilaiRataRata = totalPoin / totalBobot;
    return Math.round(nilaiRataRata * 20 * 100) / 100; // 2 decimal places
  }

  /**
   * Calculate score per group from rubrik
   */
  private hitungNilaiGroupFromRubrik(
    group: any,
    nilaiPertanyaan: { [pertanyaanId: string]: number }
  ): number {
    let totalPoin = 0;
    let totalBobot = 0;

    for (const pertanyaan of group.pertanyaans || []) {
      const nilai = nilaiPertanyaan[pertanyaan.id];

      if (nilai !== undefined) {
        const bobotPertanyaan = Number(pertanyaan.bobot);
        totalPoin += nilai * bobotPertanyaan;
        totalBobot += bobotPertanyaan;
      }
    }

    if (totalBobot === 0) {
      return 0;
    }

    return totalPoin / totalBobot;
  }

  /**
   * Submit atau update penilaian dosen (per student)
   */
  async submitPenilaian(
    jadwalId: number,
    lecturerId: number,
    jawabans: JawabanInput[],
    catatan?: string,
    studentId?: number
  ): Promise<Penilaian> {
    // Cek apakah sudah ada penilaian
    const existing = await this.penilaianRepo.findByJadwalAndLecturer(
      jadwalId,
      lecturerId,
      studentId
    );

    // Get jadwal untuk mendapatkan rubrik
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    // Get default rubrik berdasarkan type sidang
    const defenseSubmission = jadwal.defense_submission;
    const rubrikType =
      defenseSubmission.defense_type === "proposal" ? "SID" : "SID"; // Bisa disesuaikan logic
    const rubrik = await this.rubrikRepo.findDefaultByType(rubrikType);

    if (!rubrik) {
      throw new Error("Rubrik default tidak ditemukan");
    }

    // Hitung nilai akhir
    const nilaiAkhir = this.hitungNilaiAkhir(rubrik, jawabans);

    if (existing) {
      // Update existing penilaian
      await this.penilaianRepo.update(existing.id, {
        catatan,
        nilaiAkhir,
        jawabans: jawabans.map((j) => ({
          pertanyaanId: j.pertanyaanId,
          opsiJawabanId: j.opsiJawabanId,
          nilai: j.nilai,
        })) as any,
      });

      return (await this.penilaianRepo.findByJadwalAndLecturer(
        jadwalId,
        lecturerId,
        studentId
      ))!;
    } else {
      // Create new penilaian
      return await this.penilaianRepo.create({
        jadwalId,
        lecturerId,
        studentId,
        rubrikId: rubrik.id,
        catatan,
        nilaiAkhir,
        jawabans: jawabans.map((j) => ({
          pertanyaanId: j.pertanyaanId,
          opsiJawabanId: j.opsiJawabanId,
          nilai: j.nilai,
        })) as any,
      });
    }
  }

  /**
   * Update penilaian yang sudah ada (Update Nilai)
   * Memperbarui nilai penilaian mahasiswa yang sudah pernah disimpan sebelumnya
   */
  async updatePenilaian(
    penilaianId: string,
    jadwalId: number,
    nilaiPertanyaan: { [pertanyaanId: string]: number },
    nilaiAkhir: number,
    nilaiHuruf: string,
    catatan: string,
    userId: number,
    studentId: number
  ): Promise<SavePenilaianResponse> {
    // Validasi input
    if (!jadwalId) {
      throw new Error("Jadwal ID wajib diisi");
    }

    if (!nilaiPertanyaan || Object.keys(nilaiPertanyaan).length === 0) {
      throw new Error("Nilai pertanyaan wajib diisi");
    }

    if (!catatan || catatan.trim().length < 10) {
      throw new Error("Catatan tidak boleh kosong dan minimal 10 karakter");
    }

    // Convert userId to number for lookup
    const userIdNum = typeof userId === "string" ? parseInt(userId) : userId;

    // Get lecturer from userId
    const lecturer = await this.lecturerRepo.findByUserId(userIdNum);
    if (!lecturer) {
      throw new Error("Dosen tidak ditemukan untuk user ini");
    }

    const lecturerId = lecturer.id;

    // Get jadwal
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    // Validasi bahwa lecturer adalah pembimbing atau penguji
    const submission = jadwal.defense_submission;
    const final_project = submission.final_project;

    const supervisor1Id = final_project.supervisor_1?.id;
    const supervisor2Id = final_project.supervisor_2?.id;
    const examiner1Id = submission.examiner_1?.id;
    const examiner2Id = submission.examiner_2?.id;

    const isAuthorized = [
      supervisor1Id,
      supervisor2Id,
      examiner1Id,
      examiner2Id,
    ].includes(lecturerId);
    if (!isAuthorized) {
      throw new Error(
        "Anda tidak memiliki akses untuk memperbarui nilai pada jadwal ini"
      );
    }

    // Check if penilaian exists
    const existing = await this.penilaianRepo.findById(penilaianId);

    if (!existing) {
      throw new Error(
        "tidak ada penilaian sebelumnya untuk diperbarui. Gunakan endpoint simpan-nilai untuk membuat penilaian baru"
      );
    }

    // Check if penilaian is finalized
    if (existing.isFinalized) {
      throw new Error("Nilai sudah difinalisasi dan tidak dapat diperbarui");
    }

    // Get default rubrik based on defense type (untuk validasi pertanyaan)
    const rubrikType = submission.defense_type === "proposal" ? "SEM" : "SID";
    const rubrik = await this.rubrikRepo.findDefaultByType(rubrikType);

    if (!rubrik) {
      throw new Error("Rubrik default tidak ditemukan");
    }

    // Validasi semua pertanyaan memiliki nilai
    const allPertanyaanIds: string[] = [];
    const pertanyaanNilaiMap: { [key: string]: number } = {};

    for (const group of rubrik.groups || []) {
      for (const pertanyaan of group.pertanyaans || []) {
        allPertanyaanIds.push(pertanyaan.id);

        if (!nilaiPertanyaan[pertanyaan.id]) {
          throw new Error(
            `Semua pertanyaan harus memiliki nilai. Pertanyaan yang belum diisi: ${pertanyaan.id}`
          );
        }

        // Validasi nilai sesuai dengan opsi jawaban yang ada
        const nilaiForPertanyaan = nilaiPertanyaan[pertanyaan.id];
        const isValidNilai = (pertanyaan.opsiJawabans || []).some(
          (opsi: any) => Number(opsi.nilai) === Number(nilaiForPertanyaan)
        );

        if (!isValidNilai) {
          throw new Error(
            `Nilai ${nilaiForPertanyaan} tidak sesuai dengan opsi jawaban untuk pertanyaan ${pertanyaan.id}`
          );
        }

        pertanyaanNilaiMap[pertanyaan.id] = nilaiForPertanyaan;
      }
    }

    // Convert nilaiPertanyaan to jawaban format
    const jawabanList: Array<{
      pertanyaanId: string;
      opsiJawabanId: string;
      nilai: number;
    }> = [];

    for (const group of rubrik.groups || []) {
      for (const pertanyaan of group.pertanyaans || []) {
        const nilai = nilaiPertanyaan[pertanyaan.id];
        const opsiJawaban = (pertanyaan.opsiJawabans || []).find(
          (opsi: any) => Number(opsi.nilai) === Number(nilai)
        );

        if (opsiJawaban) {
          jawabanList.push({
            pertanyaanId: pertanyaan.id,
            opsiJawabanId: opsiJawaban.id,
            nilai: nilai,
          });
        }
      }
    }

    // Update existing penilaian
    await this.penilaianRepo.update(existing.id, {
      catatan,
      nilaiAkhir,
      nilaiHuruf,
    });

    // Delete old jawabans and create new ones
    await this.jawabanRepo.deleteByPenilaianId(existing.id);

    // Create new jawaban entities
    const jawabanEntities = jawabanList.map((jawaban) => ({
      penilaianId: existing.id,
      ...jawaban,
    }));
    await this.jawabanRepo.createMany(jawabanEntities);

    // Fetch updated penilaian
    const updatedPenilaian = (await this.penilaianRepo.findById(penilaianId))!;

    return {
      penilaianId: updatedPenilaian.id,
      jadwalId: jadwalId.toString(),
      dosenId: userId.toString(),
      nilaiAkhir,
      nilaiHuruf,
      catatanDisimpan: !!catatan,
      tanggalDisimpan: updatedPenilaian.updatedAt.toISOString(),
    };
  }

  /**
   * Hitung nilai akhir berdasarkan rubrik dan jawaban
   * Formula: Σ(nilaiGroup × bobotGroup) / Σ(bobotGroup) × 20
   */
  private hitungNilaiAkhir(rubrik: any, jawabans: JawabanInput[]): number {
    let totalPoin = 0;
    let totalBobot = 0;

    // Group jawaban by group
    for (const group of rubrik.groups || []) {
      const nilaiGroup = this.hitungNilaiGroup(group, jawabans);
      const bobotGroup = Number(group.bobotTotal);

      totalPoin += nilaiGroup * bobotGroup;
      totalBobot += bobotGroup;
    }

    if (totalBobot === 0) {
      return 0;
    }

    // Rata-rata tertimbang × 20 untuk konversi ke skala 100
    const nilaiRataRata = totalPoin / totalBobot;
    return Math.round(nilaiRataRata * 20 * 100) / 100; // 2 decimal places
  }

  /**
   * Hitung nilai per group
   * Formula: Σ(nilaiPertanyaan × bobotPertanyaan) / Σ(bobotPertanyaan)
   */
  private hitungNilaiGroup(group: any, jawabans: JawabanInput[]): number {
    let totalPoin = 0;
    let totalBobot = 0;

    for (const pertanyaan of group.pertanyaans || []) {
      const jawaban = jawabans.find((j) => j.pertanyaanId === pertanyaan.id);

      if (jawaban) {
        const bobotPertanyaan = Number(pertanyaan.bobot);
        totalPoin += jawaban.nilai * bobotPertanyaan;
        totalBobot += bobotPertanyaan;
      }
    }

    if (totalBobot === 0) {
      return 0;
    }

    return totalPoin / totalBobot;
  }

  /**
   * Get penilaian dosen untuk jadwal tertentu (per student)
   */
  async getPenilaianDosen(
    jadwalId: number,
    lecturerId: number,
    studentId?: number
  ): Promise<Penilaian | null> {
    return await this.penilaianRepo.findByJadwalAndLecturer(
      jadwalId,
      lecturerId,
      studentId
    );
  }

  /**
   * Get rekap nilai untuk jadwal sidang (per student atau all)
   * Return undefined jika tidak ada penilaian
   * Support baik single object maupun array of penilaian
   * Syarat perhitungan nilai akhir: minimal 2 penguji + 1 pembimbing
   * Jika tidak terpenuhi, nilaiAkhir akan kosong
   */
  async getRekapNilai(
    jadwalId: number,
    studentId: number
  ): Promise<JadwalRekap | undefined> {
    // Convert single object to array untuk konsistensi
    const penilaianList = await this.penilaianRepo.findByJadwalAndStudent(
      jadwalId,
      studentId
    );

    // Get jadwal untuk mengetahui pembimbing dan penguji
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    const submission = jadwal.defense_submission;

    // Get pembimbing dan penguji dari defense submission
    const defenseSubmission = await this.defenseSubmissionRepo.findById(
      submission.id
    );

    const pembimbingIds = [
      defenseSubmission?.final_project?.supervisor_1?.id,
      defenseSubmission?.final_project?.supervisor_2?.id,
    ].filter(Boolean) as number[];

    const pengujiIds = [
      defenseSubmission?.examiner_1?.id,
      defenseSubmission?.examiner_2?.id,
    ].filter(Boolean) as number[];

    // Filter penilaian yang ada nilainya (tidak null/0)
    const nilaiPembimbing = penilaianList
      .filter((p) => pembimbingIds.includes(p.lecturerId) && p.nilaiAkhir)
      .map((p) => Number(p.nilaiAkhir || 0));

    const rata2Pembimbing =
      nilaiPembimbing.length > 0
        ? nilaiPembimbing.reduce((a, b) => a + b, 0) / nilaiPembimbing.length
        : 0;

    // Filter penilaian penguji yang ada nilainya (tidak null/0)
    const nilaiPenguji = penilaianList
      .filter((p) => pengujiIds.includes(p.lecturerId) && p.nilaiAkhir)
      .map((p) => Number(p.nilaiAkhir || 0));

    const rata2Penguji =
      nilaiPenguji.length > 0
        ? nilaiPenguji.reduce((a, b) => a + b, 0) / nilaiPenguji.length
        : 0;

    // Validasi kondisi: harus ada minimal 2 penguji dan 1 pembimbing
    const hasSufficientPembimbing = nilaiPembimbing.length >= 1;
    const hasSufficientPenguji = nilaiPenguji.length >= 2;
    const canCalculateNilaiAkhir =
      hasSufficientPembimbing && hasSufficientPenguji;

    // Nilai akhir mahasiswa - hanya dihitung jika kondisi terpenuhi
    const nilaiAkhir = canCalculateNilaiAkhir
      ? Math.round(((rata2Pembimbing + rata2Penguji) / 2) * 100) / 100
      : undefined;

    // Get nilai huruf - hanya jika nilai akhir ada
    let nilaiHuruf = "";
    if (nilaiAkhir !== undefined && nilaiAkhir !== null) {
      nilaiHuruf = await this.rentangRepo.getGradeByScore(nilaiAkhir);
    }

    // Get finalisasi info dari database
    const finalizedPenilaian = penilaianList.find(
      (p) => p.isFinalized === true
    );
    const isFinalized = finalizedPenilaian?.isFinalized || false;
    const finalizedByName = finalizedPenilaian?.finalizedByName;

    // Detail per dosen - sesuai interface DosenNilai
    const detailPerDosen = penilaianList.map((p) => ({
      lecturerId: p.lecturerId,
      kode: p.lecturer?.lecturer_code || "",
      nama: p.lecturer?.user?.name || "",
      nilai: Math.round(Number(p.nilaiAkhir || 0) * 100) / 100,
      tanggal: p.updatedAt.toISOString(),
    }));

    return {
      rata2Pembimbing: Math.round(rata2Pembimbing * 100) / 100,
      rata2Penguji: Math.round(rata2Penguji * 100) / 100,
      nilaiAkhir: nilaiAkhir ?? undefined, // Kosong jika tidak memenuhi kondisi
      nilaiHuruf,
      isFinalized,
      finalisasiOleh: finalizedByName,
      detailPerDosen,
    };
  }

  /**
   * Finalisasi nilai (hanya pembimbing utama) - per student atau all
   */
  async finalisasiNilai(jadwalId: number, studentId: number): Promise<void> {
    // Cek apakah lecturer adalah pembimbing utama
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    // Cek apakah semua dosen sudah memberikan nilai
    let penilaians: Penilaian[];

    penilaians = await this.penilaianRepo.findByJadwalAndStudent(
      jadwalId,
      studentId
    );

    // Minimal harus ada 4 penilaian (2 pembimbing + 2 penguji)
    if (penilaians.length < 4) {
      throw new Error("Belum semua dosen memberikan nilai");
    }

    // Get pembimbing utama untuk record finalized info
    const pembimbing1 = jadwal.defense_submission.final_project.supervisor_1;
    // const finalizedById = pembimbing1?.lecturer.
    const finalizedByName = pembimbing1?.user?.name;

    // Finalisasi semua penilaian
    for (const penilaian of penilaians) {
      await this.penilaianRepo.finalize(penilaian.id, finalizedByName);
    }
  }

  /**
   * Get list komentar/catatan dosen (per student untuk capstone team)
   * @param jadwalId - ID jadwal sidang
   * @param studentId - Optional: ID student (untuk per-student komentar pada capstone team)
   */
  async getKomentarDosen(
    jadwalId: number,
    studentId?: number
  ): Promise<JadwalKomentar[]> {
    let penilaians: Penilaian[];

    if (studentId) {
      // Get komentar untuk student tertentu (per-student)
      penilaians = await this.penilaianRepo.findByJadwalAndStudent(
        jadwalId,
        studentId
      );
    } else {
      // Get semua komentar untuk jadwal (backward compatibility)
      penilaians = await this.penilaianRepo.findByJadwalId(jadwalId);
      // Filter yang tidak punya studentId
      penilaians = penilaians.filter((p) => !p.studentId);
    }

    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      return [];
    }

    const submission = jadwal.defense_submission;
    const pembimbingIds = [
      submission.final_project.supervisor_1?.id,
      submission.final_project.supervisor_2?.id,
    ].filter(Boolean) as number[];

    return penilaians
      .filter((p) => p.catatan)
      .map((p) => ({
        kode: p.lecturer.lecturer_code,
        nama: p.lecturer?.user?.name || "",
        role: pembimbingIds.includes(p.lecturerId) ? "Pembimbing" : "Penguji",
        komentar: p.catatan || "",
        tanggal: p.updatedAt.toISOString(),
      }));
  }

  /**
   * Get jadwal sidang per lecturer
   * @param lecturerId - ID pembimbing/penguji
   * @returns Array of jadwal dengan status kehadiran dan rubrik aktif
   */
  async getJadwalByLecturer(lecturerId: number): Promise<Jadwal[]> {
    try {
      // Get all defense schedules where lecturer is supervisor or examiner
      const schedules = await this.scheduleRepo.findByLecturerId(lecturerId);

      const jadwalList: Jadwal[] = [];
      const now = new Date();

      for (const schedule of schedules) {
        // Get defense submission from schedule
        const submission = schedule.defense_submission;

        if (!submission) {
          continue;
        }

        // Get student data from final project members
        // Untuk capstone: ambil semua members, untuk regular: ambil member pertama
        const isCapstone = submission.final_project.type === "capstone";
        const members = submission.final_project.members || [];
        const member = members[0];
        const student = member?.student;
        const user = student?.user;
        const memberTitle = member?.title || "-";

        // Get supervisors and examiners
        const supervisor1 = submission.final_project.supervisor_1;
        const supervisor2 = submission.final_project.supervisor_2;
        const examiner1 = submission.examiner_1;
        const examiner2 = submission.examiner_2;

        //
        let jumlahPenilaian = 4;

        if (!supervisor2) {
          jumlahPenilaian = 3;
        }

        // Determine status kehadiran
        const scheduledDate = new Date(schedule.scheduled_date);
        const startTime = schedule.start_time;
        const scheduleDatetime = new Date(
          `${schedule.scheduled_date}T${startTime}`
        );

        // Create date for comparison (same day, midnight)
        const scheduledDateOnly = new Date(
          scheduledDate.getFullYear(),
          scheduledDate.getMonth(),
          scheduledDate.getDate()
        );
        const nowDateOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        let statusKehadiran: "HARI INI" | "LEWAT" | "MENDATANG";
        if (scheduledDateOnly.getTime() === nowDateOnly.getTime()) {
          statusKehadiran = "HARI INI";
        } else if (scheduleDatetime < now) {
          statusKehadiran = "LEWAT";
        } else {
          statusKehadiran = "MENDATANG";
        }

        // Determine rubrik type based on jenisSidang
        const jenisSidang =
          submission.defense_type === "proposal" ? "PROPOSAL" : "HASIL";
        const rubrikType =
          submission.defense_type === "proposal" ? "SEM" : "SID";

        // Get active default rubrik for this sidang type
        const rubrik = await this.rubrikRepo.findDefaultByType(rubrikType);

        // Format rubrik response
        const rubrikResponse = rubrik
          ? {
              id: rubrik.id,
              nama: rubrik.nama,
              deskripsi: rubrik.deskripsi,
              type: rubrik.type,
              isDefault: rubrik.isDefault,
              isActive: rubrik.isActive,
              groups: (rubrik.groups || []).map((group) => ({
                id: group.id,
                nama: group.nama,
                bobotTotal: Number(group.bobotTotal),
                urutan: group.urutan,
                isDefault: group.isDefault,
                pertanyaans: (group.pertanyaans || []).map((pertanyaan) => ({
                  id: pertanyaan.id,
                  text: pertanyaan.text,
                  bobot: Number(pertanyaan.bobot),
                  urutan: pertanyaan.urutan,
                  opsiJawabans: (pertanyaan.opsiJawabans || []).map((opsi) => ({
                    id: opsi.id,
                    text: opsi.text,
                    nilai: Number(opsi.nilai),
                    urutan: opsi.urutan,
                  })),
                })),
              })),
            }
          : undefined;

        // Get penilaian for this lecturer
        const penilaian = await this.penilaianRepo.findByJadwalAndLecturer(
          schedule.id,
          lecturerId,
          student?.id
        );

        // Determine status penilaian
        let statusPenilaian: "belum_dinilai" | "sudah_dinilai" | "terkunci";
        if (!penilaian) {
          statusPenilaian = "belum_dinilai";
        } else if (penilaian.isFinalized) {
          statusPenilaian = "terkunci";
        } else {
          statusPenilaian = "sudah_dinilai";
        }

        // Build nilai pertanyaan map if penilaian exists
        const nilaiPertanyaan: { [pertanyaanId: string]: number } = {};
        if (penilaian?.jawabans) {
          for (const jawaban of penilaian.jawabans) {
            nilaiPertanyaan[jawaban.pertanyaanId] = jawaban.nilai;
          }
        }

        // Get rekap nilai if status kehadiran is LEWAT
        let rekap = undefined;
        let isCanFinalize = false;
        try {
          rekap = await this.getRekapNilai(schedule.id, student?.id);
        } catch (error) {
          // Rekap might not be available yet
        }

        if (rekap && rekap.detailPerDosen.length >= jumlahPenilaian) {
          isCanFinalize = true;
        }
        // Get all rentang nilai for dropdown/reference
        const allRentangNilai = await this.rentangRepo.findAll();
        const rentangNilaiData =
          allRentangNilai && allRentangNilai.length > 0
            ? allRentangNilai.map((rn) => ({
                id: rn.id,
                urutan: rn.urutan,
                grade: rn.grade,
                minScore: Number(rn.minScore),
              }))
            : undefined;

        // Get komentars
        const komentarDosens: JadwalKomentar[] = await this.getKomentarDosen(
          schedule.id,
          student?.id
        );

        // Get dokumen untuk member pertama (laporan TA dan slide presentasi)
        const allDocsForSubmission = submission.documents || [];
        const draftDocForStudent = allDocsForSubmission.find(
          (doc: any) => doc.type === "draft" && doc.student?.id === student?.id
        );
        const pptDocForStudent = allDocsForSubmission.find(
          (doc: any) => doc.type === "ppt" && doc.student?.id === student?.id
        );

        // Get BAP PDF data dari tabel berita_acara_pdfs
        const bapData = student?.id
          ? await this.bapPdfRepo.findByStudentId(student.id)
          : null;

        const jadwal: Jadwal = {
          jadwalId: schedule.id,
          penilaianId: penilaian?.id?.toString() || "",
          studentId: student?.id,
          nama: user?.name || "-",
          nim: student?.nim || "-",
          jenisSidang,
          statusKehadiran,
          tanggal: schedule.scheduled_date,
          waktu: schedule.start_time,
          judul: memberTitle,
          lokasi: schedule.room || "Prodi",
          tipeTA: isCapstone ? "Capstone" : "Reguler",
          pembimbing1: supervisor1?.user?.name || "-",
          pembimbing2: supervisor2?.user?.name || "-",
          penguji1: examiner1?.user?.name || "-",
          penguji2: examiner2?.user?.name || "-",
          laporanTA: draftDocForStudent?.url || "",
          slidePresentasi: pptDocForStudent?.url || "",
          statusPenilaian,
          nilaiPertanyaan,
          catatanMahasiswa: submission.student_notes,
          isSupervisor1: lecturerId === supervisor1?.id,
          isCanFinalize,
          rekap,
          catatan: penilaian?.catatan,
          nilaiAkhirDosenini: penilaian?.nilaiAkhir,
          nilaiHurufDosenini: penilaian?.nilaiHuruf,
          komentar: komentarDosens.length > 0 ? komentarDosens : undefined,
          rubrik: rubrikResponse,
          rentangNilai: rentangNilaiData,
          BAPUrl: {
            pdfName: bapData?.pdfName || null,
            pdfUrl: bapData?.pdfUrl || null,
          },
        };

        jadwalList.push(jadwal);

        // Untuk capstone dengan multiple members: tambahkan entries untuk member lain
        if (isCapstone && members.length > 1) {
          for (let i = 1; i < members.length; i++) {
            const otherMember = members[i];
            const otherStudent = otherMember?.student;
            const otherUser = otherStudent?.user;
            const otherMemberTitle = otherMember?.title || "-";

            // Get penilaian untuk member lain (jika ada per-student penilaian)
            const penilaianOtherMember =
              await this.penilaianRepo.findByJadwalAndLecturer(
                schedule.id,
                lecturerId,
                otherStudent?.id
              );

            // Determine status penilaian untuk member lain
            let statusPenilaianOther:
              | "belum_dinilai"
              | "sudah_dinilai"
              | "terkunci";
            if (!penilaianOtherMember) {
              statusPenilaianOther = "belum_dinilai";
            } else if (penilaianOtherMember.isFinalized) {
              statusPenilaianOther = "terkunci";
            } else {
              statusPenilaianOther = "sudah_dinilai";
            }

            // Build nilai pertanyaan map untuk member lain
            const nilaiPertanyaanOther: { [pertanyaanId: string]: number } = {};
            if (penilaianOtherMember?.jawabans) {
              for (const jawaban of penilaianOtherMember.jawabans) {
                nilaiPertanyaanOther[jawaban.pertanyaanId] = jawaban.nilai;
              }
            }

            // Get rekap nilai untuk member lain jika status kehadiran adalah LEWAT
            let rekapOther = undefined;
            let isCanFinalizeOther = false;

            try {
              rekapOther = await this.getRekapNilai(
                schedule.id,
                otherStudent?.id
              );
            } catch (error) {
              // Rekap might not be available yet
            }

            if (
              rekapOther &&
              rekapOther.detailPerDosen.length >= jumlahPenilaian
            ) {
              isCanFinalizeOther = true;
            }

            // Get komentar untuk member lain
            const komentarDosensOther: JadwalKomentar[] =
              await this.getKomentarDosen(schedule.id, otherStudent?.id);

            // Get dokumen untuk member lain (laporan TA dan slide presentasi)
            const draftDocForOtherStudent = allDocsForSubmission.find(
              (doc: any) =>
                doc.type === "draft" && doc.student?.id === otherStudent?.id
            );
            const pptDocForOtherStudent = allDocsForSubmission.find(
              (doc: any) =>
                doc.type === "ppt" && doc.student?.id === otherStudent?.id
            );

            // Get BAP PDF data untuk member lain
            const bapDataOther = otherStudent?.id
              ? await this.bapPdfRepo.findByStudentId(otherStudent.id)
              : null;

            const jadwalOther: Jadwal = {
              jadwalId: schedule.id,
              penilaianId: penilaianOtherMember?.id?.toString() || "",
              studentId: otherStudent?.id,
              nama: otherUser?.name || "-",
              nim: otherStudent?.nim || "-",
              jenisSidang,
              statusKehadiran,
              tanggal: schedule.scheduled_date,
              waktu: schedule.start_time,
              judul: otherMemberTitle,
              lokasi: schedule.room || "Prodi",
              tipeTA: isCapstone ? "Capstone" : "Reguler",
              pembimbing1: supervisor1?.user?.name || "-",
              pembimbing2: supervisor2?.user?.name || "-",
              penguji1: examiner1?.user?.name || "-",
              penguji2: examiner2?.user?.name || "-",
              laporanTA: draftDocForOtherStudent?.url || "",
              slidePresentasi: pptDocForOtherStudent?.url || "",
              statusPenilaian: statusPenilaianOther,
              nilaiPertanyaan: nilaiPertanyaanOther,
              catatanMahasiswa: submission.student_notes,
              isSupervisor1: lecturerId === supervisor1?.id,
              isCanFinalize: isCanFinalizeOther,
              rekap: rekapOther,
              catatan: penilaianOtherMember?.catatan,
              nilaiAkhirDosenini: penilaianOtherMember?.nilaiAkhir,
              nilaiHurufDosenini: penilaianOtherMember?.nilaiHuruf,
              komentar:
                komentarDosensOther.length > 0
                  ? komentarDosensOther
                  : undefined,
              rubrik: rubrikResponse,
              rentangNilai: rentangNilaiData,
              BAPUrl: {
                pdfName: bapDataOther?.pdfName || null,
                pdfUrl: bapDataOther?.pdfUrl || null,
              },
            };

            jadwalList.push(jadwalOther);
          }
        }
      }

      // Sort by tanggal
      jadwalList.sort((a, b) => {
        const dateA = new Date(`${a.tanggal}T${a.waktu}`);
        const dateB = new Date(`${b.tanggal}T${b.waktu}`);
        return dateA.getTime() - dateB.getTime();
      });

      return jadwalList;
    } catch (error) {
      console.error("Error getting jadwal by lecturer:", error);
      throw error;
    }
  }
}
