// scripts/seedAdmin.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const seedAdmin = async () => {
    try {
        console.log('🛡️ Bắt đầu khởi tạo tài khoản Quản Trị Viên (Admin)...');
        const hashedPassword = await bcrypt.hash('123456', 10);

        const res = await pool.query(`
            INSERT INTO users (full_name, email, password, role, phone)
            VALUES ('Quản Trị Viên Hệ Thống', 'admin@gym.com', $1, 'admin', '0999888999')
            ON CONFLICT (email) DO UPDATE SET role = 'admin', password = EXCLUDED.password
            RETURNING id, full_name, email, role;
        `, [hashedPassword]);

        console.log('✅ Đã tạo tài khoản Admin thành công:', res.rows[0]);
    } catch (err) {
        console.error('❌ Lỗi tạo Admin:', err);
    } finally {
        pool.end();
    }
};

seedAdmin();
