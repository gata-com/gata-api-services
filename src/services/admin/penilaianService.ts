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
  nilaiAkhir: number;
  nilaiHuruf: string;
  detailDosen: Array<{
    lecturerId: number;
    lecturerNama: string;
    role: string;
    nilaiAkhir: number;
    perGroup: NilaiPerGroup[];
  }>;
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
   * Submit atau update penilaian dosen
   */
  async submitPenilaian(
    jadwalId: number,
    lecturerId: number,
    jawabans: JawabanInput[],
    catatan?: string
  ): Promise<Penilaian> {
    // Cek apakah sudah ada penilaian
    const existing = await this.penilaianRepo.findByJadwalAndLecturer(
      jadwalId,
      lecturerId
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
        lecturerId
      ))!;
    } else {
      // Create new penilaian
      return await this.penilaianRepo.create({
        jadwalId,
        lecturerId,
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
   * Get penilaian dosen untuk jadwal tertentu
   */
  async getPenilaianDosen(
    jadwalId: number,
    lecturerId: number
  ): Promise<Penilaian | null> {
    return await this.penilaianRepo.findByJadwalAndLecturer(
      jadwalId,
      lecturerId
    );
  }

  /**
   * Get rekap nilai untuk jadwal sidang
   */
  async getRekapNilai(jadwalId: number): Promise<RekapNilai> {
    const penilaians = await this.penilaianRepo.findByJadwalId(jadwalId);

    if (penilaians.length === 0) {
      throw new Error("Belum ada penilaian untuk jadwal ini");
    }

    // Get jadwal untuk mengetahui pembimbing dan penguji
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    const submission = jadwal.defense_submission;
    const pembimbingIds = [
      submission.final_project.supervisor_1?.id,
      submission.final_project.supervisor_2?.id,
    ].filter(Boolean) as number[];

    const pengujiIds = [
      submission.examiner_1?.id,
      submission.examiner_2?.id,
    ].filter(Boolean) as number[];

    // Hitung rata-rata pembimbing
    const nilaiPembimbing = penilaians
      .filter((p) => pembimbingIds.includes(p.lecturerId))
      .map((p) => Number(p.nilaiAkhir || 0));

    const rata2Pembimbing =
      nilaiPembimbing.length > 0
        ? nilaiPembimbing.reduce((a, b) => a + b, 0) / nilaiPembimbing.length
        : 0;

    // Hitung rata-rata penguji
    const nilaiPenguji = penilaians
      .filter((p) => pengujiIds.includes(p.lecturerId))
      .map((p) => Number(p.nilaiAkhir || 0));

    const rata2Penguji =
      nilaiPenguji.length > 0
        ? nilaiPenguji.reduce((a, b) => a + b, 0) / nilaiPenguji.length
        : 0;

    // Nilai akhir mahasiswa
    const nilaiAkhir = (rata2Pembimbing + rata2Penguji) / 2;

    // Get nilai huruf
    const nilaiHuruf = await this.rentangRepo.getGradeByScore(nilaiAkhir);

    // Detail per dosen
    const detailDosen = penilaians.map((p) => {
      const role = pembimbingIds.includes(p.lecturerId)
        ? "Pembimbing"
        : "Penguji";

      const perGroup: NilaiPerGroup[] = [];
      if (p.rubrik && p.rubrik.groups) {
        for (const group of p.rubrik.groups) {
          const jawabanGroup = p.jawabans?.filter((j) =>
            group.pertanyaans?.some((pt) => pt.id === j.pertanyaanId)
          );

          if (jawabanGroup && jawabanGroup.length > 0) {
            const nilaiGroup = this.hitungNilaiGroup(
              group,
              jawabanGroup.map((j) => ({
                pertanyaanId: j.pertanyaanId,
                opsiJawabanId: j.opsiJawabanId,
                nilai: Number(j.nilai),
              }))
            );

            perGroup.push({
              groupId: group.id,
              groupNama: group.nama,
              nilaiGroup: Math.round(nilaiGroup * 100) / 100,
              bobotGroup: Number(group.bobotTotal),
            });
          }
        }
      }

      return {
        lecturerId: p.lecturerId,
        lecturerNama: p.lecturer?.user?.name || "",
        role,
        nilaiAkhir: Number(p.nilaiAkhir || 0),
        perGroup,
      };
    });

    return {
      rata2Pembimbing: Math.round(rata2Pembimbing * 100) / 100,
      rata2Penguji: Math.round(rata2Penguji * 100) / 100,
      nilaiAkhir: Math.round(nilaiAkhir * 100) / 100,
      nilaiHuruf,
      detailDosen,
    };
  }

  /**
   * Finalisasi nilai (hanya pembimbing utama)
   */
  async finalisasiNilai(jadwalId: number, lecturerId: number): Promise<void> {
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
    const penilaians = await this.penilaianRepo.findByJadwalId(jadwalId);

    // Minimal harus ada 4 penilaian (2 pembimbing + 2 penguji)
    if (penilaians.length < 4) {
      throw new Error("Belum semua dosen memberikan nilai");
    }

    // Finalisasi semua penilaian
    for (const penilaian of penilaians) {
      await this.penilaianRepo.finalize(penilaian.id);
    }
  }

  /**
   * Get list komentar/catatan dosen
   */
  async getKomentarDosen(jadwalId: number): Promise<
    Array<{
      lecturerId: number;
      lecturerNama: string;
      role: string;
      catatan: string;
    }>
  > {
    const penilaians = await this.penilaianRepo.findByJadwalId(jadwalId);

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
        lecturerId: p.lecturerId,
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
   * Get jadwal sidang per lecturer
   * @param lecturerId - ID pembimbing/penguji
   * @returns Array of jadwal dengan status kehadiran
   */
  async getJadwalByLecturer(lecturerId: number): Promise<Jadwal[]> {
    try {
      // Get all defense submissions where lecturer is supervisor or examiner
      const submissions = await this.defenseSubmissionRepo.findByLecturerId(
        lecturerId
      );

      const jadwalList: Jadwal[] = [];
      const now = new Date();

      for (const submission of submissions) {
        // Get schedule for this submission
        const schedule = await this.scheduleRepo.findByDefenseSubmissionId(
          submission.id
        );

        if (!schedule) {
          continue;
        }

        // Get student data from final project members
        const member = submission.final_project.members?.[0];
        const student = member?.student;
        const user = student?.user;

        // Get supervisors and examiners
        const supervisor1 = submission.final_project.supervisor_1;
        const supervisor2 = submission.final_project.supervisor_2;
        const examiner1 = submission.examiner_1;
        const examiner2 = submission.examiner_2;

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

        // Get penilaian for this lecturer
        const penilaian = await this.penilaianRepo.findByJadwalAndLecturer(
          schedule.id,
          lecturerId
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
        if (statusKehadiran === "LEWAT") {
          try {
            rekap = await this.getRekapNilai(schedule.id);
          } catch (error) {
            // Rekap might not be available yet
          }
        }

        // Get komentars
        const komentarDosens = await this.getKomentarDosen(schedule.id);
        const komenta: JadwalKomentar[] = komentarDosens.map((k) => ({
          kode: k.lecturerId.toString(),
          nama: k.lecturerNama,
          komentar: k.catatan,
          tanggal: new Date().toISOString(),
        }));

        // Get semua penilaian untuk dosenNilai
        const semuaPenilaian = await this.penilaianRepo.findByJadwalId(
          schedule.id
        );

        const dosenNilai = semuaPenilaian.map((p) => ({
          lecturerId: p.lecturerId,
          lecturerNama: p.lecturer?.user?.name || "-",
          role: [supervisor1?.id, supervisor2?.id].includes(p.lecturerId)
            ? ("Pembimbing" as const)
            : ("Penguji" as const),
          nilaiAkhir: Number(p.nilaiAkhir || 0),
          perGroup: [], // Could be populated from rubrik groups if needed
        }));

        const jadwal: Jadwal = {
          id: schedule.id.toString(),
          nama: user?.name || "-",
          nim: student?.nim || "-",
          jenisSidang:
            submission.defense_type === "proposal" ? "PROPOSAL" : "HASIL",
          statusKehadiran,
          tanggal: schedule.scheduled_date,
          waktu: schedule.start_time,
          judul: submission.final_project.title || "-",
          lokasi: schedule.room || "Prodi",
          capstone: submission.capstone_code || "-",
          pembimbing1: supervisor1?.user?.name || "-",
          pembimbing2: supervisor2?.user?.name || "-",
          penguji1: examiner1?.user?.name || "-",
          penguji2: examiner2?.user?.name || "-",
          statusPenilaian,
          nilaiPertanyaan,
          catatanMahasiswa: submission.student_notes,
          rekap,
          dosenNilai: dosenNilai.length > 0 ? dosenNilai : undefined,
          catatan: penilaian?.catatan,
          komentar: komenta.length > 0 ? komenta : undefined,
        };

        jadwalList.push(jadwal);
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
