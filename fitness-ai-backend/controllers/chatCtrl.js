// controllers/chatCtrl.js
const pool = require('../config/db');

/**
 * 1. Lấy danh sách cuộc trò chuyện gần nhất của User
 * GET /api/chat/conversations
 */
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy danh sách các đối tác đã từng nhắn tin cùng với tin nhắn mới nhất
        const convRes = await pool.query(`
            WITH user_messages AS (
                SELECT 
                    CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id,
                    id, content, message_type, is_read, sender_id, created_at,
                    ROW_NUMBER() OVER(
                        PARTITION BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END 
                        ORDER BY created_at DESC
                    ) as rn
                FROM messages
                WHERE sender_id = $1 OR receiver_id = $1
            ),
            unread_counts AS (
                SELECT sender_id AS partner_id, COUNT(*) AS unread_count
                FROM messages
                WHERE receiver_id = $1 AND is_read = FALSE
                GROUP BY sender_id
            )
            SELECT 
                u.id AS partner_id,
                u.full_name AS partner_name,
                u.email AS partner_email,
                u.role AS partner_role,
                u.avatar_url,
                um.content AS last_message,
                um.message_type AS last_message_type,
                um.sender_id AS last_sender_id,
                um.created_at AS last_message_time,
                COALESCE(uc.unread_count, 0) AS unread_count
            FROM user_messages um
            JOIN users u ON u.id = um.partner_id
            LEFT JOIN unread_counts uc ON uc.partner_id = um.partner_id
            WHERE um.rn = 1
            ORDER BY um.created_at DESC;
        `, [userId]);

        return res.json({
            success: true,
            conversations: convRes.rows
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách hội thoại:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy hội thoại.' });
    }
};

/**
 * 2. Lấy toàn bộ lịch sử tin nhắn với 1 đối tác cụ thể
 * GET /api/chat/messages/:partnerId
 */
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const partnerId = parseInt(req.params.partnerId, 10);

        if (!partnerId || isNaN(partnerId)) {
            return res.status(400).json({ success: false, message: 'ID đối tác không hợp lệ.' });
        }

        // Lấy thông tin đối tác
        const partnerRes = await pool.query(`
            SELECT id, full_name, email, role, avatar_url FROM users WHERE id = $1;
        `, [partnerId]);

        if (partnerRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Lấy toàn bộ tin nhắn
        const msgRes = await pool.query(`
            SELECT id, sender_id, receiver_id, content, message_type, is_read, created_at
            FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2)
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC;
        `, [userId, partnerId]);

        // Đánh dấu các tin nhắn đối tác gửi cho mình là đã đọc
        await pool.query(`
            UPDATE messages
            SET is_read = TRUE
            WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE;
        `, [partnerId, userId]);

        return res.json({
            success: true,
            partner: partnerRes.rows[0],
            messages: msgRes.rows
        });
    } catch (error) {
        console.error('Lỗi lấy tin nhắn:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy tin nhắn.' });
    }
};

/**
 * 3. Gửi tin nhắn mới
 * POST /api/chat/messages
 */
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content, messageType } = req.body;

        if (!receiverId || !content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp nội dung tin nhắn và người nhận.' });
        }

        const insertRes = await pool.query(`
            INSERT INTO messages (sender_id, receiver_id, content, message_type, is_read)
            VALUES ($1, $2, $3, $4, FALSE)
            RETURNING *;
        `, [
            senderId,
            parseInt(receiverId, 10),
            content.trim(),
            messageType || 'text'
        ]);

        return res.status(201).json({
            success: true,
            message: insertRes.rows[0]
        });
    } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi gửi tin nhắn.' });
    }
};

/**
 * 4. Đếm tổng số tin nhắn chưa đọc của User
 * GET /api/chat/unread-count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const countRes = await pool.query(`
            SELECT COUNT(*) AS total_unread
            FROM messages
            WHERE receiver_id = $1 AND is_read = FALSE;
        `, [userId]);

        return res.json({
            success: true,
            unreadCount: parseInt(countRes.rows[0].total_unread, 10) || 0
        });
    } catch (error) {
        console.error('Lỗi đếm tin nhắn chưa đọc:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
};

/**
 * 5. Hỏi đáp trực tiếp cùng AI (PT Specialist Advisor hoặc Trainee Coach)
 * POST /api/chat/local-coach
 */
const { generateAiChatReply } = require('../services/aiChatService');

exports.askLocalAiCoach = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, history, assistantType, clientContext } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp nội dung câu hỏi.' });
        }

        // Lấy thông tin thể trạng & chấn thương học viên trong Database để làm ngữ cảnh
        const userRes = await pool.query(`
            SELECT id, full_name, email, gender, age, height, weight, goal, activity_level, injuries, role 
            FROM users 
            WHERE id = $1;
        `, [userId]);

        const currentUser = userRes.rows[0] || {};
        const effectiveAssistantType = assistantType || (currentUser.role === 'pt' ? 'pt_assistant' : 'trainee_coach');

        const result = await generateAiChatReply({
            prompt: prompt.trim(),
            history: history || [],
            userProfile: currentUser,
            assistantType: effectiveAssistantType,
            clientContext: clientContext || null
        });

        return res.json({
            success: result.success,
            reply: result.reply,
            model: result.model || 'gemini-flash-lite',
            provider: result.provider || 'AI Engine',
            isLocalAi: result.model?.includes('ollama')
        });
    } catch (error) {
        console.error('Lỗi hỏi AI Coach:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi gọi AI Assistant.' });
    }
};
