// scripts/migrateMealLogs.js
const pool = require('../config/db');

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS meal_logs (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                log_date DATE NOT NULL DEFAULT CURRENT_DATE,
                meal_type VARCHAR(50) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
                food_name VARCHAR(255) NOT NULL,
                calories NUMERIC(8,2) NOT NULL DEFAULT 0,
                protein NUMERIC(8,2) NOT NULL DEFAULT 0,
                carbs NUMERIC(8,2) NOT NULL DEFAULT 0,
                fat NUMERIC(8,2) NOT NULL DEFAULT 0,
                serving_size VARCHAR(100) DEFAULT '1 khẩu phần',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, log_date);
        `);
        console.log('✅ Đã tạo bảng meal_logs thành công!');
        process.exit(0);
    } catch (err) {
        console.error('Lỗi migrate meal_logs:', err);
        process.exit(1);
    }
}

migrate();
