import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../shared/middlewares/authorize.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { teamController } from './team.controller';
import { addMemberBody, memberIdParams, updateMemberBody } from './team.validation';

const router = Router();
router.use(authenticate, requirePermission('team:manage'));

router.get('/', teamController.list);
router.post('/', validate({ body: addMemberBody }), teamController.add);
router.patch('/:id', validate({ params: memberIdParams, body: updateMemberBody }), teamController.update);
router.delete('/:id', validate({ params: memberIdParams }), teamController.remove);

export default router;
