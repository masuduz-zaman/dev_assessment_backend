import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles, requirePermission } from '../../shared/middlewares/authorize.middleware';
import { resultsController } from './results.controller';

const router = Router();
router.use(authenticate);

router.get('/mine', allowRoles('CANDIDATE'), resultsController.listMine);
router.get('/company', requirePermission('assessment:evaluate'), resultsController.listForCompany);

export default router;
