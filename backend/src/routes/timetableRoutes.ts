import { Router } from 'express';
import {
  generateTimetable,
  getTimetables,
  getTimetableEntries,
  publishTimetable,
  archiveTimetable,
  deleteTimetable,
  getConflicts,
} from '../controllers/timetableController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/generate', requireRole(['ADMIN']), generateTimetable);
router.get('/versions', getTimetables);
router.get('/versions/:versionId/entries', getTimetableEntries);
router.get('/versions/:versionId/conflicts', getConflicts);
router.patch('/versions/:versionId/publish', requireRole(['ADMIN']), publishTimetable);
router.patch('/versions/:versionId/archive', requireRole(['ADMIN']), archiveTimetable);
router.delete('/versions/:versionId', requireRole(['ADMIN']), deleteTimetable);

export default router;
