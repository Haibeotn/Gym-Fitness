// scripts/addProfileColumns.js
// Thêm các cột hồ sơ cá nhân vào bảng users
const pool = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔧 Đang thêm các cột hồ sơ cá nhân...');
        await client.query(`
            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS address TEXT,
                ADD COLUMN IF NOT EXISTS date_of_birth DATE,
                ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
                ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
                ADD COLUMN IF NOT EXISTS occupation TEXT,
                ADD COLUMN IF NOT EXISTS bio TEXT,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        `);
        console.log('✅ Đã thêm cột thành công!');
    } catch (err) {
        console.error('❌ Lỗi migration:', err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
