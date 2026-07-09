import { Router } from 'express';
import {
  exportMyBuiltResumePdf,
  getMyBuiltResume,
  upsertMyBuiltResume,
} from '../controllers/resumeBuilderController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/me', protect, getMyBuiltResume);
router.put('/me', protect, upsertMyBuiltResume);
router.get('/me/export', protect, exportMyBuiltResumePdf);

export default router;
