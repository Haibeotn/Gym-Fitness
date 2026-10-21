const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); const { Pool } = require('pg');


// Khởi tạo Connection Pool kết nối tới PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Bắt sự kiện nếu kết nối bị đứt (Giống như phát hiện chấn thương bất ngờ)
pool.on('error', (err, client) => {
    console.error('❌ Lỗi kết nối Database (Chấn thương hệ thống):', err);
    process.exit(-1);
});

// Hàm test kết nối (Khởi động nhẹ để kiểm tra khớp)
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Không thể kết nối tới PostgreSQL. Hãy kiểm tra lại mật khẩu hoặc xem Database đã được tạo chưa!', err.message);
    } else {
        console.log('✅ Đã kết nối thành công tới PostgreSQL (fitness_db)! Thời gian DB:', res.rows[0].now);
    }
});

module.exports = pool;