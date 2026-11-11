import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles, requirePermission } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { applicationsController } from './applications.controller';
import { applicationIdParams, applicationStatusBody, applyBody, companyApplicationsQuery } from './applications.validation';

const router = Router();
router.use(authenticate);

router.post('/', allowRoles('CANDIDATE'), validate({ body: applyBody }), applicationsController.apply);
router.get('/mine', allowRoles('CANDIDATE'), applicationsController.listMine);
router.get('/company', requirePermission('recruitment:manage'), validate({ query: companyApplicationsQuery }), applicationsController.listForCompany);
router.patch('/:id/status', requirePermission('recruitment:manage'), validate({ params: applicationIdParams, body: applicationStatusBody }), applicationsController.updateStatus);

export default router;
