// fitness-ai-backend/services/localAiCoach.js
const http = require('http');

const OLLAMA_HOST = '127.0.0.1';
const OLLAMA_PORT = 11434;
const MODEL_NAME = 'fitness-coach';

/**
 * Gửi tin nhắn tới Local AI Coach (Ollama)
 */
function chatWithLocalCoach(prompt, conversationHistory = [], userProfile = {}) {
    return new Promise((resolve) => {
        // RAG: Ghép thông tin thể trạng của học viên vào ngữ cảnh prompt
        const profileInfo = userProfile ? `
[THÔNG TIN THỂ TRẠNG HỌC VIÊN HIỆN TẠI]
- Tên học viên: ${userProfile.full_name || 'Học viên'}
- Cân nặng: ${userProfile.weight || 71} kg | Chiều cao: ${userProfile.height || 170} cm
- Mục tiêu: ${userProfile.goal || 'Tăng cơ giảm mỡ'}
` : '';

        const systemMessage = {
            role: 'system',
            content: `Bạn là Coach Đào Chi - Huấn luyện viên thể hình nữ cá nhân và chuyên gia dinh dưỡng thể thao AI tại Fitness AI Gym Việt Nam.${profileInfo}

QUY TẮC BẮT BUỘC:
1. ĐỐI VỚI CÂU HỎI VỀ GYM, TẬP LUYỆN, FORM ĐỘNG TÁC, LỊCH TẬP VÀ DINH DƯỠNG THỂ THAO: Trả lời trực tiếp, đầy đủ, ngọt ngào, nhiệt tình và chuẩn kỹ thuật ngay lập tức. TUYỆT ĐỐI KHÔNG từ chối.
2. CHỈ KHI người dùng hỏi về các chủ đề hoàn toàn không liên quan đến thể hình hoặc ăn uống (như code, IT, sửa máy tính, toán học, chính trị, chuyện tình cảm...): Bạn mới từ chối lịch sự, dễ thương và khéo léo chuyển hướng người dùng quay lại chủ đề tập gym hoặc chế độ dinh dưỡng!`
        };

        const formattedHistory = Array.isArray(conversationHistory) 
            ? conversationHistory.slice(-6).map(m => ({
                role: m.role || (m.sender_id === userProfile.id ? 'user' : 'assistant'),
                content: m.content
            }))
            : [];

        const messages = [
            systemMessage,
            ...formattedHistory,
            { role: 'user', content: prompt }
        ];

        const payload = JSON.stringify({
            model: MODEL_NAME,
            messages: messages,
            stream: false
        });

        const req = http.request({
            hostname: OLLAMA_HOST,
            port: OLLAMA_PORT,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 90000
        }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    const reply = parsed?.message?.content || 'Coach Đào Chi đã nhận câu hỏi của bạn!';
                    resolve({ success: true, reply, model: MODEL_NAME });
                } catch (e) {
                    resolve({ success: false, reply: '⚠️ Có lỗi trong quá trình xử lý câu hỏi. Bạn vui lòng thử lại nhé!', error: e.message });
                }
            });
        });

        req.on('error', (e) => {
            console.error('Lỗi kết nối AI Service:', e.message);
            resolve({
                success: false,
                reply: '⚠️ Coach Đào Chi hiện chưa thể phản hồi lúc này. Bạn vui lòng thử lại sau giây lát nhé!',
                error: e.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                reply: '⚠️ Thời gian phản hồi quá lâu, bạn vui lòng gửi lại câu hỏi nhé!',
                error: 'timeout'
            });
        });

        req.write(payload);
        req.end();
    });
}

module.exports = { chatWithLocalCoach };
