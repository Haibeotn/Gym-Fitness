// scripts/seedDb.js
const pool = require('../config/db');

const seedData = async () => {
    // 1. Lệnh INSERT User mẫu
    const insertUserQuery = `
        INSERT INTO users (full_name, email, height, weight, goal, injuries, role)
        VALUES (
            'Nguyễn Văn Trăm Ký', 
            'tramky@gym.com', 
            175.5, 
            80.0, 
            'Giảm mỡ', 
            ARRAY['Đau lưng dưới']::text[],
            'member'
        )
        ON CONFLICT (email) DO NOTHING;
    `;

    // 2. Lệnh INSERT PT mẫu
    const insertPTUserQuery = `
        INSERT INTO users (full_name, email, role)
        VALUES (
            'Coach Minh Tuấn',
            'tuan.coach@gym.com',
            'pt'
        )
        ON CONFLICT (email) DO NOTHING;
    `;

    // 3. Lệnh INSERT Exercises mẫu
    const insertExercisesQuery = `
        INSERT INTO exercises (name, description, mechanic, primary_muscle, secondary_muscles, equipment_required, contraindications)
        VALUES 
        (
            'Barbell Back Squat', 
            'Gánh tạ đòn ngồi xổm. Vua của các bài tập thân dưới.', 
            'Compound', 
            'Quadriceps', 
            ARRAY['Glutes', 'Hamstrings', 'Calves']::text[], 
            ARRAY['Barbell', 'Squat Rack']::text[], 
            ARRAY['Đau lưng dưới', 'Chấn thương đầu gối']::text[]
        ),
        (
            'Dumbbell Bench Press', 
            'Đẩy tạ đơn trên ghế phẳng. Giúp phát triển cơ ngực đều 2 bên.', 
            'Compound', 
            'Chest', 
            ARRAY['Triceps', 'Front Deltoids']::text[], 
            ARRAY['Dumbbell', 'Flat Bench']::text[], 
            ARRAY['Đau khớp vai']::text[]
        ),
        (
            'Incline Dumbbell Press', 
            'Đẩy tạ đơn ghế dốc lên. Tập trung cơ ngực trên.', 
            'Compound', 
            'Chest', 
            ARRAY['Triceps', 'Front Deltoids']::text[], 
            ARRAY['Dumbbell', 'Flat Bench']::text[], 
            ARRAY['Đau khớp vai']::text[]
        ),
        (
            'Push-Up (Chống đẩy)', 
            'Bài tập ngực và thân trên bodyweight cơ bản và an toàn.', 
            'Compound', 
            'Chest', 
            ARRAY['Triceps', 'Core']::text[], 
            ARRAY[]::text[], 
            ARRAY['Đau cổ tay nặng']::text[]
        ),
        (
            'Lat Pulldown', 
            'Kéo cáp tập lưng xô. Phù hợp cho người chưa thể hít xà.', 
            'Compound', 
            'Lats', 
            ARRAY['Biceps', 'Rear Deltoids']::text[], 
            ARRAY['Cable Machine']::text[], 
            ARRAY[]::text[]
        ),
        (
            'Plank', 
            'Giữ tư thế chống đẩy tĩnh. Tăng sức bền core.', 
            'Isolation', 
            'Core', 
            ARRAY['Shoulders']::text[], 
            ARRAY[]::text[],
            ARRAY['Thoát vị đĩa đệm nặng']::text[]
        );
    `;

    // 4. Lệnh INSERT Packages mẫu
    const insertPackagesQuery = `
        INSERT INTO packages (name, session_count, price, description)
        VALUES 
        (
            'Gói Khởi Đầu 12 Buổi PT',
            12,
            3600000,
            '12 buổi kèm 1-1 với Huấn luyện viên chuyên nghiệp, AI hỗ trợ theo dõi Calo và bài tập.'
        ),
        (
            'Gói Chuyển Hóa 24 Buổi PT',
            24,
            6800000,
            '24 buổi đồng hành chuyên sâu, cam kết form chuẩn và thay đổi vóc dáng rõ rệt.'
        ),
        (
            'Gói Toàn Diện 36 Buổi PT',
            36,
            9600000,
            '36 buổi hoàn thiện kỹ thuật nâng tạ và chế độ dinh dưỡng cá nhân hóa cao cấp.'
        )
        ON CONFLICT DO NOTHING;
    `;

    try {
        console.log('🚚 Đang vận chuyển thiết bị (Dữ liệu mẫu) vào phòng Gym...');

        await pool.query(insertUserQuery);
        await pool.query(insertPTUserQuery);
        console.log('👤 Đã thêm Khách hàng & Huấn luyện viên mẫu!');

        await pool.query('TRUNCATE exercises CASCADE;');
        await pool.query(insertExercisesQuery);
        console.log('🏋️‍♂️ Đã thêm các Bài tập mẫu vào thư viện!');

        await pool.query(insertPackagesQuery);
        console.log('📦 Đã tạo các Gói tập session-based mẫu!');

        console.log('✅ Hoàn tất nhập kho! Cơ sở dữ liệu đã sẵn sàng hoạt động.');
    } catch (error) {
        console.error('❌ Quá trình nhập kho thất bại:', error.message);
    } finally {
        pool.end();
        process.exit(0);
    }
};

seedData();
