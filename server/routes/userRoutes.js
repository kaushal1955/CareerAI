import { Router } from 'express';
import { getCurrentUser, updateUserRole } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/me', protect, getCurrentUser);
router.patch('/:userId/role', protect, allowRoles('admin'), updateUserRole);

export default router;
