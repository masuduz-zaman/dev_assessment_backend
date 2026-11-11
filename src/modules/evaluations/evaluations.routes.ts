import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { evaluationsController } from './evaluations.controller';
import { evaluateBody, submissionIdParams } from './evaluations.validation';

const router = Router();
router.use(authenticate, requirePermission('assessment:evaluate'));

router.get('/pending', evaluationsController.pending);
router.post('/:submissionId', validate({ params: submissionIdParams, body: evaluateBody }), evaluationsController.evaluate);

export default router;
