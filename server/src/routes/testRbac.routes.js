import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Test endpoints for verifying RBAC isolation
router.get('/participant-only', authenticate, requireRole('participant'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome participant', userRole: req.userRole });
});

router.get('/judge-only', authenticate, requireRole('judge'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome judge', userRole: req.userRole });
});

router.get('/organizer-only', authenticate, requireRole('organizer'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome organizer', userRole: req.userRole });
});

router.get('/judge-or-organizer', authenticate, requireRole(['judge', 'organizer']), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome staff', userRole: req.userRole });
});

export default router;
