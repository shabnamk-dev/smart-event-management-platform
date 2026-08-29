import { Router } from 'express';
import * as organizerController from '../controllers/organizer.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { checkinSchema } from '../validations/organizer.schema.js';

const router = Router();

// All organizer routes require authentication and organizer role
router.use(authenticate, requireRole('organizer'));

router.post('/checkin', validate(checkinSchema), organizerController.checkIn);
router.get('/attendees', organizerController.getAttendees);
router.get('/analytics', organizerController.getAnalytics);

export default router;
