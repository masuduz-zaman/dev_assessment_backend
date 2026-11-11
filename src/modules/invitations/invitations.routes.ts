import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { allowRoles, requirePermission } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { invitationsController } from './invitations.controller';
import { assessmentParams, createInvitationBody, invitationIdParams } from './invitations.validation';

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('assessment:invite'), validate({ body: createInvitationBody }), invitationsController.create);
router.get('/mine', allowRoles('CANDIDATE'), invitationsController.listMine);
router.get('/assessment/:assessmentId', requirePermission('assessment:invite'), validate({ params: assessmentParams }), invitationsController.listForAssessment);
router.post('/:id/accept', allowRoles('CANDIDATE'), validate({ params: invitationIdParams }), invitationsController.accept);

export default router;
