import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { codingController } from './coding.controller';
import { executeCodeBody } from './coding.validation';

const router = Router();
router.use(authenticate);

router.post('/execute', allowRoles('CANDIDATE', 'SUPER_ADMIN'), validate({ body: executeCodeBody }), codingController.execute);

export default router;
