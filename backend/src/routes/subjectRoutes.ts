import { Router } from 'express';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getSubjects);
router.post('/', requireRole(['ADMIN']), createSubject);
router.put('/:id', requireRole(['ADMIN']), updateSubject);
router.delete('/:id', requireRole(['ADMIN']), deleteSubject);

export default router;
