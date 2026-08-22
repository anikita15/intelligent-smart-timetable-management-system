import { Router } from 'express';
import { login, setup, register, listUsers } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/setup', setup);
router.post('/register', authenticateToken, requireRole(['ADMIN']), register);
router.get('/users', authenticateToken, requireRole(['ADMIN']), listUsers);

export default router;
