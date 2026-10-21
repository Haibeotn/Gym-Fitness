// controllers/packageCtrl.js
const pool = require('../config/db');

/**
 * 1. LẤY DANH SÁCH GÓI TẬP HIỆN CÓ
 */
const getPackages = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM packages WHERE is_active = TRUE ORDER BY session_count ASC');
        return res.status(200).json({ status: "success", packages: rows });
    } catch (error) {
        console.error('Lỗi getPackages:', error);
        return res.status(500).json({ status: "error", message: "Lỗi khi lấy danh sách gói tập." });
    }
};

/**
 * 2. MUA GÓI TẬP & TỰ ĐỘNG GÁN HUẤN LUYỆN VIÊN (AUTO-ASSIGN PT)
 */
const purchasePackage = async (req, res) => {
    const { packageId } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
        return res.status(401).json({ status: "error", message: "Vui lòng đăng nhập trước khi mua gói tập." });
    }

    if (!packageId) {
        return res.status(400).json({ status: "error", message: "Vui lòng chọn gói tập." });
    }

    try {
        // 1. Kiểm tra xem user có gói cũ đang cần khảo sát (needs_review = true) không
        const activeCheck = await pool.query(
            `SELECT * FROM user_packages 
             WHERE user_id = $1 AND needs_review = TRUE AND status = 'completed'
             LIMIT 1`,
            [userId]
        );

        if (activeCheck.rows.length > 0) {
            return res.status(403).json({
                status: "error",
                message: "Bạn đã hoàn thành gói tập trước đó. Vui lòng hoàn tất Khảo sát trải nghiệm trước khi đăng ký gói mới!",
                needsReviewPackageId: activeCheck.rows[0].id
            });
        }

        // 2. Lấy thông tin gói tập
        const pkgRes = await pool.query('SELECT * FROM packages WHERE id = $1', [packageId]);
        if (pkgRes.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Gói tập không tồn tại." });
        }
        const pkg = pkgRes.rows[0];

        // 3. Auto-assign PT: Lấy PT có ít học viên nhất hoặc PT đầu tiên
        let trainerRes = await pool.query(
            `SELECT t.id, t.user_id, u.full_name, COUNT(up.id) as client_count
             FROM trainers t
             JOIN users u ON t.user_id = u.id
             LEFT JOIN user_packages up ON t.id = up.trainer_id AND up.status = 'active'
             WHERE t.is_active = TRUE
             GROUP BY t.id, t.user_id, u.full_name
             ORDER BY client_count ASC
             LIMIT 1;`
        );

        let assignedTrainerId = trainerRes.rows[0]?.id;

        // Nếu chưa có PT nào trong hệ thống, tìm user có role = 'pt' hoặc tạo PT mặc định
        if (!assignedTrainerId) {
            const ptUser = await pool.query("SELECT id FROM users WHERE role = 'pt' LIMIT 1");
            let ptUserId = ptUser.rows[0]?.id;

            if (!ptUserId) {
                const newPt = await pool.query(
                    `INSERT INTO users (full_name, email, role) 
                     VALUES ('Coach Tuấn Anh', 'coach.tuananh@gym.com', 'pt') 
                     RETURNING id`
                );
                ptUserId = newPt.rows[0].id;
            }

            const newTrainer = await pool.query(
                `INSERT INTO trainers (user_id, specialization, bio) 
                 VALUES ($1, 'Body Recomposition & Strength', 'Huấn luyện viên trưởng') 
                 RETURNING id`,
                [ptUserId]
            );
            assignedTrainerId = newTrainer.rows[0].id;
        }

        // 4. Khi nâng cấp / mua gói mới: Đóng các gói cũ của học viên
        await pool.query(
            `UPDATE user_packages 
             SET status = 'upgraded', needs_review = FALSE 
             WHERE user_id = $1 AND status = 'active'`,
            [userId]
        );

        // Hủy các lịch hẹn chưa diễn ra của gói cũ để bắt đầu gói mới
        await pool.query(
            `UPDATE bookings 
             SET status = 'cancelled', cancel_reason = 'Học viên đã nâng cấp lên gói tập mới'
             WHERE user_id = $1 AND status IN ('confirmed', 'pending_approval')`,
            [userId]
        );

        // 5. Tạo bản ghi gói tập mới của User
        const insertUserPkg = await pool.query(
            `INSERT INTO user_packages (user_id, package_id, trainer_id, total_sessions, remaining_sessions, needs_review, status)
             VALUES ($1, $2, $3, $4, $4, FALSE, 'active')
             RETURNING *`,
            [userId, pkg.id, assignedTrainerId, pkg.session_count]
        );

        // 5. Chuyển trạng thái giáo án sang 'pending_pt_approval' và gán trainer_id
        await pool.query(
            `UPDATE user_plans 
             SET status = 'pending_pt_approval' 
             WHERE user_id = $1`,
            [userId]
        );

        return res.status(200).json({
            status: "success",
            message: `🎉 Đăng ký thành công ${pkg.name}! Hệ thống đã tự động kết nối Huấn luyện viên đồng hành cùng bạn.`,
            userPackage: insertUserPkg.rows[0]
        });

    } catch (error) {
        console.error('Lỗi purchasePackage:', error);
        return res.status(500).json({ status: "error", message: "Lỗi máy chủ khi xử lý gói tập." });
    }
};

/**
 * 3. GỬI KHẢO SÁT TRẢI NGHIỆM ĐỂ MỞ KHÓA MUA GÓI TIẾP THEO
 */
const submitExperienceReview = async (req, res) => {
    const { packageId, rating, comment } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!packageId) {
        return res.status(400).json({ status: "error", message: "Thiếu mã gói tập cần đánh giá." });
    }

    try {
        // Tắt cờ needs_review
        const updateRes = await pool.query(
            `UPDATE user_packages 
             SET needs_review = FALSE 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [packageId, userId]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Không tìm thấy gói tập tương ứng." });
        }

        return res.status(200).json({
            status: "success",
            message: "Cảm ơn bạn đã đóng góp ý kiến! Bạn đã có thể đăng ký gói tập tiếp theo.",
            rating,
            comment
        });
    } catch (error) {
        console.error('Lỗi submitExperienceReview:', error);
        return res.status(500).json({ status: "error", message: "Lỗi khi lưu đánh giá." });
    }
};

/**
 * 4. LẤY TRẠNG THÁI GÓI TẬP CỦA USER HIỆN TẠI
 */
const getMyCurrentPackage = async (req, res) => {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
        return res.status(401).json({ status: "error", message: "Chưa xác thực người dùng." });
    }

    try {
        const query = `
            SELECT 
                up.*,
                pkg.name as package_name,
                pkg.price as package_price,
                u_pt.id as trainer_user_id,
                u_pt.full_name as trainer_name,
                u_pt.email as trainer_email,
                t.specialization as trainer_specialization,
                t.rating as trainer_rating
            FROM user_packages up
            JOIN packages pkg ON up.package_id = pkg.id
            LEFT JOIN trainers t ON up.trainer_id = t.id
            LEFT JOIN users u_pt ON t.user_id = u_pt.id
            WHERE up.user_id = $1
            ORDER BY up.purchased_at DESC
            LIMIT 1;
        `;

        const { rows } = await pool.query(query, [userId]);

        return res.status(200).json({
            status: "success",
            userPackage: rows[0] || null,
            currentPackage: rows[0] || null
        });
    } catch (error) {

        console.error('Lỗi getMyCurrentPackage:', error);
        return res.status(500).json({ status: "error", message: "Lỗi khi lấy gói tập của người dùng." });
    }
};

module.exports = {
    getPackages,
    purchasePackage,
    submitExperienceReview,
    getMyCurrentPackage
};
