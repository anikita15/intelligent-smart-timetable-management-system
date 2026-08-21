import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/roomController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getRooms);
router.post('/', requireRole(['ADMIN']), createRoom);
router.put('/:id', requireRole(['ADMIN']), updateRoom);
router.delete('/:id', requireRole(['ADMIN']), deleteRoom);

export default router;
