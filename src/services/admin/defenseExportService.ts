import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";
import { generateCapstoneCode } from "@/utils/capstoneCode";

export class DefenseExportService {
  private defenseRepo: DefenseSubmissionRepository;

  constructor() {
    this.defenseRepo = new DefenseSubmissionRepository();
  }

  /**
   * Export defense submissions to CSV format
   * @param defense_type - optional filter by defense type (proposal, hasil)
   * @returns CSV string with proper headers
   */
  async exportToCSV(defense_type?: string): Promise<string> {
    // Get defense submissions
    const submissions = await this.defenseRepo.findForCsvExport(defense_type);

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

    for (const submission of submissions) {
      const fp = submission.final_project;
      const members = fp.members || [];

      // Get first member (ketua) for main data
      const leader = members[0];
      if (!leader) continue;

      const student = leader.student;
      const studentUser = student?.user;

      // Generate capstone code if not exists
      let capstoneCode = submission.capstone_code;
      if (!capstoneCode) {
        capstoneCode = await generateCapstoneCode();
        // Update in database
        await this.defenseRepo.updateDefenseSchedule(submission.id, {
          capstone_code: capstoneCode,
        });
      }

      // Get supervisor codes
      const supervisor1Code =
        fp.supervisor_1?.user?.name?.substring(0, 3).toUpperCase() || "";
      const supervisor2Code = fp.supervisor_2
        ? fp.supervisor_2.user?.name?.substring(0, 3).toUpperCase()
        : "";

      // Get examiner codes (from sidang proposal)
      let examiner1Code = "";
      let examiner2Code = "";

      if (submission.defense_type === "hasil") {
        // For sidang akhir, get examiners from sidang proposal
        const proposalSubmission =
          await this.defenseRepo.findByFinalProjectAndType(fp.id, "proposal");

        if (proposalSubmission) {
          examiner1Code = proposalSubmission.examiner_1
            ? proposalSubmission.examiner_1.user?.name
                ?.substring(0, 3)
                .toUpperCase()
            : "";
          examiner2Code = proposalSubmission.examiner_2
            ? proposalSubmission.examiner_2.user?.name
                ?.substring(0, 3)
                .toUpperCase()
            : "";
        }
      } else if (submission.defense_type === "proposal") {
        // For sidang proposal, use current examiners
        examiner1Code = submission.examiner_1
          ? submission.examiner_1.user?.name?.substring(0, 3).toUpperCase()
          : "";
        examiner2Code = submission.examiner_2
          ? submission.examiner_2.user?.name?.substring(0, 3).toUpperCase()
          : "";
      }

      // Determine defense type label
      const defenseTypeLabel =
        submission.defense_type === "proposal" ? "Proposal" : "Sidang Akhir";

      const row = [
        studentUser?.name || "",
        student?.nim || "",
        leader.title || "",
        capstoneCode,
        defenseTypeLabel,
        submission.expertises_group_1?.name || "",
        submission.expertises_group_2?.name || "",
        supervisor1Code,
        supervisor2Code,
        "", // date_time must be blank for scheduler
        examiner1Code,
        examiner2Code,
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
