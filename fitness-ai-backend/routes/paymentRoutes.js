// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/paymentCtrl');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Tạo đơn thanh toán VietQR / MoMo (Yêu cầu đăng nhập)
router.post('/create-order', verifyToken, paymentCtrl.createPaymentOrder);

// 2. Xác thực thanh toán & Kích hoạt gói tập (Mô phỏng Webhook / Xác nhận chuyển khoản)
router.post('/verify/:transactionCode', verifyToken, paymentCtrl.verifyPaymentOrder);

// 3. Lịch sử giao dịch của tôi
router.get('/my-history', verifyToken, paymentCtrl.getMyPaymentHistory);

// 4. Hủy đơn thanh toán chờ
router.put('/:transactionCode/cancel', verifyToken, paymentCtrl.cancelPaymentOrder);

// 5. Admin: Báo cáo doanh thu & Quản lý tất cả giao dịch
router.get('/admin/all', verifyToken, paymentCtrl.getAdminPayments);

module.exports = router;
