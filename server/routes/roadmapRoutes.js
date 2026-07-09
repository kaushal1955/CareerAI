import { Router } from 'express';
import { generateRoadmap, getLatestRoadmap } from '../controllers/roadmapController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/latest', protect, getLatestRoadmap);
router.post('/generate', protect, generateRoadmap);

export default router;
