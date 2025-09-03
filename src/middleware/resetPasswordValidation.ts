import { body, param } from 'express-validator';

// Validation untuk forgot password
export const forgotPasswordValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase()
];

// Validation untuk reset password
export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 }) // Update untuk sesuai panjang token crypto (32 bytes = 64 hex)
    .withMessage('Invalid token format')
    .isAlphanumeric()
    .withMessage('Token must be alphanumeric'),
    
  body('new_password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Validation untuk verify token
export const verifyTokenValidation = [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 64, max: 64 }) // Update untuk sesuai panjang token crypto
    .withMessage('Invalid token format')
    .isAlphanumeric()
    .withMessage('Token must be alphanumeric')
];