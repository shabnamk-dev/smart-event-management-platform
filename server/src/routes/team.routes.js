import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createTeamSchema, joinTeamSchema } from '../validations/team.schema.js';

const router = Router();

// All team routes require authentication and participant role
router.use(authenticate, requireRole('participant'));

router.get('/recommendations', teamController.getRecommendations);
router.get('/my-team', teamController.getMyTeam);
router.post('/', validate(createTeamSchema), teamController.createTeam);
router.post('/join', validate(joinTeamSchema), teamController.joinTeam);
router.post('/leave', teamController.leaveTeam);

export default router;
