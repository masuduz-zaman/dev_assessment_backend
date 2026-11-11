import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware';
import { publicController } from './public.controller';
import { publicIdParams, publicJobsQuery, publicSearchQuery } from './public.validation';

const router = Router();

router.get('/assessments', validate({ query: publicSearchQuery }), publicController.assessments);
router.get('/assessments/:id', validate({ params: publicIdParams }), publicController.assessmentOverview);
router.get('/companies', validate({ query: publicSearchQuery }), publicController.companies);
router.get('/jobs', validate({ query: publicJobsQuery }), publicController.jobs);
router.get('/candidates', validate({ query: publicSearchQuery }), publicController.candidates);
router.get('/stats', publicController.stats);
router.get('/meta', publicController.meta);

export default router;
