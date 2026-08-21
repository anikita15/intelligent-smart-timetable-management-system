import { Router } from 'express';
import { seedTimeSlots, getTimeSlots } from '../controllers/timeSlotController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getTimeSlots);
router.post('/seed', requireRole(['ADMIN']), seedTimeSlots);

export default router;
