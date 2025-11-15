import { body, ValidationChain, param } from "express-validator";

export const validateCreateFinalProjectPeriod: ValidationChain[] = [
  body("start_date").notEmpty().withMessage("Start date tidak boleh kosong"),
  body("end_date").notEmpty().withMessage("End date tidak boleh kosong"),

  // start_date tidak boleh sama atau setelah end_date
  body("start_date").custom((value, { req }) => {
    const endDate = req.body.end_date;
    if (new Date(value) >= new Date(endDate)) {
      throw new Error("Start date tidak boleh sama atau setelah end date");
    }
    return true;
  }),

  body("description")
    .optional()
    .isString()
    .withMessage("Description harus berupa string"),
];

