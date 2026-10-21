// routes/workoutLogRoutes.js
const express = require('express');
const router = express.Router();
const workoutLogCtrl = require('../controllers/workoutLogCtrl');
const { verifyToken } = require('../middleware/authMiddleware');

// Toàn bộ chức năng ghi nhật ký và tiến độ yêu cầu xác thực người dùng
router.use(verifyToken);

// 1. Ghi nhật ký buổi tập & Hiệp tập
router.post('/logs', workoutLogCtrl.saveWorkoutLog);

// 2. Xem lịch sử các buổi tập
router.get('/logs/history', workoutLogCtrl.getWorkoutHistory);

// 3. Cập nhật cân nặng
router.post('/progress/weight', workoutLogCtrl.logWeightProgress);

// 4. Xem báo cáo biểu đồ tiến độ & Volume tích lũy
router.get('/progress/analytics', workoutLogCtrl.getProgressAnalytics);

// 5. Báo cáo tổng kết tiến độ toàn diện & Chứng nhận tập luyện (Xuất PDF / Infographic)
router.get('/progress/report', workoutLogCtrl.getProgressReport);

module.exports = router;

