const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. ĐĂNG KÝ (Hỗ trợ lưu Guest hoặc tạo User mới)
const register = async (req, res) => {
    const { userId, email, password, fullName } = req.body;
    try {
        // Kiểm tra xem email đã tồn tại chưa
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ status: "error", message: "Email này đã được sử dụng!" });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let finalUserId = userId;
        let role = 'member';

        if (userId) {
            // Cập nhật email và password vào hồ sơ guest đã tạo trước đó
            const updateRes = await pool.query(
                `UPDATE users 
                 SET email = $1, password = $2, full_name = COALESCE($3, full_name), role = COALESCE(role, 'member') 
                 WHERE id = $4 
                 RETURNING id, role, email, full_name`,
                [email, hashedPassword, fullName || null, userId]
            );

            if (updateRes.rows.length > 0) {
                finalUserId = updateRes.rows[0].id;
                role = updateRes.rows[0].role || 'member';
            } else {
                // Nếu không tìm thấy userId cũ thì insert mới
                const insertRes = await pool.query(
                    `INSERT INTO users (email, password, full_name, role) 
                     VALUES ($1, $2, $3, 'member') 
                     RETURNING id, role`,
                    [email, hashedPassword, fullName || 'Member']
                );
                finalUserId = insertRes.rows[0].id;
                role = insertRes.rows[0].role;
            }
        } else {
            const insertRes = await pool.query(
                `INSERT INTO users (email, password, full_name, role) 
                 VALUES ($1, $2, $3, 'member') 
                 RETURNING id, role`,
                [email, hashedPassword, fullName || 'Member']
            );
            finalUserId = insertRes.rows[0].id;
            role = insertRes.rows[0].role;
        }

        // Tạo thẻ thông hành JWT có chứa ID và Role
        const token = jwt.sign(
            { id: finalUserId, role: role || 'member' },
            process.env.JWT_SECRET || 'fitness_secret_key',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            status: "success",
            message: "Đăng ký thành công!",
            token,
            userId: finalUserId,
            role: role || 'member'
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        return res.status(500).json({ status: "error", message: "Lỗi hệ thống khi đăng ký." });
    }
};

// 2. ĐĂNG NHẬP
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        // Tìm user theo email (không phân biệt hoa thường và khoảng trắng thừa)
        const result = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = $1', [cleanEmail]);
        if (result.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Email không tồn tại trong hệ thống!" });
        }


        const user = result.rows[0];

        if (!user.password) {
            return res.status(400).json({ 
                status: "error", 
                message: "Tài khoản chưa thiết lập mật khẩu. Vui lòng đăng ký/kích hoạt tài khoản." 
            });
        }

        // So sánh mật khẩu
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ status: "error", message: "Sai mật khẩu!" });
        }

        const role = user.role || 'member';

        // Tạo token mang ID và Role
        const token = jwt.sign(
            { id: user.id, role },
            process.env.JWT_SECRET || 'fitness_secret_key',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            status: "success",
            message: "Đăng nhập thành công!",
            token,
            userId: user.id,
            role,
            email: user.email,
            fullName: user.full_name
        });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        return res.status(500).json({ status: "error", message: "Lỗi hệ thống khi đăng nhập." });
    }
};

// 3. LẤY THÔNG TIN TÀI KHOẢN HIỆN TẠI
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: "error", message: "Chưa xác thực." });
        }

        const result = await pool.query(
            `SELECT id, full_name, email, phone, google_id, role, gender, age, height, weight, goal, activity_level, injuries, avatar_url, created_at 
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Không tìm thấy người dùng." });
        }

        return res.status(200).json({ status: "success", user: result.rows[0] });
    } catch (error) {
        console.error('Lỗi getMe:', error);
        return res.status(500).json({ status: "error", message: "Lỗi máy chủ." });
    }
};

// 4. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GOOGLE (OAuth 2.0 / Google Identity Services)
const googleAuth = async (req, res) => {
    const { credential, googleId, email, fullName, avatarUrl, userId } = req.body;

    try {
        let finalGoogleId = googleId;
        let finalEmail = email;
        let finalName = fullName;
        let finalAvatar = avatarUrl;

        // Nếu client gửi credential JWT từ Google One-Tap / Identity Services
        if (credential) {
            try {
                // Giải mã payload của Google JWT mà không cần thư viện ngoài phức tạp
                const parts = credential.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                    finalGoogleId = payload.sub || finalGoogleId;
                    finalEmail = payload.email || finalEmail;
                    finalName = payload.name || finalName;
                    finalAvatar = payload.picture || finalAvatar;
                }
            } catch (err) {
                console.warn('Không thể parse Google credential:', err);
            }
        }

        if (!finalEmail && !finalGoogleId) {
            return res.status(400).json({ status: "error", message: "Thiếu thông tin xác thực Google." });
        }

        // Tìm user theo google_id hoặc email
        let userResult = null;
        if (finalGoogleId) {
            userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [finalGoogleId]);
        }
        if ((!userResult || userResult.rows.length === 0) && finalEmail) {
            userResult = await pool.query('SELECT * FROM users WHERE email = $1', [finalEmail]);
        }

        let targetUserId = null;
        let role = 'member';

        if (userResult && userResult.rows.length > 0) {
            // User đã tồn tại -> Cập nhật thông tin Google nếu cần
            const existingUser = userResult.rows[0];
            targetUserId = existingUser.id;
            role = existingUser.role || 'member';

            await pool.query(
                `UPDATE users 
                 SET google_id = COALESCE(google_id, $1), 
                     avatar_url = COALESCE($2, avatar_url),
                     full_name = COALESCE(full_name, $3)
                 WHERE id = $4`,
                [finalGoogleId, finalAvatar, finalName, targetUserId]
            );

            // Nếu người dùng đang có guest plan ở phiên hiện tại và ID khác targetUserId, merge plan sang tài khoản này
            if (userId && parseInt(userId, 10) !== targetUserId) {
                await pool.query(
                    `UPDATE user_plans SET user_id = $1 WHERE user_id = $2`,
                    [targetUserId, parseInt(userId, 10)]
                );
            }
        } else {
            // User chưa tồn tại trong hệ thống
            if (userId) {
                // Nâng cấp hồ sơ Guest hiện tại
                const updateRes = await pool.query(
                    `UPDATE users 
                     SET email = $1, google_id = $2, full_name = COALESCE($3, full_name), 
                         avatar_url = $4, role = COALESCE(role, 'member')
                     WHERE id = $5
                     RETURNING id, role`,
                    [finalEmail, finalGoogleId, finalName || 'Google User', finalAvatar, parseInt(userId, 10)]
                );

                if (updateRes.rows.length > 0) {
                    targetUserId = updateRes.rows[0].id;
                    role = updateRes.rows[0].role || 'member';
                }
            }

            if (!targetUserId) {
                // Tạo mới user hoàn toàn
                const insertRes = await pool.query(
                    `INSERT INTO users (email, google_id, full_name, avatar_url, role)
                     VALUES ($1, $2, $3, $4, 'member')
                     RETURNING id, role`,
                    [finalEmail, finalGoogleId, finalName || 'Google User', finalAvatar]
                );
                targetUserId = insertRes.rows[0].id;
                role = insertRes.rows[0].role || 'member';
            }
        }

        // Sinh thẻ thông hành JWT
        const token = jwt.sign(
            { id: targetUserId, role },
            process.env.JWT_SECRET || 'fitness_secret_key',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            status: "success",
            message: "Đăng nhập với Google thành công!",
            token,
            userId: targetUserId,
            role,
            email: finalEmail,
            fullName: finalName,
            avatarUrl: finalAvatar
        });
    } catch (error) {
        console.error('Lỗi googleAuth:', error);
        return res.status(500).json({ status: "error", message: "Lỗi xử lý xác thực Google." });
    }
};

// 5. GỬI MÃ OTP SỐ ĐIỆN THOẠI
const sendPhoneOtp = async (req, res) => {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 9) {
        return res.status(400).json({ status: "error", message: "Số điện thoại không hợp lệ." });
    }

    const cleanPhone = phone.trim();

    try {
        // Sinh mã OTP 6 số
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Hạn sử dụng OTP là 5 phút
        await pool.query(
            `INSERT INTO otp_codes (phone, otp_code, expires_at, is_used)
             VALUES ($1, $2, NOW() + INTERVAL '5 minutes', FALSE)`,
            [cleanPhone, otpCode]
        );

        console.log(`📱 [SMS SIMULATION] Mã OTP gửi tới ${cleanPhone}: ${otpCode}`);

        return res.status(200).json({
            status: "success",
            message: `Mã OTP đã được gửi tới số ${cleanPhone}! (Mã thử nghiệm: ${otpCode})`,
            // Trong môi trường dev gửi kèm để tiện test nhanh
            devOtp: otpCode
        });
    } catch (error) {
        console.error('Lỗi sendPhoneOtp:', error);
        return res.status(500).json({ status: "error", message: "Không thể gửi OTP lúc này." });
    }
};

// 6. XÁC THỰC MÃ OTP & ĐĂNG NHẬP SỐ ĐIỆN THOẠI
const verifyPhoneOtp = async (req, res) => {
    const { phone, otp, userId, fullName } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ status: "error", message: "Vui lòng cung cấp số điện thoại và mã OTP." });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    try {
        // Kiểm tra mã OTP trong Database (hoặc OTP mặc định '123456' cho dev)
        const checkOtp = await pool.query(
            `SELECT * FROM otp_codes 
             WHERE phone = $1 AND otp_code = $2 AND is_used = FALSE AND expires_at > NOW()
             ORDER BY created_at DESC 
             LIMIT 1`,
            [cleanPhone, cleanOtp]
        );

        const isDevDefaultOtp = cleanOtp === '123456';

        if (checkOtp.rows.length === 0 && !isDevDefaultOtp) {
            return res.status(400).json({ status: "error", message: "Mã OTP không chính xác hoặc đã hết hạn!" });
        }

        // Đánh dấu OTP đã sử dụng
        if (checkOtp.rows.length > 0) {
            await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = $1', [checkOtp.rows[0].id]);
        }

        // Kiểm tra xem số điện thoại này đã có tài khoản chưa
        const userCheck = await pool.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);

        let targetUserId = null;
        let role = 'member';

        if (userCheck.rows.length > 0) {
            // Đã có tài khoản
            const existingUser = userCheck.rows[0];
            targetUserId = existingUser.id;
            role = existingUser.role || 'member';

            // Merge guest plan nếu có
            if (userId && parseInt(userId, 10) !== targetUserId) {
                await pool.query(
                    `UPDATE user_plans SET user_id = $1 WHERE user_id = $2`,
                    [targetUserId, parseInt(userId, 10)]
                );
            }
        } else {
            // Chưa có tài khoản -> Đăng ký mới bằng SĐT
            if (userId) {
                const updateRes = await pool.query(
                    `UPDATE users 
                     SET phone = $1, full_name = COALESCE($2, full_name, 'Học viên SĐT'), role = COALESCE(role, 'member')
                     WHERE id = $3
                     RETURNING id, role`,
                    [cleanPhone, fullName || null, parseInt(userId, 10)]
                );
                if (updateRes.rows.length > 0) {
                    targetUserId = updateRes.rows[0].id;
                    role = updateRes.rows[0].role || 'member';
                }
            }

            if (!targetUserId) {
                const insertRes = await pool.query(
                    `INSERT INTO users (phone, full_name, role)
                     VALUES ($1, $2, 'member')
                     RETURNING id, role`,
                    [cleanPhone, fullName || 'Học viên SĐT']
                );
                targetUserId = insertRes.rows[0].id;
                role = insertRes.rows[0].role || 'member';
            }
        }

        // Sinh JWT token
        const token = jwt.sign(
            { id: targetUserId, role },
            process.env.JWT_SECRET || 'fitness_secret_key',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            status: "success",
            message: "Xác thực số điện thoại thành công!",
            token,
            userId: targetUserId,
            role,
            phone: cleanPhone,
            fullName: fullName || 'Học viên SĐT'
        });
    } catch (error) {
        console.error('Lỗi verifyPhoneOtp:', error);
        return res.status(500).json({ status: "error", message: "Lỗi hệ thống khi xác thực OTP." });
    }
};

module.exports = { register, login, getMe, googleAuth, sendPhoneOtp, verifyPhoneOtp };