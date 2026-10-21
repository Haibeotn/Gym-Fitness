// controllers/workoutLogCtrl.js
const pool = require('../config/db');

/**
 * 1. Lưu nhật ký buổi tập thực tế và các hiệp tập đã hoàn thành
 * POST /api/workouts/logs
 */
exports.saveWorkoutLog = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { planId, readinessScore, sessionRpe, notes, durationMinutes, sets } = req.body;

        if (!sets || !Array.isArray(sets) || sets.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ít nhất 1 hiệp tập đã hoàn thành.' });
        }

        await client.query('BEGIN');

        // Tính tổng khối lượng tạ đã nâng (Volume Load)
        let totalVolume = 0;
        sets.forEach(s => {
            const weight = parseFloat(s.actualWeight) || 0;
            const reps = parseInt(s.actualReps, 10) || 0;
            if (!s.isWarmup) {
                totalVolume += weight * reps;
            }
        });

        // Tạo bản ghi workout_logs
        const logRes = await client.query(`
            INSERT INTO workout_logs (user_id, plan_id, readiness_score, session_rpe, notes, duration_minutes, total_volume_kg, ended_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            RETURNING *;
        `, [
            userId,
            planId || null,
            readinessScore ? parseInt(readinessScore, 10) : 8,
            sessionRpe ? parseInt(sessionRpe, 10) : 8,
            notes || '',
            durationMinutes ? parseInt(durationMinutes, 10) : 45,
            totalVolume
        ]);

        const logId = logRes.rows[0].id;

        // Lưu từng hiệp tập vào log_sets
        for (const s of sets) {
            await client.query(`
                INSERT INTO log_sets (log_id, exercise_name, set_number, actual_weight, actual_reps, actual_rpe, is_warmup)
                VALUES ($1, $2, $3, $4, $5, $6, $7);
            `, [
                logId,
                s.exerciseName || 'Bài tập',
                s.setNumber || 1,
                parseFloat(s.actualWeight) || 0,
                parseInt(s.actualReps, 10) || 0,
                s.actualRpe ? parseInt(s.actualRpe, 10) : 8,
                !!s.isWarmup
            ]);
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: '🎉 Chúc mừng bạn đã hoàn thành buổi tập xuất sắc!',
            log: logRes.rows[0],
            totalVolumeKg: totalVolume,
            setsCount: sets.length
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi lưu nhật ký buổi tập:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lưu nhật ký buổi tập.' });
    } finally {
        client.release();
    }
};

/**
 * 2. Lấy lịch sử các buổi tập đã hoàn thành
 * GET /api/workouts/logs/history
 */
exports.getWorkoutHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const logsQuery = `
            SELECT wl.*,
                   json_agg(
                       json_build_object(
                           'id', ls.id,
                           'exercise_name', ls.exercise_name,
                           'set_number', ls.set_number,
                           'actual_weight', ls.actual_weight,
                           'actual_reps', ls.actual_reps,
                           'actual_rpe', ls.actual_rpe,
                           'is_warmup', ls.is_warmup
                       ) ORDER BY ls.id ASC
                   ) as sets
            FROM workout_logs wl
            LEFT JOIN log_sets ls ON wl.id = ls.log_id
            WHERE wl.user_id = $1
            GROUP BY wl.id
            ORDER BY wl.started_at DESC
            LIMIT 20;
        `;

        const result = await pool.query(logsQuery, [userId]);

        return res.json({
            success: true,
            history: result.rows
        });
    } catch (error) {
        console.error('Lỗi lấy lịch sử tập:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử tập luyện.' });
    }
};

/**
 * 3. Ghi nhận cân nặng theo dõi tiến độ
 * POST /api/workouts/progress/weight
 */
exports.logWeightProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { weight, bodyFatPercentage, notes } = req.body;

        if (!weight || isNaN(weight)) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số cân nặng hợp lệ.' });
        }

        const numWeight = parseFloat(weight);

        // Lưu vào weight_history
        const logRes = await pool.query(`
            INSERT INTO weight_history (user_id, weight, body_fat_percentage, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, [
            userId,
            numWeight,
            bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
            notes || ''
        ]);

        // Đồng bộ cập nhật vào bảng users
        await pool.query(`UPDATE users SET weight = $1 WHERE id = $2;`, [numWeight, userId]);

        return res.status(201).json({
            success: true,
            message: 'Đã cập nhật chỉ số cân nặng thành công!',
            record: logRes.rows[0]
        });
    } catch (error) {
        console.error('Lỗi cập nhật cân nặng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lưu cân nặng.' });
    }
};

/**
 * 4. Lấy dữ liệu phân tích biểu đồ tiến độ & Volume tích lũy
 * GET /api/workouts/progress/analytics
 */
exports.getProgressAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Lịch sử cân nặng
        const weightRes = await pool.query(`
            SELECT id, weight, body_fat_percentage, notes, recorded_at
            FROM weight_history
            WHERE user_id = $1
            ORDER BY recorded_at ASC
            LIMIT 30;
        `, [userId]);

        // 2. Thống kê tập luyện (Tổng buổi, Tổng volume, Trung bình thời gian)
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*) as total_workouts,
                COALESCE(SUM(total_volume_kg), 0) as total_volume_lifted,
                COALESCE(AVG(duration_minutes), 0) as avg_duration_minutes,
                COALESCE(AVG(session_rpe), 0) as avg_session_rpe
            FROM workout_logs
            WHERE user_id = $1;
        `, [userId]);

        // 3. Khối lượng tạ theo tuần gần nhất
        const volumeTrendRes = await pool.query(`
            SELECT 
                DATE(started_at) as workout_date,
                SUM(total_volume_kg) as daily_volume,
                COUNT(*) as sessions_count
            FROM workout_logs
            WHERE user_id = $1 AND started_at >= CURRENT_DATE - INTERVAL '14 days'
            GROUP BY DATE(started_at)
            ORDER BY workout_date ASC;
        `, [userId]);

        return res.json({
            success: true,
            weightHistory: weightRes.rows,
            summary: {
                totalWorkouts: parseInt(statsRes.rows[0].total_workouts, 10),
                totalVolumeLifted: parseFloat(statsRes.rows[0].total_volume_lifted),
                avgDurationMinutes: Math.round(parseFloat(statsRes.rows[0].avg_duration_minutes)),
                avgSessionRpe: Math.round(parseFloat(statsRes.rows[0].avg_session_rpe) * 10) / 10
            },
            volumeTrend: volumeTrendRes.rows
        });
    } catch (error) {
        console.error('Lỗi lấy phân tích tiến độ:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi phân tích tiến độ.' });
    }
};

/**
 * 5. Báo cáo Tổng kết Tiến độ Toàn diện (PDF / Infographic Export)
 * GET /api/workouts/progress/report
 */
exports.getProgressReport = async (req, res) => {
    try {
        const userId = req.query.userId || req.user.id;

        // 1. User info & Coach info
        const userRes = await pool.query(`
            SELECT 
                u.id, u.full_name, u.email, u.phone, u.gender, u.age, u.height, u.weight, u.goal, u.activity_level, u.created_at,
                tu.full_name as trainer_name, tu.phone as trainer_phone, t.specialization as trainer_specialization,
                up.total_sessions, up.remaining_sessions, up.status as package_status,
                p.nutrition_data, p.workout_data, p.ai_advice
            FROM users u
            LEFT JOIN LATERAL (
                SELECT * FROM user_packages WHERE user_id = u.id ORDER BY purchased_at DESC LIMIT 1
            ) up ON true
            LEFT JOIN trainers t ON up.trainer_id = t.id
            LEFT JOIN users tu ON t.user_id = tu.id
            LEFT JOIN LATERAL (
                SELECT * FROM user_plans WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
            ) p ON true
            WHERE u.id = $1
        `, [userId]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });
        }

        const user = userRes.rows[0];

        // 2. Workout statistics
        const statsRes = await pool.query(`
            SELECT 
                COUNT(DISTINCT wl.id) as total_workouts,
                COALESCE(SUM(wl.total_volume_kg), 0) as total_volume_lifted,
                COALESCE(AVG(wl.duration_minutes), 0) as avg_duration_minutes,
                COALESCE(AVG(wl.session_rpe), 0) as avg_rpe,
                COUNT(ls.id) as total_sets_completed,
                COALESCE(SUM(ls.actual_reps), 0) as total_reps_completed
            FROM workout_logs wl
            LEFT JOIN log_sets ls ON wl.id = ls.log_id
            WHERE wl.user_id = $1
        `, [userId]);

        // 3. Weight transformation
        const weightRes = await pool.query(`
            SELECT weight, body_fat_percentage, recorded_at
            FROM weight_history
            WHERE user_id = $1
            ORDER BY recorded_at ASC
        `, [userId]);

        const startingWeight = weightRes.rows[0]?.weight || user.weight || 70;
        const currentWeight = weightRes.rows[weightRes.rows.length - 1]?.weight || user.weight || 70;
        const weightChange = (currentWeight - startingWeight).toFixed(1);

        // 4. Nutrition logs summary (last 7 days)
        const mealsRes = await pool.query(`
            SELECT 
                COALESCE(AVG(daily_calories), 0) as avg_daily_calories,
                COALESCE(AVG(daily_protein), 0) as avg_daily_protein,
                COALESCE(AVG(daily_carbs), 0) as avg_daily_carbs,
                COALESCE(AVG(daily_fat), 0) as avg_daily_fat
            FROM (
                SELECT 
                    log_date,
                    SUM(calories) as daily_calories,
                    SUM(protein) as daily_protein,
                    SUM(carbs) as daily_carbs,
                    SUM(fat) as daily_fat
                FROM meal_logs
                WHERE user_id = $1 AND log_date >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY log_date
            ) d
        `, [userId]);

        // 5. Top lifted exercises
        const topExRes = await pool.query(`
            SELECT 
                exercise_name,
                MAX(actual_weight) as max_weight,
                SUM(actual_weight * actual_reps) as total_volume
            FROM log_sets ls
            JOIN workout_logs wl ON ls.log_id = wl.id
            WHERE wl.user_id = $1 AND ls.exercise_name IS NOT NULL
            GROUP BY exercise_name
            ORDER BY max_weight DESC, total_volume DESC
            LIMIT 4
        `, [userId]);

        // 6. Streak calculation
        const streakRes = await pool.query(`
            SELECT COUNT(DISTINCT DATE(started_at)) as active_days
            FROM workout_logs
            WHERE user_id = $1 AND started_at >= CURRENT_DATE - INTERVAL '30 days'
        `, [userId]);

        const certCode = `FIT-CERT-${new Date().getFullYear()}-${userId.toString().padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        return res.json({
            success: true,
            report: {
                certCode,
                generatedAt: new Date().toISOString(),
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    gender: user.gender,
                    age: user.age,
                    height: user.height,
                    startingWeight,
                    currentWeight,
                    weightChange,
                    goal: user.goal,
                    activityLevel: user.activity_level,
                    trainerName: user.trainer_name || 'HLV Trưởng Tuấn Coach',
                    trainerSpecialization: user.trainer_specialization || 'Master Trainer & Calisthenics Specialist',
                    totalSessions: user.total_sessions || 0,
                    remainingSessions: user.remaining_sessions || 0
                },
                workoutStats: {
                    totalWorkouts: parseInt(statsRes.rows[0].total_workouts || 0, 10),
                    totalVolumeLifted: parseFloat(statsRes.rows[0].total_volume_lifted || 0),
                    totalSetsCompleted: parseInt(statsRes.rows[0].total_sets_completed || 0, 10),
                    totalRepsCompleted: parseInt(statsRes.rows[0].total_reps_completed || 0, 10),
                    avgDurationMinutes: Math.round(parseFloat(statsRes.rows[0].avg_duration_minutes || 45)),
                    avgRpe: Math.round(parseFloat(statsRes.rows[0].avg_rpe || 8) * 10) / 10,
                    activeDaysMonth: parseInt(streakRes.rows[0].active_days || 0, 10),
                    topExercises: topExRes.rows
                },
                nutritionSummary: {
                    avgDailyCalories: Math.round(parseFloat(mealsRes.rows[0].avg_daily_calories || 0)),
                    avgDailyProtein: Math.round(parseFloat(mealsRes.rows[0].avg_daily_protein || 0)),
                    avgDailyCarbs: Math.round(parseFloat(mealsRes.rows[0].avg_daily_carbs || 0)),
                    avgDailyFat: Math.round(parseFloat(mealsRes.rows[0].avg_daily_fat || 0)),
                    targetCalories: user.nutrition_data?.targetCalories || 2200,
                    targetProtein: user.nutrition_data?.protein || 150
                },
                weightHistory: weightRes.rows,
                coachEvaluation: user.ai_advice || 'Học viên có tính kỷ luật cao, duy trì form động tác chuẩn xác và có sự tiến bộ vượt bậc về sức mạnh và tỷ lệ cơ bắp.'
            }
        });
    } catch (error) {
        console.error('Lỗi tạo báo cáo tiến độ:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi trích xuất báo cáo.' });
    }
};
