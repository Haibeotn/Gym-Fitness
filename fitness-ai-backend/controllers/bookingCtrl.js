// controllers/bookingCtrl.js
const pool = require('../config/db');

/**
 * 0. Lấy danh sách Huấn luyện viên (PTs) để học viên chọn đặt lịch
 * GET /api/bookings/trainers
 */
exports.getTrainersList = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id as trainer_id,
                t.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.avatar_url,
                t.specialization,
                t.bio,
                COALESCE(t.rating, 5.0) as rating,
                t.is_active,
                COUNT(up.id) FILTER (WHERE up.status = 'active') as active_clients_count
            FROM trainers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_packages up ON up.trainer_id = t.id
            WHERE t.is_active = TRUE
            GROUP BY t.id, t.user_id, u.full_name, u.email, u.phone, u.avatar_url, t.specialization, t.bio, t.rating, t.is_active
            ORDER BY t.rating DESC, u.full_name ASC
        `;
        const result = await pool.query(query);
        return res.json({
            success: true,
            trainers: result.rows
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách PT:", error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách PT.' });
    }
};

/**
 * 1. Lấy danh sách khung giờ trống của PT theo ngày
 * GET /api/bookings/availability?trainerId=1&date=2026-10-01
 */
exports.getTrainerAvailability = async (req, res) => {
    try {
        const { trainerId, date } = req.query;

        if (!trainerId || !date) {
            return res.status(400).json({ success: false, message: 'Thiếu trainerId hoặc date (YYYY-MM-DD).' });
        }

        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...

        // Lấy khung giờ làm việc của PT trong ngày này
        let availRes = await pool.query(
            `SELECT * FROM trainer_availability 
             WHERE trainer_id = $1 AND day_of_week = $2 AND is_active = TRUE`,
            [trainerId, dayOfWeek]
        );

        // Nếu chưa có cấu hình riêng, tạo khung giờ mặc định 07:00 - 21:00
        let workShift = availRes.rows[0];
        if (!workShift) {
            workShift = {
                start_time: '07:00',
                end_time: '21:30',
                slot_duration_minutes: 60
            };
        }

        // Lấy danh sách các buổi đã đặt của PT trong ngày này (trạng thái confirmed hoặc pending)
        const bookedRes = await pool.query(
            `SELECT start_time, end_time FROM bookings 
             WHERE trainer_id = $1 AND booking_date = $2 AND status IN ('confirmed', 'pending_approval')`,
            [trainerId, date]
        );

        const bookedSlots = bookedRes.rows;

        // Sinh danh sách slot từ start_time đến end_time với buffer 15 phút
        const availableSlots = [];
        const [startH, startM] = workShift.start_time.split(':').map(Number);
        const [endH, endM] = workShift.end_time.split(':').map(Number);

        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = workShift.slot_duration_minutes || 60;
        const buffer = 15; // 15 phút nghỉ giữa các ca dạy

        while (currentMinutes + duration <= endMinutes) {
            const slotStartH = Math.floor(currentMinutes / 60);
            const slotStartM = currentMinutes % 60;
            const slotEndMinutes = currentMinutes + duration;
            const slotEndH = Math.floor(slotEndMinutes / 60);
            const slotEndM = slotEndMinutes % 60;

            const timeStrStart = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`;
            const timeStrEnd = `${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}`;

            // Kiểm tra xem slot này có bị trùng với lịch đã đặt không
            const isConflict = bookedSlots.some(b => {
                const bStart = b.start_time.slice(0, 5);
                const bEnd = b.end_time.slice(0, 5);
                return (timeStrStart < bEnd && timeStrEnd > bStart);
            });

            if (!isConflict) {
                availableSlots.push({
                    startTime: timeStrStart,
                    endTime: timeStrEnd,
                    durationMinutes: duration,
                    isAvailable: true
                });
            }

            // Tiến tới ca tiếp theo
            currentMinutes += duration + buffer;
        }

        return res.json({
            success: true,
            date,
            trainerId: Number(trainerId),
            availableSlots
        });
    } catch (error) {
        console.error("Lỗi lấy lịch trống PT:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch trống của HLV.' });
    }
};

/**
 * 2. Đặt lịch tập với PT (Dành cho Học viên)
 * POST /api/bookings
 * Body: { trainerId, bookingDate, startTime, endTime, sessionTopic, notes }
 */
exports.createBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { trainerId, bookingDate, startTime, endTime, sessionTopic, notes } = req.body;

        if (!trainerId || !bookingDate || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ ngày, giờ và Huấn luyện viên.' });
        }

        // 1. Tìm gói tập còn buổi của user (nếu có)
        const pkgRes = await pool.query(
            `SELECT id, remaining_sessions, needs_review FROM user_packages 
             WHERE user_id = $1 AND (trainer_id = $2 OR trainer_id IS NULL) AND status = 'active' AND remaining_sessions > 0
             ORDER BY purchased_at DESC LIMIT 1`,
            [userId, trainerId]
        );

        let userPackageId = null;
        let remainingSessions = null;

        if (pkgRes.rows.length > 0) {
            const userPackage = pkgRes.rows[0];
            userPackageId = userPackage.id;
            remainingSessions = userPackage.remaining_sessions;
        }

        // 2. Kiểm tra xung đột lịch với PT
        const conflictRes = await pool.query(
            `SELECT id FROM bookings 
             WHERE trainer_id = $1 AND booking_date = $2 AND status IN ('confirmed', 'pending_approval')
             AND NOT (end_time <= $3 OR start_time >= $4)`,
            [trainerId, bookingDate, startTime, endTime]
        );

        if (conflictRes.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Khung giờ này HLV đã có học viên khác đặt. Vui lòng chọn khung giờ khác.'
            });
        }

        // Sinh mã check-in QR Code duy nhất
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const dateCode = bookingDate.replace(/[^0-9]/g, '').slice(-4);
        const checkinCode = `GYM-CHK-${dateCode}-${Date.now().toString().slice(-4)}-${randomSuffix}`;

        // 3. Tạo booking mới
        const insertRes = await pool.query(
            `INSERT INTO bookings (
                user_id, trainer_id, user_package_id, booking_date, start_time, end_time, 
                status, session_topic, notes, checkin_code, checkin_status
             )
             VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, $8, $9, 'pending')
             RETURNING *`,
            [
                userId, 
                trainerId, 
                userPackageId, 
                bookingDate, 
                startTime, 
                endTime, 
                sessionTopic || 'Buổi tập cá nhân hóa cùng PT', 
                notes || '', 
                checkinCode
            ]
        );

        return res.status(201).json({
            success: true,
            message: '🎉 Đặt lịch tập với Huấn luyện viên thành công!',
            booking: insertRes.rows[0],
            checkinCode,
            remainingSessions
        });
    } catch (error) {
        console.error("Lỗi đặt lịch tập:", error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đặt lịch tập.' });
    }
};

/**
 * 3. Lấy danh sách lịch tập của tôi (Member xem lịch của mình, PT xem lịch dạy của mình)
 * GET /api/bookings/my-bookings
 */
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query = '';
        let params = [userId];

        if (role === 'pt') {
            // Lấy trainerId của PT hiện tại
            const trainerRes = await pool.query("SELECT id FROM trainers WHERE user_id = $1", [userId]);
            if (trainerRes.rows.length === 0) {
                return res.json({ success: true, bookings: [] });
            }
            const trainerId = trainerRes.rows[0].id;
            query = `
                SELECT b.*, 
                       u.full_name as client_name, u.email as client_email, u.phone as client_phone, 
                       u.avatar_url as client_avatar, u.goal as client_goal, u.weight as client_weight, 
                       u.height as client_height,
                       up.remaining_sessions, up.total_sessions
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                LEFT JOIN user_packages up ON b.user_package_id = up.id
                WHERE b.trainer_id = $1
                ORDER BY b.booking_date DESC, b.start_time DESC
            `;
            params = [trainerId];
        } else {
            // Member xem lịch của mình
            query = `
                SELECT b.*, 
                       tu.full_name as trainer_name, tu.phone as trainer_phone, tu.avatar_url as trainer_avatar,
                       t.specialization, t.rating as trainer_rating,
                       up.remaining_sessions, up.total_sessions
                FROM bookings b
                JOIN trainers t ON b.trainer_id = t.id
                JOIN users tu ON t.user_id = tu.id
                LEFT JOIN user_packages up ON b.user_package_id = up.id
                WHERE b.user_id = $1
                ORDER BY b.booking_date DESC, b.start_time DESC
            `;
        }

        const result = await pool.query(query, params);

        return res.json({
            success: true,
            bookings: result.rows
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách booking:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách lịch tập.' });
    }
};

/**
 * 4. Quét mã QR Check-in buổi tập tại phòng Gym
 * POST /api/bookings/check-in
 * Body: { checkinCode: "GYM-CHK-..." }
 */
exports.checkInBooking = async (req, res) => {
    try {
        const { checkinCode } = req.body;
        const currentUserId = req.user ? req.user.id : null;

        if (!checkinCode) {
            return res.status(400).json({ success: false, message: 'Thiếu mã check-in QR Code.' });
        }

        // Tìm booking theo checkin_code
        const bookingRes = await pool.query(`
            SELECT b.*, 
                   u.full_name as client_name, u.phone as client_phone, u.avatar_url as client_avatar,
                   tu.full_name as trainer_name, tu.phone as trainer_phone,
                   up.remaining_sessions, up.total_sessions
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN trainers t ON b.trainer_id = t.id
            JOIN users tu ON t.user_id = tu.id
            LEFT JOIN user_packages up ON b.user_package_id = up.id
            WHERE b.checkin_code = $1
        `, [checkinCode.trim()]);

        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Mã QR Check-in không hợp lệ hoặc không tồn tại.' });
        }

        const booking = bookingRes.rows[0];

        if (booking.checkin_status === 'checked_in') {
            return res.json({
                success: true,
                isAlreadyCheckedIn: true,
                message: `Buổi tập này đã được check-in vào lúc ${new Date(booking.checked_in_at).toLocaleTimeString('vi-VN')}!`,
                booking
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Buổi tập này đã bị hủy trước đó, không thể check-in.' });
        }

        // Trừ 1 buổi tập trong gói (nếu có gói liên kết)
        let updatedRemaining = booking.remaining_sessions;
        if (booking.user_package_id) {
            const deductRes = await pool.query(`
                UPDATE user_packages 
                SET remaining_sessions = GREATEST(0, remaining_sessions - 1),
                    needs_review = (CASE WHEN remaining_sessions - 1 <= 0 THEN TRUE ELSE needs_review END),
                    status = (CASE WHEN remaining_sessions - 1 <= 0 THEN 'completed' ELSE status END)
                WHERE id = $1 
                RETURNING remaining_sessions
            `, [booking.user_package_id]);

            if (deductRes.rows.length > 0) {
                updatedRemaining = deductRes.rows[0].remaining_sessions;
            }
        }

        // Cập nhật booking: checkin_status = 'checked_in', status = 'completed', checked_in_at = NOW()
        const updateRes = await pool.query(`
            UPDATE bookings 
            SET checkin_status = 'checked_in',
                checked_in_at = CURRENT_TIMESTAMP,
                status = 'completed'
            WHERE id = $1
            RETURNING *
        `, [booking.id]);

        return res.json({
            success: true,
            message: '🎉 Check-in thành công! Chúc bạn và HLV có buổi tập bùng nổ năng lượng 💪',
            booking: {
                ...updateRes.rows[0],
                client_name: booking.client_name,
                trainer_name: booking.trainer_name,
                remaining_sessions: updatedRemaining
            }
        });
    } catch (error) {
        console.error("Lỗi check-in QR:", error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý Check-in.' });
    }
};

/**
 * 5. Cập nhật trạng thái buổi tập (Hoàn thành / Hủy lịch)
 * PUT /api/bookings/:bookingId/status
 * Body: { status: 'completed' | 'cancelled', cancelReason?: string }
 */
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, cancelReason, trainerNotes } = req.body;

        if (!['completed', 'cancelled', 'confirmed', 'pending_approval'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        const bookingRes = await pool.query("SELECT * FROM bookings WHERE id = $1", [bookingId]);
        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch tập này.' });
        }

        const booking = bookingRes.rows[0];

        // Nếu trạng thái đổi sang 'completed' và trước đó chưa hoàn thành -> trừ 1 buổi tập
        if (status === 'completed' && booking.status !== 'completed' && booking.user_package_id) {
            await pool.query(
                `UPDATE user_packages 
                 SET remaining_sessions = GREATEST(0, remaining_sessions - 1),
                     needs_review = (CASE WHEN remaining_sessions - 1 <= 0 THEN TRUE ELSE needs_review END),
                     status = (CASE WHEN remaining_sessions - 1 <= 0 THEN 'completed' ELSE status END)
                 WHERE id = $1`,
                [booking.user_package_id]
            );
        }

        // Cập nhật trạng thái booking
        const updatedRes = await pool.query(
            `UPDATE bookings 
             SET status = $1, 
                 cancel_reason = COALESCE($2, cancel_reason),
                 trainer_notes = COALESCE($3, trainer_notes),
                 checkin_status = (CASE WHEN $1 = 'completed' AND checkin_status = 'pending' THEN 'checked_in' ELSE checkin_status END),
                 checked_in_at = (CASE WHEN $1 = 'completed' AND checked_in_at IS NULL THEN CURRENT_TIMESTAMP ELSE checked_in_at END)
             WHERE id = $4 RETURNING *`,
            [status, cancelReason || null, trainerNotes || null, bookingId]
        );

        return res.json({
            success: true,
            message: status === 'completed' ? '✅ Đã xác nhận hoàn thành buổi tập!' : 'Đã cập nhật trạng thái lịch tập.',
            booking: updatedRes.rows[0]
        });
    } catch (error) {
        console.error("Lỗi cập nhật booking:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật lịch tập.' });
    }
};

/**
 * 6. Đánh giá buổi tập (Rating & Review)
 * POST /api/bookings/:bookingId/review
 * Body: { rating: 1-5, reviewText: "..." }
 */
exports.reviewBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        const { rating, reviewText } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Điểm đánh giá phải từ 1 đến 5 sao.' });
        }

        const bookingRes = await pool.query("SELECT * FROM bookings WHERE id = $1 AND user_id = $2", [bookingId, userId]);
        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy buổi tập của bạn.' });
        }

        const booking = bookingRes.rows[0];

        // Lưu đánh giá vào booking
        const updateRes = await pool.query(
            `UPDATE bookings 
             SET rating = $1, review_text = $2 
             WHERE id = $3 RETURNING *`,
            [rating, reviewText || '', bookingId]
        );

        // Tính lại điểm trung bình cho PT
        const avgRes = await pool.query(`
            SELECT AVG(rating)::numeric(3,2) as new_rating 
            FROM bookings 
            WHERE trainer_id = $1 AND rating IS NOT NULL
        `, [booking.trainer_id]);

        if (avgRes.rows.length > 0 && avgRes.rows[0].new_rating) {
            await pool.query(
                `UPDATE trainers SET rating = $1 WHERE id = $2`,
                [avgRes.rows[0].new_rating, booking.trainer_id]
            );
        }

        return res.json({
            success: true,
            message: '⭐ Cảm ơn bạn đã gửi đánh giá cho Huấn luyện viên!',
            booking: updateRes.rows[0]
        });
    } catch (error) {
        console.error("Lỗi gửi đánh giá buổi tập:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi gửi đánh giá.' });
    }
};
