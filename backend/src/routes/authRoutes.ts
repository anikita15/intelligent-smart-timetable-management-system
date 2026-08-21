import { Router } from 'express';
import { login, setup } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/setup', setup);

export default router;
