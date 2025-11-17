import { body, ValidationChain } from "express-validator";

export const validateRegister: ValidationChain[] = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name tidak boleh kosong")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name hanya boleh antara 2-100 karakter")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name hanya boleh mengandung huruf dan spasi"),
  body("email")
    .notEmpty()
    .withMessage("Email tidak boleh kosong")
    .isEmail()
    .normalizeEmail()
    .withMessage("Format email tidak valid"),
  body("password")
    .notEmpty()
    .withMessage("Password tidak boleh kosong")
    .isLength({ min: 8 })
    .withMessage("Password harus memiliki minimal 8 karakter"),
  // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  // .withMessage(
  //   "Password harus mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka"
  // ),
  body("nim")
    .trim()
    .isLength({ min: 8, max: 12 })
    .withMessage("NIM hanya boleh antara 8-12 karakter"),
  body("semester")
    .isInt({ min: 1, max: 14 })
    .withMessage("Semester hanya boleh antara 1-14"),

  body("whatsapp_number")
    .trim()
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,9}$/)
    .withMessage("Format nomor WhatsApp tidak valid"),
];

export const validateLogin: ValidationChain[] = [
  body("email")
    .notEmpty()
    .withMessage("Email tidak boleh kosong")
    .isEmail()
    .normalizeEmail()
    .withMessage("Format email tidak valid"),

  body("password").notEmpty().withMessage("Password harus diisi"),
];

export const forgotPasswordValidation: ValidationChain[] = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Format email tidak valid"),
];

export const resetPasswordValidation: ValidationChain[] = [
  body("token").notEmpty().withMessage("Token harus diisi"),
  body("password").notEmpty().withMessage("Password harus diisi"),
];

export const validateUpdateUser: ValidationChain[] = [
  body("nama")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nama hanya boleh antara 2-100 karakter")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Nama hanya boleh mengandung huruf dan spasi"),

  body("semester")
    .optional()
    .isInt({ min: 1, max: 14 })
    .withMessage("Semester hanya boleh antara 1-14"),

  body("nomorWhatsapp")
    .optional()
    .trim()
    .matches(/^(\+62|62|0)[0-9]{9,13}$/)
    .withMessage("Format nomor WhatsApp tidak valid"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Format email tidak valid"),

  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password harus memiliki minimal 6 karakter"),
  // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  // .withMessage(
  //   "Password harus mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka"
  // ),
];
