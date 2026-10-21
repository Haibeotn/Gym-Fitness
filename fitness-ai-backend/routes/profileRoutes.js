// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileCtrl = require('../controllers/profileCtrl');
const { verifyToken } = require('../middleware/authMiddleware');

// GET  /api/profile/me          — Xem hồ sơ cá nhân
router.get('/me', verifyToken, profileCtrl.getMyProfile);

// PUT  /api/profile/me          — Cập nhật hồ sơ cá nhân
router.put('/me', verifyToken, profileCtrl.updateMyProfile);

// DELETE /api/profile/me/field/:field — Xóa một trường thông tin
router.delete('/me/field/:field', verifyToken, profileCtrl.clearProfileField);

module.exports = router;
