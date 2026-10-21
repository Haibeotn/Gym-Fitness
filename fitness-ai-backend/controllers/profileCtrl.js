// controllers/profileCtrl.js
// Quản lý Hồ Sơ Cá Nhân (CRUD) - Không bao gồm chiều cao/cân nặng (đã có ở khảo sát)
const pool = require('../config/db');

// GET /api/profile/me — Lấy hồ sơ cá nhân đầy đủ
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Chưa xác thực.' });

        const result = await pool.query(
            `SELECT 
                id, full_name, email, phone, role,
                address, date_of_birth, emergency_contact, emergency_phone,
                occupation, bio, avatar_url, gender, created_at, updated_at
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng.' });
        }

        return res.status(200).json({ status: 'success', profile: result.rows[0] });
    } catch (error) {
        console.error('Lỗi getMyProfile:', error);
        return res.status(500).json({ status: 'error', message: 'Lỗi máy chủ.' });
    }
};

// PUT /api/profile/me — Cập nhật hồ sơ cá nhân
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Chưa xác thực.' });

        const {
            full_name,
            phone,
            address,
            date_of_birth,
            emergency_contact,
            emergency_phone,
            occupation,
            bio,
            gender
        } = req.body;

        // Kiểm tra số điện thoại không trùng người khác
        if (phone) {
            const phoneCheck = await pool.query(
                'SELECT id FROM users WHERE phone = $1 AND id != $2',
                [phone, userId]
            );
            if (phoneCheck.rows.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác.' });
            }
        }

        const result = await pool.query(
            `UPDATE users SET
                full_name          = COALESCE($1, full_name),
                phone              = COALESCE($2, phone),
                address            = $3,
                date_of_birth      = $4,
                emergency_contact  = $5,
                emergency_phone    = $6,
                occupation         = $7,
                bio                = $8,
                gender             = COALESCE($9, gender),
                updated_at         = NOW()
             WHERE id = $10
             RETURNING id, full_name, email, phone, address, date_of_birth, emergency_contact, emergency_phone, occupation, bio, gender, avatar_url, updated_at`,
            [
                full_name || null,
                phone || null,
                address !== undefined ? address : null,
                date_of_birth || null,
                emergency_contact !== undefined ? emergency_contact : null,
                emergency_phone !== undefined ? emergency_phone : null,
                occupation !== undefined ? occupation : null,
                bio !== undefined ? bio : null,
                gender || null,
                userId
            ]
        );

        return res.status(200).json({
            status: 'success',
            message: 'Cập nhật hồ sơ thành công! 💪',
            profile: result.rows[0]
        });
    } catch (error) {
        console.error('Lỗi updateMyProfile:', error);
        return res.status(500).json({ status: 'error', message: 'Lỗi máy chủ khi cập nhật.' });
    }
};

// DELETE /api/profile/me/field — Xóa (reset về null) một trường cụ thể
const clearProfileField = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Chưa xác thực.' });

        const { field } = req.params;
        const ALLOWED_FIELDS = ['address', 'date_of_birth', 'emergency_contact', 'emergency_phone', 'occupation', 'bio'];

        if (!ALLOWED_FIELDS.includes(field)) {
            return res.status(400).json({ status: 'error', message: 'Trường không hợp lệ.' });
        }

        await pool.query(
            `UPDATE users SET "${field}" = NULL, updated_at = NOW() WHERE id = $1`,
            [userId]
        );

        return res.status(200).json({ status: 'success', message: `Đã xóa thông tin "${field}".` });
    } catch (error) {
        console.error('Lỗi clearProfileField:', error);
        return res.status(500).json({ status: 'error', message: 'Lỗi máy chủ.' });
    }
};

module.exports = { getMyProfile, updateMyProfile, clearProfileField };
