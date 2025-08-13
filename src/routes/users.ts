import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserStats 
} from '../controllers/userController';
import { validateUpdateUser } from '../middleware/validation';
import { auth, adminAuth, selfOrAdminAuth } from '../middleware/auth';

const router: Router = Router();

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/stats', auth, adminAuth, getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters (Admin only)
 * @access  Private/Admin
 */
router.get('/', auth, adminAuth, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Self or Admin)
 * @access  Private
 */
router.get('/:id', auth, selfOrAdminAuth, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Self or Admin)
 * @access  Private
 */
router.put('/:id', auth, selfOrAdminAuth, validateUpdateUser, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user - soft delete (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', auth, adminAuth, deleteUser);

export default router;