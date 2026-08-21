import { Router } from 'express';
import { getAssignments, createAssignment, deleteAssignment } from '../controllers/assignmentController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssignments);
router.post('/', requireRole(['ADMIN']), createAssignment);
router.delete('/:id', requireRole(['ADMIN']), deleteAssignment);

export default router;
