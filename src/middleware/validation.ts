import { body, ValidationChain, validationResult } from 'express-validator';
import { ApiResponse } from '../types';
import { Request, Response, NextFunction } from 'express';

export const validateRegister: ValidationChain[] = [
  body('nim')
    .trim()
    .isLength({ min: 8, max: 12 })
    .withMessage('NIM must be 8-12 characters')
    .isNumeric()
    .withMessage('NIM must contain only numbers'),
  
  body('nama')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('semester')
    .isInt({ min: 1, max: 14 })
    .withMessage('Semester must be between 1-14'),
  
  body('nomorWhatsapp')
    .trim()
    .matches(/^(\+62|62|0)[0-9]{9,13}$/)
    .withMessage('Invalid WhatsApp number format'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateUpdateUser: ValidationChain[] = [
  body('nama')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('semester')
    .optional()
    .isInt({ min: 1, max: 14 })
    .withMessage('Semester must be between 1-14'),
  
  body('nomorWhatsapp')
    .optional()
    .trim()
    .matches(/^(\+62|62|0)[0-9]{9,13}$/)
    .withMessage('Invalid WhatsApp number format'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

export const handleValidationErrors = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
    return;
  }
  
  next();
};