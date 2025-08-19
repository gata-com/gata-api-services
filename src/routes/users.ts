import { Router } from 'express';
import { UserController } from '../controllers/UserController/index';
import { validateUpdateUser } from '../middleware/validation';
import { auth, adminAuth, selfOrAdminAuth } from '../middleware/auth';
import { 
  forgotPasswordValidation, 
  resetPasswordValidation, 
  verifyTokenValidation 
} from '../middleware/resetPasswordValidation';
import { handleValidationErrors } from '../middleware/validation';

const router: Router = Router();
const userController = new UserController();

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/stats', auth, adminAuth, userController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters (Admin only)
 * @access  Private/Admin
 */
router.get('/', auth, adminAuth, userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Self or Admin)
 * @access  Private
 */
router.get('/:id', auth, selfOrAdminAuth, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Self or Admin)
 * @access  Private
 */
router.put('/:id', auth, selfOrAdminAuth, validateUpdateUser, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user - soft delete (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', auth, adminAuth, userController.deleteUser);

// Reset Password Routes
router.post('/forgot-password', 
  forgotPasswordValidation, 
  handleValidationErrors, 
  userController.forgotPassword
);

router.post('/reset-password', 
  resetPasswordValidation, 
  handleValidationErrors, 
  userController.resetPassword
);

router.get('/verify-reset-token/:token', 
  verifyTokenValidation, 
  handleValidationErrors, 
  userController.verifyResetToken
);

export default router;