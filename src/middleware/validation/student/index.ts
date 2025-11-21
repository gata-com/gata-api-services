import { body, ValidationChain, param } from "express-validator";

export const validateCreateFinalProject: ValidationChain[] = [
  body("type").trim().notEmpty().withMessage("Tipe tugas akhir harus diisi"),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status tugas akhir harus diisi"),

  body("supervisor1Id")
    .trim()
    .notEmpty()
    .withMessage("ID Dosen Pembimbing 1 harus diisi"),

  // supervisor1Id tidak boleh sama dengan supervisor2Id
  body("supervisor2Id").custom((value, { req }) => {
    if (value === req.body.supervisor1Id) {
      throw new Error(
        "ID Dosen Pembimbing 2 tidak boleh sama dengan ID Dosen Pembimbing 1"
      );
    }
    return true;
  }),

  body("source_topic")
    .trim()
    .notEmpty()
    .withMessage("Sumber topik harus diisi"),

  body("finalProjectPeriodId")
    .trim()
    .notEmpty()
    .withMessage("ID Periode Tugas Akhir harus diisi"),

  // Jika client mengirim members sebagai JSON string, otomatis parse.
  body("members")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          // kembalikan string agar isArray akan gagal dan menghasilkan error yang tepat
          return value;
        }
      }
      return value;
    })
    .isArray({ min: 1 })
    .withMessage(
      "Data anggota tugas akhir harus berupa array dan minimal 1 anggota"
    ),

  // Pastikan setiap item adalah object (bukan string/number/null)
  body("members.*").custom((member) => {
    if (
      typeof member !== "object" ||
      member === null ||
      Array.isArray(member)
    ) {
      throw new Error(
        "Setiap anggota harus berupa objek dengan properti yang sesuai"
      );
    }
    return true;
  }),

  // Validasi fields di dalam tiap anggota
  body("members.*.studentId").notEmpty().withMessage("Student ID harus diisi"),

  body("members.*.email")
    .trim()
    .notEmpty()
    .withMessage("Email harus diisi")
    .bail() // jika kosong, hentikan chain isEmail
    .isEmail()
    .withMessage("Format email anggota tidak valid"),

  body("members.*.title")
    .trim()
    .notEmpty()
    .withMessage("Judul tugas akhir anggota harus diisi"),

  body("members.*.resume")
    .trim()
    .notEmpty()
    .withMessage("Resume tugas akhir anggota harus diisi"),
];

export const validateFPChangeSupervisor: ValidationChain[] = [
  body("fpId")
    .notEmpty()
    .withMessage("ID Tugas Akhir harus diisi")
    .isInt()
    .withMessage("ID Tugas Akhir harus berupa angka"),
  body("supervisor_1"),
  body("supervisor_2"),
];

export const validateFPDelete: ValidationChain[] = [
  param("id").notEmpty().withMessage("ID Tugas Akhir harus diisi"),
];

export const validateGetSupervisors: ValidationChain[] = [
  param("userId").notEmpty().withMessage("User ID harus diisi"),
];

export const validateGSCreate: ValidationChain[] = [
  body("fpId")
    .notEmpty()
    .withMessage("ID Tugas Akhir harus diisi")
    .isInt()
    .withMessage("ID Tugas Akhir harus berupa angka"),
  body("lecturerId")
    .notEmpty()
    .withMessage("ID Dosen harus diisi")
    .isInt()
    .withMessage("ID Dosen harus berupa angka"),
  body("GAId")
    .notEmpty()
    .withMessage("ID Guidance Availability harus diisi")
    .isInt()
    .withMessage("ID Guidance Availability harus berupa angka"),
  body("topic").trim().notEmpty().withMessage("Topik bimbingan harus diisi"),
  body("supervisor_type")
    .notEmpty()
    .withMessage("Tipe pembimbing harus diisi")
    .isIn([1, 2])
    .withMessage("Tipe pembimbing harus berupa 1 atau 2"),
  body("draftLinks").isArray().withMessage("Draft links harus berupa array"),
];

export const validateGuidanceDashboard: ValidationChain[] = [
  param("userId")
    .notEmpty()
    .withMessage("userId tidak ditemukan")
    .isInt()
    .withMessage("userId harus berupa angka"),
];

export const validateGuidanceDefenseCreate: ValidationChain[] = [
  body("fpId")
    .notEmpty()
    .withMessage("ID Tugas Akhir harus diisi")
    .isInt()
    .withMessage("ID Tugas Akhir harus berupa angka"),
  body("expertiseGroup1Id")
    .notEmpty()
    .withMessage("ID Kelompok Keahlian harus diisi")
    .isInt()
    .withMessage("ID Kelompok Keahlian harus berupa angka"),
  body("expertiseGroup2Id")
    .notEmpty()
    .withMessage("ID Kelompok Keahlian harus diisi")
    .isInt()
    .withMessage("ID Kelompok Keahlian harus berupa angka"),
  body("lecturerId")
    .notEmpty()
    .withMessage("ID Dosen harus diisi")
    .isInt()
    .withMessage("ID Dosen harus berupa angka"),
  body("tipeSidang")
    .notEmpty()
    .withMessage("Tipe Sidang harus diisi")
    .isIn(["proposal", "hasil"])
    .withMessage("Tipe Sidang harus berupa 'proposal' atau 'hasil'"),
  body("finalDraftLinks")
    .isArray()
    .withMessage("Final draft links harus berupa array"),
  body("pptLinks").isArray().withMessage("PPT links harus berupa array"),
];
