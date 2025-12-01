import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";
import { TempExportCsvRepository } from "@/repositories/TempExportCsvRepository";
import { FinalProjectRepository } from "@/repositories/FinalProjectRepository";
import { generateCapstoneCode } from "@/utils/capstoneCode";

export class DefenseExportService {
  private fpRepo: FinalProjectRepository;
  private defenseRepo: DefenseSubmissionRepository;
  private tempExportCsvRepo: TempExportCsvRepository;

  constructor() {
    this.fpRepo = new FinalProjectRepository();
    this.defenseRepo = new DefenseSubmissionRepository();
    this.tempExportCsvRepo = new TempExportCsvRepository();
  }

  /**
   * move the data into temp table
   *
   */

  /**
   * Export defense submissions to CSV format
   * @param defense_type - optional filter by defense type (proposal, hasil)
   * @returns CSV string with proper headers
   */
  async exportToCSV(defense_type?: string): Promise<string> {
    // Get defense submissions
    const finalProjects = await this.fpRepo.findForCsvExport(defense_type);

    // delete All temp data before insert new temp data
    await this.tempExportCsvRepo.deleteAll();

    // transform data to fit required scheduler format data (insert into temp_export_csv)
    for (const fp of finalProjects) {
      const submission = fp.defense_submissions[0];
      const members = fp.members || [];

      // Generate capstone code if fp.type is 'capstone'
      let capstoneCode = "";
      if (fp.type === "capstone") {
        capstoneCode = await generateCapstoneCode();
      }

      for (const m of members) {
        // Get supervisor codes
        const supervisor1Code = fp.supervisor_1?.lecturer_code || "";
        const supervisor2Code = fp.supervisor_2?.lecturer_code || "";

        // Get examiner codes
        let examiner1Code = submission.examiner_1?.lecturer_code || "";
        let examiner2Code = submission.examiner_2?.lecturer_code || "";

        // Determine defense type label
        const defenseTypeLabel =
          submission.defense_type === "proposal" ? "Proposal" : "Sidang Akhir";

        const tempData = {
          nama: m.student?.user?.name || "",
          nim: m.student?.nim || "",
          judul: m.title || "",
          capstone_code: capstoneCode,
          type: defenseTypeLabel,
          field_1: submission.expertises_group_1?.name || "",
          field_2: submission.expertises_group_2?.name || "",
          spv_1: supervisor1Code,
          spv_2: supervisor2Code,
          date_time: "", // date_time must be blank for scheduler
          examiner_1: examiner1Code,
          examiner_2: examiner2Code,
          status: "", // status must be blank
        };

        await this.tempExportCsvRepo.insertTempData(tempData);
      }
    }

    // CSV Headers (2 rows as per requirement)
    const headerRow1 = [
      "nama",
      "nim",
      "judul",
      "capstone_code",
      "type",
      "field_1",
      "field_2",
      "spv_1",
      "spv_2",
      "date_time",
      "examiner_1",
      "examiner_2",
      "status",
    ];

    const headerRow2 = [
      "Nama",
      "Nim",
      "Judul",
      "Masukkan Kode Capstone",
      "Jenis Pendaftaran",
      "Kata Kunci Keilmuan - Opsi 1",
      "Kata Kunci Keilmuan - Opsi 2",
      "Pembimbing 1",
      "Pembimbing 2 (jika ada)",
      "",
      "Penguji 1 Ketika Seminar Proposal",
      "Penguji 2 Ketika Seminar Proposal",
      "",
    ];

    // Build CSV rows
    const csvRows: string[][] = [headerRow1, headerRow2];

    // get all temp data
    const tempDataList = await this.tempExportCsvRepo.findAll();

    for (const temp of tempDataList) {
      const row = [
        temp.nama,
        temp.nim,
        temp.judul,
        temp.capstone_code,
        temp.type,
        temp.field_1,
        temp.field_2,
        temp.spv_1,
        temp.spv_2,
        "", // date_time must be blank for scheduler
        temp.examiner_1,
        temp.examiner_2,
        "", // status must be blank
      ];

      csvRows.push(row);
    }

    // Convert to CSV string
    return this.arrayToCSV(csvRows);
  }

  /**
   * Convert 2D array to CSV string
   * @param data - 2D array of strings
   * @returns CSV formatted string
   */
  private arrayToCSV(data: string[][]): string {
    return data
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const escaped = cell.replace(/"/g, '""');
            if (
              escaped.includes(",") ||
              escaped.includes('"') ||
              escaped.includes("\n")
            ) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(",")
      )
      .join("\n");
  }

  /**
   * Assign examiners to a defense submission
   * @param submissionId - Defense submission ID
   * @param examiner1Id - Examiner 1 lecturer ID
   * @param examiner2Id - Examiner 2 lecturer ID
   * @param defenseDate - Date and time of defense
   */
  async assignExaminers(
    submissionId: number,
    examiner1Id?: number,
    examiner2Id?: number,
    defenseDate?: Date
  ): Promise<void> {
    const updateData: any = {};

    if (examiner1Id) {
      updateData.examiner_1_id = examiner1Id;
    }

    if (examiner2Id) {
      updateData.examiner_2_id = examiner2Id;
    }

    if (defenseDate) {
      updateData.defense_date = defenseDate;
    }

    // Generate capstone code if not exists
    const submission = await this.defenseRepo.findById(submissionId);
    if (submission && !submission.capstone_code) {
      updateData.capstone_code = await generateCapstoneCode();
    }

    await this.defenseRepo.updateDefenseSchedule(submissionId, updateData);
  }
}
