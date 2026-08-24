import { Router } from 'express';
import { login, setup, register, listUsers, updateUserSection } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/setup', setup);
router.post('/register', authenticateToken, requireRole(['ADMIN']), register);
router.get('/users', authenticateToken, requireRole(['ADMIN']), listUsers);
router.patch('/users/:id/section', authenticateToken, requireRole(['ADMIN']), updateUserSection);

export default router;
