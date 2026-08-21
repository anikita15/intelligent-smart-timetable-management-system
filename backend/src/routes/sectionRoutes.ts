import { Router } from 'express';
import { getSections, createSection, updateSection, deleteSection } from '../controllers/sectionController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getSections);
router.post('/', requireRole(['ADMIN']), createSection);
router.put('/:id', requireRole(['ADMIN']), updateSection);
router.delete('/:id', requireRole(['ADMIN']), deleteSection);

export default router;
