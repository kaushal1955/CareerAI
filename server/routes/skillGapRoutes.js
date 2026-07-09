import { Router } from 'express';
import { generateSkillGap, getLatestSkillGap } from '../controllers/skillGapController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/latest', protect, getLatestSkillGap);
router.post('/generate', protect, generateSkillGap);

export default router;
