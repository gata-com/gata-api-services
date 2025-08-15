import { Router } from 'express';

// Import langsung dari file individual (jangan pakai barrel export dulu)
import { register } from '../controllers/auth/register';
import { login } from '../controllers/auth/login';
import { forgotPassword } from '../controllers/auth/forgotPassword';
import { resetPassword } from '../controllers/auth/resetPassword';
import { getProfile } from '../controllers/auth/getProfile';
import { refreshToken } from '../controllers/auth/refreshToken';
import { verifyResetToken } from '../controllers/auth/verifyResetToken';

// Middleware imports
import { 
  validateRegister, 
  validateLogin
} from '../middleware/validation';
import { 
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyTokenValidation
} from '../middleware/resetPasswordValidation';
import { auth } from '../middleware/auth';

const router: Router = Router();

// Basic routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', auth, getProfile);
router.post('/refresh', auth, refreshToken);

// Reset password routes
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.get('/reset-password/:token', verifyTokenValidation, verifyResetToken);
router.post('/reset-password', /* resetPasswordValidation, */  resetPassword);

// Test route untuk debug
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes working!',
    routes: [
      'POST /register',
      'POST /login', 
      'GET /profile',
      'POST /refresh',
      'POST /forgot-password',
      'GET /reset-password/:token',
      'POST /reset-password'
    ]
  });
});

export default router;