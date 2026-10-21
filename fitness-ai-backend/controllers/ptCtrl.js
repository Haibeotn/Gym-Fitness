// controllers/ptCtrl.js
const pool = require('../config/db');

/**
 * 1. LẤY TOÀN BỘ DANH SÁCH HỌC VIÊN DÀNH CHO PT (MÔ HÌNH PHÒNG GYM BOUTIQUE / 1 PT QUẢN LÝ TẤT CẢ)
 * Bao gồm: Học viên kèm 1-1, Học viên tập từ xa / Calisthenics tại nhà, và Học viên trải nghiệm.
 */
const getMyClients = async (req, res) => {
    try {
        const ptUserId = req.user?.id;

        // Tìm trainer_id theo user_id
        let trainerRes = await pool.query('SELECT id FROM trainers WHERE user_id = $1', [ptUserId]);
        let trainerId = trainerRes.rows[0]?.id;

        // Nếu chưa có trong bảng trainers (ví dụ PT vừa đăng ký), tự động tạo bản ghi trainer
        if (!trainerId) {
            const newTrainer = await pool.query(
                `INSERT INTO trainers (user_id, specialization, bio) 
                 VALUES ($1, 'Huấn luyện viên trưởng & Chuyên gia Calisthenics', 'Phụ trách toàn diện học viên tại phòng tập và học viên từ xa') 
                 RETURNING id`,
                [ptUserId]
            );
            trainerId = newTrainer.rows[0].id;
        }

        // Lấy tất cả học viên (role = 'member') kèm gói tập và giáo án mới nhất
        const query = `
            SELECT 
                u.id as client_id,
                u.full_name,
                u.email,
                u.phone,
                u.gender,
                u.age,
                u.weight,
                u.height,
                u.goal,
                u.activity_level,
                u.injuries,
                u.avatar_url,
                u.created_at as member_since,
                up.id as user_package_id,
                COALESCE(up.total_sessions, 0) as total_sessions,
                COALESCE(up.remaining_sessions, 0) as remaining_sessions,
                COALESCE(up.needs_review, FALSE) as needs_review,
                COALESCE(up.status, 'trial') as package_status,
                COALESCE(pkg.name, 'Gói Tự Do / Calisthenics Tại Nhà') as package_name,
                p.id as plan_id,
                COALESCE(p.status, 'approved') as plan_status,
                p.ai_advice,
                p.created_at as plan_created_at,
                CASE 
                    WHEN up.status = 'active' AND up.remaining_sessions > 0 THEN 'pt_1_1'
                    WHEN LOWER(COALESCE(u.goal, '')) LIKE '%calisthenic%' 
                         OR LOWER(COALESCE(u.activity_level, '')) LIKE '%nhà%' 
                         OR LOWER(COALESCE(u.goal, '')) LIKE '%tại nhà%'
                         OR LOWER(COALESCE(u.goal, '')) LIKE '%tự do%' THEN 'calisthenics_home'
                    ELSE 'trial'
                END as client_tier
            FROM users u
            LEFT JOIN LATERAL (
                SELECT * FROM user_packages 
                WHERE user_id = u.id 
                ORDER BY purchased_at DESC 
                LIMIT 1
            ) up ON true
            LEFT JOIN packages pkg ON up.package_id = pkg.id
            LEFT JOIN LATERAL (
                SELECT id, status, ai_advice, created_at 
                FROM user_plans 
                WHERE user_id = u.id 
                ORDER BY created_at DESC 
                LIMIT 1
            ) p ON true
            WHERE u.role = 'member' AND (u.email IS NOT NULL OR u.phone IS NOT NULL)
            ORDER BY 
                CASE WHEN p.status = 'pending_pt_approval' THEN 1 ELSE 2 END,
                up.purchased_at DESC NULLS LAST,
                u.created_at DESC;
        `;

        const { rows } = await pool.query(query);

        return res.status(200).json({
            status: "success",
            trainerId,
            totalClients: rows.length,
            clients: rows
        });
    } catch (error) {
        console.error('Lỗi getMyClients:', error);
        return res.status(500).json({ status: "error", message: "Lỗi máy chủ khi lấy danh sách học viên." });
    }
};

/**
 * 2. XEM CHI TIẾT HỒ SƠ & GIÁO ÁN AI CỦA 1 HỌC VIÊN
 */
const getClientPlanDetail = async (req, res) => {
    const { clientId } = req.params;

    try {
        // Thông tin học viên
        const userRes = await pool.query(
            `SELECT id, full_name, email, phone, gender, age, height, weight, goal, activity_level, injuries, avatar_url, created_at 
             FROM users WHERE id = $1`,
            [clientId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Không tìm thấy học viên." });
        }

        // Gói tập hiện tại
        const pkgRes = await pool.query(
            `SELECT up.*, pkg.name as package_name 
             FROM user_packages up 
             JOIN packages pkg ON up.package_id = pkg.id 
             WHERE up.user_id = $1 
             ORDER BY up.purchased_at DESC LIMIT 1`,
            [clientId]
        );

        // Giáo án mới nhất (kèm AI reasoning)
        const planRes = await pool.query(
            `SELECT id, nutrition_data, workout_data, ai_advice, ai_reasoning, status, created_at 
             FROM user_plans 
             WHERE user_id = $1 
             ORDER BY created_at DESC LIMIT 1`,
            [clientId]
        );

        return res.status(200).json({
            status: "success",
            client: userRes.rows[0],
            userPackage: pkgRes.rows[0] || null,
            latestPlan: planRes.rows[0] || null
        });
    } catch (error) {
        console.error('Lỗi getClientPlanDetail:', error);
        return res.status(500).json({ status: "error", message: "Lỗi máy chủ khi lấy chi tiết học viên." });
    }
};

/**
 * 3. PT DUYỆT & GHI ĐÈ GIÁO ÁN (PT OVERRIDES AI)
 */
const approveOrUpdateClientPlan = async (req, res) => {
    const { clientId } = req.params;
    const { workoutData, nutritionData, ptAdvice, ptNotes } = req.body;

    try {
        // Kiểm tra plan mới nhất của user
        const planCheck = await pool.query(
            `SELECT id FROM user_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [clientId]
        );

        let planId = planCheck.rows[0]?.id;

        const finalWorkout = workoutData !== undefined ? JSON.stringify(workoutData) : null;
        const finalNutrition = nutritionData !== undefined ? JSON.stringify(nutritionData) : null;
        const finalAdvice = ptAdvice || ptNotes || 'Giáo án đã được Huấn Luyện Viên trực tiếp thẩm định & tối ưu hóa.';

        let updatedPlan;

        if (!planId) {
            const insertPlan = await pool.query(`
                INSERT INTO user_plans (user_id, workout_data, nutrition_data, ai_advice, status)
                VALUES ($1, $2::jsonb, $3::jsonb, $4, 'approved')
                RETURNING id, status, workout_data, nutrition_data, ai_advice
            `, [
                clientId,
                finalWorkout || '[]',
                finalNutrition || '{}',
                finalAdvice
            ]);
            updatedPlan = insertPlan.rows[0];
        } else {
            const updateQuery = `
                UPDATE user_plans 
                SET workout_data = COALESCE($1::jsonb, workout_data),
                    nutrition_data = COALESCE($2::jsonb, nutrition_data),
                    ai_advice = COALESCE($3, ai_advice),
                    status = 'approved'
                WHERE id = $4
                RETURNING id, status, workout_data, nutrition_data, ai_advice;
            `;

            const updateRes = await pool.query(updateQuery, [
                finalWorkout,
                finalNutrition,
                finalAdvice,
                planId
            ]);
            updatedPlan = updateRes.rows[0];
        }

        return res.status(200).json({
            status: "success",
            message: "🎉 Huấn luyện viên đã phê duyệt & ghi đè giáo án thành công!",
            plan: updatedPlan
        });
    } catch (error) {
        console.error('Lỗi approveOrUpdateClientPlan:', error);
        return res.status(500).json({ status: "error", message: "Lỗi khi phê duyệt giáo án: " + error.message });
    }
};

/**
 * 4. ĐIỂM DANH / TRỪ SỐ BUỔI TẬP (SESSION DEDUCTION)
 */
const deductSession = async (req, res) => {
    const { clientId } = req.params;
    const { sessionNotes, sessionRpe } = req.body;

    try {
        const pkgRes = await pool.query(
            `SELECT * FROM user_packages 
             WHERE user_id = $1 AND status = 'active' 
             ORDER BY purchased_at DESC LIMIT 1`,
            [clientId]
        );

        if (pkgRes.rows.length === 0) {
            return res.status(400).json({ status: "error", message: "Học viên không có gói tập nào đang hoạt động." });
        }

        const userPackage = pkgRes.rows[0];
        const newRemaining = Math.max(0, userPackage.remaining_sessions - 1);
        const isCompleted = newRemaining === 0;

        const updatePkg = await pool.query(
            `UPDATE user_packages 
             SET remaining_sessions = $1, 
                 needs_review = $2,
                 status = $3
             WHERE id = $4
             RETURNING *`,
            [
                newRemaining,
                isCompleted,
                isCompleted ? 'completed' : 'active',
                userPackage.id
            ]
        );

        await pool.query(
            `INSERT INTO workout_logs (user_id, notes, session_rpe, ended_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [clientId, sessionNotes || 'Buổi tập cùng PT', sessionRpe || 8]
        );

        return res.status(200).json({
            status: "success",
            message: isCompleted 
                ? `Đã hoàn thành buổi tập cuối cùng! Hệ thống đã kích hoạt khảo sát trải nghiệm trước khi gia hạn.`
                : `Điểm danh thành công! Số buổi còn lại: ${newRemaining}/${userPackage.total_sessions}.`,
            userPackage: updatePkg.rows[0]
        });
    } catch (error) {
        console.error('Lỗi deductSession:', error);
        return res.status(500).json({ status: "error", message: "Lỗi khi trừ số buổi tập." });
    }
};

/**
 * 5. ĐUỔI HỌC VIÊN & XÓA HOÀN TOÀN KHỎI CƠ SỞ DỮ LIỆU (EXPEL CLIENT)
 */
const expelClient = async (req, res) => {
    const { clientId } = req.params;

    try {
        // Kiểm tra xem học viên có tồn tại và đúng là member không
        const checkUser = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [clientId]);
        
        if (checkUser.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Không tìm thấy học viên trong hệ thống." });
        }

        const user = checkUser.rows[0];
        if (user.role !== 'member') {
            return res.status(403).json({ status: "error", message: "Chỉ được phép xóa tài khoản học viên (member)!" });
        }

        // Xóa người dùng (các bảng liên kết user_plans, user_packages, workout_logs, bookings, messages,... sẽ tự động CASCADE)
        await pool.query('DELETE FROM users WHERE id = $1', [clientId]);

        return res.status(200).json({
            status: "success",
            message: `🗑️ Đã đuổi và xóa hoàn toàn học viên "${user.full_name}" (${user.email}) khỏi cơ sở dữ liệu!`
        });
    } catch (error) {
        console.error('Lỗi expelClient:', error);
        return res.status(500).json({ status: "error", message: "Lỗi khi xóa học viên khỏi database: " + error.message });
    }
};

/**
 * 6. THÊM BÀI TẬP TRỰC TIẾP TỪ KHUNG CHAT (IN-CHAT WORKOUT ADDITION)
 */
const addExerciseFromChat = async (req, res) => {
    const { clientId } = req.params;
    const ptUserId = req.user.id;
    const { 
        name, 
        target_muscle = 'Toàn thân', 
        sets = 3, 
        reps = '10-12', 
        weight = '', 
        notes = '',
        mechanic = 'Compound',
        sendChatMessage = true 
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ status: "error", message: "Vui lòng nhập tên bài tập." });
    }

    try {
        // 1. Lấy plan mới nhất của học viên
        const planCheck = await pool.query(
            `SELECT id, workout_data, nutrition_data, ai_advice 
             FROM user_plans 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [clientId]
        );

        let planId = planCheck.rows[0]?.id;
        let existingWorkout = [];

        if (planCheck.rows.length > 0 && planCheck.rows[0].workout_data) {
            const raw = planCheck.rows[0].workout_data;
            existingWorkout = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : (raw.data || []));
        }

        // 2. Tạo đối tượng bài tập mới
        const newExercise = {
            id: Date.now(),
            name: name.trim(),
            target_muscle: target_muscle.trim(),
            sets: parseInt(sets, 10) || 3,
            reps: reps.toString().trim(),
            weight: weight ? weight.toString().trim() : '',
            notes: notes ? notes.trim() : 'Huấn luyện viên thêm trực tiếp từ khung chat',
            description: notes ? notes.trim() : `Bài tập ${target_muscle} do HLV chỉ định`,
            mechanic: mechanic || 'Compound',
            added_by_pt: true,
            created_at: new Date().toISOString()
        };

        const updatedWorkout = [...existingWorkout, newExercise];

        // 3. Cập nhật hoặc chèn plan mới
        let updatedPlan;
        if (!planId) {
            const insertPlan = await pool.query(`
                INSERT INTO user_plans (user_id, workout_data, nutrition_data, ai_advice, status)
                VALUES ($1, $2::jsonb, '{}'::jsonb, 'Giáo án được HLV trực tiếp chỉ định', 'approved')
                RETURNING id, status, workout_data;
            `, [clientId, JSON.stringify(updatedWorkout)]);
            updatedPlan = insertPlan.rows[0];
        } else {
            const updatePlan = await pool.query(`
                UPDATE user_plans 
                SET workout_data = $1::jsonb, status = 'approved'
                WHERE id = $2
                RETURNING id, status, workout_data;
            `, [JSON.stringify(updatedWorkout), planId]);
            updatedPlan = updatePlan.rows[0];
        }

        // 4. Nếu bật sendChatMessage, tự động gửi 1 tin nhắn thông báo vào đoạn chat
        let chatMessage = null;
        if (sendChatMessage) {
            const content = `🏋️ [HLV ĐÃ THÊM BÀI TẬP VÀO GIÁO ÁN]\n• Bài tập: ${name.trim()}\n• Nhóm cơ: ${target_muscle}\n• Khối lượng: ${sets} hiệp x ${reps} reps ${weight ? '(' + weight + ')' : ''}\n• Lưu ý kỹ thuật: ${notes ? notes.trim() : 'Chuẩn form, kiểm soát nhịp thở!'}`;

            const insertMsg = await pool.query(`
                INSERT INTO messages (sender_id, receiver_id, content, message_type, is_read)
                VALUES ($1, $2, $3, 'workout_share', FALSE)
                RETURNING *;
            `, [ptUserId, parseInt(clientId, 10), content]);

            chatMessage = insertMsg.rows[0];
        }

        return res.status(200).json({
            status: "success",
            message: `🎉 Đã thêm bài tập "${name.trim()}" vào giáo án học viên thành công!`,
            exercise: newExercise,
            chatMessage,
            totalExercises: updatedWorkout.length
        });
    } catch (error) {
        console.error('Lỗi addExerciseFromChat:', error);
        return res.status(500).json({ status: "error", message: "Lỗi khi thêm bài tập: " + error.message });
    }
};

module.exports = {
    getMyClients,
    getClientPlanDetail,
    approveOrUpdateClientPlan,
    deductSession,
    expelClient,
    addExerciseFromChat
};

