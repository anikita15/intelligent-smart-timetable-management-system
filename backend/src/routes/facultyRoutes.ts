import { Router } from 'express';
import { getFaculties, createFaculty, updateFaculty, deleteFaculty } from '../controllers/facultyController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Protect all faculty routes, only ADMIN can modify
router.use(authenticateToken);

router.get('/', getFaculties);
router.post('/', requireRole(['ADMIN']), createFaculty);
router.put('/:id', requireRole(['ADMIN']), updateFaculty);
router.delete('/:id', requireRole(['ADMIN']), deleteFaculty);

export default router;
