// scripts/fixMemberAccount.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const fixMember = async () => {
    try {
        console.log('🔧 Đang sửa chữa và hoàn thiện tài khoản Học viên test.member@gym.com...');
        const passwordHash = await bcrypt.hash('123456', 10);

        // 1. Cập nhật mật khẩu và thông tin thể trạng cho test.member@gym.com
        let userRes = await pool.query(`
            INSERT INTO users (full_name, email, password, role, phone, gender, age, height, weight, goal, activity_level)
            VALUES ('Học Viên Trải Nghiệm', 'test.member@gym.com', $1, 'member', '0912345678', 'male', 26, 175, 74, 'Tăng cơ & Giảm mỡ', 'moderate')
            ON CONFLICT (email) DO UPDATE SET 
                password = EXCLUDED.password, 
                role = 'member',
                full_name = 'Học Viên Trải Nghiệm',
                gender = 'male',
                age = 26,
                height = 175,
                weight = 74,
                goal = 'Tăng cơ & Giảm mỡ',
                activity_level = 'moderate'
            RETURNING id, full_name, email, role;
        `, [passwordHash]);

        const memberId = userRes.rows[0].id;
        console.log(`✅ 1. Tài khoản Học viên (ID: ${memberId}) đã cập nhật mật khẩu '123456'!`);

        // 2. Tạo hoặc cập nhật Giáo án mẫu (User Plan) cho học viên
        const nutritionData = {
            daily_targets: {
                targetCalories: 2250,
                macros: {
                    protein: 160,
                    carbs: 230,
                    fat: 65
                }
            },
            bmr: 1720,
            tdee: 2450,
            reasoning: {
                bmr_explanation: "BMR 1720 kcal tính toán chuẩn xác theo công thức Mifflin-St Jeor cho nam 26 tuổi, 74kg, 175cm.",
                tdee_explanation: "TDEE 2450 kcal tương ứng mức vận động vừa phải (3-4 buổi/tuần).",
                calorie_strategy: "Thâm hụt nhẹ 200 kcal/ngày giúp giảm mỡ thừa trong khi duy trì tối đa khối lượng cơ bắp.",
                macro_breakdown: {
                    protein: "160g (~2.2g/kg) để phục hồi và tổng hợp sợi cơ sau tập nặng.",
                    carb: "230g cung cấp glycogen năng lượng cho các bài tập tạ.",
                    fat: "65g hỗ trợ cân bằng hormone và hấp thu vitamin tan trong chất béo."
                }
            }
        };

        const workoutData = [
            {
                name: "Barbell Bench Press (Đẩy ngực ngang)",
                mechanic: "Compound",
                description: "Nằm vững trên ghế phẳng, hạ tạ kiểm soát chạm ngực dưới và đẩy dứt khoát.",
                target_sets: 4,
                target_reps: "8-10",
                target_rpe: 8
            },
            {
                name: "Incline Dumbbell Press (Đẩy ngực trên với tạ đơn)",
                mechanic: "Compound",
                description: "Ghế nghiêng 30 độ, mở rộng lồng ngực và ép chặt đỉnh cơ ngực trên.",
                target_sets: 3,
                target_reps: "10-12",
                target_rpe: 8
            },
            {
                name: "Barbell Back Squat (Gánh đùi sau)",
                mechanic: "Compound",
                description: "Khóa chặt core bụng, gập gối hông hạ sâu song song mặt sàn, giữ lưng thẳng.",
                target_sets: 4,
                target_reps: "6-8",
                target_rpe: 8
            },
            {
                name: "Cable Tricep Pushdown (Kéo cáp tay sau)",
                mechanic: "Isolation",
                description: "Khép chặt 2 cùi chỏ sát sườn, siết chặt tay sau ở điểm cuối.",
                target_sets: 3,
                target_reps: "12-15",
                target_rpe: 7
            }
        ];

        const planAdvice = "Chào bạn! Với mục tiêu Tăng cơ & Giảm mỡ ở cân nặng 74kg, AI đã xây dựng phác đồ kết hợp đẩy tạ nặng compound và kiểm soát calo 2250 kcal. Hãy giữ kỷ luật và tuân thủ hướng dẫn của Huấn luyện viên 1-1!";

        await pool.query(`DELETE FROM user_plans WHERE user_id = $1;`, [memberId]);
        await pool.query(`
            INSERT INTO user_plans (user_id, nutrition_data, workout_data, ai_advice, ai_reasoning, status)
            VALUES ($1, $2, $3, $4, $5, 'approved');
        `, [memberId, JSON.stringify(nutritionData), JSON.stringify(workoutData), planAdvice, JSON.stringify(nutritionData.reasoning)]);
        console.log('✅ 2. Đã nạp đầy đủ Lộ trình Dinh dưỡng & Bài tập cho Học viên!');

        // 3. Đảm bảo gói tập kèm PT cho học viên
        const ptRes = await pool.query("SELECT id FROM trainers LIMIT 1;");
        const pkgRes = await pool.query("SELECT id FROM packages WHERE session_count = 12 LIMIT 1;");

        if (ptRes.rows.length > 0 && pkgRes.rows.length > 0) {
            const ptId = ptRes.rows[0].id;
            const pkgId = pkgRes.rows[0].id;

            await pool.query(`DELETE FROM user_packages WHERE user_id = $1;`, [memberId]);
            await pool.query(`
                INSERT INTO user_packages (user_id, package_id, trainer_id, total_sessions, remaining_sessions, needs_review, status)
                VALUES ($1, $2, $3, 12, 11, FALSE, 'active');
            `, [memberId, pkgId, ptId]);
            console.log('✅ 3. Đã kích hoạt Gói tập 12 buổi kèm HLV Tuấn Coach cho Học viên!');
        }

        console.log('🎉 TÀI KHOẢN HỌC VIÊN ĐÃ HOÀN HẢO 100%! BẠN CÓ THỂ ĐĂNG NHẬP NGAY.');
    } catch (err) {
        console.error('❌ Lỗi sửa tài khoản học viên:', err);
    } finally {
        pool.end();
    }
};

fixMember();
