import { Router } from 'express';
import {
  deletePushSubscription,
  getNotificationSettings,
  savePushSubscription,
  sendTestPush,
  updateNotificationSettings,
} from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/notifications', protect, getNotificationSettings);
router.put('/notifications', protect, updateNotificationSettings);
router.post('/push-subscriptions', protect, savePushSubscription);
router.delete('/push-subscriptions', protect, deletePushSubscription);
router.post('/push-test', protect, sendTestPush);

export default router;
