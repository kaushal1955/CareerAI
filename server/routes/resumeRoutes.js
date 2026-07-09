import { Router } from 'express';
import {
  deleteResume,
  downloadResumeFile,
  getLatestResume,
  getMyResumes,
  previewResumeFile,
  reanalyzeResume,
  replaceResumeFile,
  uploadResume,
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
import { uploadResume as resumeUploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.get('/me', protect, getMyResumes);
router.get('/me/latest', protect, getLatestResume);
router.get('/:resumeId/view', protect, previewResumeFile);
router.get('/:resumeId/download', protect, downloadResumeFile);
router.post('/upload', protect, resumeUploadMiddleware.single('resume'), uploadResume);
router.put('/:resumeId/replace', protect, resumeUploadMiddleware.single('resume'), replaceResumeFile);
router.post('/:resumeId/analyze', protect, reanalyzeResume);
router.delete('/:resumeId', protect, deleteResume);

export default router;
