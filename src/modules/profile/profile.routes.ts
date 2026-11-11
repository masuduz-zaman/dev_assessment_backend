import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { profileController } from './profile.controller';
import { updateProfileBody } from './profile.validation';

const router = Router();
router.use(authenticate);

router.get('/', profileController.get);
router.patch('/', validate({ body: updateProfileBody }), profileController.update);

export default router;
