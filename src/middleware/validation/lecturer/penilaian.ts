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
  body("confirm")
    .notEmpty()
    .withMessage("Konfirmasi wajib diisi")
    .isBoolean()
    .withMessage("Confirm harus boolean")
    .equals("true")
    .withMessage("Anda harus konfirmasi untuk finalisasi"),
  handleValidationErrors,
];
