import { Router } from 'express';
import { generateTimetable, getTimetables, getTimetableEntries } from '../controllers/timetableController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/generate', requireRole(['ADMIN']), generateTimetable);
router.get('/versions', getTimetables);
router.get('/versions/:versionId/entries', getTimetableEntries);

export default router;
