import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { adminController } from './admin.controller';
import { companyListQuery, idParams, updateCompanyStatusBody, updateUserStatusBody, userListQuery } from './admin.validation';

const router = Router();
router.use(authenticate, allowRoles('SUPER_ADMIN'));

router.get('/companies', validate({ query: companyListQuery }), adminController.listCompanies);
router.patch('/companies/:id/status', validate({ params: idParams, body: updateCompanyStatusBody }), adminController.updateCompanyStatus);

router.get('/users', validate({ query: userListQuery }), adminController.listUsers);
router.patch('/users/:id/status', validate({ params: idParams, body: updateUserStatusBody }), adminController.updateUserStatus);

router.get('/assessments', adminController.listAssessments);
router.get('/payments', adminController.listPayments);
router.get('/audit-logs', adminController.auditLogs);
router.get('/reports', adminController.reports);

export default router;
