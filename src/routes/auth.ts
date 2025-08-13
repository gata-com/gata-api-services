import { Router } from 'express';
import { register, login, getProfile, refreshToken } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validation';
import { auth } from '../middleware/auth';

const router: Router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, getProfile);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Private
 */
router.post('/refresh', auth, refreshToken);

export default router;