import { Router } from 'express';
import { createReport, getAdminReports, getMyReports, updateReportStatus } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/', protect, createReport);
router.get('/me', protect, getMyReports);
router.get('/admin', protect, allowRoles('admin'), getAdminReports);
router.patch('/admin/:reportId', protect, allowRoles('admin'), updateReportStatus);

export default router;
