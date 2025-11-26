import { BeritaAcaraPDFRepository } from "@/repositories/BeritaAcaraPDFRepository";
import { PenilaianService } from "./penilaianService";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { StudentRepository } from "@/repositories/StudentRepository";
import { BeritaAcaraPDF } from "@/entities/beritaAcaraPDF";
import * as fs from "fs";
import * as path from "path";
import puppeteer from "puppeteer";

export class BapPdfService {
  private bapRepo: BeritaAcaraPDFRepository;
  private penilaianService: PenilaianService;
  private scheduleRepo: DefenseScheduleRepository;
  private studentRepo: StudentRepository;
  private storageDir: string;

  constructor() {
    this.bapRepo = new BeritaAcaraPDFRepository();
    this.penilaianService = new PenilaianService();
    this.scheduleRepo = new DefenseScheduleRepository();
    this.studentRepo = new StudentRepository();
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
   * Create BAP PDF from HTML template
   * Generates professional BAP document using HTML and converts to PDF
   */
  private async createPdfFromTemplate(
    outputPath: string,
    student: any,
    finalProjectMember: any,
    jadwal: any,
    rekap: any
  ) {
    try {
      // Generate HTML content
      const htmlContent = this.generateBapHtml(
        student,
        finalProjectMember,
        jadwal,
        rekap
      );

      // Convert HTML to PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: "A4",
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      await browser.close();
      console.log(`BAP PDF berhasil di-generate: ${outputPath}`);
    } catch (error) {
      console.error("Error creating BAP PDF:", error);
      throw new Error(
        `Gagal membuat BAP PDF: ${
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
   * Generate HTML content for BAP document
   * Creates HTML identical to the BAP form with all data filled in
   */
  private generateBapHtml(
    student: any,
    finalProjectMember: any,
    jadwal: any,
    rekap: any
  ): string {
    const studentName = student.user?.name || student.nim || "[nama-mahasiswa]";
    const studentNim = student.nim || "[nim-mahasiswa]";
    const projectTitle = finalProjectMember.title || "[judul-tugas-akhir]";
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
    const defenseDate = jadwal.scheduled_date || "[tanggal-sidang]";
    const defenseTime = `${jadwal.start_time || "[jam-mulai]"} - ${
      jadwal.end_time || "[jam-selesai]"
    }`;

    // Format tanggal ke format Indonesia
    const formattedDate = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Berita Acara Sidang</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.5;
          color: #000;
          background: #fff;
          padding: 0;
        }
        
        .container {
          max-width: 210mm;
          height: 297mm;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 3px solid #000;
          padding-bottom: 15px;
        }
        
        .header-content {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 20px;
          margin-bottom: 10px;
        }
        
        .logo-placeholder {
          width: 50px;
          height: 50px;
          background: #d4af37;
          border: 2px solid #8b7300;
          flex-shrink: 0;
          display: inline-block;
        }
        
        .header-text {
          text-align: center;
          flex: 1;
        }
        
        .header-text h1 {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 2px;
          line-height: 1.3;
        }
        
        .header-text p {
          font-size: 10pt;
          margin: 1px 0;
          line-height: 1.3;
        }
        
        .title {
          text-align: center;
          margin-bottom: 15px;
          font-weight: bold;
          font-size: 11pt;
          text-transform: uppercase;
          line-height: 1.4;
        }
        
        .intro-section {
          margin-bottom: 12px;
          font-size: 10pt;
          line-height: 1.6;
          text-align: justify;
        }
        
        .intro-date {
          color: #0066cc;
          font-weight: bold;
        }
        
        .data-section {
          margin-bottom: 10px;
          font-size: 10pt;
        }
        
        .data-row {
          display: flex;
          margin-bottom: 6px;
          line-height: 1.4;
        }
        
        .data-label {
          width: 140px;
          font-weight: normal;
        }
        
        .data-value {
          flex: 1;
          word-break: break-word;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 10pt;
          margin-top: 8px;
          margin-bottom: 6px;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10pt;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 6px;
          text-align: left;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
          font-size: 10pt;
        }
        
        td {
          height: 25px;
          vertical-align: middle;
        }
        
        .nilai-column {
          text-align: center;
        }
        
        .result-section {
          margin-top: 12px;
          font-size: 10pt;
        }
        
        .result-item {
          margin-bottom: 4px;
          text-align: justify;
        }
        
        .result-value {
          color: #0066cc;
          font-weight: bold;
        }
        
        .signature-section {
          margin-top: 20px;
          font-size: 10pt;
        }
        
        .signature-intro {
          margin-bottom: 8px;
          text-align: justify;
        }
        
        .signature-date {
          margin-bottom: 15px;
          margin-top: 8px;
        }
        
        .supervisor-sig {
          margin-top: 20px;
        }
        
        .sig-item {
          display: inline-block;
          width: 48%;
          margin-right: 4%;
          margin-bottom: 20px;
          vertical-align: top;
        }
        
        .sig-item:nth-child(even) {
          margin-right: 0;
        }
        
        .sig-name {
          margin-top: 40px;
          font-weight: bold;
          font-size: 9pt;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 8pt;
          color: #666;
          padding-top: 8px;
          border-top: 1px solid #ccc;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <div class="logo-placeholder"></div>
            <div class="header-text">
              <h1>KEMENTERIAN PENDIDIKAN TINGGI,<br>SAINS, DAN TEKNOLOGI</h1>
              <p>INSTITUT TEKNOLOGI SUMATERA</p>
              <p>FAKULTAS TEKNOLOGI INDUSTRI</p>
              <p>Jalan Terusan Ryacudu Way Halu, Kecamatan Jati Agung, Lampung Selatan 35365</p>
              <p>Telepon: (0721) 8030188 Website: fti.itera.ac.id, Email: fti@itera.ac.id</p>
            </div>
          </div>
        </div>
        
        <!-- Title -->
        <div class="title">
          BERITA ACARA SIDANG<br>
          PROGRAM STUDI TEKNIK INFORMATIKA<br>
          FAKULTAS TEKNOLOGI INDUSTRI<br>
          INSTITUT TEKNOLOGI SUMATERA
        </div>
        
        <!-- Introduction -->
        <div class="intro-section">
          Pada hari <span class="intro-date">${formattedDate}</span> telah diaksanakan Ujian Sidang [jenis-sidang] mahasiswa:
        </div>
        
        <!-- Student Data -->
        <div class="data-section">
          <div class="data-row">
            <div class="data-label">Nama</div>
            <div class="data-value">: ${studentName}</div>
          </div>
          <div class="data-row">
            <div class="data-label">NIM</div>
            <div class="data-value">: ${studentNim}</div>
          </div>
          <div class="data-row">
            <div class="data-label">Judul Tugas Akhir</div>
            <div class="data-value">: ${projectTitle}</div>
          </div>
        </div>
        
        <!-- Supervisors -->
        <div class="data-section">
          Setelah melihat, mendengar dan memperhatikan jalannya Ujian Sidang [jenis-sidang], maka tim penguji:
        </div>
        
        <div class="data-section">
          <div class="section-title">Pembimbing Utama:</div>
          <div class="data-row">
            <div class="data-label">Nama</div>
            <div class="data-value">: ${supervisor1Name}</div>
          </div>
          <div class="data-row">
            <div class="data-label">NIP</div>
            <div class="data-value">: ${supervisor1Nip}</div>
          </div>
        </div>
        
        <div class="data-section">
          <div class="section-title">Pembimbing Pendamping:</div>
          <div class="data-row">
            <div class="data-label">Nama</div>
            <div class="data-value">: ${supervisor2Name}</div>
          </div>
          <div class="data-row">
            <div class="data-label">NIP</div>
            <div class="data-value">: ${supervisor2Nip}</div>
          </div>
        </div>
        
        <!-- Grades Table -->
        <div class="section-title">Hasil Penilaian:</div>
        <table>
          <thead>
            <tr>
              <th>Nama Dosen</th>
              <th>Keterangan</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${(rekap.detailPerDosen || [])
              .map((dosen: any) => {
                return `<tr><td>${dosen.lecturerNama || "-"}</td><td>${
                  dosen.role || "-"
                }</td><td class="nilai-column">${
                  dosen.nilaiAkhir || "-"
                }</td></tr>`;
              })
              .join("")}
          </tbody>
        </table>
        
        <!-- Final Result -->
        <div class="result-section">
          <div class="result-item">
            Berdasarkan nilai yang diperoleh, maka diputuskan bahwa mahasiswa tersebut dinyatakan <span class="result-value">[status-sidang]</span> dengan nilai <span class="result-value">[nilai-sidang]</span>
          </div>
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
          <div class="signature-intro">
            Demikian berita acara ini dibuat untuk dipergunakan sebagaimana perlunya.
          </div>
          
          <div class="signature-date">
            Lampung Selatan, ${formattedDate}
          </div>
          
          <div class="supervisor-sig">
            <div class="sig-item">
              <p>Pembimbing Utama,</p>
              <div class="sig-name">
                ${supervisor1Name}<br>
                NIP: ${supervisor1Nip}
              </div>
            </div>
            
            <div class="sig-item">
              <p>Pembimbing Pendamping,</p>
              <div class="sig-name">
                ${supervisor2Name}<br>
                NIP: ${supervisor2Nip}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Dokumen ini digenerate otomatis oleh Sistem Informasi GATA pada ${formattedDate}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
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
