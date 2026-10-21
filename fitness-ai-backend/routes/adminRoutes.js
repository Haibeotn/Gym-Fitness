// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminCtrl');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Áp dụng bảo vệ toàn bộ route Admin: Phải có Token hợp lệ và Role 'admin'
router.use(verifyToken, requireRole('admin'));

// 1. Thống kê tổng quan & KPIs
router.get('/stats', adminCtrl.getStats);

// 2. Quản lý Huấn luyện viên
router.get('/trainers', adminCtrl.getTrainers);
router.post('/trainers', adminCtrl.createTrainer);
router.put('/trainers/:trainerId/toggle', adminCtrl.toggleTrainerStatus);

// 3. Quản lý Thư viện Bài tập
router.get('/exercises', adminCtrl.getExercises);
router.post('/exercises', adminCtrl.createExercise);
router.delete('/exercises/:id', adminCtrl.deleteExercise);

// 4. Quản lý Gói Thành Viên
router.get('/memberships', adminCtrl.getMemberships);

// 5. Lịch sử mua hàng
router.get('/purchase-history', adminCtrl.getPurchaseHistory);

module.exports = router;

