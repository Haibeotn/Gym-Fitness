// scripts/upgradePackageFix.js
const pool = require('../config/db');

async function run() {
    try {
        console.log('🔄 Đang cập nhật gói tập và làm sạch dữ liệu cho User 6...');
        
        // 1. Chuyển các gói cũ trước đó của User 6 sang 'upgraded'
        await pool.query("UPDATE user_packages SET status = 'upgraded', needs_review = FALSE WHERE user_id = 6 AND id != 6");

        // 2. Thiết lập gói 36 buổi (ID 6) bắt đầu mới hoàn toàn với 36 buổi khả dụng
        await pool.query("UPDATE user_packages SET total_sessions = 36, remaining_sessions = 36, status = 'active' WHERE id = 6");

        // 3. Xóa các lịch đặt thử nghiệm cũ của gói trước để bắt đầu gói mới
        await pool.query("DELETE FROM bookings WHERE user_id = 6");

        // 4. Xóa các log tập cũ thử nghiệm của gói trước
        await pool.query("DELETE FROM log_sets WHERE log_id IN (SELECT id FROM workout_logs WHERE user_id = 6)");
        await pool.query("DELETE FROM workout_logs WHERE user_id = 6");

        console.log('✅ Hoàn tất! Gói 36 buổi mới đã được làm sạch và thiết lập 36/36 buổi.');

        const pkgs = await pool.query("SELECT id, user_id, package_id, total_sessions, remaining_sessions, status FROM user_packages WHERE user_id = 6");
        console.log('User 6 packages:', pkgs.rows);

        const bookings = await pool.query("SELECT * FROM bookings WHERE user_id = 6");
        console.log('User 6 bookings count:', bookings.rows.length);

        const logs = await pool.query("SELECT * FROM workout_logs WHERE user_id = 6");
        console.log('User 6 workout logs count:', logs.rows.length);

    } catch (err) {
        console.error('Lỗi:', err);
    } finally {
        await pool.end();
    }
}

run();
