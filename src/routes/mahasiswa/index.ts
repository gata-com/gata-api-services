import { Router } from 'express';
import mahasiswaRoutes from './mahasiswa';
import profileRoutes from './profile';

const router = Router();

// Mahasiswa routes
router.use('/', mahasiswaRoutes);

// Profile routes  
router.use('/', profileRoutes);

export default router;