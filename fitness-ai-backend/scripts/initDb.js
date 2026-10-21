// scripts/initDb.js
const pool = require('../config/db');

const createTables = async () => {
    const queryText = `
        -- 1. Bảng Vai trò (Roles)
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL
        );

        -- 2. Bảng lưu thông tin Người dùng & Khách hàng
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            phone VARCHAR(20) UNIQUE,
            google_id VARCHAR(255) UNIQUE,
            password VARCHAR(255),
            role VARCHAR(20) DEFAULT 'member', -- 'member', 'pt', 'admin'
            gender VARCHAR(10),
            age INT,
            height FLOAT,
            weight FLOAT,
            goal VARCHAR(50),
            activity_level VARCHAR(50),
            injuries TEXT[],
            avatar_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Đảm bảo các cột mới tồn tại nếu bảng đã được tạo trước đó
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

        -- 2b. Bảng Lưu mã OTP xác thực số điện thoại
        CREATE TABLE IF NOT EXISTS otp_codes (
            id SERIAL PRIMARY KEY,
            phone VARCHAR(20) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 3. Bảng Huấn luyện viên (Trainers / PT)
        CREATE TABLE IF NOT EXISTS trainers (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            specialization VARCHAR(100),
            bio TEXT,
            rating DECIMAL(3,2) DEFAULT 5.0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. Bảng Gói tập theo số buổi (Packages)
        CREATE TABLE IF NOT EXISTS packages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            session_count INT NOT NULL,
            price DECIMAL(12,2) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. Bảng Gói tập người dùng sở hữu (User Packages)
        CREATE TABLE IF NOT EXISTS user_packages (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            package_id INT REFERENCES packages(id),
            trainer_id INT REFERENCES trainers(id),
            total_sessions INT NOT NULL,
            remaining_sessions INT NOT NULL,
            needs_review BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'expired'
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 6. Bảng Thư viện Bài tập (Exercises)
        CREATE TABLE IF NOT EXISTS exercises (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            video_url VARCHAR(255),
            mechanic VARCHAR(50),          -- Compound / Isolation
            primary_muscle VARCHAR(50),    -- Cơ chính
            secondary_muscles TEXT[],      -- Cơ phụ
            equipment_required TEXT[],     -- Dụng cụ cần thiết
            contraindications TEXT[],      -- Chống chỉ định
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 7. Bảng Lịch tập (Workout Plans)
        CREATE TABLE IF NOT EXISTS workout_plans (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            created_by VARCHAR(50) DEFAULT 'AI',        -- 'AI' hoặc 'PT'
            plan_name VARCHAR(255),
            phase VARCHAR(50),
            status VARCHAR(50) DEFAULT 'approved',      -- 'draft', 'pending_pt_approval', 'approved'
            trainer_id INT REFERENCES trainers(id),
            trainer_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 8. Bảng Chi tiết các bài trong buổi tập
        CREATE TABLE IF NOT EXISTS plan_exercises (
            id SERIAL PRIMARY KEY,
            plan_id INT REFERENCES workout_plans(id) ON DELETE CASCADE,
            exercise_id INT REFERENCES exercises(id),
            sequence_order INT,
            target_sets INT,
            target_reps VARCHAR(50),
            target_rpe INT,
            rest_time_seconds INT
        );

        -- 9. Bảng Hồ sơ Giáo án & Lộ trình người dùng (User Plans JSONB)
        CREATE TABLE IF NOT EXISTS user_plans (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            nutrition_data JSONB,
            workout_data JSONB,
            ai_advice TEXT,
            ai_reasoning JSONB,
            status VARCHAR(50) DEFAULT 'approved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 10. Bảng Nhật ký tập luyện thực tế (Workout Logs)
        CREATE TABLE IF NOT EXISTS workout_logs (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            plan_id INT REFERENCES workout_plans(id),
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP,
            readiness_score INT CHECK (readiness_score BETWEEN 1 AND 10),
            session_rpe INT CHECK (session_rpe BETWEEN 1 AND 10),
            notes TEXT
        );

        -- 11. Bảng Kết quả từng hiệp tập (Log Sets)
        CREATE TABLE IF NOT EXISTS log_sets (
            id SERIAL PRIMARY KEY,
            log_id INT REFERENCES workout_logs(id) ON DELETE CASCADE,
            plan_exercise_id INT REFERENCES plan_exercises(id),
            exercise_name VARCHAR(255),
            set_number INT,
            actual_weight DECIMAL(5,2),
            actual_reps INT,
            actual_rpe INT,
            is_warmup BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE log_sets ADD COLUMN IF NOT EXISTS exercise_name VARCHAR(255);
        ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS total_volume_kg DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 0;

        -- 11b. Bảng Theo dõi Cân nặng & Tiến độ (Weight History)
        CREATE TABLE IF NOT EXISTS weight_history (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            weight FLOAT NOT NULL,
            body_fat_percentage FLOAT,
            notes TEXT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );


        -- 12. Bảng Thời gian rảnh của HLV (Trainer Availability)
        CREATE TABLE IF NOT EXISTS trainer_availability (
            id SERIAL PRIMARY KEY,
            trainer_id INT REFERENCES trainers(id) ON DELETE CASCADE,
            day_of_week INT NOT NULL, -- 0 = CN, 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6, 6 = T7
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            slot_duration_minutes INT DEFAULT 60,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 13. Bảng Đặt lịch tập với PT (Bookings)
        CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            trainer_id INT REFERENCES trainers(id) ON DELETE CASCADE,
            user_package_id INT REFERENCES user_packages(id) ON DELETE SET NULL,
            booking_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'completed', 'cancelled'
            notes TEXT,
            cancel_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Khởi tạo dữ liệu roles mặc định
        INSERT INTO roles (name) VALUES ('member'), ('pt'), ('admin') ON CONFLICT (name) DO NOTHING;

        -- Khởi tạo các gói tập mẫu nếu chưa có
        INSERT INTO packages (name, session_count, price, description)
        VALUES 
            ('Gói Khởi Động (12 Buổi)', 12, 3600000, 'Lý tưởng cho người mới bắt đầu làm quen form và dinh dưỡng cùng PT 1-1'),
            ('Gói Tiến Bộ (24 Buổi)', 24, 6800000, 'Tối ưu hóa thể trạng, xây dựng kỷ luật và tăng cơ/giảm mỡ rõ rệt'),
            ('Gói Chuyển Hóa (36 Buổi)', 36, 9600000, 'Chương trình toàn diện thay đổi vóc dáng và duy trì lối sống đỉnh cao')
        ON CONFLICT DO NOTHING;
    `;

    try {
        console.log('⏳ Đang dọn dẹp mặt bằng và thiết lập cơ sở dữ liệu phòng Gym...');
        await pool.query(queryText);
        console.log('✅ Đã tạo thành công cấu trúc bảng (Users, Roles, Trainers, Packages, Plans, Bookings, Availability...)');

        // Seed availability mẫu cho PT nếu có
        const ptRes = await pool.query("SELECT id FROM trainers LIMIT 1;");
        if (ptRes.rows.length > 0) {
            const ptId = ptRes.rows[0].id;
            for (let day = 1; day <= 6; day++) {
                await pool.query(`
                    INSERT INTO trainer_availability (trainer_id, day_of_week, start_time, end_time)
                    SELECT $1, $2, '08:00', '21:00'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM trainer_availability WHERE trainer_id = $1 AND day_of_week = $2
                    );
                `, [ptId, day]);
            }
            console.log('✅ Đã nạp lịch rảnh mẫu cho PT!');
        }
    } catch (error) {
        console.error('❌ Lỗi khi thi công cơ sở dữ liệu:', error.message);
    } finally {
        pool.end();
        process.exit(0);
    }
};

createTables();

