import { Router } from 'express';
import {
  assignStudentToMentor,
  getAdminDashboard,
  getAdminModerationResources,
  getAdminUsers,
  moderateResource,
  unassignStudentFromMentor,
  updateUserStatus,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/dashboard', protect, allowRoles('admin'), getAdminDashboard);
router.get('/users', protect, allowRoles('admin'), getAdminUsers);
router.get('/resources', protect, allowRoles('admin'), getAdminModerationResources);
router.patch('/resources/:resourceId/moderate', protect, allowRoles('admin'), moderateResource);
router.patch('/users/:userId/status', protect, allowRoles('admin'), updateUserStatus);
router.post('/mentors/:mentorId/assign-student', protect, allowRoles('admin'), assignStudentToMentor);
router.delete('/mentors/:mentorId/assign-student/:studentId', protect, allowRoles('admin'), unassignStudentFromMentor);

export default router;
