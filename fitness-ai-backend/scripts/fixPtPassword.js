// scripts/fixPtPassword.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const fix = async () => {
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const res = await pool.query(
            `UPDATE users SET password = $1 WHERE email = 'tuan.coach@gym.com' RETURNING id, full_name, email, role;`,
            [hashedPassword]
        );
        console.log('✅ Đã cập nhật mật khẩu cho PT:', res.rows[0]);
    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        pool.end();
    }
};

fix();
