// routes/ptRoutes.js
const express = require('express');
const router = express.Router();
const ptCtrl = require('../controllers/ptCtrl');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Tất cả các route của PT yêu cầu đăng nhập và có role = 'pt' hoặc 'admin'
router.use(verifyToken, requireRole(['pt', 'admin']));

// 1. Danh sách học viên được gán
router.get('/clients', ptCtrl.getMyClients);

// 2. Chi tiết hồ sơ và giáo án AI của học viên
router.get('/clients/:clientId', ptCtrl.getClientPlanDetail);

// 3. Phê duyệt & Ghi đè giáo án học viên
router.put('/clients/:clientId/approve', ptCtrl.approveOrUpdateClientPlan);

// 4. Điểm danh / Trừ 1 buổi tập
router.post('/clients/:clientId/deduct-session', ptCtrl.deductSession);

// 5. Đuổi học viên (Xóa hoàn toàn khỏi database)
router.delete('/clients/:clientId', ptCtrl.expelClient);

// 6. Thêm bài tập trực tiếp từ khung chat
router.post('/clients/:clientId/add-exercise', ptCtrl.addExerciseFromChat);

module.exports = router;
