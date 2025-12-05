import { PenilaianRepository } from "@/repositories/PenilaianRepository";
import { RubrikRepository } from "@/repositories/RubrikRepository";
import { RentangNilaiRepository } from "@/repositories/RentangNilaiRepository";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { Penilaian } from "@/entities/penilaian";
import { JawabanPenilaian } from "@/entities/jawabanPenilaian";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";
import { Jadwal, JadwalKomentar } from "@/types/lecturer";

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

interface RekapNilai {
  rata2Pembimbing: number;
  rata2Penguji: number;
  nilaiAkhir?: number; // Optional - kosong jika tidak memenuhi syarat (< 2 penguji atau < 1 pembimbing)
  nilaiHuruf: string;
  isFinalized: boolean;
  finalisasiOleh?: string;
  detailPerDosen: {
    lecturerId: number;
    kode: string;
    nama: string;
    nilai: number;
    tanggal: string;
  }[];
}

export class PenilaianService {
  private penilaianRepo: PenilaianRepository;
  private rubrikRepo: RubrikRepository;
  private rentangRepo: RentangNilaiRepository;
  private scheduleRepo: DefenseScheduleRepository;
  private lecturerRepo: LecturerRepository;
  private defenseSubmissionRepo: DefenseSubmissionRepository;

  constructor() {
    this.penilaianRepo = new PenilaianRepository();
    this.rubrikRepo = new RubrikRepository();
    this.rentangRepo = new RentangNilaiRepository();
    this.scheduleRepo = new DefenseScheduleRepository();
    this.lecturerRepo = new LecturerRepository();
    this.defenseSubmissionRepo = new DefenseSubmissionRepository();
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

  async getRekapNilai(
    jadwalId: number,
    studentId: number
  ): Promise<RekapNilai | any> {
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
    const detailPerDosen = penilaianList.map((p) => {
      let role = "";

      if (pembimbingIds[0] === p.lecturerId) {
        role = "Pembimbing 1";
      } else if (pembimbingIds[1] === p.lecturerId) {
        role = "Pembimbing 2";
      }

      if (pengujiIds[0] === p.lecturerId) {
        role = "Penguji 1";
      } else if (pengujiIds[1] === p.lecturerId) {
        role = "Penguji 2";
      }

      return {
        PenilaianID: p.id,
        lecturerId: p.lecturerId,
        role: role,
        kode: p.lecturer?.lecturer_code || "",
        nama: p.lecturer?.user?.name || "",
        nilai: Math.round(Number(p.nilaiAkhir || 0) * 100) / 100,
        tanggal: p.updatedAt.toISOString(),
      };
    });

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
  async finalisasiNilai(
    jadwalId: number,
    lecturerId: number,
    studentId?: number
  ): Promise<void> {
    // Cek apakah lecturer adalah pembimbing utama
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    const pembimbing1Id =
      jadwal.defense_submission.final_project.supervisor_1?.id;
    if (lecturerId !== pembimbing1Id) {
      throw new Error("Hanya pembimbing utama yang bisa finalisasi nilai");
    }

    // Cek apakah semua dosen sudah memberikan nilai
    let penilaians: Penilaian[];

    if (studentId) {
      penilaians = await this.penilaianRepo.findByJadwalAndStudent(
        jadwalId,
        studentId
      );
    } else {
      penilaians = await this.penilaianRepo.findByJadwalId(jadwalId);
      // Filter yang tidak punya studentId (untuk backward compatibility)
      penilaians = penilaians.filter((p) => !p.studentId);
    }

    // Minimal harus ada 4 penilaian (2 pembimbing + 2 penguji)
    if (penilaians.length < 4) {
      throw new Error("Belum semua dosen memberikan nilai");
    }

    // Get pembimbing utama untuk record finalized info
    const pembimbing1 = jadwal.defense_submission.final_project.supervisor_1;
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
  ): Promise<
    Array<{
      code: string;
      lecturerNama: string;
      role: string;
      catatan: string;
    }>
  > {
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
        code: p.lecturer.lecturer_code,
        lecturerNama: p.lecturer?.user?.name || "",
        role: pembimbingIds.includes(p.lecturerId) ? "Pembimbing" : "Penguji",
        catatan: p.catatan || "",
      }));
  }

  /**
   * Get all penilaians (for admin)
   */
  async getAllPenilaians(): Promise<Penilaian[]> {
    return await this.penilaianRepo.findAll();
  }

  /**
   * Check if all penilaian for jadwal are finalized
   */
  async checkAllFinalized(lecturerId: number, jadwalId: number, studentId: number): Promise<boolean> {
    return await this.penilaianRepo.checkAllFinalized(lecturerId, jadwalId, studentId);
  }
}
