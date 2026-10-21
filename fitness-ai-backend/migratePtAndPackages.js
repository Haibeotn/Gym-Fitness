// fitness-ai-backend/migratePtAndPackages.js
const pool = require('./config/db');
const bcrypt = require('bcrypt');


async function migrate() {
  try {
    console.log('🚀 Bắt đầu cập nhật PT và chuẩn hóa gói tập...');

    // 1. Tạo tài khoản cho PT mới: Coach Hoàng Long
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const ptUserRes = await pool.query("SELECT id FROM users WHERE email = 'hoanglong.pt@fitnessai.vn';");
    let ptUserId;
    if (ptUserRes.rows.length === 0) {
      const insRes = await pool.query(`
        INSERT INTO users (full_name, email, password, role, phone, goal, activity_level)
        VALUES ('Coach Hoàng Long', 'hoanglong.pt@fitnessai.vn', $1, 'pt', '0988776655', 'Tăng cơ & Calisthenics', 'active')
        RETURNING id;
      `, [hashedPassword]);
      ptUserId = insRes.rows[0].id;


      console.log('✅ Tạo tài khoản Coach Hoàng Long (ID:', ptUserId, ')');
    } else {
      ptUserId = ptUserRes.rows[0].id;
      await pool.query("UPDATE users SET role = 'pt', full_name = 'Coach Hoàng Long' WHERE id = $1;", [ptUserId]);
    }

    // 2. Chuyển các booking/user_packages đang trỏ tới admin (trainer_id = 3) sang Coach Minh Tuấn (trainer_id = 1)
    await pool.query("UPDATE user_packages SET trainer_id = 1 WHERE trainer_id = 3;");
    await pool.query("UPDATE bookings SET trainer_id = 1 WHERE trainer_id = 3;");

    // Xóa admin khỏi bảng trainers
    await pool.query("DELETE FROM trainers WHERE user_id = 10 OR specialization = 'Huấn luyện viên cá nhân';");
    console.log('✅ Đã gỡ bỏ Quản Trị Viên khỏi danh sách PT.');

    // 3. Thêm Coach Hoàng Long vào bảng trainers
    const tCheck = await pool.query("SELECT id FROM trainers WHERE user_id = $1;", [ptUserId]);
    if (tCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO trainers (user_id, specialization, bio, rating, is_active)
        VALUES ($1, 'Calisthenics, Sức bền & Tăng cơ Hypertrophy', 'Chứng chỉ quốc tế NASM CPT, cựu VĐV Thể hình & Calisthenics Street Workout.', 4.95, true);
      `, [ptUserId]);
      console.log('✅ Đã thêm Coach Hoàng Long vào danh sách Huấn Luyện Viên chính thức!');
    }


    // 4. Chuẩn hóa bảng packages (chỉ giữ đúng 3 gói chính xác)
    await pool.query("UPDATE user_packages SET package_id = 1 WHERE package_id IN (4, 7);");
    await pool.query("UPDATE user_packages SET package_id = 2 WHERE package_id IN (5, 8);");
    await pool.query("UPDATE user_packages SET package_id = 3 WHERE package_id IN (6, 9);");
    await pool.query("UPDATE payments SET package_id = 1 WHERE package_id IN (4, 7);");
    await pool.query("UPDATE payments SET package_id = 2 WHERE package_id IN (5, 8);");
    await pool.query("UPDATE payments SET package_id = 3 WHERE package_id IN (6, 9);");

    await pool.query("DELETE FROM packages WHERE id NOT IN (1, 2, 3);");

    await pool.query(`
      UPDATE packages SET 
        name = 'Gói Khởi Động (12 Buổi)',
        session_count = 12,
        price = 3600000.00,
        description = 'Làm quen form chuẩn & dinh dưỡng 1-1 cùng Huấn luyện viên, AI phân tích Calo.'
      WHERE id = 1;
    `);

    await pool.query(`
      UPDATE packages SET 
        name = 'Gói Tiến Bộ (24 Buổi)',
        session_count = 24,
        price = 6800000.00,
        description = 'Xây dựng cơ bắp & giảm mỡ rõ rệt, PT thiết kế giáo án riêng biệt, check-in QR VIP.'
      WHERE id = 2;
    `);

    await pool.query(`
      UPDATE packages SET 
        name = 'Gói Toàn Diện VIP (36 Buổi)',
        session_count = 36,
        price = 9600000.00,
        description = 'Chương trình lột xác vóc dáng đỉnh cao, kèm 1-1 chuyên sâu và tư vấn dinh dưỡng 24/7.'
      WHERE id = 3;
    `);

    console.log('✅ Đã chuẩn hóa 3 gói tập chính xác!');

    // 5. Kiểm tra lại danh sách PT và Gói tập
    const tFinal = await pool.query("SELECT t.id, u.full_name, u.email, t.specialization, t.rating FROM trainers t JOIN users u ON t.user_id = u.id;");
    console.log('📋 Danh sách PT sau cập nhật:', tFinal.rows);

    const pFinal = await pool.query("SELECT id, name, session_count, price FROM packages ORDER BY id ASC;");
    console.log('📋 Danh sách Gói tập sau cập nhật:', pFinal.rows);

  } catch (err) {
    console.error('Lỗi migration:', err);
  } finally {
    pool.end();
  }
}
migrate();
