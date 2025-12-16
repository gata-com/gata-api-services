import { ServicesReturn, ApiResponse } from "@/types";
import { StudentRepository } from "@/repositories/StudentRepository";
import { BeritaAcaraPDFRepository } from "@/repositories/BeritaAcaraPDFRepository";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { PenilaianRepository } from "@/repositories/PenilaianRepository";
import { RentangNilaiRepository } from "@/repositories/RentangNilaiRepository";
import { PenilaianService } from "@/services/admin/penilaianService";

interface JadwalKomentar {
  kode: string;
  nama: string;
  komentar: string;
  tanggal: string;
}

export class HasilSidangService {
  private studentRepo: StudentRepository;
  private bapRepo: BeritaAcaraPDFRepository;
  private defenseScheduleRepo: DefenseScheduleRepository;
  private penilaianRepo: PenilaianRepository;
  private penilaianService: PenilaianService;
  private rentangRepo: RentangNilaiRepository;

  constructor() {
    this.studentRepo = new StudentRepository();
    this.bapRepo = new BeritaAcaraPDFRepository();
    this.defenseScheduleRepo = new DefenseScheduleRepository();
    this.penilaianRepo = new PenilaianRepository();
    this.penilaianService = new PenilaianService();
    this.rentangRepo = new RentangNilaiRepository();
  }

  /**
   * Get hasil sidang by student ID
   * Menggabungkan data dari:
   * - berita_acara_pdfs: bapUrl, nilaiAkhir, nilaiHuruf
   * - penilaians: nilai per dosen penguji
   * - defense_schedules: tanggal sidang
   * - final_project_members: judul TA
   */
  async getHasilSidangByStudentId(studentId: number): Promise<ServicesReturn> {
    try {
      // Get student data dengan relasi final_project_members
      const student = await this.studentRepo.repository
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.user", "user")
        .leftJoinAndSelect("student.final_project_members", "fpm")
        .leftJoinAndSelect("fpm.final_project", "fp")
        .where("student.id = :studentId", { studentId })
        .getOne();

      if (!student || !student.user) {
        return {
          error: null,
          data: null,
        };
      }

      // Get BAP (Berita Acara PDF) dari tabel berita_acara_pdfs dengan studentId
      // Query: SELECT pdfUrl, nilaiAkhir, nilaiHuruf FROM berita_acara_pdfs WHERE studentId = ?
      const bap = await this.bapRepo.findByStudentId(studentId);

      // Get defense schedule dan penilaian jika BAP ada
      let defenseSchedule = null;
      let rekap = [];
      let judulTA = "-";
      let komentarDosen: JadwalKomentar[] = [];

      if (bap) {
        // Get defense schedule by jadwalId dari BAP untuk mendapatkan tanggal sidang
        defenseSchedule = await this.defenseScheduleRepo.findById(bap.jadwalId);

        // Get penilaian (assessment) data by jadwalId untuk mendapatkan nilai per dosen
        // Query: SELECT lecturerId, nilaiAkhir, isFinalized FROM penilaians WHERE jadwalId = ?
        const rekapTemp = await this.penilaianService.getRekapNilai(
          bap.jadwalId,
          student.id
        );

        if (rekapTemp) {
          // reorder detailPerDosen dengan urutan detailPerDosen.role = Penguji 1, Penguji 2, Pembimbing 1, Pembimbing 2
          rekapTemp.detailPerDosen.sort((a: any, b: any) => {
            const order = [
              "Pembimbing 1",
              "Pembimbing 2",
              "Penguji 1",
              "Penguji 2",
            ];
            return order.indexOf(a.role) - order.indexOf(b.role);
          });

          rekap = rekapTemp.detailPerDosen.map((dosen: any, index: number) => ({
            no: index + 1,
            id: String(dosen.lecturerId || "-"),
            nama: dosen.nama || "-",
            peran: dosen.role,
            nilai: dosen.nilai || 0,
          }));
        }

        // komentar dosen dari penilaians
        komentarDosen = await this.getKomentarDosen(bap.jadwalId, studentId);
      }

      // Ambil judul TA dari final_project_members
      if (student.final_project_members?.title) {
        judulTA = student.final_project_members.title;
      }

      // Build the response data sesuai format yang diminta
      const hasilSidang = {
        id: bap?.id || `hasil-sidang-${studentId}`,
        studentId: String(studentId),
        studentInfo: {
          id: String(student.id),
          nama: student.user.name || "-",
          nim: student.nim || "-",
          tanggalSidang: defenseSchedule?.scheduled_date || "-",
          judulTA: judulTA,
          programStudi: "Teknik Informatika", // Default atau bisa diambil dari config
        },
        dosenList: rekap,
        hasilAkhir: await this.determineStatus(
          rekap?.nilaiAkhir,
          rekap?.isFinalized
        ),
        nilaiAkhir: bap ? Number(bap.nilaiAkhir) : undefined,
        nilaiHuruf: bap?.nilaiHuruf || undefined,
        bapUrl: bap?.pdfUrl || undefined,
        komentar: komentarDosen,
        createdAt: bap?.createdAt?.toISOString() || undefined,
        updatedAt: bap?.updatedAt?.toISOString() || undefined,
      };

      return {
        error: null,
        data: hasilSidang,
      };
    } catch (error) {
      console.error("Error in getHasilSidangByStudentId:", error);
      return {
        error: null,
        data: null,
      };
    }
  }

  /**
   * Get all hasil sidang (for admin or listing)
   */
  async getAllHasilSidang(
    page: number = 1,
    limit: number = 10,
    filter?: "LULUS" | "TIDAK_LULUS" | "MENUNGGU"
  ): Promise<ServicesReturn> {
    try {
      // Get all BAP
      const bapList = await this.bapRepo.findAll();

      // Get all students
      const students = await this.studentRepo.findAll();

      const hasilSidangList = await Promise.all(
        bapList.map(async (bap) => {
          const student = students.find((s) => s.id === bap.studentId);
          if (!student || !student.user) return null;

          const penilaianList = await this.penilaianRepo.findByJadwalId(
            bap.jadwalId
          );

          const hasilAkhir = bap.nilaiAkhir >= 60 ? "LULUS" : "TIDAK LULUS";

          // Filter if needed
          if (filter && hasilAkhir !== filter) {
            return null;
          }

          return {
            id: bap.id,
            studentId: student.id,
            studentInfo: {
              id: student.id,
              nama: student.user.name || "-",
              nim: student.nim || "-",
              tanggalSidang: "-",
            },
            hasilAkhir: hasilAkhir,
            nilaiAkhir: bap.nilaiAkhir,
            nilaiHuruf: bap.nilaiHuruf,
          };
        })
      );

      // Filter out null values
      const filteredList = hasilSidangList.filter((item) => item !== null);

      // Pagination
      const total = filteredList.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedList = filteredList.slice(startIndex, startIndex + limit);

      return {
        error: null,
        data: paginatedList,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error in getAllHasilSidang:", error);
      return {
        error: null,
        data: [],
      };
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
    let penilaians: any[];

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

    const jadwal = await this.defenseScheduleRepo.findByDefenseSubmissionId(
      jadwalId
    );
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
   * Get BAP PDF file dari berita_acara_pdfs table
   * Query: SELECT pdfUrl, pdfName FROM berita_acara_pdfs WHERE studentId = ?
   */
  async getBAPFile(studentId: number): Promise<ServicesReturn> {
    try {
      // Get BAP by student ID dari tabel berita_acara_pdfs
      const bap = await this.bapRepo.findByStudentId(studentId);

      if (!bap) {
        return {
          error: null,
          data: null,
        };
      }

      return {
        error: null,
        data: {
          // Ambil pdfUrl langsung dari berita_acara_pdfs
          bapUrl: bap.pdfUrl,
          fileName: bap.pdfName,
          contentType: "application/pdf",
          fileSize: 0, // Bisa diambil dari file system jika diperlukan
        },
      };
    } catch (error) {
      console.error("Error in getBAPFile:", error);
      return {
        error: null,
        data: null,
      };
    }
  }

  /**
   * Helper function untuk menentukan status penilaian
   * Berdasarkan nilaiAkhir dan isFinalized
   */
  private async determineStatus(
    nilaiAkhir?: number | null | undefined,
    isFinalized?: boolean
  ): Promise<"LULUS" | "TIDAK LULUS" | "MENUNGGU"> {
    if (!isFinalized || nilaiAkhir === null || nilaiAkhir === undefined) {
      return "MENUNGGU";
    }

    const minScoreToPass = await this.rentangRepo.getMinScoreToPassed();
    return nilaiAkhir >= minScoreToPass ? "LULUS" : "TIDAK LULUS";
  }
}
