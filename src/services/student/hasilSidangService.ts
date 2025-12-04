import { ServicesReturn, ApiResponse } from "@/types";
import { StudentRepository } from "@/repositories/StudentRepository";
import { BeritaAcaraPDFRepository } from "@/repositories/BeritaAcaraPDFRepository";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { PenilaianRepository } from "@/repositories/PenilaianRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { FinalProjectRepository } from "@/repositories/FinalProjectRepository";

export class HasilSidangService {
  private studentRepo: StudentRepository;
  private bapRepo: BeritaAcaraPDFRepository;
  private defenseScheduleRepo: DefenseScheduleRepository;
  private penilaianRepo: PenilaianRepository;
  private lecturerRepo: LecturerRepository;
  private finalProjectRepo: FinalProjectRepository;

  constructor() {
    this.studentRepo = new StudentRepository();
    this.bapRepo = new BeritaAcaraPDFRepository();
    this.defenseScheduleRepo = new DefenseScheduleRepository();
    this.penilaianRepo = new PenilaianRepository();
    this.lecturerRepo = new LecturerRepository();
    this.finalProjectRepo = new FinalProjectRepository();
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
      let penilaianList: any[] = [];
      let judulTA = "-";

      if (bap) {
        // Get defense schedule by jadwalId dari BAP untuk mendapatkan tanggal sidang
        defenseSchedule = await this.defenseScheduleRepo.findById(bap.jadwalId);

        // Get penilaian (assessment) data by jadwalId untuk mendapatkan nilai per dosen
        // Query: SELECT lecturerId, nilaiAkhir, isFinalized FROM penilaians WHERE jadwalId = ?
        penilaianList = await this.penilaianRepo.findByJadwalId(bap.jadwalId);
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
        dosenList: penilaianList.map((penilaian, index) => ({
          no: index + 1,
          id: String(penilaian.lecturer?.id || "-"),
          nama: penilaian.lecturer?.user?.name || "-",
          peran: this.determineLecturerRole(
            penilaian.lecturer?.id,
            penilaianList
          ),
          nilai: Number(penilaian.nilaiAkhir) || 0,
          status: this.determineStatus(
            penilaian.nilaiAkhir,
            penilaian.isFinalized
          ),
        })),
        hasilAkhir: bap
          ? Number(bap.nilaiAkhir) >= 60
            ? "LULUS"
            : "TIDAK LULUS"
          : "MENUNGGU",
        nilaiAkhir: bap ? Number(bap.nilaiAkhir) : undefined,
        nilaiHuruf: bap?.nilaiHuruf || undefined,
        // Ambil pdfUrl dari berita_acara_pdfs table
        bapUrl: bap?.pdfUrl || undefined,
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
   * Helper function untuk menentukan peran dosen
   * Didasarkan pada urutan dalam list penilaian
   */
  private determineLecturerRole(
    lecturerId: number | undefined,
    penilaianList: any[]
  ): "Pembimbing 1" | "Pembimbing 2" | "Penguji 1" | "Penguji 2" {
    // Bisa disesuaikan sesuai dengan logika bisnis
    // Contoh: Pembimbing 1, Pembimbing 2, Penguji 1, Penguji 2
    const roles: (
      | "Pembimbing 1"
      | "Pembimbing 2"
      | "Penguji 1"
      | "Penguji 2"
    )[] = ["Pembimbing 1", "Pembimbing 2", "Penguji 1", "Penguji 2"];
    const index = penilaianList.findIndex((p) => p.lecturer?.id === lecturerId);
    return roles[index] || "Penguji 1";
  }

  /**
   * Helper function untuk menentukan status penilaian
   * Berdasarkan nilaiAkhir dan isFinalized
   */
  private determineStatus(
    nilaiAkhir: number | null | undefined,
    isFinalized: boolean
  ): "Lulus" | "Tidak Lulus" | "Menunggu" {
    if (!isFinalized || nilaiAkhir === null || nilaiAkhir === undefined) {
      return "Menunggu";
    }
    return nilaiAkhir >= 60 ? "Lulus" : "Tidak Lulus";
  }
}
