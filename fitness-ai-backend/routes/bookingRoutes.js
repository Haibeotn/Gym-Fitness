// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingCtrl');
const { verifyToken } = require('../middleware/authMiddleware');

// Lấy danh sách PT để chọn đặt lịch
router.get('/trainers', bookingCtrl.getTrainersList);

// Lấy lịch trống của PT theo ngày
router.get('/availability', bookingCtrl.getTrainerAvailability);

// Đặt lịch tập (Yêu cầu đăng nhập)
router.post('/', verifyToken, bookingCtrl.createBooking);

// Lấy danh sách lịch tập của tôi (Member hoặc PT)
router.get('/my-bookings', verifyToken, bookingCtrl.getMyBookings);

// Quét mã QR Check-in buổi tập tại phòng Gym
router.post('/check-in', verifyToken, bookingCtrl.checkInBooking);

// Cập nhật trạng thái buổi tập (Hoàn thành / Hủy)
router.put('/:bookingId/status', verifyToken, bookingCtrl.updateBookingStatus);

// Đánh giá buổi tập (Rating & Review)
router.post('/:bookingId/review', verifyToken, bookingCtrl.reviewBooking);

module.exports = router;
