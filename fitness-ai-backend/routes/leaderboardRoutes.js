// routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const leaderboardCtrl = require('../controllers/leaderboardCtrl');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, leaderboardCtrl.getLeaderboard);

module.exports = router;
