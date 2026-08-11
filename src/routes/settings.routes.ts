import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// GET is public so checkout can access it
router.get('/', getSettings);

// PATCH requires admin auth
router.patch('/', verifyToken, updateSettings);

export default router;
