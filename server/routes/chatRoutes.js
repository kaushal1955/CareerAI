import { Router } from 'express';
import { getChatContacts, getConversation, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/contacts', protect, getChatContacts);
router.get('/conversations/:peerId', protect, getConversation);
router.post('/messages', protect, sendMessage);

export default router;
