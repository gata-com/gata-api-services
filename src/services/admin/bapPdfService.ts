import { BeritaAcaraPDFRepository } from "@/repositories/BeritaAcaraPDFRepository";
import { PenilaianService } from "./penilaianService";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { StudentRepository } from "@/repositories/StudentRepository";
import { RentangNilaiRepository } from "@/repositories/RentangNilaiRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { SignatureRepository } from "@/repositories/SignatureRepository";
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
  private lecturerRepo: LecturerRepository;
  private signatureRepo: SignatureRepository;
  private BAPDir: string;
  private templatePath: string;
  private storageDir: string;

  constructor() {
    this.bapRepo = new BeritaAcaraPDFRepository();
    this.penilaianService = new PenilaianService();
    this.scheduleRepo = new DefenseScheduleRepository();
    this.studentRepo = new StudentRepository();
    this.rentangRepo = new RentangNilaiRepository();
    this.lecturerRepo = new LecturerRepository();
    this.signatureRepo = new SignatureRepository();

    // Use process.cwd() for consistent path resolution in both dev and production
    const basePath = process.cwd();
    this.storageDir = path.join(basePath, "src/storages");
    this.BAPDir = path.join(this.storageDir, "bap-pdf");

    this.templatePath = path.join(
      basePath,
      "src/templates/bap-pdf/bap-template.html"
    );

    // Pastikan storage dir exists
    if (!fs.existsSync(this.BAPDir)) {
      fs.mkdirSync(this.BAPDir, { recursive: true });
    }
  }

  /**
   * Generate random text untuk nama file unik
   */
  private generateRandomText(length: number = 8): string {
    const chars = "abcdefghijklmnopqrs-tuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate BAP PDF untuk mahasiswa
   * Jika PDF sudah ada, akan di-update dengan data terbaru (bukan ditimpa)
   */
  async generateBapForStudent(
    userId: number,
    jadwalId: number,
    studentId: number
  ): Promise<BeritaAcaraPDF | any> {
    // Get student data
    const student = await this.studentRepo.findById(studentId);
    if (!student) {
      throw new Error("Student tidak ditemukan");
    }

    // cek dosen
    const lecturer = await this.lecturerRepo.findByUserId(userId);
    if (!lecturer) {
      throw new Error("Lecturer tidak ditemukan");
    }

    // Cek apakah dosen sudah punya tanda tangan
    const signature = await this.signatureRepo.findByLecturerId(lecturer.id);
    if (!signature || !signature.signature_url) {
      return "ttd missing";
    }

    // Format: BAP_121140044_RANDOM8CHARS
    const randomText = this.generateRandomText(30);
    const pdfName = `BAP_${randomText}`;
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
      lecturer.id,
      jadwalId,
      studentId
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
    const pdfFilePath = path.join(this.BAPDir, pdfFileName);

    await this.createPdfFromTemplate(
      pdfFilePath,
      student,
      finalProjectMember,
      jadwal,
      rekap,
      isPassed,
      signature
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
    isPassed: boolean,
    signature: any
  ) {
    let browser = null;
    try {
      // Generate HTML content
      const htmlContent = this.generateBapHtml(
        student,
        finalProjectMember,
        jadwal,
        rekap,
        isPassed,
        signature
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
    isPassed: boolean,
    signature: any
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
        jadwal.defense_submission.defense_type === "proposal"
          ? "PROPOSAL"
          : "AKHIR"
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
          }</td>`;
        })
        .join("");

      const statusSidang = isPassed ? "LULUS" : "TIDAK LULUS";
      const nilaiSidang = rekap.nilaiAkhir || "-";
      const nilaiHuruf = rekap.nilaiHuruf || "-";

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
      htmlContent = htmlContent.replace(/{{nilaiHuruf}}/g, nilaiHuruf);

      // Load signature image as base64
      let signatureDataUrl = "";
      if (signature && signature.signature_url) {
        // signature_url format: /signatures/SIGNATURE_199111272022031007_1764853778518.png
        const signaturePath = path.join(
          this.storageDir,
          signature.signature_url.replace(/^\//, "")
        );
        if (fs.existsSync(signaturePath)) {
          const signatureBuffer = fs.readFileSync(signaturePath);
          const signatureBase64 = signatureBuffer.toString("base64");
          signatureDataUrl = `data:image/png;base64,${signatureBase64}`;
        }
      }

      // Inject signature image into HTML
      if (signatureDataUrl) {
        htmlContent = htmlContent.replace(
          /{{signatureImage}}/g,
          `<img src="${signatureDataUrl}" alt="Tanda Tangan" style="width: 120px; height: auto; border: none; outline: none; box-shadow: none; display: block; margin: 0; padding: 0;" />`
        );
      } else {
        htmlContent = htmlContent.replace(/{{signatureImage}}/g, "");
      }

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
    return path.join(this.BAPDir, pdfName);
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
