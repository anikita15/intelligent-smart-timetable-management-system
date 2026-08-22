import { Router } from 'express';
import { getPreferences, setPreferences } from '../controllers/facultyPreferenceController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

// GET /api/faculty/:id/preferences
router.get('/:id/preferences', authenticateToken, getPreferences);
// POST /api/faculty/:id/preferences  (admin only)
router.post('/:id/preferences', authenticateToken, requireRole(['ADMIN']), setPreferences);

export default router;
