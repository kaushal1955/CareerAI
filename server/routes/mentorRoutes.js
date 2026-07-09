import { Router } from 'express';
import {
  createMentorResource,
  createMentorSession,
  getMentorDashboard,
  updateMentorSession,
  upsertMentorProfile,
} from '../controllers/mentorController.js';
import { protect } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/dashboard', protect, allowRoles('mentor', 'admin'), getMentorDashboard);
router.put('/profile', protect, allowRoles('mentor', 'admin'), upsertMentorProfile);
router.post('/sessions', protect, allowRoles('mentor', 'admin'), createMentorSession);
router.patch('/sessions/:sessionId', protect, allowRoles('mentor', 'admin'), updateMentorSession);
router.post('/resources', protect, allowRoles('mentor', 'admin'), createMentorResource);

export default router;
