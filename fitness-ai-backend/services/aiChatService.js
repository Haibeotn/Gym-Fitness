// fitness-ai-backend/services/aiChatService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { chatWithLocalCoach } = require("./localAiCoach");
const {
    VIETNAMESE_NUTRITION_SYSTEM_CONTEXT,
    parseAndCalculateMealFromText
} = require("./vietnameseNutritionKnowledge");
const pool = require("../config/db");
require('dotenv').config();

const genAI = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza'))
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/**
 * Hỏi đáp với AI - Tự động định tuyến giữa Trợ lý Chuyên Môn PT và Coach Đào Chi cho Học Viên
 * Ưu tiên: Gemini Flash Lite -> Ollama Local -> Fallback thông minh
 */
async function generateAiChatReply({ prompt, history = [], userProfile = {}, assistantType = 'trainee_coach', clientContext = null }) {
    const isPtAssistant = assistantType === 'pt_assistant';

    // 1. Tạo System Prompt phù hợp
    let systemInstruction = '';
    if (isPtAssistant) {
        let clientInfo = '';
        if (clientContext && (clientContext.full_name || clientContext.client_id)) {
            clientInfo = `
[HỒ SƠ HỌC VIÊN ĐANG ĐƯỢC HUẤN LUYỆN VIÊN ĐÍNH KÈM THAM KHẢO]:
- Tên học viên: ${clientContext.full_name || 'Học viên'}
- Mục tiêu: ${clientContext.goal || 'Tăng cơ giảm mỡ'}
- Thể trạng: Cân nặng ${clientContext.weight || '--'} kg | Chiều cao ${clientContext.height || '--'} cm
- Chấn thương / Tiền sử: ${Array.isArray(clientContext.injuries) ? clientContext.injuries.join(', ') : (clientContext.injuries || 'Không có chấn thương')}
- Mức độ vận động: ${clientContext.activity_level || 'Vừa phải'}
- Gói tập: ${clientContext.package_name || 'Gói PT'} (Còn lại ${clientContext.remaining_sessions || 0}/${clientContext.total_sessions || 0} buổi)
`;
        }

        systemInstruction = `Bạn là Chuyên gia Cố vấn Huấn luyện Cấp cao & Trợ lý AI Chuyên Môn (AI Head Coach Specialist) dành riêng cho Huấn Luyện Viên Thể Hình (PT) tại Fitness AI Gym Việt Nam.
${clientInfo}
NHIỆM VỤ & PHONG CÁCH:
1. Giao tiếp chuyên nghiệp giữa các đồng nghiệp trong ngành thể hình: Gọi người dùng là "Huấn luyện viên" hoặc "Coach", xưng là "Trợ lý AI PT".
2. Chuyên sâu về:
   - Khoa học vận động, giải phẫu chức năng và góc phát lực cơ bắp (Biomechanics, Functional Anatomy).
   - Thiết kế chu kỳ tập luyện khoa học (Periodization: Macrocycle, Mesocycle, Hypertrophy, Strength, RPE/RIR, Progressive Overload, Deload).
   - Gợi ý bài tập biến thể, bài tập thay thế giảm tải khớp (Regression & Progression) khi học viên bị đau khớp gối, khớp vai, cột sống thắt lưng hoặc hạn chế độ linh hoạt (Mobility).
   - Dinh dưỡng thể thao chuyên sâu: Tính toán Macro/Calo, chu kỳ nạp carb (Carb cycling), khắc phục tình trạng chững cân (Plateau), xả cơ (Bulking) và siết cơ (Cutting).
   - Tâm lý học thể thao: Kỹ năng tạo động lực, coaching hành vi và duy trì gắn kết học viên (Client Retention).
3. Định dạng câu trả lời: Rõ ràng, có gạch đầu dòng, nêu rõ cơ chế sinh học, các bước thực hiện và lưu ý sư phạm cho PT.`;
    } else {
        const injuriesStr = Array.isArray(userProfile?.injuries) && userProfile.injuries.length > 0
            ? userProfile.injuries.join(', ')
            : (userProfile?.injuries || 'Không có chấn thương');
        const profileInfo = userProfile ? `
[THÔNG TIN THỂ TRẠNG & CHẤN THƯƠNG CỦA HỌC VIÊN]:
- Tên học viên: ${userProfile.full_name || 'Học viên'}
- Giới tính: ${userProfile.gender === 'female' ? 'Nữ' : 'Nam'} | Tuổi: ${userProfile.age || 24}
- Cân nặng: ${userProfile.weight || 70} kg | Chiều cao: ${userProfile.height || 170} cm
- Mục tiêu: ${userProfile.goal || 'Tăng cơ giảm mỡ'}
- Tiền sử chấn thương / Đau khớp cần bảo vệ: ${injuriesStr}
` : '';

        systemInstruction = `Bạn là Coach Đào Chi - Huấn luyện viên thể hình cá nhân nữ và chuyên gia dinh dưỡng thể thao AI tại Fitness AI Gym Việt Nam.${profileInfo}
${VIETNAMESE_NUTRITION_SYSTEM_CONTEXT}
QUY TẮC:
1. Đối với câu hỏi về gym, kỹ thuật form bài tập, dinh dưỡng, calo/protein, giảm mỡ tăng cơ: Trả lời nhiệt tình, dễ hiểu, ngọt ngào, chuẩn xác theo số liệu thực tế và khích lệ người tập.
2. Xưng hô "Coach" và "Bạn".`;
    }

    // 1.5. RAG Grounding: Truy vấn Database PostgreSQL (bảng foods & exercises) theo từ khóa câu hỏi để làm giàu ngữ cảnh chính xác
    let ragContext = '';
    try {
        const qLower = (prompt || '').toLowerCase();
        // Kiểm tra xem câu hỏi có đề cập món ăn / dinh dưỡng không
        const parsedMeal = parseAndCalculateMealFromText(prompt);
        if (parsedMeal) {
            ragContext += `\n[PHÂN TÍCH ĐỊNH LƯỢNG MÓN ĂN CHÍNH XÁC TỪ HỆ THỐNG]:\n- Món: ${parsedMeal.food_name} (${parsedMeal.serving_size})\n- Tổng năng lượng: ${parsedMeal.calories} kcal | Đạm (Protein): ${parsedMeal.protein}g | Tinh bột (Carbs): ${parsedMeal.carbs}g | Chất béo (Fat): ${parsedMeal.fat}g\n- Lời khuyên: ${parsedMeal.health_tip}\n`;
        }

        // Tìm bài tập liên quan trong DB nếu người dùng hỏi về bài tập
        let matchedMuscle = null;
        if (qLower.includes('ngực') || qLower.includes('chest') || qLower.includes('bench')) matchedMuscle = 'Chest';
        else if (qLower.includes('lưng') || qLower.includes('xô') || qLower.includes('back') || qLower.includes('pull')) matchedMuscle = 'Back';
        else if (qLower.includes('vai') || qLower.includes('shoulder')) matchedMuscle = 'Shoulders';
        else if (qLower.includes('chân') || qLower.includes('đùi') || qLower.includes('squat') || qLower.includes('leg')) matchedMuscle = 'Quadriceps';
        else if (qLower.includes('mông') || qLower.includes('glute') || qLower.includes('hip thrust')) matchedMuscle = 'Glutes';
        else if (qLower.includes('bụng') || qLower.includes('core') || qLower.includes('abs')) matchedMuscle = 'Core';
        else if (qLower.includes('tay trước') || qLower.includes('bicep')) matchedMuscle = 'Biceps';
        else if (qLower.includes('tay sau') || qLower.includes('tricep')) matchedMuscle = 'Triceps';

        if (matchedMuscle) {
            const exRes = await pool.query(`
                SELECT name, mechanic, primary_muscle, target_sets, target_reps, target_rpe, instructions
                FROM exercises
                WHERE primary_muscle ILIKE $1 OR $1 = ANY(secondary_muscles)
                LIMIT 4;
            `, [`%${matchedMuscle}%`]);

            if (exRes.rows.length > 0) {
                ragContext += `\n[DANH SÁCH BÀI TẬP CHUẨN KHOA HỌC CHO NHÓM CƠ ${matchedMuscle.toUpperCase()} TỪ DATABASE]:\n` +
                    exRes.rows.map((e, i) => `${i + 1}. **${e.name}** (${e.mechanic}): ${e.target_sets} hiệp x ${e.target_reps} lần (RPE ${e.target_rpe}/10) — Kỹ thuật: ${e.instructions}`).join('\n');
            }
        }
    } catch (ragErr) {
        console.warn('RAG lookup warning:', ragErr.message);
    }

    const enrichedPrompt = ragContext ? `${prompt}\n\n(Tham khảo dữ liệu chuẩn từ hệ thống để trả lời chính xác cho học viên:${ragContext})` : prompt;

    // 2. Thử gọi Google Gemini (gemini-flash-lite-latest)
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-lite-latest",
                systemInstruction: systemInstruction
            });

            // Format history cho Gemini
            const recentHistory = (history || []).slice(-6).map(m => ({
                role: (m.role === 'user' || m.sender_id === 'user' || (!m.role && m.sender_id !== 'ai')) ? 'user' : 'model',
                parts: [{ text: m.content || '' }]
            })).filter(m => m.parts[0].text);

            const chat = model.startChat({
                history: recentHistory
            });

            const result = await chat.sendMessage(enrichedPrompt);
            const text = result.response.text();
            if (text && text.trim()) {
                return {
                    success: true,
                    reply: text.trim(),
                    model: 'gemini-flash-lite',
                    provider: 'Google Gemini'
                };
            }
        } catch (geminiError) {
            console.warn("⚠️ Gemini API tạm thời không phản hồi, thử sang Ollama:", geminiError.message);
        }
    }

    // 3. Fallback sang Local Ollama nếu có cài đặt
    try {
        const ollamaRes = await chatWithLocalCoach(enrichedPrompt, history, isPtAssistant ? (clientContext || {}) : userProfile);
        if (ollamaRes.success && ollamaRes.reply) {
            return {
                success: true,
                reply: ollamaRes.reply,
                model: 'ollama-fitness-coach',
                provider: 'Ollama Local'
            };
        }
    } catch (ollamaErr) {
        console.warn("⚠️ Ollama không khả dụng:", ollamaErr.message);
    }

    // 4. Fallback thông minh dựa trên RAG Database & Vietnamese Nutrition Engine (khi không có mạng hoặc Ollama chưa bật)
    if (ragContext) {
        return {
            success: true,
            reply: `Chào ${isPtAssistant ? 'Huấn luyện viên' : 'bạn'}! Dựa trên cơ sở dữ liệu Khoa học Thể hình & Viện Dinh dưỡng Quốc gia, ${isPtAssistant ? 'Trợ lý AI PT' : 'Coach Đào Chi'} xin phân tích chi tiết cho câu hỏi **"${prompt}"**:\n${ragContext}\n\n💡 **Lưu ý chuyên môn**: Hãy kiểm soát nhịp độ chuyển động (Tempo 3-0-1-0), giữ mức RPE 8/10 và đảm bảo nạp đủ 2.0g - 2.2g Protein/kg cân nặng mỗi ngày để tối ưu phục hồi cơ bắp nhé!`,
            model: 'rag-knowledge-engine',
            provider: 'Fitness Knowledge Engine'
        };
    }

    // 4. Fallback thông minh nếu không có kết nối internet hoặc API tạm gián đoạn
    if (isPtAssistant) {
        return {
            success: true,
            reply: `Chào Huấn luyện viên! Về câu hỏi "${prompt}":\n\n1. **Phân tích cơ chế**: Đối với trường hợp này, Coach nên ưu tiên kiểm soát nhịp độ (Tempo 3-0-1-0) và đảm bảo biên độ chuyển động an toàn (Active ROM), tránh tải đột ngột lên các khớp nhạy cảm.\n2. **Đề xuất bài tập**: Có thể thay thế bằng các bài tập đa khớp biến thể có điểm tựa vững chắc (Closed Kinetic Chain Exercises) như Goblet Box Squat, Dumbbell Romanian Deadlift hoặc Incline Dumbbell Press.\n3. **Kế hoạch theo dõi**: Ghi nhận mức RPE (khuyến nghị RPE 7-8) sau mỗi buổi tập để điều chỉnh kịp thời cho học viên.\n\nCoach có cần em hỗ trợ lên chi tiết bảng tính Macro hay lộ trình 4 tuần cho học viên này không ạ?`,
            model: 'pt-expert-engine',
            provider: 'AI Assistant Fallback'
        };
    } else {
        return {
            success: true,
            reply: `Chào bạn! Coach Đào Chi đã ghi nhận câu hỏi: "${prompt}".\n\nĐể đạt hiệu quả tối ưu nhất, bạn hãy duy trì uống đủ 2-2.5 lít nước mỗi ngày, ngủ đủ 7-8 tiếng và nạp đủ 1.6g - 2.0g Protein/kg cân nặng nhé! Coach luôn ở đây đồng hành cùng bạn trên hành trình độ dáng! 💪`,
            model: 'dao-chi-engine',
            provider: 'Coach Đào Chi Fallback'
        };
    }
}

module.exports = { generateAiChatReply };
