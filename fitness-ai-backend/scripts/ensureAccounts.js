// scripts/ensureAccounts.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const ensureAccounts = async () => {
    try {
        console.log('🔄 Đang đồng bộ và khởi tạo các tài khoản hệ thống...');
        const passwordHash = await bcrypt.hash('123456', 10);

        // 1. Tài khoản Admin: Xóa user 7 cũ hoặc update email sang admin@gym.com
        await pool.query(`DELETE FROM users WHERE email = 'admin@gym.com' OR phone = '0999888999';`);
        const adminRes = await pool.query(`
            INSERT INTO users (full_name, email, password, role, phone)
            VALUES ('Quản Trị Viên Hệ Thống', 'admin@gym.com', $1, 'admin', '0999888999')
            RETURNING id, full_name, email, role;
        `, [passwordHash]);
        console.log('✅ 1. Tài khoản Admin đã sẵn sàng:', adminRes.rows[0]);

        // 2. Tài khoản PT
        await pool.query(`DELETE FROM users WHERE email = 'tuan.coach@gym.com' OR phone = '0901234567';`);
        const ptRes = await pool.query(`
            INSERT INTO users (full_name, email, password, role, phone)
            VALUES ('HLV Tuấn Coach', 'tuan.coach@gym.com', $1, 'pt', '0901234567')
            RETURNING id, full_name, email, role;
        `, [passwordHash]);
        const ptUserId = ptRes.rows[0].id;

        // Đảm bảo record trong bảng trainers
        const trainerRes = await pool.query(`
            INSERT INTO trainers (user_id, specialization, bio, rating, is_active)
            VALUES ($1, 'Tăng cơ & Giảm mỡ nâng cao, Chỉnh form Squat/Deadlift', 'Chứng chỉ NASM CPT với hơn 6 năm kinh nghiệm.', 4.9, TRUE)
            RETURNING id;
        `, [ptUserId]);
        console.log('✅ 2. Tài khoản PT đã sẵn sàng:', ptRes.rows[0]);

        // 3. Tài khoản Học viên Test
        await pool.query(`DELETE FROM users WHERE email = 'test.member@gym.com' OR phone = '0912345678';`);
        const memberRes = await pool.query(`
            INSERT INTO users (full_name, email, password, role, phone)
            VALUES ('Học Viên Trải Nghiệm', 'test.member@gym.com', $1, 'member', '0912345678')
            RETURNING id, full_name, email, role;
        `, [passwordHash]);
        console.log('✅ 3. Tài khoản Học viên đã sẵn sàng:', memberRes.rows[0]);

        console.log('🎉 TẤT CẢ TÀI KHOẢN ĐÃ ĐƯỢC THIẾT LẬP MẬT KHẨU: 123456');
    } catch (err) {
        console.error('❌ Lỗi thiết lập tài khoản:', err);
    } finally {
        pool.end();
    }
};


ensureAccounts();
