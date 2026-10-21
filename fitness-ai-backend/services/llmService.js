// services/llmService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Khởi tạo Gemini AI bằng API Key
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * 1. SINH LỜI KHUYÊN & THẨM ĐỊNH GIÁO ÁN CHUYÊN MÔN CỦA HLV AI
 * Ràng buộc:
 * - Giải thích rõ cấu trúc 4 pha (Trục chính -> Bổ trợ -> Cô lập -> Core)
 * - Tối ưu 4 - 6 bài tập (ngăn ngừa Junk Volume & mỏi thần kinh trung ương)
 * - Nhịp độ chuyển động chuẩn (Tempo 3-0-1-0) & RPE 7.5 - 8.5
 * - Hướng dẫn thở gồng cơ lõi (Core Bracing) & an toàn chấn thương
 */
const generateCoachAdvice = async (targetMuscle, exercisesArr, userProfile = {}) => {
    const exerciseListStr = (exercisesArr || []).map((ex, idx) => 
        `#${idx + 1}. [${ex.phase_title || 'Bài tập'}] ${ex.name} (${ex.target_sets || 3} sets x ${ex.target_reps || '10 reps'}, RPE ${ex.target_rpe || 8})`
    ).join('\n');

    const prompt = `
Bạn là Huấn luyện viên trưởng & Chuyên gia Thể thao AI tại Fitness AI Gym Việt Nam.
Khách hàng hôm nay tập nhóm cơ: ${targetMuscle}.
Danh sách giáo án 4 pha khoa học đã được thiết lập gồm ${exercisesArr.length} bài tập (tối ưu chuẩn 4-6 bài, không gây Junk Volume):
${exerciseListStr}

${userProfile.injuries ? `Học viên có lưu ý chấn thương: ${Array.isArray(userProfile.injuries) ? userProfile.injuries.join(', ') : userProfile.injuries}` : ''}

Nhiệm vụ của bạn (viết khoảng 4-5 câu mạch lạc, nhiệt huyết, chuẩn y học thể thao):
1. Chào hỏi năng lượng và khen ngợi sự chuẩn bị của học viên.
2. Giải thích ngắn gọn tại sao cấu trúc buổi tập này (tập bài trục chính trước, bổ trợ và cô lập sau với đúng ${exercisesArr.length} bài) lại giúp tối ưu tăng cơ giảm mỡ mà không bị quá tải thần kinh (Junk Volume).
3. Nhắc nhở 1 lưu ý kỹ thuật cốt lõi: Nhịp độ hạ tạ có kiểm soát (Tempo 3-0-1-0) và cách gồng bụng (Core Bracing 360 độ).
Xưng hô là "Coach" và "Bạn".`;

    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text && text.trim()) return text.trim();
        } catch (error) {
            console.warn("Lỗi gọi Gemini cho coach advice:", error.message);
        }
    }

    // Fallback chuẩn mực
    return `Chào bạn! Buổi tập ${targetMuscle} hôm nay được thiết kế chuẩn khoa học với ${exercisesArr.length} bài tập tinh gọn, tập trung kích hoạt từ bài phức hợp trục chính đến các bài cô lập để tối đa hóa áp lực cơ học mà hoàn toàn tránh được "khối lượng rác" (Junk Volume). Hãy nhớ áp dụng nhịp độ hạ tạ chậm 3 giây (Tempo 3-0-1-0), hít sâu gồng chặt cơ bụng trước mỗi hiệp và giữ mức RPE quanh 8/10. Khởi động kỹ và cùng bùng nổ năng lượng nhé! 💪`;
};

/**
 * 2. CƠ CHẾ SINH BÀI TẬP TRỰC TIẾP CỦA AI VỚI RÀNG BUỘC KHOA HỌC CHẶT CHẼ
 * Ràng buộc bắt buộc:
 * - TUYỆT ĐỐI CHỈ TỪ 4 ĐẾN 6 BÀI TẬP CHO 1 BUỔI TẬP.
 * - Tuân thủ cấu trúc 4 pha:
 *   + Pha 1: 1 bài Primary Compound (4 sets x 6-8 reps, RPE 8, nghỉ 120-150s)
 *   + Pha 2: 1-2 bài Secondary Assistance (3 sets x 8-10 reps, RPE 8, nghỉ 90s)
 *   + Pha 3: 2 bài Isolation / Finisher (3 sets x 12-15 reps, RPE 8.5-9, nghỉ 60s)
 *   + Pha 4: 1 bài Core / Cool-down (2-3 sets x 15-20 reps)
 * - Tự động loại trừ hoặc hạ bậc (Regress) các bài tập nguy hiểm nếu có chấn thương.
 */
const generateAiCustomWorkoutPlan = async ({ targetMuscles, userInjuries = [], availableEquipment = [], environment = 'all', userProfile = {} }) => {
    const musclesStr = Array.isArray(targetMuscles) ? targetMuscles.join(', ') : (targetMuscles || 'Toàn thân');
    const injuriesStr = Array.isArray(userInjuries) ? userInjuries.join(', ') : (userInjuries || 'Không có');
    const equipStr = Array.isArray(availableEquipment) ? availableEquipment.join(', ') : (availableEquipment || 'Full Gym');

    const prompt = `
Bạn là Hệ thống Trí Tuệ Nhân Tạo Thiết Kế Giáo Án Thể Hình Chuẩn Khoa Học (Evidence-Based Strength & Conditioning AI).
Hãy thiết kế MỘT BUỔI TẬP DUY NHẤT với các yêu cầu và RÀNG BUỘC BẮT BUỘC sau:

[THÔNG TIN ĐẦU VÀO]:
- Nhóm cơ mục tiêu: ${musclesStr}
- Chấn thương / Vấn đề xương khớp: ${injuriesStr}
- Dụng cụ có sẵn: ${equipStr}
- Môi trường tập: ${environment}

[RÀNG BUỘC KHOA HỌC BẮT BUỘC - KHÔNG ĐƯỢC VI PHẠM]:
1. SỐ LƯỢNG BÀI TẬP: TUYỆT ĐỐI CHỈ TỪ 4 ĐẾN 6 BÀI TẬP (Tuyệt đối không sinh 7, 8 hay 10 bài để tránh Junk Volume).
2. CẤU TRÚC 4 PHA KHOA HỌC:
   - Bài 1 (Pha 1 - Primary Compound): 1 bài đa khớp nặng nhất, 4 sets x 6-8 reps, RPE 8, Tempo 3-0-1-0.
   - Bài 2 & 3 (Pha 2 - Secondary Assistance): 1-2 bài đa khớp bổ trợ góc khác, 3 sets x 8-10 reps, RPE 8.
   - Bài 4 & 5 (Pha 3 - Isolation & Pump): 2 bài cô lập đơn khớp, 3 sets x 12-15 reps, RPE 8.5-9.
   - Bài 6 (Pha 4 - Core/Finisher, nếu cần): 1 bài cơ lõi ổn định cột sống, 3 sets x 15-20 reps hoặc 45s.
3. AN TOÀN CHẤN THƯƠNG: Nếu có đau gối -> Không Back Squat sâu/Jump; Nếu đau lưng -> Không Deadlift tự do/Bent-over row; Nếu đau vai -> Không Behind neck/Upright row.

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng mảng (Array of Objects), không có markdown thừa bên ngoài:
[
  {
    "id": 1,
    "name": "Tên bài tập tiếng Việt (Tên quốc tế)",
    "phase": 1,
    "phase_title": "1. Trục Chính (Primary Compound)",
    "mechanic": "Compound",
    "primary_muscle": "Nhóm cơ chính",
    "target_sets": 4,
    "target_reps": "6-8 reps",
    "target_rpe": 8,
    "rest_seconds": 150,
    "tempo": "3-0-1-0",
    "equipment_required": ["Tên dụng cụ"],
    "description": "Mô tả kỹ thuật thực hiện",
    "coaching_tip": "Lưu ý chuẩn form của HLV"
  }
]
`;

    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            
            // Làm sạch markdown nếu có
            if (text.startsWith('```json')) {
                text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (text.startsWith('```')) {
                text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.length >= 4 && parsed.length <= 6) {
                return parsed;
            }
        } catch (err) {
            console.warn("⚠️ AI Custom Plan fallback sang thuật toán database:", err.message);
        }
    }

    return null;
};

module.exports = { generateCoachAdvice, generateAiCustomWorkoutPlan };