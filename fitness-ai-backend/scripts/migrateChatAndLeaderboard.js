// scripts/migrateChatAndLeaderboard.js
const pool = require('../config/db');

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'quick_prompt', 'workout_share', 'meal_share'
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read);
        `);
        console.log('✅ Đã tạo bảng messages và các indexes thành công!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi migrate chat:', err);
        process.exit(1);
    }
}

migrate();
