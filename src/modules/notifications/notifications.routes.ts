import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { notificationsController } from './notifications.controller';
import { notificationIdParams } from './notifications.validation';

const router = Router();
router.use(authenticate);

router.get('/', notificationsController.list);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', validate({ params: notificationIdParams }), notificationsController.markRead);

export default router;
