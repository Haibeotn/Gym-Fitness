// fitness-ai-backend/routes/ttsRoutes.js
const express = require('express');
const router = express.Router();
const { textToSpeech } = require('../controllers/ttsCtrl');

// GET /api/tts?text=...
router.get('/', textToSpeech);

module.exports = router;
