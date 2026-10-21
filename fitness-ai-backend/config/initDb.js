const initExercisesTable = async (pool) => {
    try {
        // 1. Tạo bảng exercises
        await pool.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        muscle_group VARCHAR(50) NOT NULL,
        type VARCHAR(50),
        equipment VARCHAR(100),
        instructions TEXT,
        avoid_if TEXT
      );
    `);

        // 2. Kiểm tra nếu chưa có bài tập nào thì nạp mẫu
        const countRes = await pool.query('SELECT COUNT(*) FROM exercises');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            await pool.query(`
        INSERT INTO exercises (name, muscle_group, type, equipment, instructions, avoid_if) VALUES
        ('Dumbbell Bench Press', 'Chest', 'Compound', 'Dumbbell, Flat Bench', 'Nằm trên ghế phẳng, đẩy tạ đôi lên cao kiểm soát.', 'Đau khớp vai nặng'),
        ('Push-Up', 'Chest', 'Bodyweight', 'Bodyweight', 'Chống đẩy với thân người thẳng, siết chặt cơ bụng.', 'Đau cổ tay'),
        ('Incline Dumbbell Press', 'Chest', 'Compound', 'Dumbbell, Incline Bench', 'Đẩy tạ đôi trên ghế dốc lên tập ngực trên.', 'Đau khớp vai'),
        ('Goblet Squat', 'Legs', 'Compound', 'Dumbbell', 'Giữ tạ trước ngực, hạ người xuống tư thế squat chuẩn.', 'Đau khớp gối nặng'),
        ('Dumbbell Row', 'Back', 'Compound', 'Dumbbell', 'Gập hông, kéo tạ đôi sát sườn ép cơ lưng.', 'Đau thắt lưng cấp tính');
      `);
            console.log('✅ Đã khởi tạo dữ liệu mẫu cho bảng exercises!');
        }
    } catch (error) {
        console.error('❌ Lỗi tạo bảng exercises:', error.message);
    }
};