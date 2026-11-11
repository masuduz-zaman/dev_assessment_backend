import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles, requirePermission } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { offersController } from './offers.controller';
import { createOfferBody, offerIdParams, respondOfferBody } from './offers.validation';

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('recruitment:manage'), validate({ body: createOfferBody }), offersController.create);
router.get('/company', requirePermission('recruitment:manage'), offersController.listForCompany);
router.get('/mine', allowRoles('CANDIDATE'), offersController.listMine);
router.patch('/:id/respond', allowRoles('CANDIDATE'), validate({ params: offerIdParams, body: respondOfferBody }), offersController.respond);

export default router;
