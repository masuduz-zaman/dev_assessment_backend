import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { dashboardController } from './dashboard.controller';

const router = Router();
router.get('/', authenticate, dashboardController.get);

export default router;
