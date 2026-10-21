// controllers/workoutCtrl.js
const pool = require('../config/db');
const llmService = require('../services/llmService');
const aiService = require('../services/aiService');

/**
 * 1. TẠO LỘ TRÌNH BÀI TẬP THÔNG MINH ĐA NHÓM CƠ & ĐA DỤNG CỤ
 */
const getPersonalizedWorkout = async (req, res) => {
    const { 
        targetMuscle, 
        targetMuscles, 
        userInjuries = [], 
        availableEquipment = [], 
        environment = 'all',
        shouldSaveToPlan,
        userId,
        mode = 'smart', // 'smart' (rule-based algorithm) or 'ai' (pure LLM Gemini)
        useAi = false,
        goal = 'Tăng cơ giảm mỡ',
        fitnessLevel = 'Trung bình'
    } = req.body;

    // Chấp nhận cả targetMuscles (mảng) hoặc targetMuscle (chuỗi đơn)
    const musclesToTarget = targetMuscles || (targetMuscle ? [targetMuscle] : []);
    const muscleTitle = musclesToTarget.length > 0 ? musclesToTarget.join(', ') : 'Toàn thân';

    try {
        let exercises = [];
        let coachMessage = "";

        // Chế độ 1: Tạo bài tập trực tiếp từ AI (Gemini 4-Phase Architecture)
        if (mode === 'ai' || useAi) {
            try {
                const aiResult = await llmService.generateAiCustomWorkoutPlan(
                    musclesToTarget,
                    userInjuries,
                    availableEquipment,
                    goal
                );

                if (aiResult?.exercises && aiResult.exercises.length > 0) {
                    exercises = aiResult.exercises;
                    coachMessage = aiResult.coach_advice || "";
                }
            } catch (aiErr) {
                console.warn("⚠️ AI generation fallback to smart rule-based:", aiErr.message);
            }
        }

        // Chế độ 2: Sinh danh sách bài tập thông minh chuẩn khoa học (Rule-based 4-Phase)
        if (!exercises || exercises.length === 0) {
            exercises = await aiService.generateSafeExercises(
                musclesToTarget, 
                userInjuries, 
                availableEquipment, 
                environment,
                6 // Max 6 bài tập để tránh quá tải CNS
            );

            if (!exercises || exercises.length === 0) {
                return res.status(404).json({
                    status: "warning",
                    message: "Không tìm thấy bài tập phù hợp với điều kiện lọc và chấn thương hiện tại. Hãy thử bổ sung dụng cụ hoặc chọn nhóm cơ khác!"
                });
            }

            try {
                coachMessage = await llmService.generateCoachAdvice(muscleTitle, exercises, {
                    injuries: userInjuries,
                    goal: goal
                });
            } catch (e) {
                coachMessage = `Lộ trình khoa học tối ưu cho nhóm cơ: ${muscleTitle}. Tuân thủ cấu trúc 4 pha, chú ý RPE 7.5 - 8.5 và kiểm soát nhịp tempo chuyển động!`;
            }
        }

        // Nếu có yêu cầu lưu vào Plan của User
        const activeUserId = userId || req.user?.id;
        if (shouldSaveToPlan && activeUserId) {
            try {
                const planCheck = await pool.query(
                    'SELECT id FROM user_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
                    [activeUserId]
                );

                if (planCheck.rows.length > 0) {
                    await pool.query(
                        `UPDATE user_plans 
                         SET workout_data = $1::jsonb, 
                             ai_advice = $2,
                             status = 'approved'
                         WHERE id = $3`,
                        [JSON.stringify(exercises), coachMessage, planCheck.rows[0].id]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO user_plans (user_id, workout_data, ai_advice, status)
                         VALUES ($1, $2::jsonb, $3, 'approved')`,
                        [activeUserId, JSON.stringify(exercises), coachMessage]
                    );
                }
            } catch (saveErr) {
                console.warn('Không thể tự động lưu plan:', saveErr.message);
            }
        }

        return res.status(200).json({
            status: "success",
            message: "🎉 Đã tạo lộ trình bài tập chuẩn khoa học (4-6 bài tối ưu CNS) thành công!",
            ai_coach_advice: coachMessage,
            target_muscles: musclesToTarget,
            total_exercises: exercises.length,
            data: exercises
        });

    } catch (error) {
        console.error("Lỗi getPersonalizedWorkout:", error);
        return res.status(500).json({
            status: "error",
            message: "Lỗi máy chủ khi tạo bài tập: " + error.message
        });
    }
};

/**
 * 2. LẤY THƯ VIỆN BÀI TẬP VỚI BỘ LỌC ĐA NĂNG
 */
const getExerciseLibrary = async (req, res) => {
    const { muscle, equipment, mechanic, search, tag } = req.query;

    try {
        let query = `
            SELECT id, name, description, mechanic, primary_muscle, secondary_muscles, 
                   equipment_required, contraindications, target_sets, target_reps, 
                   target_rpe, instructions, tags
            FROM exercises
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIdx = 1;

        if (muscle && muscle !== 'all') {
            query += ` AND (primary_muscle ILIKE $${paramIdx} OR $${paramIdx} = ANY(secondary_muscles))`;
            queryParams.push(`%${muscle}%`);
            paramIdx++;
        }

        if (equipment && equipment !== 'all') {
            query += ` AND ($${paramIdx} = ANY(equipment_required) OR ($${paramIdx} = 'Bodyweight' AND (equipment_required = '{}' OR equipment_required IS NULL)))`;
            queryParams.push(equipment);
            paramIdx++;
        }

        if (mechanic && mechanic !== 'all') {
            query += ` AND mechanic ILIKE $${paramIdx}`;
            queryParams.push(`%${mechanic}%`);
            paramIdx++;
        }

        if (search) {
            query += ` AND (name ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR instructions ILIKE $${paramIdx})`;
            queryParams.push(`%${search}%`);
            paramIdx++;
        }

        if (tag) {
            query += ` AND $${paramIdx} = ANY(tags)`;
            queryParams.push(tag);
            paramIdx++;
        }

        query += ` ORDER BY primary_muscle, name ASC`;

        const { rows } = await pool.query(query, queryParams);

        return res.status(200).json({
            status: "success",
            total: rows.length,
            exercises: rows
        });
    } catch (error) {
        console.error("Lỗi getExerciseLibrary:", error);
        return res.status(500).json({
            status: "error",
            message: "Lỗi máy chủ khi lấy thư viện bài tập: " + error.message
        });
    }
};

module.exports = { 
    getPersonalizedWorkout,
    getExerciseLibrary
};