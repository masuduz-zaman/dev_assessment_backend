import { Router } from 'express';
import { authenticateOptional } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { rankingsController } from './rankings.controller';
import { rankingQuery } from './rankings.validation';

const router = Router();

// The public leaderboard is open; company scope needs a signed in company user (checked in the service).
router.get('/', authenticateOptional, validate({ query: rankingQuery }), rankingsController.list);

export default router;
