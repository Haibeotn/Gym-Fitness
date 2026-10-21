// services/userService.js
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const saveUserOnboarding = async (userInfo, nutritionPlan, workoutPlan, aiAdvice, aiReasoning = null, existingUserId = null) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let userId = existingUserId ? parseInt(existingUserId, 10) : null;
        let role = 'member';

        if (userId && !isNaN(userId)) {
            // Cập nhật thông tin cho User đã tồn tại
            const updateQuery = `
                UPDATE users 
                SET gender = $1, age = $2, weight = $3, height = $4, goal = $5, 
                    activity_level = $6, injuries = $7
                WHERE id = $8
                RETURNING id, role, email, full_name;
            `;
            const updateRes = await client.query(updateQuery, [
                userInfo.gender, userInfo.age, userInfo.weight,
                userInfo.height, userInfo.goal, userInfo.activityLevel,
                userInfo.injuries || [],
                userId
            ]);

            if (updateRes.rows.length > 0) {
                role = updateRes.rows[0].role || 'member';
            } else {
                userId = null;
            }
        }

        if (!userId) {
            // Tạo mới User khách (gán role = 'guest' để phân tách rõ ràng với học viên thật 'member')
            const insertQuery = `
                INSERT INTO users (gender, age, weight, height, goal, activity_level, injuries, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'guest')
                RETURNING id, role;
            `;
            const insertRes = await client.query(insertQuery, [
                userInfo.gender, userInfo.age, userInfo.weight,
                userInfo.height, userInfo.goal, userInfo.activityLevel,
                userInfo.injuries || []
            ]);
            userId = insertRes.rows[0].id;
            role = 'guest';
        }

        // Lưu giáo án và cơ sở suy luận AI vào bảng user_plans
        const planQuery = `
            INSERT INTO user_plans (user_id, nutrition_data, workout_data, ai_advice, ai_reasoning, status)
            VALUES ($1, $2, $3, $4, $5, 'approved')
            RETURNING id;
        `;
        const planValues = [
            userId,
            JSON.stringify(nutritionPlan),
            JSON.stringify(workoutPlan),
            aiAdvice,
            aiReasoning ? JSON.stringify(aiReasoning) : null
        ];
        await client.query(planQuery, planValues);

        await client.query('COMMIT');

        // Tạo JWT Token cho người dùng
        const token = jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET || 'fitness_secret_key',
            { expiresIn: '7d' }
        );

        return {
            userId,
            token,
            role,
            message: "Đã lưu trữ hồ sơ và kế hoạch luyện tập thành công!"
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi lưu dữ liệu người dùng:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getLatestUserPlan = async (userId = null) => {
    const client = await pool.connect();
    try {
        let query;
        let params = [];

        if (userId) {
            query = `
                SELECT u.id as user_id, u.full_name, u.email, u.role, u.gender, u.age, u.weight, u.height, u.goal,
                       u.activity_level, u.injuries,
                       p.nutrition_data, p.workout_data, p.ai_advice, p.ai_reasoning, p.status as plan_status,
                       p.created_at as plan_created_at
                FROM users u
                JOIN user_plans p ON u.id = p.user_id
                WHERE u.id = $1
                ORDER BY p.created_at DESC
                LIMIT 1;
            `;
            params = [userId];
        } else {
            query = `
                SELECT u.id as user_id, u.full_name, u.email, u.role, u.gender, u.age, u.weight, u.height, u.goal,
                       u.activity_level, u.injuries,
                       p.nutrition_data, p.workout_data, p.ai_advice, p.ai_reasoning, p.status as plan_status,
                       p.created_at as plan_created_at
                FROM users u
                JOIN user_plans p ON u.id = p.user_id
                ORDER BY p.created_at DESC
                LIMIT 1;
            `;
        }

        let result = await client.query(query, params);
        if (result.rows.length > 0) {
            return result.rows[0];
        }

        // Nếu user tồn tại nhưng chưa có bản ghi trong user_plans -> Tự động sinh baseline plan
        if (userId) {
            const userCheck = await client.query("SELECT * FROM users WHERE id = $1", [userId]);
            if (userCheck.rows.length > 0) {
                const u = userCheck.rows[0];
                const weight = u.weight || 70;
                const height = u.height || 170;
                const age = u.age || 25;
                const gender = u.gender || 'male';
                const goal = u.goal || 'Tăng cơ & Giảm mỡ';

                const baselineNutrition = {
                    daily_targets: {
                        targetCalories: 2200,
                        macros: { protein: 150, carbs: 220, fat: 60 }
                    },
                    bmr: 1650,
                    tdee: 2350,
                    reasoning: {
                        bmr_explanation: `BMR 1650 kcal theo công thức Mifflin-St Jeor cho cân nặng ${weight}kg, chiều cao ${height}cm.`,
                        tdee_explanation: "TDEE 2350 kcal cho mức vận động 3-4 buổi/tuần.",
                        calorie_strategy: "Tối ưu hóa mức calo cân bằng giúp thay đổi vóc dáng bền vững.",
                        macro_breakdown: {
                            protein: "150g protein hỗ trợ tái tạo mô cơ sau tập luyện.",
                            carb: "220g carbohydrate cung cấp năng lượng tập luyện bền bỉ.",
                            fat: "60g chất béo thiết yếu cho hệ nội tiết."
                        }
                    }
                };

                const baselineWorkout = [
                    {
                        name: "Barbell Bench Press (Đẩy ngực ngang)",
                        mechanic: "Compound",
                        description: "Nằm vững trên ghế phẳng, hạ tạ kiểm soát chạm ngực dưới và đẩy dứt khoát.",
                        target_sets: 4,
                        target_reps: "8-10",
                        target_rpe: 8
                    },
                    {
                        name: "Incline Dumbbell Press (Đẩy ngực tạ đơn ghế dốc)",
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

                const advice = "Chào mừng bạn đến với lộ trình thể hình cá nhân hóa! AI đã thiết lập phác đồ chuẩn cho bạn. Hãy liên hệ Huấn luyện viên để bắt đầu buổi tập 1-1!";

                await client.query(`
                    INSERT INTO user_plans (user_id, nutrition_data, workout_data, ai_advice, ai_reasoning, status)
                    VALUES ($1, $2, $3, $4, $5, 'approved')
                `, [userId, JSON.stringify(baselineNutrition), JSON.stringify(baselineWorkout), advice, JSON.stringify(baselineNutrition.reasoning)]);

                result = await client.query(query, params);
                return result.rows[0];
            }
        }

        return null;
    } catch (error) {
        console.error('Lỗi khi lấy giáo án người dùng:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { saveUserOnboarding, getLatestUserPlan };