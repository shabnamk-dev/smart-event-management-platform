import { Router } from 'express';
import * as judgeController from '../controllers/judge.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { evaluationSchema, updateEvaluationSchema } from '../validations/evaluation.schema.js';

const router = Router();

// All judge routes require authentication and Judge role
router.use(authenticate, requireRole('judge'));

router.get('/stats', judgeController.getStats);
router.get('/submissions', judgeController.getSubmissions);
router.get('/submissions/:id', judgeController.getSubmissionById);
router.post('/evaluations', validate(evaluationSchema), judgeController.submitEvaluation);
router.put('/evaluations/:id', validate(updateEvaluationSchema), judgeController.updateEvaluation);

export default router;
