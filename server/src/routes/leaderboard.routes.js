import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Leaderboard requires authentication (accessible to all authenticated roles)
router.use(authenticate);

router.get('/', leaderboardController.getLeaderboard);

export default router;
