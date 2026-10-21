// controllers/paymentCtrl.js
const pool = require('../config/db');

// Cấu hình tài khoản thụ hưởng Gym
const GYM_BANK_CONFIG = {
    bankCode: 'MB', // Ngân hàng Quân Đội MBBank
    bankName: 'MBBank (Ngân hàng TMCP Quân đội)',
    accountNumber: '62405082006',
    accountName: 'FITNESS AI GYM VIETNAM',
    momoPhone: '62405082006',
    momoName: 'FITNESS AI GYM VIETNAM'
};

/**
 * 1. TẠO ĐƠN THANH TOÁN (VIETQR / MOMO)
 * POST /api/payments/create-order
 * Body: { packageId, trainerId, paymentMethod: 'vietqr' | 'momo' }
 */
exports.createPaymentOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { packageId, trainerId, paymentMethod = 'vietqr' } = req.body;

        if (!packageId) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn gói tập cần mua.' });
        }

        // Lấy thông tin gói tập
        const pkgRes = await pool.query('SELECT * FROM packages WHERE id = $1', [packageId]);
        if (pkgRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Gói tập không tồn tại.' });
        }
        const pkg = pkgRes.rows[0];

        // Tìm hoặc gán PT
        let finalTrainerId = trainerId;
        if (!finalTrainerId) {
            const ptRes = await pool.query(`
                SELECT id FROM trainers WHERE is_active = TRUE ORDER BY rating DESC, id ASC LIMIT 1
            `);
            if (ptRes.rows.length > 0) {
                finalTrainerId = ptRes.rows[0].id;
            }
        }

        // Tạo mã giao dịch độc bản
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const transactionCode = `GYMPAY-${Date.now().toString().slice(-6)}-${randomNum}`;
        const transferContent = `GYM ${pkg.session_count}B U${userId} ${randomNum}`;

        // Tạo link VietQR chuẩn NAPAS 247
        const amount = Number(pkg.price);
        const bankCode = GYM_BANK_CONFIG.bankCode;
        const accountNo = GYM_BANK_CONFIG.accountNumber;
        const accountName = GYM_BANK_CONFIG.accountName;

        const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;
        
        // MoMo Deep Link Payload
        const momoDeepLink = `2|99|${GYM_BANK_CONFIG.momoPhone}|${encodeURIComponent(GYM_BANK_CONFIG.momoName)}||0|0|${amount}|${encodeURIComponent(transferContent)}|transfer_p2p`;

        // Lưu bản ghi giao dịch vào DB
        const insertRes = await pool.query(`
            INSERT INTO payments (
                transaction_code, user_id, package_id, trainer_id, 
                amount, payment_method, bank_code, account_number, 
                account_name, transfer_content, qr_url, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
            RETURNING *
        `, [
            transactionCode,
            userId,
            pkg.id,
            finalTrainerId,
            amount,
            paymentMethod,
            bankCode,
            accountNo,
            accountName,
            transferContent,
            vietQrUrl
        ]);

        return res.status(201).json({
            success: true,
            message: 'Tạo mã thanh toán QR thành công!',
            payment: insertRes.rows[0],
            package: pkg,
            vietQrUrl,
            momoDeepLink,
            bankConfig: GYM_BANK_CONFIG,
            expiresInSeconds: 900 // 15 phút
        });
    } catch (error) {
        console.error("Lỗi tạo đơn thanh toán:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tạo đơn thanh toán.' });
    }
};

/**
 * 2. XÁC THỰC THANH TOÁN & TỰ ĐỘNG KÍCH HOẠT GÓI TẬP (Mô phỏng Webhook Ngân Hàng)
 * POST /api/payments/verify/:transactionCode
 */
exports.verifyPaymentOrder = async (req, res) => {
    try {
        const { transactionCode } = req.params;
        const userId = req.user?.id;

        const payRes = await pool.query(`
            SELECT p.*, pkg.name as package_name, pkg.session_count, u.full_name as user_name
            FROM payments p
            JOIN packages pkg ON p.package_id = pkg.id
            JOIN users u ON p.user_id = u.id
            WHERE p.transaction_code = $1
        `, [transactionCode]);

        if (payRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn thanh toán.' });
        }

        const payment = payRes.rows[0];

        if (payment.status === 'completed') {
            return res.json({
                success: true,
                isAlreadyCompleted: true,
                message: 'Giao dịch này đã được xác nhận thanh toán thành công trước đó!',
                payment
            });
        }

        // Cập nhật trạng thái thanh toán -> 'completed'
        await pool.query(`
            UPDATE payments 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [payment.id]);

        // Khi nâng cấp / mua gói mới: Đóng các gói cũ của học viên
        await pool.query(`
            UPDATE user_packages 
            SET status = 'upgraded', needs_review = FALSE 
            WHERE user_id = $1 AND status = 'active'
        `, [payment.user_id]);

        // Hủy các lịch hẹn chưa diễn ra của gói cũ để bắt đầu gói mới
        await pool.query(`
            UPDATE bookings 
            SET status = 'cancelled', cancel_reason = 'Học viên đã nâng cấp lên gói tập mới'
            WHERE user_id = $1 AND status IN ('confirmed', 'pending_approval')
        `, [payment.user_id]);

        // Kích hoạt gói tập mới cho User với đầy đủ số buổi của gói mới
        const userPkgRes = await pool.query(`
            INSERT INTO user_packages (
                user_id, package_id, trainer_id, total_sessions, 
                remaining_sessions, needs_review, status
            )
            VALUES ($1, $2, $3, $4, $4, FALSE, 'active')
            RETURNING *
        `, [payment.user_id, payment.package_id, payment.trainer_id, payment.session_count]);

        // Cập nhật trạng thái giáo án của học viên sang 'pending_pt_approval'
        await pool.query(`
            UPDATE user_plans 
            SET status = 'pending_pt_approval' 
            WHERE user_id = $1
        `, [payment.user_id]);

        return res.json({
            success: true,
            message: `🎉 Thanh toán thành công ${payment.package_name}! Gói tập ${payment.session_count} buổi đã sẵn sàng kích hoạt.`,
            payment: {
                ...payment,
                status: 'completed',
                completed_at: new Date()
            },
            userPackage: userPkgRes.rows[0]
        });
    } catch (error) {
        console.error("Lỗi xác nhận thanh toán:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xác nhận thanh toán.' });
    }
};

/**
 * 3. LẤY LỊCH SỬ GIAO DỊCH CỦA TÔI
 * GET /api/payments/my-history
 */
exports.getMyPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const historyRes = await pool.query(`
            SELECT 
                p.*,
                pkg.name as package_name,
                pkg.session_count,
                tu.full_name as trainer_name
            FROM payments p
            LEFT JOIN packages pkg ON p.package_id = pkg.id
            LEFT JOIN trainers t ON p.trainer_id = t.id
            LEFT JOIN users tu ON t.user_id = tu.id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [userId]);

        return res.json({
            success: true,
            payments: historyRes.rows
        });
    } catch (error) {
        console.error("Lỗi lấy lịch sử thanh toán:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử giao dịch.' });
    }
};

/**
 * 4. ADMIN: THỐNG KÊ DOANH THU & DANH SÁCH TẤT CẢ GIAO DỊCH
 * GET /api/payments/admin/all
 */
exports.getAdminPayments = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Chỉ Quản trị viên mới có quyền truy cập.' });
        }

        const [listRes, statsRes] = await Promise.all([
            pool.query(`
                SELECT 
                    p.*,
                    u.full_name as user_name,
                    u.email as user_email,
                    u.phone as user_phone,
                    pkg.name as package_name,
                    pkg.session_count,
                    tu.full_name as trainer_name
                FROM payments p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN packages pkg ON p.package_id = pkg.id
                LEFT JOIN trainers t ON p.trainer_id = t.id
                LEFT JOIN users tu ON t.user_id = tu.id
                ORDER BY p.created_at DESC
                LIMIT 100
            `),
            pool.query(`
                SELECT 
                    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
                    COUNT(id) FILTER (WHERE status = 'completed') as completed_count,
                    COUNT(id) FILTER (WHERE status = 'pending') as pending_count,
                    COUNT(id) as total_transactions
                FROM payments
            `)
        ]);

        return res.json({
            success: true,
            stats: statsRes.rows[0],
            payments: listRes.rows
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách thanh toán admin:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu tài chính.' });
    }
};

/**
 * 5. HỦY ĐƠN THANH TOÁN CHỜ
 * PUT /api/payments/:transactionCode/cancel
 */
exports.cancelPaymentOrder = async (req, res) => {
    try {
        const { transactionCode } = req.params;
        const userId = req.user.id;

        const updateRes = await pool.query(`
            UPDATE payments 
            SET status = 'cancelled' 
            WHERE transaction_code = $1 AND user_id = $2 AND status = 'pending'
            RETURNING *
        `, [transactionCode, userId]);

        if (updateRes.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không thể hủy đơn thanh toán này.' });
        }

        return res.json({
            success: true,
            message: 'Đã hủy đơn thanh toán thành công.',
            payment: updateRes.rows[0]
        });
    } catch (error) {
        console.error("Lỗi hủy đơn thanh toán:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi hủy đơn thanh toán.' });
    }
};
