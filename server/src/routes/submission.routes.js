import { Router } from 'express';
import * as submissionController from '../controllers/submission.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { submissionSchema } from '../validations/submission.schema.js';

const router = Router();

// Submission routes require authentication
router.use(authenticate);

// Public / Authenticated list of submissions
router.get('/', submissionController.getAllSubmissions);

// Participant team submission management
router.get('/my', requireRole('participant'), submissionController.getMySubmission);
router.post('/', requireRole('participant'), validate(submissionSchema), submissionController.createOrUpdateSubmission);
router.put('/', requireRole('participant'), validate(submissionSchema), submissionController.createOrUpdateSubmission);

export default router;
