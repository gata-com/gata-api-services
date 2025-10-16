import { body, ValidationChain } from "express-validator";

export const validateCreateFinalProjectPeriod: ValidationChain[] = [
  body("start_date").notEmpty().withMessage("Start date tidak boleh kosong"),
  body("end_date").notEmpty().withMessage("End date tidak boleh kosong"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description harus berupa string"),
];
