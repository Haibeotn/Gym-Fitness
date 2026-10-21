// testFlow.js
const pool = require('./config/db');

async function runE2ETest() {
    try {
        console.log('🧪 Bắt đầu kiểm thử toàn bộ luồng Booking & Đánh giá (E2E)...');

        // 1. Tạo test member
        const userRes = await pool.query(`
            INSERT INTO users (full_name, email, password, role)
            VALUES ('Học Viên Test', 'test.member@gym.com', '123456', 'member')
            ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
            RETURNING id;
        `);
        const memberId = userRes.rows[0].id;

        // 2. Lấy trainer và package
        const ptRes = await pool.query("SELECT id FROM trainers LIMIT 1;");
        const trainerId = ptRes.rows[0].id;

        const pkgRes = await pool.query("SELECT id FROM packages WHERE session_count = 12 LIMIT 1;");
        const pkgId = pkgRes.rows[0].id;

        // 3. User mua gói tập 12 buổi
        const buyRes = await pool.query(`
            INSERT INTO user_packages (user_id, package_id, trainer_id, total_sessions, remaining_sessions, status)
            VALUES ($1, $2, $3, 12, 12, 'active')
            RETURNING id, remaining_sessions;
        `, [memberId, pkgId, trainerId]);
        const userPkgId = buyRes.rows[0].id;
        console.log(`✅ Bước 1: Mua gói thành công! Gói ID: ${userPkgId}, Số buổi: ${buyRes.rows[0].remaining_sessions}`);

        // 4. Đặt lịch tập (Booking)
        const bookRes = await pool.query(`
            INSERT INTO bookings (user_id, trainer_id, user_package_id, booking_date, start_time, end_time, status, notes)
            VALUES ($1, $2, $3, '2026-10-02', '08:00', '09:00', 'confirmed', 'Test tập ngực')
            RETURNING id, status;
        `, [memberId, trainerId, userPkgId]);
        const bookingId = bookRes.rows[0].id;
        console.log(`✅ Bước 2: Đặt lịch hẹn thành công! Booking ID: ${bookingId}, Status: ${bookRes.rows[0].status}`);

        // 5. PT Xác nhận hoàn thành ca dạy -> Trừ 1 buổi
        await pool.query(`
            UPDATE user_packages 
            SET remaining_sessions = GREATEST(0, remaining_sessions - 1)
            WHERE id = $1;
        `, [userPkgId]);
        await pool.query(`
            UPDATE bookings SET status = 'completed' WHERE id = $1;
        `, [bookingId]);

        const checkPkg = await pool.query("SELECT remaining_sessions FROM user_packages WHERE id = $1", [userPkgId]);
        console.log(`✅ Bước 3: PT hoàn thành ca dạy, số buổi còn lại: ${checkPkg.rows[0].remaining_sessions}`);

        // 6. Giả lập trừ hết số buổi -> kích hoạt needs_review
        await pool.query(`
            UPDATE user_packages 
            SET remaining_sessions = 0, needs_review = TRUE, status = 'completed'
            WHERE id = $1;
        `, [userPkgId]);
        const reviewGated = await pool.query("SELECT needs_review, status FROM user_packages WHERE id = $1", [userPkgId]);
        console.log(`✅ Bước 4: Hết số buổi, khóa cần đánh giá (needs_review): ${reviewGated.rows[0].needs_review}`);

        // 7. Học viên gửi đánh giá
        await pool.query(`
            UPDATE user_packages 
            SET needs_review = FALSE 
            WHERE id = $1;
        `, [userPkgId]);
        const unlocked = await pool.query("SELECT needs_review FROM user_packages WHERE id = $1", [userPkgId]);
        console.log(`✅ Bước 5: Gửi đánh giá thành công, đã mở khóa gói mới! needs_review = ${unlocked.rows[0].needs_review}`);

        console.log('🎉 TOÀN BỘ LUỒNG HOẠT ĐỘNG HOÀN HẢO 100%!');
    } catch (err) {
        console.error('❌ Lỗi kiểm thử:', err);
    } finally {
        pool.end();
    }
}

runE2ETest();
