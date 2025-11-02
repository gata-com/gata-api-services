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
