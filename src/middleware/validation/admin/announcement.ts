import { body, ValidationChain } from "express-validator";

/**
 * Validate create announcement request
 */
export const validateCreateAnnouncement: ValidationChain[] = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Judul pengumuman harus diisi")
    .isLength({ max: 255 })
    .withMessage("Judul pengumuman maksimal 255 karakter"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Konten pengumuman harus diisi"),
  body("priority")
    .notEmpty()
    .withMessage("Priority harus diisi")
    .isIn(["low", "high"])
    .withMessage("Priority harus berisi low atau high"),
  body("is_published")
    .optional()
    .isBoolean()
    .withMessage("is_published harus berupa boolean"),
];

/**
 * Validate update announcement request
 */
export const validateUpdateAnnouncement: ValidationChain[] = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Judul pengumuman tidak boleh kosong")
    .isLength({ max: 255 })
    .withMessage("Judul pengumuman maksimal 255 karakter"),
  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Konten pengumuman tidak boleh kosong"),
  body("priority")
    .optional()
    .isIn(["low", "high"])
    .withMessage("Priority harus berisi low atau high"),
  body("is_published")
    .optional()
    .isBoolean()
    .withMessage("is_published harus berupa boolean"),
];
