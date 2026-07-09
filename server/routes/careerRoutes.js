import { Router } from 'express';
import {
  generateCareerRecommendation,
  getLatestCareerRecommendation,
} from '../controllers/careerController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/recommendations/latest', protect, getLatestCareerRecommendation);
router.post('/recommendations/generate', protect, generateCareerRecommendation);

export default router;
