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
 * Validate create rubrik
 */
export const validateCreateRubrik = [
  body("nama")
    .trim()
    .notEmpty()
    .withMessage("Nama rubrik wajib diisi")
    .isLength({ max: 255 })
    .withMessage("Nama rubrik maksimal 255 karakter"),
  body("type")
    .notEmpty()
    .withMessage("Type rubrik wajib diisi")
    .isIn(["SID", "SEM"])
    .withMessage("Type harus SID atau SEM"),
  body("deskripsi")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Deskripsi maksimal 1000 karakter"),
  handleValidationErrors,
];

/**
 * Validate update rubrik
 */
export const validateUpdateRubrik = [
  body("nama")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nama rubrik tidak boleh kosong")
    .isLength({ max: 255 })
    .withMessage("Nama rubrik maksimal 255 karakter"),
  body("type")
    .optional()
    .isIn(["SID", "SEM"])
    .withMessage("Type harus SID atau SEM"),
  body("deskripsi")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Deskripsi maksimal 1000 karakter"),
  body("isActive").optional().isBoolean().withMessage("isActive harus boolean"),
  handleValidationErrors,
];

/**
 * Validate create group
 */
export const validateCreateGroup = [
  body("nama")
    .trim()
    .notEmpty()
    .withMessage("Nama group wajib diisi")
    .isLength({ max: 255 })
    .withMessage("Nama group maksimal 255 karakter"),
  body("bobotTotal")
    .notEmpty()
    .withMessage("Bobot total wajib diisi")
    .isFloat({ min: 0 })
    .withMessage("Bobot total harus angka positif"),
  body("urutan")
    .notEmpty()
    .withMessage("Urutan wajib diisi")
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];

/**
 * Validate update group
 */
export const validateUpdateGroup = [
  body("nama")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nama group tidak boleh kosong")
    .isLength({ max: 255 })
    .withMessage("Nama group maksimal 255 karakter"),
  body("bobotTotal")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Bobot total harus angka positif"),
  body("urutan")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];

/**
 * Validate create pertanyaan
 */
export const validateCreatePertanyaan = [
  body("text")
    .trim()
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Text pertanyaan maksimal 1000 karakter"),
  body("bobot")
    .notEmpty()
    .withMessage("Bobot wajib diisi")
    .isFloat({ min: 0 })
    .withMessage("Bobot harus angka positif"),
  body("urutan")
    .notEmpty()
    .withMessage("Urutan wajib diisi")
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];

/**
 * Validate update pertanyaan
 */
export const validateUpdatePertanyaan = [
  body("text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Text pertanyaan tidak boleh kosong")
    .isLength({ max: 1000 })
    .withMessage("Text pertanyaan maksimal 1000 karakter"),
  body("bobot")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Bobot harus angka positif"),
  body("urutan")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];

/**
 * Validate create opsi jawaban
 */
export const validateCreateOpsi = [
  body("text")
    .trim()
    .optional()
    .isLength({ max: 255 })
    .withMessage("Text opsi maksimal 255 karakter"),
  body("nilai")
    .notEmpty()
    .withMessage("Nilai wajib diisi")
    .isInt({ min: 0, max: 5 })
    .withMessage("Nilai harus integer antara 0-5"),
  body("urutan")
    .notEmpty()
    .withMessage("Urutan wajib diisi")
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];

/**
 * Validate update opsi jawaban
 */
export const validateUpdateOpsi = [
  body("text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Text opsi tidak boleh kosong")
    .isLength({ max: 255 })
    .withMessage("Text opsi maksimal 255 karakter"),
  body("nilai")
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage("Nilai harus integer antara 0-5"),
  body("urutan")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];

/**
 * Validate rentang nilai for create
 */
export const validateRentangNilai = [
  body("grade")
    .trim()
    .notEmpty()
    .withMessage("Grade wajib diisi")
    .isLength({ max: 5 })
    .withMessage("Grade maksimal 5 karakter"),
  body("minScore")
    .notEmpty()
    .withMessage("Min score wajib diisi")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Min score harus antara 0-100"),
  body("urutan")
    .notEmpty()
    .withMessage("Urutan wajib diisi")
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];

/**
 * Validate rentang nilai for update (optional fields)
 */
export const validateUpdateRentangNilai = [
  body("grade")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Grade tidak boleh kosong")
    .isLength({ max: 5 })
    .withMessage("Grade maksimal 5 karakter"),
  body("minScore")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Min score harus antara 0-100"),
  body("urutan")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Urutan harus integer positif"),
  handleValidationErrors,
];
