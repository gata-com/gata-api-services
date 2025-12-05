import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Validation error",
      errors: errors.array()[0],
    });
    return;
  }
  next();
};

/**
 * Validate submit penilaian
 */
export const validateSubmitPenilaian = [
  body("jawaban")
    .notEmpty()
    .withMessage("Jawaban wajib diisi")
    .isArray({ min: 1 })
    .withMessage("Jawaban harus array dan tidak boleh kosong"),
  body("jawaban.*.pertanyaanId")
    .notEmpty()
    .withMessage("Pertanyaan ID wajib diisi")
    .isUUID()
    .withMessage("Pertanyaan ID harus UUID"),
  body("jawaban.*.opsiJawabanId")
    .notEmpty()
    .withMessage("Opsi jawaban ID wajib diisi")
    .isUUID()
    .withMessage("Opsi jawaban ID harus UUID"),
  body("jawaban.*.nilai")
    .notEmpty()
    .withMessage("Nilai wajib diisi")
    .isInt({ min: 0, max: 5 })
    .withMessage("Nilai harus integer antara 0-5"),
  body("catatan")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Catatan maksimal 5000 karakter"),
  handleValidationErrors,
];

/**
 * Validate finalisasi
 */
export const validateFinalisasi = [
  body("jadwalId")
    .notEmpty()
    .withMessage("Jadwal ID wajib diisi")
    .isInt()
    .withMessage("Jadwal ID harus integer"),
  body("lecturerIds")
    .notEmpty()
    .withMessage("Lecturer ID wajib diisi")
    .isArray()
    .withMessage("Lecturer ID harus array of ids"),
];

/**
 * Validate save penilaian (Simpan Nilai endpoint)
 */
export const validateSavePenilaian = [
  body("jadwalId")
    .notEmpty()
    .withMessage("Jadwal ID wajib diisi")
    .isInt()
    .withMessage("Jadwal ID harus integer"),
  body("userId")
    .notEmpty()
    .withMessage("User ID wajib diisi")
    .isInt()
    .withMessage("User ID harus integer"),
  body("studentId")
    .notEmpty()
    .withMessage("Student ID wajib diisi")
    .isInt()
    .withMessage("Student ID harus integer"),
  body("nilaiPertanyaan")
    .notEmpty()
    .withMessage("Nilai pertanyaan wajib diisi")
    .isObject()
    .withMessage("Nilai pertanyaan harus object"),
  body("nilaiPertanyaan.*")
    .notEmpty()
    .withMessage("Nilai untuk setiap pertanyaan wajib diisi")
    .isNumeric()
    .withMessage("Nilai harus berupa angka")
    .custom((value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error("Nilai tidak boleh negatif");
      }
      return true;
    }),
  body("nilaiAkhir")
    .notEmpty()
    .withMessage("Nilai akhir wajib diisi")
    .isNumeric()
    .withMessage("Nilai akhir harus berupa angka")
    .custom((value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        throw new Error("Nilai akhir harus antara 0-100");
      }
      return true;
    }),
  body("nilaiHuruf")
    .notEmpty()
    .withMessage("Nilai huruf wajib diisi")
    .trim()
    .isLength({ min: 1, max: 5 })
    .withMessage("Nilai huruf harus 1-5 karakter"),
  body("catatan")
    .notEmpty()
    .withMessage("Catatan tidak boleh kosong")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Catatan minimal 10 karakter")
    .isLength({ max: 5000 })
    .withMessage("Catatan maksimal 5000 karakter"),
  handleValidationErrors,
];

/**
 * Validate update penilaian (Update Nilai endpoint)
 */
export const validateUpdateNilai = [
  body("penilaianId")
    .notEmpty()
    .withMessage("Penilaian ID wajib diisi")
    .isString()
    .withMessage("Penilaian ID harus string"),
  body("jadwalId")
    .notEmpty()
    .withMessage("Jadwal ID wajib diisi")
    .isInt()
    .withMessage("Jadwal ID harus integer"),
  body("userId")
    .notEmpty()
    .withMessage("User ID wajib diisi")
    .isInt()
    .withMessage("User ID harus integer"),
  body("studentId")
    .notEmpty()
    .withMessage("Student ID wajib diisi")
    .isInt()
    .withMessage("Student ID harus integer"),
  body("nilaiPertanyaan")
    .notEmpty()
    .withMessage("Nilai pertanyaan wajib diisi")
    .isObject()
    .withMessage("Nilai pertanyaan harus object"),
  body("nilaiPertanyaan.*")
    .notEmpty()
    .withMessage("Nilai untuk setiap pertanyaan wajib diisi")
    .isNumeric()
    .withMessage("Nilai harus berupa angka")
    .custom((value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error("Nilai tidak boleh negatif");
      }
      return true;
    }),
  body("nilaiAkhir")
    .notEmpty()
    .withMessage("Nilai akhir wajib diisi")
    .isNumeric()
    .withMessage("Nilai akhir harus berupa angka")
    .custom((value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        throw new Error("Nilai akhir harus antara 0-100");
      }
      return true;
    }),
  body("nilaiHuruf")
    .notEmpty()
    .withMessage("Nilai huruf wajib diisi")
    .trim()
    .isLength({ min: 1, max: 5 })
    .withMessage("Nilai huruf harus 1-5 karakter"),
  body("catatan")
    .notEmpty()
    .withMessage("Catatan tidak boleh kosong")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Catatan minimal 10 karakter")
    .isLength({ max: 5000 })
    .withMessage("Catatan maksimal 5000 karakter"),
  handleValidationErrors,
];
