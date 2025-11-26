import { BeritaAcaraPenilaianRepository } from "@/repositories/BeritaAcaraPenilaianRepository";
import { PenilaianService } from "./penilaianService";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { BeritaAcaraPenilaian } from "@/entities/beritaAcaraPenilaian";
import * as fs from "fs/promises";
import * as path from "path";

export class BapService {
  private bapRepo: BeritaAcaraPenilaianRepository;
  private penilaianService: PenilaianService;
  private scheduleRepo: DefenseScheduleRepository;

  constructor() {
    this.bapRepo = new BeritaAcaraPenilaianRepository();
    this.penilaianService = new PenilaianService();
    this.scheduleRepo = new DefenseScheduleRepository();
  }

  /**
   * Generate BAP PDF
   */
  async generateBap(jadwalId: number): Promise<BeritaAcaraPenilaian> {
    // Check if BAP already exists
    const existing = await this.bapRepo.findByJadwalId(jadwalId);

    // Get jadwal details first to extract student ID
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

    const student = finalProjectMember.student;
    const studentId = student.id;

    // Get rekap nilai
    const rekap = await this.penilaianService.getRekapNilai(
      jadwalId,
      studentId
    );

    // Jika tidak ada penilaian, tidak bisa generate BAP
    if (!rekap) {
      throw new Error("Belum ada penilaian untuk membuat BAP");
    }

    // Generate filename
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const fileName = `BAP_${student.nim}_${student.user?.name.replace(
      /\s/g,
      ""
    )}_${date}.pdf`;

    // TODO: Generate actual PDF using puppeteer or similar
    // For now, we'll just create a placeholder
    const fileUrl = `/storage/bap/${fileName}`;

    const bapData = {
      jadwalId,
      fileName,
      fileUrl,
      nilaiAkhir: rekap.nilaiAkhir,
      nilaiHuruf: rekap.nilaiHuruf,
      catatan: this.generateCatatanBap(rekap),
    };

    if (existing) {
      return (await this.bapRepo.update(existing.id, bapData))!;
    } else {
      return await this.bapRepo.create(bapData);
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
   * Get BAP by jadwal ID
   */
  async getBapByJadwalId(
    jadwalId: number
  ): Promise<BeritaAcaraPenilaian | null> {
    return await this.bapRepo.findByJadwalId(jadwalId);
  }

  /**
   * Generate BAP HTML for preview
   */
  async generateBapHtml(jadwalId: number): Promise<string> {
    const jadwal = await this.scheduleRepo.findByDefenseSubmissionId(jadwalId);

    if (!jadwal) {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Berita Acara Penilaian</title>
</head>
<body>
  <h2>Berita Acara Penilaian</h2>
  <p>Belum ada penilaian untuk jadwal ini.</p>
</body>
</html>
      `;
    }

    const submission = jadwal.defense_submission;
    const finalProject = submission.final_project;
    const finalProjectMember = finalProject.members?.[0];

    if (!finalProjectMember) {
      throw new Error("Final project member tidak ditemukan");
    }

    const student = finalProjectMember.student;
    const studentId = student.id;

    const rekap = await this.penilaianService.getRekapNilai(
      jadwalId,
      studentId
    );

    // Jika tidak ada penilaian, return placeholder
    if (!rekap) {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Berita Acara Penilaian</title>
</head>
<body>
  <h2>Berita Acara Penilaian</h2>
  <p>Belum ada penilaian untuk jadwal ini.</p>
</body>
</html>
      `;
    }

    // Generate HTML BAP
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Berita Acara Penilaian</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .info-table {
      width: 100%;
      margin-bottom: 20px;
    }
    .info-table td {
      padding: 5px;
      vertical-align: top;
    }
    .info-table td:first-child {
      width: 200px;
      font-weight: bold;
    }
    .nilai-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .nilai-table th,
    .nilai-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    .nilai-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .signature {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      margin-top: 60px;
      border-top: 1px solid #000;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">BERITA ACARA PENILAIAN SIDANG TUGAS AKHIR</div>
  </div>

  <table class="info-table">
    <tr>
      <td>Nama Mahasiswa</td>
      <td>: ${student.user?.name || student.nim}</td>
    </tr>
    <tr>
      <td>NIM</td>
      <td>: ${student.nim}</td>
    </tr>
    <tr>
      <td>Judul Tugas Akhir</td>
      <td>: ${finalProjectMember.title}</td>
    </tr>
    <tr>
      <td>Tanggal Sidang</td>
      <td>: ${jadwal.scheduled_date}</td>
    </tr>
    <tr>
      <td>Waktu</td>
      <td>: ${jadwal.start_time} - ${jadwal.end_time}</td>
    </tr>
  </table>

  <table class="nilai-table">
    <thead>
      <tr>
        <th>Dosen</th>
        <th>Role</th>
        <th>Nilai</th>
      </tr>
    </thead>
    <tbody>
      ${rekap.detailPerDosen
        .map(
          (d: any) => `
        <tr>
          <td>${d.lecturerNama}</td>
          <td>${d.role}</td>
          <td>${d.nilaiAkhir}</td>
        </tr>
      `
        )
        .join("")}
      <tr>
        <td colspan="2"><strong>Rata-rata Pembimbing</strong></td>
        <td><strong>${rekap.rata2Pembimbing}</strong></td>
      </tr>
      <tr>
        <td colspan="2"><strong>Rata-rata Penguji</strong></td>
        <td><strong>${rekap.rata2Penguji}</strong></td>
      </tr>
      <tr>
        <td colspan="2"><strong>Nilai Akhir</strong></td>
        <td><strong>${rekap.nilaiAkhir} (${rekap.nilaiHuruf})</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="signature">
    ${rekap.detailPerDosen
      .map(
        (d: any) => `
      <div class="signature-box">
        <div>${d.role}</div>
        <div class="signature-line">${d.lecturerNama}</div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>
    `;

    return html;
  }
}
