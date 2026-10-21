// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatCtrl = require('../controllers/chatCtrl');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/conversations', chatCtrl.getConversations);
router.get('/messages/:partnerId', chatCtrl.getMessages);
router.post('/messages', chatCtrl.sendMessage);
router.get('/unread-count', chatCtrl.getUnreadCount);
router.post('/local-coach', chatCtrl.askLocalAiCoach);

module.exports = router;
