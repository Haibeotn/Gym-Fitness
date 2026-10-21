// scripts/migrateBookingsAndQR.js
const pool = require('../config/db');

async function migrateBookingsAndQR() {
    try {
        console.log('🔄 Đang nâng cấp cấu trúc bảng bookings cho tính năng Đặt lịch & QR Check-in...');

        await pool.query(`
            -- Thêm các cột cho tính năng QR Check-in & Đánh giá buổi tập
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkin_code VARCHAR(60) UNIQUE;
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkin_status VARCHAR(20) DEFAULT 'pending';
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_topic VARCHAR(255);
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trainer_notes TEXT;
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rating INT;
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_text TEXT;

            -- Cập nhật mã checkin_code ngẫu nhiên cho các booking cũ chưa có code
            UPDATE bookings 
            SET checkin_code = 'GYM-CHK-' || id || '-' || floor(random() * 8999 + 1000)::int
            WHERE checkin_code IS NULL;

            -- Đảm bảo mỗi PT đều có cấu hình trainer_availability đầy đủ từ Thứ 2 -> Chủ Nhật
            INSERT INTO trainer_availability (trainer_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
            SELECT t.id, d.day, '07:00'::time, '21:30'::time, 60, TRUE
            FROM trainers t
            CROSS JOIN (SELECT generate_series(0, 6) AS day) d
            WHERE NOT EXISTS (
                SELECT 1 FROM trainer_availability ta 
                WHERE ta.trainer_id = t.id AND ta.day_of_week = d.day
            );
        `);

        console.log('✅ Đã nâng cấp thành công cơ sở dữ liệu cho Đặt lịch & QR Check-in!');
    } catch (err) {
        console.error('❌ Lỗi khi nâng cấp cơ sở dữ liệu bookings:', err);
    } finally {
        pool.end();
    }
}

migrateBookingsAndQR();
