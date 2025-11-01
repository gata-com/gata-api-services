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
