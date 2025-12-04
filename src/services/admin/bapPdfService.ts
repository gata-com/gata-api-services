import { BeritaAcaraPDFRepository } from "@/repositories/BeritaAcaraPDFRepository";
import { PenilaianService } from "./penilaianService";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { StudentRepository } from "@/repositories/StudentRepository";
import { RentangNilaiRepository } from "@/repositories/RentangNilaiRepository";
import { BeritaAcaraPDF } from "@/entities/beritaAcaraPDF";
import * as fs from "fs";
import * as path from "path";
import puppeteer from "puppeteer";

export class BapPdfService {
  private bapRepo: BeritaAcaraPDFRepository;
  private penilaianService: PenilaianService;
  private scheduleRepo: DefenseScheduleRepository;
  private studentRepo: StudentRepository;
  private rentangRepo: RentangNilaiRepository;
  private storageDir: string;
  private templatePath: string;

  constructor() {
    this.bapRepo = new BeritaAcaraPDFRepository();
    this.penilaianService = new PenilaianService();
    this.scheduleRepo = new DefenseScheduleRepository();
    this.studentRepo = new StudentRepository();
    this.rentangRepo = new RentangNilaiRepository();

    // Use process.cwd() for consistent path resolution in both dev and production
    const basePath = process.cwd();
    // Check if running from dist (production) or src (development)
    const isProduction =
      basePath.includes("dist") || !fs.existsSync(path.join(basePath, "src"));

    if (isProduction) {
      // In production: storages and templates are at root level
      this.storageDir = path.join(basePath, "storages/bap-pdf");
      this.templatePath = path.join(
        basePath,
        "templates/bap-pdf/bap-template.html"
      );
    } else {
      // In development: storages and templates are in src/
      this.storageDir = path.join(basePath, "src/storages/bap-pdf");
      this.templatePath = path.join(
        basePath,
        "src/templates/bap-pdf/bap-template.html"
      );
    }

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
  ): Promise<BeritaAcaraPDF | any> {
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

    const minScoreToPass = await this.rentangRepo.getMinScoreToPassed();

    const isPassed = rekap.nilaiAkhir >= minScoreToPass;

    // Generate PDF
    const pdfFilePath = path.join(this.storageDir, pdfFileName);

    await this.createPdfFromTemplate(
      pdfFilePath,
      student,
      finalProjectMember,
      jadwal,
      rekap,
      isPassed
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
   * Create BAP PDF from HTML template
   * Generates professional BAP document using Puppeteer with proper HTML rendering
   */
  private async createPdfFromTemplate(
    outputPath: string,
    student: any,
    finalProjectMember: any,
    jadwal: any,
    rekap: any,
    isPassed: boolean
  ) {
    let browser = null;
    try {
      // Generate HTML content
      const htmlContent = this.generateBapHtml(
        student,
        finalProjectMember,
        jadwal,
        rekap,
        isPassed
      );

      // Launch browser with proper configuration for production
      const launchOptions: any = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-dev-tools",
          "--no-first-run",
          "--no-default-browser-check",
        ],
      };

      // If executablePath is provided (for custom Chrome installation), use it
      if (process.env.CHROME_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
      }

      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({
        width: 210,
        height: 297,
        deviceScaleFactor: 1,
      });

      // Set content and wait for all resources to load
      await page.setContent(htmlContent, { waitUntil: "networkidle2" });

      // Generate PDF with proper formatting to match the HTML template style
      await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      console.log(`BAP PDF berhasil di-generate: ${outputPath}`);
    } catch (error) {
      console.error("Error creating BAP PDF:", error);
      throw new Error(
        `Gagal membuat BAP PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      if (browser) {
        await browser.close();
      }
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
   * Generate HTML content for BAP document
   * Loads HTML template dan inject data
   */
  private generateBapHtml(
    student: any,
    finalProjectMember: any,
    jadwal: any,
    rekap: any,
    isPassed: boolean
  ): string {
    try {
      // Load template HTML
      let htmlContent = fs.readFileSync(this.templatePath, "utf-8");

      // Load logo as base64
      const basePath = process.cwd();
      const logoPath = path.join(
        basePath,
        "src/templates/bap-pdf/logo_itera.png"
      );
      let logoBase64 = "";
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = logoBuffer.toString("base64");
        const logoDataUrl = `data:image/png;base64,${logoBase64}`;
        htmlContent = htmlContent.replace(
          /src=["']\.\/logo_itera\.png["']/g,
          `src="${logoDataUrl}"`
        );
      }

      // Prepare data
      const studentName = student.user?.name || "[nama-mahasiswa]";
      const studentNim = student.nim || "[nim-mahasiswa]";
      const projectTitle = (
        finalProjectMember.title || "[judul-tugas-akhir]"
      ).toUpperCase();
      const supervisor1Name =
        jadwal.defense_submission?.final_project?.supervisor_1?.user?.name ||
        "[nama-pembimbing1]";
      const supervisor1Nip =
        jadwal.defense_submission?.final_project?.supervisor_1?.nip ||
        "[nip-pembimbing1]";
      const supervisor2Name =
        jadwal.defense_submission?.final_project?.supervisor_2?.user?.name ||
        "[nama-pembimbing2]";
      const supervisor2Nip =
        jadwal.defense_submission?.final_project?.supervisor_2?.nip ||
        "[nip-pembimbing2]";

      // Format tanggal sidang
      const formattedDate = new Date(jadwal.scheduled_date).toLocaleDateString(
        "id-ID",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      );

      // start and end time
      const startTime = jadwal.start_time || "[start-time]";
      const endTime = jadwal.end_time || "[end-time]";

      // UPPERCASE jenis sidang
      const jenisSidang = (
        jadwal.defense_submission.defense_type || "[jenis-sidang]"
      ).toUpperCase();

      // reorder detailPerDosen dengan urutan detailPerDosen.role = Penguji 1, Penguji 2, Pembimbing 1, Pembimbing 2
      rekap.detailPerDosen.sort((a: any, b: any) => {
        const order = [
          "Pembimbing 1",
          "Pembimbing 2",
          "Penguji 1",
          "Penguji 2",
        ];
        return order.indexOf(a.role) - order.indexOf(b.role);
      });

      // Generate table rows
      const tabelPenilaian = (rekap.detailPerDosen || [])
        .map((dosen: any) => {
          return `<tr><td>${dosen.nama || "-"}</td><td>${
            dosen.role || "-"
          }</td><td class="nilai-column">${dosen.nilai || "-"}</td></tr>`;
        })
        .join("");

      const statusSidang = isPassed ? "LULUS" : "TIDAK LULUS";
      const nilaiSidang = rekap.nilaiAkhir || "-";

      // Replace placeholders dengan data
      htmlContent = htmlContent.replace(/{{formattedDate}}/g, formattedDate);
      htmlContent = htmlContent.replace(/{{jenisSidang}}/g, jenisSidang);
      htmlContent = htmlContent.replace(/{{startTime}}/g, startTime);
      htmlContent = htmlContent.replace(/{{endTime}}/g, endTime);
      htmlContent = htmlContent.replace(/{{studentName}}/g, studentName);
      htmlContent = htmlContent.replace(/{{studentNim}}/g, studentNim);
      htmlContent = htmlContent.replace(/{{projectTitle}}/g, projectTitle);
      htmlContent = htmlContent.replace(
        /{{supervisor1Name}}/g,
        supervisor1Name
      );
      htmlContent = htmlContent.replace(/{{supervisor1Nip}}/g, supervisor1Nip);
      htmlContent = htmlContent.replace(
        /{{supervisor2Name}}/g,
        supervisor2Name
      );
      htmlContent = htmlContent.replace(/{{supervisor2Nip}}/g, supervisor2Nip);
      htmlContent = htmlContent.replace(/{{tabelPenilaian}}/g, tabelPenilaian);
      htmlContent = htmlContent.replace(/{{statusSidang}}/g, statusSidang);
      htmlContent = htmlContent.replace(/{{nilaiSidang}}/g, nilaiSidang);

      return htmlContent;
    } catch (error) {
      console.error("Error generating BAP HTML:", error);
      throw new Error(
        `Gagal generate HTML BAP: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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
