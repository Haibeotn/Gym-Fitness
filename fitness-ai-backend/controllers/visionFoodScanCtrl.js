const pool = require('../config/db');

exports.visionFoodScanHandler = async (req, res) => {
  const start = Date.now();
  try {
    const { imageBase64 = '', fileName = '', userNote = '' } = req.body || {};
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    if (!cleanBase64) {
      return res.status(400).json({
        success: false,
        reply: '⚠️ Chưa nhận được dữ liệu hình ảnh. Bạn vui lòng chọn lại ảnh món ăn nhé!',
      });
    }

    // =========================================================================
    // BƯỚC 1: BỘ GÁC CỔNG THỊ GIÁC (VISION DOMAIN CLASSIFIER: FOOD | GYM | UNRELATED)
    // =========================================================================
    let visionCategory = 'UNKNOWN';
    let visualDescription = '';

    const visionModels = ['fitness-vision-food', 'llava', 'moondream'];
    for (const vModel of visionModels) {
      try {
        const vRes = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: vModel,
            stream: false,
            options: { temperature: 0.05, num_predict: 180 },
            messages: [
              {
                role: 'user',
                content: `Classify this image strictly into one of 3 categories:
1. FOOD (if the image contains food, meals, drinks, fruits, cooking ingredients, or nutrition supplements)
2. GYM (if the image contains gym equipment, weights, workout posture, or fitness tracking)
3. UNRELATED (if the image is a screenshot, person selfie without food/gym, animal, vehicle, landscape, meme, document, or random object)

Respond in this EXACT format:
CATEGORY: [FOOD or GYM or UNRELATED]
OBJECT: [short description of what is actually visible in the image]
DETAILS: [if FOOD, list visible food items and estimated grams; otherwise leave blank]`,
                images: [cleanBase64],
              },
            ],
          }),
        });

        if (vRes.ok) {
          const vData = await vRes.json();
          const rawContent = (vData.message?.content || '').trim();
          if (rawContent) {
            visualDescription = rawContent;
            const upper = rawContent.toUpperCase();
            if (upper.includes('CATEGORY: UNRELATED') || upper.includes('CATEGORY: [UNRELATED]')) {
              visionCategory = 'UNRELATED';
            } else if (upper.includes('CATEGORY: GYM') || upper.includes('CATEGORY: [GYM]')) {
              visionCategory = 'GYM';
            } else if (upper.includes('CATEGORY: FOOD') || upper.includes('CATEGORY: [FOOD]')) {
              visionCategory = 'FOOD';
            } else {
              // Kiểm tra từ khóa nếu model không in đúng header
              const lower = rawContent.toLowerCase();
              const nonFoodKeywords = [
                'screenshot', 'computer', 'screen', 'text', 'code', 'car', 'motorcycle',
                'dog', 'cat', 'animal', 'building', 'street', 'landscape', 'cartoon', 'meme',
                'document', 'diagram', 'phone'
              ];
              const foodKeywords = [
                'rice', 'chicken', 'meat', 'beef', 'pork', 'egg', 'noodle', 'soup', 'pho',
                'salad', 'vegetable', 'bread', 'plate', 'bowl', 'dish', 'food', 'meal', 'fruit', 'drink'
              ];
              if (nonFoodKeywords.some((k) => lower.includes(k)) && !foodKeywords.some((k) => lower.includes(k))) {
                visionCategory = 'UNRELATED';
              } else {
                visionCategory = 'FOOD';
              }
            }
            break;
          }
        }
      } catch (_) {}
    }

    // Nếu máy chưa tải mô hình thị giác llava/moondream
    if (!visualDescription) {
      return res.json({
        success: true,
        reply:
          '### ⚠️ Chưa kích hoạt Mô hình Thị giác (Vision Model)\n' +
          '- Để AI nhìn và phân biệt được ảnh thật (đồ ăn vs ảnh ngoài lề), bạn hãy chạy lệnh tải mắt thần nhẹ trong PowerShell:\n' +
          '  - **Lệnh**: `ollama pull llava` (hoặc `ollama pull moondream`)\n' +
          '- 💡 *Sau khi tải xong, AI sẽ tự động nhận diện chính xác từng món ăn và từ chối các bức ảnh không liên quan đến Gym!*',
      });
    }

    // =========================================================================
    // TRƯỜNG HỢP 1: ẢNH KHÔNG LIÊN QUAN ĐẾN ĐỒ ĂN HOẶC GYM -> TỪ CHỐI KHÉO LÉO
    // =========================================================================
    if (visionCategory === 'UNRELATED') {
      const refusalPrompt = `Camera Vision AI vừa quan sát bức ảnh của người dùng gửi lên và ghi nhận:
"${visualDescription}"

Đây KHÔNG phải là món ăn, thực phẩm dinh dưỡng hay thiết bị tập Gym.
Hãy đóng vai FitnessAI Coach, trả lời ngắn gọn (4-5 dòng), thân thiện, dí dỏm theo cấu trúc sau:
### 🛡️ Phát Hiện Ảnh Ngoài Danh Mục Dinh Dưỡng & Gym
- **Nhận diện từ Camera AI**: (Nêu ngắn gọn bằng tiếng Việt thứ bạn nhìn thấy trong ảnh dựa vào mô tả trên).
- **Lời nhắn từ HLV AI**: (Từ chối tính Calo một cách khéo léo, vui vẻ mang tinh thần thể thao — ví dụ "Thứ này không có Protein hay Carb để nuôi cơ bắp rồi bạn ơi!", sau đó mời người dùng chụp ảnh bữa ăn thực tế như cơm, phở, ức gà hoặc ảnh dụng cụ tập gym để Coach phân tích chuẩn khoa học).`;

      const refusalRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'fitness-ai-coach',
          stream: false,
          keep_alive: '60m',
          options: { temperature: 0.3, num_predict: 220 },
          messages: [{ role: 'user', content: refusalPrompt }],
        }),
      });

      const refusalData = await refusalRes.json();
      const politeReply =
        refusalData.message?.content ||
        '### 🛡️ Ảnh Không Thuộc Danh Mục Dinh Dưỡng\n- Bức ảnh bạn gửi không phải là món ăn hoặc hoạt động thể hình nên Coach xin phép không tính Calo nhé! Hãy gửi ảnh bữa ăn hoặc bài tập để Coach hỗ trợ bạn tốt nhất!';

      return res.json({
        success: true,
        reply:
          politeReply +
          `\n\n🛡️ **Bộ lọc Chống Ảo Giác Vision (${Date.now() - start}ms)**: Đã chặn tính toán Calo trên ảnh không phải thực phẩm.`,
      });
    }

    // =========================================================================
    // TRƯỜNG HỢP 2: ẢNH DỤNG CỤ / HOẠT ĐỘNG GYM (KHÔNG PHẢI ĐỒ ĂN)
    // =========================================================================
    if (visionCategory === 'GYM') {
      const gymPrompt = `Camera AI nhận diện bức ảnh này liên quan đến tập luyện/dụng cụ Gym chứ không phải món ăn:
"${visualDescription}"

Hãy trả lời ngắn gọn:
### 🏋️ Nhận Diện Hình Ảnh Tập Luyện Gym
- Khéo léo cho người dùng biết đây là hình ảnh tập luyện/thiết bị Gym (không phải món ăn nên không tính Calo).
- Đưa ra 2-3 lời khuyên kỹ thuật cơ sinh học ngắn gọn liên quan đến thiết bị/hoạt động trong ảnh.`;

      const gymRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'fitness-ai-coach',
          stream: false,
          keep_alive: '60m',
          options: { temperature: 0.25, num_predict: 260 },
          messages: [{ role: 'user', content: gymPrompt }],
        }),
      });
      const gymData = await gymRes.json();
      return res.json({
        success: true,
        reply: gymData.message?.content || 'Đã nhận diện hình ảnh liên quan đến Gym.',
      });
    }

    // =========================================================================
    // TRƯỜNG HỢP 3: ĐÚNG LÀ ẢNH MÓN ĂN / DINH DƯỠNG -> PHÂN TÍCH KHOA HỌC 4 MỤC
    // =========================================================================
    let dbFoodsText = '';
    try {
      const fRes = await pool.query(
        'SELECT name, calories, protein, carbs, fat, serving_size FROM foods ORDER BY id ASC LIMIT 20'
      );
      if (fRes.rows?.length > 0) {
        dbFoodsText = fRes.rows
          .slice(0, 10)
          .map(
            (f) =>
              `${f.name} (${f.serving_size || '100g'}): ${f.calories}kcal, ${f.protein}g P, ${f.carbs}g C, ${f.fat}g F`
          )
          .join(' | ');
      }
    } catch (_) {}

    const foodPrompt = `Phân tích bức ảnh món ăn đã được xác thực:
- Quan sát từ Camera Vision AI: "${visualDescription}"
- Ghi chú thêm: "${userNote || ''}"
- Chuẩn RAG PostgreSQL (trên 100g): ${dbFoodsText || 'Cơm trắng 100g: 130kcal (2.7g P, 28g C, 0.3g F) | Gà/Thịt nạc 100g: 165kcal (31g P, 0g C, 3.6g F) | Trứng 1 quả: 78kcal (6.3g P, 0.6g C, 5.3g F)'}

Trình bày đúng 4 mục khoa học:
### 1. Tên Món Ăn và Phương Pháp Chế Biến
### 2. Ước Lượng Khối Lượng (gram) và Thành Phần Ẩm Thực
### 3. Tổng Ước Tính Calo và Dinh Dưỡng (Chuẩn Atwater 4-4-9)
- **Tổng Năng lượng**: [Tổng Calo] kcal
- **Protein (Đạm)**: [Số g]g (x 4 kcal/g)
- **Carbs (Tinh bột)**: [Số g]g (x 4 kcal/g)
- **Fat (Chất béo)**: [Số g]g (x 9 kcal/g)
### 4. Đánh Giá Theo Mục Tiêu Thể Hình (Bulking vs Cutting)`;

    const coachRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'fitness-ai-coach',
        stream: false,
        keep_alive: '60m',
        options: { temperature: 0.2, repeat_penalty: 1.15, num_ctx: 2048, num_predict: 450 },
        messages: [{ role: 'user', content: foodPrompt }],
      }),
    });

    const coachData = await coachRes.json();
    const report = coachData.message?.content || '';
    const footer = `\n\n🛡️ **Xác thực Vision AI & RAG (${Date.now() - start}ms)**: Ảnh thực phẩm hợp lệ • Đối chiếu bảng \`foods\` (\`fitness_db\`) & **Atwater 4-4-9**.`;

    return res.json({
      success: true,
      reply: report + footer,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xử lý ảnh: ' + err.message,
    });
  }
};