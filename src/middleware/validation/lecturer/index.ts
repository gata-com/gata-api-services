import { body, ValidationChain, param } from "express-validator";

export const validateFPApproval: ValidationChain[] = [
  // validate fpId parameter
  body("fpId")
    .notEmpty()
    .withMessage("fpId tidak ditemukan")
    .isInt()
    .withMessage("fpId harus berupa angka"),
  body("status")
    .notEmpty()
    .withMessage("status tidak ditemukan")
    .isIn(["approved", "rejected"])
    .withMessage("status harus berupa approved atau rejected"),
  body("supervisor_choices")
    .notEmpty()
    .withMessage("supervisor_choices tidak ditemukan")
    .isIn(["1", "2"])
    .withMessage("supervisor_choices harus berupa 1 atau 2"),
  body("note").optional(),
];

export const validateFPValidation: ValidationChain[] = [
  // validate userId parameter
  param("userId")
    .notEmpty()
    .withMessage("userId tidak ditemukan")
    .isInt()
    .withMessage("userId harus berupa angka"),
];

export const validateFPAddSlot: ValidationChain[] = [
  body("userId")
    .notEmpty()
    .withMessage("userId tidak ditemukan")
    .isInt()
    .withMessage("userId harus berupa angka"),
  body("supervisorType")
    .notEmpty()
    .withMessage("supervisorType tidak ditemukan")
    .isIn(["1", "2"])
    .withMessage("supervisorType harus berupa 1 atau 2"),
  body("amount")
    .notEmpty()
    .withMessage("amount tidak ditemukan")
    .isInt({ min: 1 })
    .withMessage("amount harus berupa angka minimal 1"),
];

export const validateGA: ValidationChain[] = [
  body("id").optional().isInt().withMessage("id harus berupa angka"),
  body("day_of_week")
    .notEmpty()
    .withMessage("hari tidak ditemukan")
    .isIn(["1", "2", "3", "4", "5"])
    .withMessage("hari harus berupa angka antara 1-5"),
  body("start_time").notEmpty().withMessage("jamMulai tidak ditemukan"),
  body("end_time").notEmpty().withMessage("jamSelesai tidak ditemukan"),
  body("location").notEmpty().withMessage("location tidak ditemukan"),
  body("user_id")
    .notEmpty()
    .withMessage("user_id tidak ditemukan")
    .isInt()
    .withMessage("user_id harus berupa angka"),
];

export const validateGADelete: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("id tidak ditemukan")
    .isInt()
    .withMessage("id harus berupa angka"),
];

export const validateGAAvailability: ValidationChain[] = [
  param("userId")
    .notEmpty()
    .withMessage("userId tidak ditemukan")
    .isInt()
    .withMessage("userId harus berupa angka"),
];

export const validateGuidanceDashboard: ValidationChain[] = [
  param("userId")
    .notEmpty()
    .withMessage("id tidak ditemukan")
    .isInt()
    .withMessage("id harus berupa angka"),
];

export const validateGuidaneActions: ValidationChain[] = [
  body("id")
    .notEmpty()
    .withMessage("GSId tidak ditemukan")
    .isInt()
    .withMessage("GSId harus berupa angka"),
  body("status")
    .notEmpty()
    .withMessage("status tidak ditemukan")
    .isIn(["scheduled", "ongoing", "completed", "no_show", "cancelled"])
    .withMessage(
      "status harus berupa scheduled, ongoing, completed, no_show, atau cancelled"
    ),
  body("lecturer_feedback").optional(),
];

export const validateDefenseSubmission: ValidationChain[] = [
  param("userId")
    .notEmpty()
    .withMessage("id tidak ditemukan")
    .isInt()
    .withMessage("id harus berupa angka"),
];

export const validateDefenseApproval: ValidationChain[] = [
  body("id")
    .notEmpty()
    .withMessage("id tidak ditemukan")
    .isInt()
    .withMessage("id harus berupa angka"),
  body("status")
    .notEmpty()
    .withMessage("status tidak ditemukan")
    .isIn(["approved", "rejected"])
    .withMessage("status harus berupa approved atau rejected"),
];

export const validateTotalStudents: ValidationChain[] = [
  param("userId")
    .notEmpty()
    .withMessage("id tidak ditemukan")
    .isInt()
    .withMessage("id harus berupa angka"),
];
