// scripts/migratePayments.js
const pool = require('../config/db');

async function migratePayments() {
    try {
        console.log('🔄 Đang nâng cấp cơ sở dữ liệu cho Cổng thanh toán VietQR & MoMo...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                transaction_code VARCHAR(60) UNIQUE NOT NULL,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                package_id INT REFERENCES packages(id) ON DELETE SET NULL,
                trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL,
                amount DECIMAL(12,2) NOT NULL,
                payment_method VARCHAR(30) DEFAULT 'vietqr',
                bank_code VARCHAR(30) DEFAULT 'MB',
                account_number VARCHAR(50) DEFAULT '0901234567',
                account_name VARCHAR(100) DEFAULT 'FITNESS AI GYM CENTER',
                transfer_content VARCHAR(100) NOT NULL,
                qr_url TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                admin_notes TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
            CREATE INDEX IF NOT EXISTS idx_payments_transaction_code ON payments(transaction_code);
        `);

        console.log('✅ Đã tạo thành công bảng payments và chỉ mục!');
    } catch (err) {
        console.error('❌ Lỗi tạo bảng payments:', err);
    } finally {
        pool.end();
    }
}

migratePayments();
