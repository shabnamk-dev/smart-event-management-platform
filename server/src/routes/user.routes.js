import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validations/user.schema.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.get('/qr', requireRole('participant'), userController.getQR);

export default router;
