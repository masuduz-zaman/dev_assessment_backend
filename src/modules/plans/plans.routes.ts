import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { plansController } from './plans.controller';
import { createPlanBody, planIdParams, updatePlanBody } from './plans.validation';

const router = Router();

router.get('/', plansController.list);
router.get('/all', authenticate, allowRoles('SUPER_ADMIN'), plansController.listAll);
router.post('/', authenticate, allowRoles('SUPER_ADMIN'), validate({ body: createPlanBody }), plansController.create);
router.patch('/:id', authenticate, allowRoles('SUPER_ADMIN'), validate({ params: planIdParams, body: updatePlanBody }), plansController.update);

export default router;
