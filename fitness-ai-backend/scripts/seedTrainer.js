// scripts/seedTrainer.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');


const seed = async () => {
    try {
        console.log('🌱 Bắt đầu tạo PT mẫu & Lịch làm việc...');

        // 1. Tạo user PT: tuan.coach@gym.com
        const hashedPassword = await bcrypt.hash('123456', 10);
        let userRes = await pool.query("SELECT id FROM users WHERE email = 'tuan.coach@gym.com'");
        let ptUserId;

        if (userRes.rows.length === 0) {
            const newUser = await pool.query(`
                INSERT INTO users (full_name, email, password, role, phone)
                VALUES ('HLV Tuấn Coach', 'tuan.coach@gym.com', $1, 'pt', '0901234567')
                RETURNING id;
            `, [hashedPassword]);
            ptUserId = newUser.rows[0].id;
        } else {
            ptUserId = userRes.rows[0].id;
        }

        // 2. Tạo record trainer
        let trainerRes = await pool.query("SELECT id FROM trainers WHERE user_id = $1", [ptUserId]);
        let trainerId;
        if (trainerRes.rows.length === 0) {
            const newTrainer = await pool.query(`
                INSERT INTO trainers (user_id, specialization, bio, rating, is_active)
                VALUES ($1, 'Tăng cơ & Giảm mỡ nâng cao, Chỉnh form Squat/Deadlift', 'Chứng chỉ NASM CPT với hơn 6 năm kinh nghiệm huấn luyện cá nhân chuyên sâu.', 4.9, TRUE)
                RETURNING id;
            `, [ptUserId]);
            trainerId = newTrainer.rows[0].id;
        } else {
            trainerId = trainerRes.rows[0].id;
        }

        // 3. Tạo lịch làm việc (Thứ 2 đến Chủ nhật: 08:00 - 21:00)
        for (let day = 0; day <= 6; day++) {
            await pool.query(`
                INSERT INTO trainer_availability (trainer_id, day_of_week, start_time, end_time, slot_duration_minutes)
                SELECT $1, $2, '08:00', '21:00', 60
                WHERE NOT EXISTS (
                    SELECT 1 FROM trainer_availability WHERE trainer_id = $1 AND day_of_week = $2
                );
            `, [trainerId, day]);
        }

        console.log(`✅ Đã thiết lập HLV: HLV Tuấn Coach (ID: ${trainerId}, UserID: ${ptUserId})`);
        console.log('✅ Đã thiết lập lịch rảnh 08:00 - 21:00 cho cả tuần (CN - T7)!');
    } catch (err) {
        console.error('❌ Lỗi seed HLV:', err);
    } finally {
        pool.end();
    }
};

seed();
