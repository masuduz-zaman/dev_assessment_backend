import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { assessmentsController } from './assessments.controller';
import { assessmentIdParams, assessmentListQuery, createAssessmentBody, updateAssessmentBody } from './assessments.validation';

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: assessmentListQuery }), assessmentsController.list);
router.post('/', requirePermission('assessment:create'), validate({ body: createAssessmentBody }), assessmentsController.create);
router.get('/:id', validate({ params: assessmentIdParams }), assessmentsController.getById);
router.patch('/:id', requirePermission('assessment:create'), validate({ params: assessmentIdParams, body: updateAssessmentBody }), assessmentsController.update);
router.delete('/:id', requirePermission('assessment:create'), validate({ params: assessmentIdParams }), assessmentsController.remove);
router.patch('/:id/publish', requirePermission('assessment:publish'), validate({ params: assessmentIdParams }), assessmentsController.publish);
router.patch('/:id/archive', requirePermission('assessment:publish'), validate({ params: assessmentIdParams }), assessmentsController.archive);

export default router;
