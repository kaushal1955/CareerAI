import { Router } from 'express';
import {
  evaluateInterview,
  generateInterview,
  getLatestInterview,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/latest', protect, getLatestInterview);
router.post('/generate', protect, generateInterview);
router.post('/:interviewId/evaluate', protect, evaluateInterview);

export default router;
