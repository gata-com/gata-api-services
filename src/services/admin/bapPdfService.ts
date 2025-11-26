import { BeritaAcaraPDFRepository } from "@/repositories/BeritaAcaraPDFRepository";
import { PenilaianService } from "./penilaianService";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { StudentRepository } from "@/repositories/StudentRepository";
import { BeritaAcaraPDF } from "@/entities/beritaAcaraPDF";
import * as fs from "fs";
import * as path from "path";
import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";

export class BapPdfService {
  private bapRepo: BeritaAcaraPDFRepository;
  private penilaianService: PenilaianService;
  private scheduleRepo: DefenseScheduleRepository;
  private studentRepo: StudentRepository;
  private templatePath: string;
  private storageDir: string;

  constructor() {
    this.bapRepo = new BeritaAcaraPDFRepository();
    this.penilaianService = new PenilaianService();
    this.scheduleRepo = new DefenseScheduleRepository();
    this.studentRepo = new StudentRepository();
    this.templatePath = path.join(
      __dirname,
      "../../templates/templates_BAP.pdf"
    );
    this.storageDir = path.join(__dirname, "../../storages/bap-pdf");

    // Pastikan storage dir exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Generate BAP PDF untuk mahasiswa
   * Jika PDF sudah ada, akan di-update dengan data terbaru (bukan ditimpa)
   */
  async generateBapForStudent(
    jadwalId: number,
    studentId: number
  ): Promise<BeritaAcaraPDF> {
    // Get student data
    const student = await this.studentRepo.findById(studentId);
    if (!student) {
      throw new Error("Student tidak ditemukan");
    }

    // Format: BAP_121140044
    const pdfName = `BAP_${student.nim}`;
    const pdfFileName = `${pdfName}.pdf`;

    // Check apakah PDF sudah ada di database
    let existingPdf = await this.bapRepo.findByPdfName(pdfFileName);
    const isUpdate = !!existingPdf;

    // Get rekap nilai
    const rekap = await this.penilaianService.getRekapNilai(
      jadwalId,
      studentId
    );

    if (!rekap) {
      throw new Error("Belum ada penilaian untuk membuat BAP");
    }

    // Check apakah semua nilai sudah di-finalisasi
    const allFinalized = await this.penilaianService.checkAllFinalized(
      jadwalId
    );
    if (!allFinalized) {
      throw new Error(
        "Tidak semua dosen sudah memfinalisasi nilai. BAP tidak dapat di-generate."
      );
    }

    // Get jadwal details
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);
    if (!jadwal) {
      throw new Error("Jadwal tidak ditemukan");
    }

    const submission = jadwal.defense_submission;
    const finalProject = submission.final_project;
    const finalProjectMember = finalProject.members?.[0];

    if (!finalProjectMember) {
      throw new Error("Final project member tidak ditemukan");
    }

    // Generate PDF
    const pdfFilePath = path.join(this.storageDir, pdfFileName);

    await this.createPdfFromTemplate(
      pdfFilePath,
      student,
      finalProjectMember,
      jadwal,
      rekap
    );

    // Save to database
    const pdfUrl = `/bap/${pdfFileName}`;
    const bapData = {
      studentId,
      pdfName: pdfFileName,
      pdfUrl,
      nilaiAkhir: rekap.nilaiAkhir,
      nilaiHuruf: rekap.nilaiHuruf,
      jadwalId,
      catatan: this.generateCatatanBap(rekap),
    };

    // Jika update, gunakan update untuk update existing record
    if (isUpdate && existingPdf) {
      const updated = await this.bapRepo.update(existingPdf.id, bapData);
      if (!updated) {
        throw new Error("Gagal update BAP record");
      }
      return updated;
    }

    return await this.bapRepo.create(bapData);
  }

  /**
   * Clear/reset area text lama sebelum menulis text baru
   * Ini untuk menghindari overlapping text ketika update PDF
   */
  private clearTextArea(page: PDFPage, fields: any[], height: number): void {
    // Clear area untuk data fields
    for (const [, x, y, fontSize] of fields) {
      // Draw white rectangle untuk clear area
      page.drawRectangle({
        x: (x as number) - 10,
        y: (y as number) - (fontSize as number) / 2 - 5,
        width: 400,
        height: (fontSize as number) + 10,
        color: rgb(255, 255, 255),
      });
    }

    // Clear area untuk tabel (dari Y 550 sampai 700)
    page.drawRectangle({
      x: 70,
      y: height - 700,
      width: 450,
      height: 150,
      color: rgb(255, 255, 255),
    });
  }

  /**
   * Create PDF from template dan populate data
   * Jika file sudah ada, akan di-edit (bukan di-overwrite)
   * Text lama di-clear terlebih dahulu sebelum menulis text baru
   */
  private async createPdfFromTemplate(
    outputPath: string,
    student: any,
    finalProjectMember: any,
    jadwal: any,
    rekap: any
  ): Promise<void> {
    try {
      let pdfDoc: PDFDocument;
      const isUpdate = fs.existsSync(outputPath);

      // Cek apakah PDF sudah ada
      if (isUpdate) {
        // EDIT: Load existing PDF dan update data
        console.log(`Editing existing PDF: ${outputPath}`);
        const existingBytes = fs.readFileSync(outputPath);
        pdfDoc = await PDFDocument.load(existingBytes);
      } else {
        // CREATE: Load template PDF untuk membuat baru
        console.log(`Creating new PDF from template: ${outputPath}`);
        const templateBytes = fs.readFileSync(this.templatePath);
        pdfDoc = await PDFDocument.load(templateBytes);
      }

      // Get the first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Embed font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { height } = firstPage.getSize();

      // Koordinat untuk setiap field (adjust sesuai template PDF Anda)
      // Format: [text, x, y, fontSize, fontType]
      const dataFields = [
        // Data Mahasiswa
        [student.user?.name || student.nim || "", 200, height - 200, 12, font],
        [student.nim || "", 200, height - 220, 12, font],
        [finalProjectMember.title || "", 200, height - 240, 10, font],

        // Dosen Pembimbing 1
        [
          jadwal.defense_submission?.final_project?.supervisor_1?.user?.name ||
            "",
          200,
          height - 280,
          11,
          font,
        ],
        [
          jadwal.defense_submission?.final_project?.supervisor_1?.nip || "",
          200,
          height - 300,
          11,
          font,
        ],

        // Dosen Pembimbing 2 (jika ada)
        [
          jadwal.defense_submission?.final_project?.supervisor_2?.user?.name ||
            "-",
          200,
          height - 340,
          11,
          font,
        ],
        [
          jadwal.defense_submission?.final_project?.supervisor_2?.nip || "-",
          200,
          height - 360,
          11,
          font,
        ],

        // Tanggal Sidang
        [jadwal.scheduled_date || "", 200, height - 400, 11, font],
        [
          `${jadwal.start_time || ""} - ${jadwal.end_time || ""}`,
          200,
          height - 420,
          11,
          font,
        ],

        // Nilai Akhir
        [
          `${rekap.nilaiAkhir || ""} (${rekap.nilaiHuruf || ""})`,
          200,
          height - 480,
          14,
          boldFont,
        ],
      ];

      // Jika UPDATE: clear area text lama terlebih dahulu
      if (isUpdate) {
        this.clearTextArea(firstPage, dataFields, height);
      }

      // Draw text fields
      for (const [text, x, y, fontSize, fontType] of dataFields) {
        firstPage.drawText(String(text), {
          x: x as number,
          y: y as number,
          size: fontSize as number,
          font: fontType as any,
          color: rgb(0, 0, 0),
        });
      }

      // Draw table penilaian per dosen
      let tableY = height - 550;
      const tableX = 80;
      const rowHeight = 25;
      const colWidths = [200, 100, 80];

      // Table header
      firstPage.drawText("Nama Dosen", {
        x: tableX,
        y: tableY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText("Role", {
        x: tableX + colWidths[0],
        y: tableY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText("Nilai", {
        x: tableX + colWidths[0] + colWidths[1],
        y: tableY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      tableY -= rowHeight;

      // Table rows
      for (const dosen of rekap.detailPerDosen) {
        firstPage.drawText(dosen.lecturerNama || "", {
          x: tableX,
          y: tableY,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        firstPage.drawText(dosen.role || "", {
          x: tableX + colWidths[0],
          y: tableY,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        firstPage.drawText(String(dosen.nilaiAkhir || ""), {
          x: tableX + colWidths[0] + colWidths[1],
          y: tableY,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        tableY -= rowHeight;
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);

      const action = isUpdate ? "di-edit" : "di-generate";
      console.log(`PDF berhasil ${action}: ${outputPath}`);
    } catch (error) {
      console.error("Error creating/editing PDF from template:", error);
      throw new Error(
        `Gagal membuat/edit PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate catatan untuk BAP
   */
  private generateCatatanBap(rekap: any): string {
    const lines = [
      `Nilai Akhir: ${rekap.nilaiAkhir} (${rekap.nilaiHuruf})`,
      `Rata-rata Pembimbing: ${rekap.rata2Pembimbing}`,
      `Rata-rata Penguji: ${rekap.rata2Penguji}`,
      "",
      "Detail Penilaian per Dosen:",
    ];

    for (const dosen of rekap.detailPerDosen) {
      lines.push(
        `- ${dosen.lecturerNama} (${dosen.role}): ${dosen.nilaiAkhir}`
      );
    }

    return lines.join("\n");
  }

  /**
   * Get BAP by student ID
   */
  async getBapByStudentId(studentId: number): Promise<BeritaAcaraPDF | null> {
    return await this.bapRepo.findByStudentId(studentId);
  }

  /**
   * Get BAP by PDF name
   */
  async getBapByPdfName(pdfName: string): Promise<BeritaAcaraPDF | null> {
    return await this.bapRepo.findByPdfName(pdfName);
  }

  /**
   * Get file path for download
   */
  getFilePath(pdfName: string): string {
    return path.join(this.storageDir, pdfName);
  }

  /**
   * Check if file exists
   */
  fileExists(pdfName: string): boolean {
    return fs.existsSync(this.getFilePath(pdfName));
  }

  /**
   * Get all BAP
   */
  async getAllBap(): Promise<BeritaAcaraPDF[]> {
    return await this.bapRepo.findAll();
  }
}
