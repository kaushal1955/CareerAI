import { Router } from 'express';
import { getMyProfile, upsertMyProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { validateProfileUpsert } from '../middleware/validate.js';

const router = Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, validateProfileUpsert, upsertMyProfile);

export default router;
