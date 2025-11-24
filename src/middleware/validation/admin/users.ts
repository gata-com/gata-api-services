import { body, ValidationChain, param } from "express-validator";

export const validateAdminCreateUser: ValidationChain[] = [
  body("role")
    .isIn(["student", "admin", "lecturer"])
    .withMessage("Role harus salah satu dari student, admin, atau lecturer"),
  body("email").isEmail().withMessage("Email tidak valid"),
  body("name").notEmpty().withMessage("Name tidak boleh kosong"),
  body("nip").optional(),
  body("nim").optional(),
  body("initials").optional(),
  body("whatsapp_number").optional(),
  body("password").optional(),
];
