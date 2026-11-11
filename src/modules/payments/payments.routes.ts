import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { paymentsController } from './payments.controller';
import { checkoutBody, paymentIdParams } from './payments.validation';

const router = Router();
router.use(authenticate, allowRoles('COMPANY', 'CANDIDATE'));

router.post('/checkout', validate({ body: checkoutBody }), paymentsController.checkout);
router.get('/', paymentsController.listMine);
router.get('/:id', validate({ params: paymentIdParams }), paymentsController.getMine);
router.post('/:id/verify', validate({ params: paymentIdParams }), paymentsController.verify);

export default router;
