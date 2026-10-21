// controllers/adminCtrl.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * 1. Tổng quan số liệu toàn hệ thống (Dashboard KPIs)
 * GET /api/admin/stats
 */
exports.getStats = async (req, res) => {
    try {
        // Tổng doanh thu từ user_packages (kết nối với bảng packages)
        const revenueRes = await pool.query(`
            SELECT 
                COALESCE(SUM(p.price), 0) as total_revenue,
                COUNT(up.id) as total_packages_sold
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
        `);

        // Số lượng PT và Member
        const userStatsRes = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE role = 'member') as total_members,
                COUNT(*) FILTER (WHERE role = 'pt') as total_pts
            FROM users
        `);

        // Số lượng buổi tập đã hoàn thành
        const bookingStatsRes = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'confirmed') as upcoming_bookings,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions
            FROM bookings
        `);

        // Doanh thu theo từng gói
        const packageBreakdownRes = await pool.query(`
            SELECT 
                p.id, p.name, p.price, p.session_count,
                COUNT(up.id) as sold_count,
                COALESCE(SUM(p.price), 0) as subtotal
            FROM packages p
            LEFT JOIN user_packages up ON p.id = up.package_id
            GROUP BY p.id, p.name, p.price, p.session_count
            ORDER BY sold_count DESC
        `);

        // Giao dịch mua gói gần đây
        const recentOrdersRes = await pool.query(`
            SELECT 
                up.id, up.purchased_at, up.remaining_sessions, up.total_sessions, up.status,
                u.full_name as client_name, u.email as client_email,
                tu.full_name as trainer_name,
                p.name as package_name, p.price
            FROM user_packages up
            JOIN users u ON up.user_id = u.id
            JOIN packages p ON up.package_id = p.id
            LEFT JOIN trainers t ON up.trainer_id = t.id
            LEFT JOIN users tu ON t.user_id = tu.id
            ORDER BY up.purchased_at DESC
            LIMIT 10
        `);

        return res.json({
            success: true,
            stats: {
                totalRevenue: Number(revenueRes.rows[0].total_revenue),
                totalPackagesSold: Number(revenueRes.rows[0].total_packages_sold),
                totalMembers: Number(userStatsRes.rows[0].total_members),
                totalPts: Number(userStatsRes.rows[0].total_pts),
                upcomingBookings: Number(bookingStatsRes.rows[0].upcoming_bookings),
                completedSessions: Number(bookingStatsRes.rows[0].completed_sessions),
            },
            packageBreakdown: packageBreakdownRes.rows,
            recentOrders: recentOrdersRes.rows
        });
    } catch (error) {
        console.error("Lỗi lấy thống kê Admin:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê hệ thống.' });
    }
};

/**
 * 2. Danh sách Huấn luyện viên và số học viên phụ trách
 * GET /api/admin/trainers
 */
exports.getTrainers = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id, t.specialization, t.bio, t.rating, t.is_active, t.created_at,
                u.id as user_id, u.full_name, u.email, u.phone,
                COUNT(up.id) FILTER (WHERE up.status = 'active') as active_clients_count,
                COUNT(up.id) as total_clients_count
            FROM trainers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_packages up ON t.id = up.trainer_id
            GROUP BY t.id, u.id
            ORDER BY t.is_active DESC, active_clients_count ASC
        `;
        const result = await pool.query(query);

        return res.json({
            success: true,
            trainers: result.rows
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách PT:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách PT.' });
    }
};

/**
 * 3. Thêm mới Huấn luyện viên
 * POST /api/admin/trainers
 * Body: { fullName, email, password, phone, specialization, bio }
 */
exports.createTrainer = async (req, res) => {
    try {
        const { fullName, email, password, phone, specialization, bio } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu.' });
        }

        // Kiểm tra trùng email
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user role 'pt'
        const userRes = await pool.query(`
            INSERT INTO users (full_name, email, password, role, phone)
            VALUES ($1, $2, $3, 'pt', $4)
            RETURNING id, full_name, email, role;
        `, [fullName, email, hashedPassword, phone || null]);

        const ptUserId = userRes.rows[0].id;

        // Tạo profile trainer
        const trainerRes = await pool.query(`
            INSERT INTO trainers (user_id, specialization, bio, rating, is_active)
            VALUES ($1, $2, $3, 5.0, TRUE)
            RETURNING *;
        `, [ptUserId, specialization || 'HLV Cá Nhân Chuyên Nghiệp', bio || '']);

        const trainerId = trainerRes.rows[0].id;

        // Seed lịch rảnh mặc định (08:00 - 21:00 từ T2 đến CN)
        for (let day = 0; day <= 6; day++) {
            await pool.query(`
                INSERT INTO trainer_availability (trainer_id, day_of_week, start_time, end_time, slot_duration_minutes)
                VALUES ($1, $2, '08:00', '21:00', 60)
            `, [trainerId, day]);
        }

        return res.status(201).json({
            success: true,
            message: '🎉 Tạo tài khoản Huấn Luyện Viên mới thành công!',
            trainer: {
                ...trainerRes.rows[0],
                user: userRes.rows[0]
            }
        });
    } catch (error) {
        console.error("Lỗi tạo PT:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tạo Huấn Luyện Viên.' });
    }
};

/**
 * 4. Kích hoạt / Tạm dừng hoạt động của PT
 * PUT /api/admin/trainers/:trainerId/toggle
 */
exports.toggleTrainerStatus = async (req, res) => {
    try {
        const { trainerId } = req.params;

        const updated = await pool.query(`
            UPDATE trainers 
            SET is_active = NOT is_active 
            WHERE id = $1 
            RETURNING *
        `, [trainerId]);

        if (updated.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy PT.' });
        }

        return res.json({
            success: true,
            message: updated.rows[0].is_active ? 'Đã kích hoạt PT thành công!' : 'Đã tạm ngưng nhận học viên cho PT!',
            trainer: updated.rows[0]
        });
    } catch (error) {
        console.error("Lỗi toggle PT:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái PT.' });
    }
};

/**
 * 5. Quản lý Thư viện Bài tập
 * GET /api/admin/exercises
 */
exports.getExercises = async (req, res) => {
    try {
        const { search, mechanic } = req.query;
        let query = "SELECT * FROM exercises WHERE 1=1";
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR primary_muscle ILIKE $${params.length})`;
        }
        if (mechanic) {
            params.push(mechanic);
            query += ` AND mechanic = $${params.length}`;
        }

        query += " ORDER BY id DESC";

        const result = await pool.query(query, params);
        return res.json({
            success: true,
            exercises: result.rows
        });
    } catch (error) {
        console.error("Lỗi lấy bài tập:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách bài tập.' });
    }
};

/**
 * 6. Thêm bài tập mới vào thư viện
 * POST /api/admin/exercises
 */
exports.createExercise = async (req, res) => {
    try {
        const { name, description, mechanic, primaryMuscle, equipmentRequired, contraindications, videoUrl } = req.body;

        if (!name || !primaryMuscle) {
            return res.status(400).json({ success: false, message: 'Tên bài tập và nhóm cơ chính là bắt buộc.' });
        }

        const result = await pool.query(`
            INSERT INTO exercises (name, description, mechanic, primary_muscle, equipment_required, contraindications, video_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            name,
            description || '',
            mechanic || 'Compound',
            primaryMuscle,
            equipmentRequired ? (Array.isArray(equipmentRequired) ? equipmentRequired : [equipmentRequired]) : [],
            contraindications ? (Array.isArray(contraindications) ? contraindications : [contraindications]) : [],
            videoUrl || ''
        ]);

        return res.status(201).json({
            success: true,
            message: 'Đã thêm bài tập mới vào thư viện!',
            exercise: result.rows[0]
        });
    } catch (error) {
        console.error("Lỗi tạo bài tập:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi thêm bài tập mới.' });
    }
};

/**
 * 7. Xóa bài tập khỏi thư viện
 * DELETE /api/admin/exercises/:id
 */
exports.deleteExercise = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM exercises WHERE id = $1", [id]);
        return res.json({ success: true, message: 'Đã xóa bài tập thành công.' });
    } catch (error) {
        console.error("Lỗi xóa bài tập:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa bài tập.' });
    }
};

/**
 * 8. Quản lý gói thành viên của tất cả học viên
 * GET /api/admin/memberships
 */
exports.getMemberships = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                up.id, up.total_sessions, up.remaining_sessions, up.status,
                up.purchased_at, up.needs_review,
                u.id as user_id, u.full_name as member_name, u.email as member_email, u.phone as member_phone,
                p.name as package_name, p.price as package_price, p.session_count,
                tu.full_name as trainer_name,
                t.specialization as trainer_specialization
            FROM user_packages up
            JOIN users u ON up.user_id = u.id
            JOIN packages p ON up.package_id = p.id
            LEFT JOIN trainers t ON up.trainer_id = t.id
            LEFT JOIN users tu ON t.user_id = tu.id
            ORDER BY up.purchased_at DESC
        `);

        const summary = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'active') as active_count,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) as total_count
            FROM user_packages
        `);

        return res.json({
            success: true,
            memberships: result.rows,
            summary: summary.rows[0]
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách gói thành viên:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách gói thành viên.' });
    }
};

/**
 * 9. Lịch sử tất cả giao dịch mua gói
 * GET /api/admin/purchase-history
 */
exports.getPurchaseHistory = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                po.id, po.transaction_code, po.transfer_content, po.amount,
                po.status, po.created_at, po.completed_at as verified_at,
                u.full_name as user_name, u.email as user_email, u.phone as user_phone,
                p.name as package_name, p.session_count
            FROM payments po
            JOIN users u ON po.user_id = u.id
            LEFT JOIN packages p ON po.package_id = p.id
            ORDER BY po.created_at DESC
        `);

        const statsResult = await pool.query(`
            SELECT
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue
            FROM payments
        `);

        return res.json({
            success: true,
            orders: result.rows,
            stats: statsResult.rows[0]
        });
    } catch (error) {
        console.error("Lỗi lấy lịch sử mua hàng:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử mua hàng.' });
    }
};
