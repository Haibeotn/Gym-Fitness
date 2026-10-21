// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userCtrl');
const { optionalAuth } = require('../middleware/authMiddleware');

// Đường dẫn: POST /api/users/save-profile
router.post('/save-profile', optionalAuth, userCtrl.saveProfile);

// Đường dẫn: GET /api/users/latest-plan
router.get('/latest-plan', optionalAuth, userCtrl.getLatestPlan);

module.exports = router;