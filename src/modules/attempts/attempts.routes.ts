import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { attemptsController } from './attempts.controller';
import { attemptIdParams, startAttemptBody, submitAttemptBody } from './attempts.validation';

const router = Router();
router.use(authenticate, allowRoles('CANDIDATE'));

router.post('/', validate({ body: startAttemptBody }), attemptsController.start);
router.post('/:id/submit', validate({ params: attemptIdParams, body: submitAttemptBody }), attemptsController.submit);

export default router;
