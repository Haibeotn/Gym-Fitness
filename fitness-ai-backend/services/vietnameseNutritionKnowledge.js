// fitness-ai-backend/services/vietnameseNutritionKnowledge.js
/**
 * CƠ SỞ DỮ LIỆU CHUẨN HÓA DINH DƯỠNG & THÀNH PHẦN MÓN ĂN VIỆT NAM (VIETNAMESE NUTRITION KNOWLEDGE BASE)
 * Xây dựng theo Bảng Thành phần Thực phẩm Việt Nam (Viện Dinh dưỡng Quốc gia - NIN) & USDA FoodData Central.
 * Tất cả định lượng quy chuẩn theo phần ăn thực tế tại Việt Nam và mật độ dinh dưỡng trên 100g chín.
 */

// 1. BẢNG MẬT ĐỘ DINH DƯỠNG NGUYÊN LIỆU CƠ BẢN (Tính trên 100g thực phẩm đã chế biến chín)
const INGREDIENT_DENSITY_PER_100G = {
    'cơm trắng': { cal: 130, pro: 2.7, carb: 28.2, fat: 0.3, default_g: 150, unit: '1 chén vừa (150g)' },
    'cơm tấm': { cal: 135, pro: 2.8, carb: 29.5, fat: 0.4, default_g: 200, unit: '1 đĩa cơm tấm (200g)' },
    'cơm gạo lứt': { cal: 112, pro: 2.6, carb: 23.5, fat: 0.9, default_g: 150, unit: '1 chén (150g)' },
    'bún tươi': { cal: 110, pro: 1.8, carb: 25.0, fat: 0.2, default_g: 180, unit: '1 vắt bún (180g)' },
    'bánh phở': { cal: 115, pro: 2.2, carb: 26.0, fat: 0.3, default_g: 180, unit: '1 phần bánh phở (180g)' },
    'miến dong': { cal: 108, pro: 0.5, carb: 26.5, fat: 0.1, default_g: 150, unit: '1 vắt miến chín (150g)' },
    'mì gói': { cal: 450, pro: 9.0, carb: 62.0, fat: 18.0, default_g: 75, unit: '1 vắt mì (75g)' },
    'xôi nếp': { cal: 170, pro: 3.5, carb: 37.0, fat: 0.8, default_g: 200, unit: '1 gói xôi (200g)' },
    'khoai lang': { cal: 86, pro: 1.6, carb: 20.1, fat: 0.1, default_g: 200, unit: '1 củ vừa (200g)' },
    'yến mạch': { cal: 389, pro: 16.9, carb: 66.3, fat: 6.9, default_g: 50, unit: '50g khô' },
    'bánh mì': { cal: 265, pro: 9.0, carb: 49.0, fat: 3.2, default_g: 90, unit: '1 ổ bánh mì không (90g)' },
    'ức gà': { cal: 165, pro: 31.0, carb: 0.0, fat: 3.6, default_g: 150, unit: '1 miếng ức gà chín (150g)' },
    'đùi gà': { cal: 209, pro: 26.0, carb: 0.0, fat: 10.9, default_g: 150, unit: '1 cái đùi gà (150g)' },
    'thịt gà': { cal: 190, pro: 27.0, carb: 0.0, fat: 8.0, default_g: 120, unit: '120g thịt gà' },
    'thịt bò': { cal: 215, pro: 28.5, carb: 0.0, fat: 10.5, default_g: 120, unit: '120g thịt bò nạc' },
    'bò tái': { cal: 198, pro: 29.0, carb: 0.0, fat: 8.5, default_g: 100, unit: '100g thịt bò tái' },
    'sườn nướng': { cal: 260, pro: 24.0, carb: 4.5, fat: 16.0, default_g: 110, unit: '1 miếng sườn cốt lết (110g)' },
    'thịt heo luộc': { cal: 210, pro: 25.0, carb: 0.0, fat: 12.0, default_g: 120, unit: '120g thịt heo luộc' },
    'thịt kho tàu': { cal: 310, pro: 18.0, carb: 5.0, fat: 24.0, default_g: 150, unit: '2 miếng thịt ba chỉ kho (150g)' },
    'heo quay': { cal: 330, pro: 21.0, carb: 1.0, fat: 27.0, default_g: 120, unit: '120g thịt heo quay' },
    'chả lụa': { cal: 215, pro: 18.5, carb: 3.5, fat: 14.0, default_g: 60, unit: '3 lát chả lụa (60g)' },
    'cá hồi': { cal: 208, pro: 22.5, carb: 0.0, fat: 13.0, default_g: 150, unit: '1 phi lê cá hồi (150g)' },
    'cá thu': { cal: 189, pro: 24.0, carb: 0.0, fat: 10.0, default_g: 150, unit: '1 khứa cá thu (150g)' },
    'cá lóc': { cal: 118, pro: 22.0, carb: 0.0, fat: 2.8, default_g: 150, unit: '150g thịt cá lóc' },
    'tôm hấp': { cal: 99, pro: 24.0, carb: 0.2, fat: 0.3, default_g: 150, unit: '150g tôm bóc vỏ' },
    'trứng luộc': { cal: 155, pro: 12.6, carb: 1.1, fat: 10.6, default_g: 100, unit: '2 quả trứng (100g)' },
    'trứng ốp la': { cal: 192, pro: 12.5, carb: 1.2, fat: 15.0, default_g: 60, unit: '1 quả trứng ốp la (60g)' },
    'đậu hũ': { cal: 85, pro: 9.0, carb: 2.0, fat: 4.8, default_g: 150, unit: '2 bìa đậu hũ trắng (150g)' },
    'rau muống': { cal: 19, pro: 2.1, carb: 2.5, fat: 0.2, default_g: 200, unit: '1 đĩa rau muống luộc (200g)' },
    'súp lơ': { cal: 34, pro: 2.8, carb: 6.6, fat: 0.4, default_g: 200, unit: '1 đĩa bông cải xanh (200g)' },
    'bắp cải': { cal: 25, pro: 1.3, carb: 5.8, fat: 0.1, default_g: 200, unit: '1 đĩa bắp cải luộc (200g)' },
    'dưa leo': { cal: 15, pro: 0.7, carb: 3.6, fat: 0.1, default_g: 100, unit: '1 trái dưa leo (100g)' },
    'chuối': { cal: 89, pro: 1.1, carb: 22.8, fat: 0.3, default_g: 120, unit: '1 quả chuối chín (120g)' },
    'bơ sáp': { cal: 160, pro: 2.0, carb: 8.5, fat: 14.7, default_g: 150, unit: '1 nửa quả bơ (150g)' },
    'whey protein': { cal: 120, pro: 24.0, carb: 3.0, fat: 1.5, default_g: 32, unit: '1 muỗng (32g)' }
};

// 2. BỘ DỮ LIỆU ĐỐI CHIẾU MÓN ĂN VIỆT NAM ĐA DẠNG (CHUẨN HÓA THEO TỪNG THÀNH PHẦN TRÊN ĐĨA)
const VIETNAMESE_COMPOSITE_DISHES = [
    {
        keywords: ['cơm tấm sườn bì chả', 'sườn bì chả'],
        food_name: 'Cơm tấm sườn bì chả trứng ốp la',
        serving_size: '1 đĩa đầy đủ (~480g)',
        calories: 785,
        protein: 41.5,
        carbs: 82.0,
        fat: 31.0,
        items_detected: [
            { name: 'Cơm tấm hạt gãy', weight_g: 200, calories: 270, protein: 5.5, carbs: 59.0, fat: 0.8 },
            { name: 'Sườn cốt lết nướng mật ong', weight_g: 110, calories: 285, protein: 24.0, carbs: 6.0, fat: 18.0 },
            { name: 'Bì heo trộn thính & Chả trứng hấp', weight_g: 90, calories: 175, protein: 11.0, carbs: 8.0, fat: 10.5 },
            { name: 'Đồ chua, dưa leo & Nước mắm pha', weight_g: 80, calories: 55, protein: 1.0, carbs: 9.0, fat: 1.7 }
        ],
        health_tip: 'Món ăn rất giàu Protein (41.5g) tốt cho xây dựng cơ bắp, nhưng lượng mỡ từ bì heo và mỡ hành khá cao. Nếu đang siết mỡ (Cutting), bạn nên bỏ bì và giảm một nửa nước mắm ngọt nhé!'
    },
    {
        keywords: ['cơm tấm sườn', 'cơm sườn'],
        food_name: 'Cơm tấm sườn nướng',
        serving_size: '1 đĩa tiêu chuẩn (~380g)',
        calories: 615,
        protein: 31.0,
        carbs: 71.0,
        fat: 21.5,
        items_detected: [
            { name: 'Cơm tấm', weight_g: 200, calories: 270, protein: 5.5, carbs: 59.0, fat: 0.8 },
            { name: 'Sườn cốt lết nướng', weight_g: 110, calories: 285, protein: 24.5, carbs: 5.0, fat: 18.5 },
            { name: 'Dưa leo, cà chua & Mỡ hành', weight_g: 70, calories: 60, protein: 1.0, carbs: 7.0, fat: 2.2 }
        ],
        health_tip: 'Khẩu phần cung cấp năng lượng tốt trước hoặc sau buổi tập nặng. Hãy gọi thêm 1 chén canh rau để tăng chất xơ và no lâu hơn!'
    },
    {
        keywords: ['cơm gà xối mỡ', 'gà xối mỡ'],
        food_name: 'Cơm gà xối mỡ đùi góc tư',
        serving_size: '1 đĩa (~420g)',
        calories: 740,
        protein: 36.0,
        carbs: 74.0,
        fat: 32.5,
        items_detected: [
            { name: 'Cơm chiên/rang bơ tỏi', weight_g: 200, calories: 330, protein: 6.0, carbs: 64.0, fat: 5.5 },
            { name: 'Đùi gà góc tư chiên giòn da', weight_g: 160, calories: 380, protein: 29.0, carbs: 4.0, fat: 26.5 },
            { name: 'Dưa leo, cà chua, xà lách', weight_g: 60, calories: 30, protein: 1.0, carbs: 6.0, fat: 0.5 }
        ],
        health_tip: 'Phần da gà chiên giòn chứa nhiều chất béo bão hòa. Nếu đang trong giai đoạn giảm mỡ, bạn có thể bỏ lớp da gà để tiết kiệm ngay ~120 kcal!'
    },
    {
        keywords: ['cơm ức gà', 'ức gà áp chảo', 'eat clean'],
        food_name: 'Cơm gạo lứt ức gà áp chảo & Bông cải xanh',
        serving_size: '1 phần Eat Clean (~450g)',
        calories: 475,
        protein: 46.5,
        carbs: 51.0,
        fat: 8.5,
        items_detected: [
            { name: 'Ức gà phi lê áp chảo', weight_g: 150, calories: 245, protein: 41.0, carbs: 1.0, fat: 6.5 },
            { name: 'Cơm gạo lứt tím/đỏ', weight_g: 150, calories: 168, protein: 3.5, carbs: 35.0, fat: 1.4 },
            { name: 'Bông cải xanh & Cà rốt luộc', weight_g: 150, calories: 62, protein: 2.0, carbs: 15.0, fat: 0.6 }
        ],
        health_tip: 'Điểm 10 cho bữa ăn chuẩn Gymer! Tỷ lệ Protein cực cao (46.5g), tinh bột hấp thu chậm (GI thấp) và rất ít chất béo xấu.'
    },
    {
        keywords: ['phở bò', 'phở tái', 'phở chín', 'phở tái nạm'],
        food_name: 'Phở bò tái nạm truyền thống',
        serving_size: '1 tô vừa (~550g cả nước dùng)',
        calories: 485,
        protein: 31.5,
        carbs: 58.0,
        fat: 13.5,
        items_detected: [
            { name: 'Bánh phở tươi', weight_g: 180, calories: 207, protein: 4.0, carbs: 46.8, fat: 0.5 },
            { name: 'Thịt bò tái & Nạm bò thái lát', weight_g: 100, calories: 195, protein: 25.5, carbs: 0.0, fat: 10.0 },
            { name: 'Nước dùng xương bò & Hành ngò, giá trụng', weight_g: 270, calories: 83, protein: 2.0, carbs: 11.2, fat: 3.0 }
        ],
        health_tip: 'Phở bò là bữa sáng giàu đạm và dễ tiêu hóa. Mẹo cho người tập gym: Hãy dặn quán "nước trong, không nước béo" và hạn chế húp hết nước lèo để tránh nạp dư muối (Natri) gây tích nước!'
    },
    {
        keywords: ['phở gà'],
        food_name: 'Phở gà ta (thịt đùi & lườn)',
        serving_size: '1 tô (~520g)',
        calories: 445,
        protein: 33.0,
        carbs: 55.0,
        fat: 9.8,
        items_detected: [
            { name: 'Bánh phở tươi', weight_g: 180, calories: 207, protein: 4.0, carbs: 46.8, fat: 0.5 },
            { name: 'Thịt gà ta xé phay', weight_g: 110, calories: 175, protein: 27.5, carbs: 0.0, fat: 7.0 },
            { name: 'Nước dùng gà thanh ngọt & Rau thơm', weight_g: 230, calories: 63, protein: 1.5, carbs: 8.2, fat: 2.3 }
        ],
        health_tip: 'Lựa chọn tuyệt vời với lượng đạm nạc cao và ít chất béo hơn các món nước hầm giò heo.'
    },
    {
        keywords: ['bún bò', 'bún bò huế'],
        food_name: 'Bún bò Huế giò nạm chả',
        serving_size: '1 tô đầy đủ (~600g)',
        calories: 580,
        protein: 35.0,
        carbs: 62.0,
        fat: 21.0,
        items_detected: [
            { name: 'Sợi bún bò to', weight_g: 200, calories: 220, protein: 3.6, carbs: 50.0, fat: 0.4 },
            { name: 'Bắp bò, nạm bò & Chả cua/chả lụa', weight_g: 120, calories: 250, protein: 29.0, carbs: 3.5, fat: 13.5 },
            { name: 'Nước dùng sả ớt sa tế & Rau sống', weight_g: 280, calories: 110, protein: 2.4, carbs: 8.5, fat: 7.1 }
        ],
        health_tip: 'Bún bò Huế giàu đạm nhưng lớp váng dầu điều và sa tế trên mặt nước lèo chứa khá nhiều calo. Hãy vớt bớt váng dầu và ăn nhiều bắp chuối, giá trụng!'
    },
    {
        keywords: ['bún thịt nướng', 'bún chả'],
        food_name: 'Bún thịt nướng chả giò',
        serving_size: '1 tô (~450g)',
        calories: 565,
        protein: 26.5,
        carbs: 68.0,
        fat: 20.5,
        items_detected: [
            { name: 'Bún tươi', weight_g: 180, calories: 198, protein: 3.2, carbs: 45.0, fat: 0.4 },
            { name: 'Thịt heo nướng sả & 1 cuốn chả giò', weight_g: 110, calories: 275, protein: 21.5, carbs: 9.0, fat: 16.5 },
            { name: 'Đậu phộng, mỡ hành, rau sống & Nước mắm', weight_g: 160, calories: 92, protein: 1.8, carbs: 14.0, fat: 3.6 }
        ],
        health_tip: 'Cẩn thận với chả giò chiên và đậu phộng + mỡ hành nếu bạn đang thâm hụt calo. Đổi chả giò sang thêm thịt nướng nạc sẽ tốt hơn cho cơ bắp!'
    },
    {
        keywords: ['bánh mì thịt', 'bánh mì pate', 'bánh mì chả', 'bánh mì ốp la', 'bánh mì'],
        food_name: 'Bánh mì thịt nguội chả lụa pate trứng',
        serving_size: '1 ổ đầy đủ (~230g)',
        calories: 475,
        protein: 21.5,
        carbs: 51.0,
        fat: 20.0,
        items_detected: [
            { name: 'Ổ bánh mì Việt Nam giòn', weight_g: 90, calories: 238, protein: 8.1, carbs: 44.1, fat: 2.9 },
            { name: 'Thịt nguội, chả lụa / Trứng ốp la', weight_g: 80, calories: 155, protein: 11.5, carbs: 2.0, fat: 11.0 },
            { name: 'Pate gan, sốt bơ trứng & Đồ chua dưa leo', weight_g: 60, calories: 82, protein: 1.9, carbs: 4.9, fat: 6.1 }
        ],
        health_tip: 'Nhanh gọn và đủ năng lượng trước buổi tập (Pre-workout). Nếu muốn giảm Fat, hãy dặn "ít bơ, ít pate" bạn nhé!'
    },
    {
        keywords: ['xôi mặn', 'xôi gà', 'xôi xéo'],
        food_name: 'Xôi mặn thập cẩm (Gà xé, chả lụa, lạp xưởng, trứng cút)',
        serving_size: '1 hộp/gói (~280g)',
        calories: 560,
        protein: 23.0,
        carbs: 72.0,
        fat: 19.5,
        items_detected: [
            { name: 'Xôi nếp dẻo', weight_g: 190, calories: 323, protein: 6.6, carbs: 70.3, fat: 1.5 },
            { name: 'Gà xé, chả lụa, lạp xưởng & Chà bông', weight_g: 75, calories: 195, protein: 16.0, carbs: 1.5, fat: 14.0 },
            { name: 'Mỡ hành, hành phi & Nước tương', weight_g: 15, calories: 42, protein: 0.4, carbs: 0.2, fat: 4.0 }
        ],
        health_tip: 'Gạo nếp cung cấp lượng tinh bột rất dồi dào giúp tập tạ khỏe, nhưng lạp xưởng và hành phi chứa nhiều dầu mỡ.'
    },
    {
        keywords: ['cá hồi', 'salmon'],
        food_name: 'Cá hồi áp chảo kèm khoai lang & Măng tây',
        serving_size: '1 đĩa (~380g)',
        calories: 495,
        protein: 37.5,
        carbs: 38.0,
        fat: 21.0,
        items_detected: [
            { name: 'Phi lê cá hồi áp chảo', weight_g: 150, calories: 312, protein: 33.8, carbs: 0.0, fat: 19.5 },
            { name: 'Khoai lang mật nướng/hấp', weight_g: 150, calories: 129, protein: 2.4, carbs: 30.1, fat: 0.2 },
            { name: 'Măng tây & Cà chua bi áp chảo', weight_g: 80, calories: 54, protein: 1.3, carbs: 7.9, fat: 1.3 }
        ],
        health_tip: 'Nguồn Omega-3 tự nhiên tuyệt hảo giúp giảm viêm cơ khớp sau các buổi tập nặng và hỗ trợ tim mạch!'
    }
];

/**
 * Hàm phân tích định lượng thông minh từ mô tả văn bản (ví dụ: "200g ức gà, 1 chén cơm trắng và 2 quả trứng luộc")
 */
function parseAndCalculateMealFromText(inputText = '') {
    const normalized = inputText.toLowerCase().trim();
    if (!normalized) return null;

    // Bước 1: Kiểm tra xem có khớp trực tiếp với các món ăn phức hợp truyền thống Việt Nam không
    for (const dish of VIETNAMESE_COMPOSITE_DISHES) {
        if (dish.keywords.some(kw => normalized.includes(kw))) {
            // Kiểm tra xem người dùng có ghi chú đặc biệt như "không mỡ", "thêm trứng", "ít cơm" không
            let cal = dish.calories;
            let pro = dish.protein;
            let carb = dish.carbs;
            let fat = dish.fat;
            const items = [...dish.items_detected];

            if (normalized.includes('ít cơm') || normalized.includes('nửa chén cơm')) {
                cal -= 110;
                carb -= 25;
            }
            if (normalized.includes('không mỡ') || normalized.includes('bỏ da') || normalized.includes('ít dầu')) {
                cal -= 80;
                fat = Math.max(3, fat - 9);
            }
            if (normalized.includes('thêm trứng') || normalized.includes('2 trứng')) {
                cal += 78;
                pro += 6.3;
                fat += 5.3;
                items.push({ name: 'Trứng thêm', weight_g: 50, calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 });
            }

            return {
                food_name: dish.food_name,
                serving_size: dish.serving_size,
                calories: Math.round(cal),
                protein: Math.round(pro * 10) / 10,
                carbs: Math.round(carb * 10) / 10,
                fat: Math.round(fat * 10) / 10,
                confidence: 95,
                items_detected: items,
                health_tip: dish.health_tip
            };
        }
    }

    // Bước 2: Phân tích từng thành phần nguyên liệu rời và định lượng gram / số lượng (ví dụ: "250g ức gà, 150g khoai lang, 2 quả trứng")
    const detectedItems = [];
    let totalCal = 0;
    let totalPro = 0;
    let totalCarb = 0;
    let totalFat = 0;
    let totalWeightG = 0;

    for (const [ingName, spec] of Object.entries(INGREDIENT_DENSITY_PER_100G)) {
        if (normalized.includes(ingName)) {
            // Tìm số gram đứng trước hoặc sau tên nguyên liệu (ví dụ: "200g ức gà" hoặc "ức gà 250g")
            const escaped = ingName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const gramBeforeRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:g|gram|gr)\\s*(?:thịt\\s+|cá\\s+|rau\\s+)?${escaped}`, 'i');
            const gramAfterRegex = new RegExp(`${escaped}\\s*(?:khoảng\\s*)?(\\d+(?:\\.\\d+)?)\\s*(?:g|gram|gr)`, 'i');
            const countBeforeRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:quả|trái|chén|bát|ổ|miếng|củ|muỗng|lát|đĩa|phần)\\s*${escaped}`, 'i');

            let weightG = spec.default_g;
            const matchBefore = normalized.match(gramBeforeRegex);
            const matchAfter = normalized.match(gramAfterRegex);
            const matchCount = normalized.match(countBeforeRegex);

            if (matchBefore) {
                weightG = parseFloat(matchBefore[1]);
            } else if (matchAfter) {
                weightG = parseFloat(matchAfter[1]);
            } else if (matchCount) {
                const count = parseFloat(matchCount[1]);
                // Nếu đơn vị là quả trứng (1 quả = 50g), còn lại nhân theo default_g
                if (ingName.includes('trứng')) {
                    weightG = count * 50;
                } else {
                    weightG = count * spec.default_g;
                }
            }

            const ratio = weightG / 100;
            const itemCal = Math.round(spec.cal * ratio);
            const itemPro = Math.round(spec.pro * ratio * 10) / 10;
            const itemCarb = Math.round(spec.carb * ratio * 10) / 10;
            const itemFat = Math.round(spec.fat * ratio * 10) / 10;

            detectedItems.push({
                name: ingName.charAt(0).toUpperCase() + ingName.slice(1),
                weight_g: Math.round(weightG),
                calories: itemCal,
                protein: itemPro,
                carbs: itemCarb,
                fat: itemFat
            });

            totalCal += itemCal;
            totalPro += itemPro;
            totalCarb += itemCarb;
            totalFat += itemFat;
            totalWeightG += weightG;
        }
    }

    if (detectedItems.length > 0) {
        const displayTitle = detectedItems.map(i => `${i.name} (${i.weight_g}g)`).join(' + ');
        return {
            food_name: displayTitle,
            serving_size: `Khẩu phần tổng hợp (~${Math.round(totalWeightG)}g)`,
            calories: Math.round(totalCal),
            protein: Math.round(totalPro * 10) / 10,
            carbs: Math.round(totalCarb * 10) / 10,
            fat: Math.round(totalFat * 10) / 10,
            confidence: 94,
            items_detected: detectedItems,
            health_tip: totalPro >= 30
                ? `Bữa ăn giàu đạm (${Math.round(totalPro)}g Protein), rất lý tưởng để tổng hợp cơ bắp sau tập (MPS)!`
                : `Khẩu phần cung cấp ${Math.round(totalCal)} kcal. Bạn có thể bổ sung thêm 100g ức gà, thịt nạc hoặc 2 quả trứng để nâng lượng Protein tối ưu hơn nhé!`
        };
    }

    return null;
}

/**
 * Dữ liệu huấn luyện chuẩn (System Prompt Reference) nhúng vào Gemini & Ollama để chống ảo giác (Hallucination) số liệu
 */
const VIETNAMESE_NUTRITION_SYSTEM_CONTEXT = `
[BẢNG CHUẨN ĐỊNH LƯỢNG DINH DƯỠNG VIỆT NAM (VIỆN DINH DƯỠNG QUỐC GIA - NIN & USDA)]:
1. Tinh bột chín (Carb Sources):
   - 1 chén cơm trắng vừa (150g chín): 195 kcal | 4.1g Protein | 42.3g Carbs | 0.4g Fat
   - 1 chén cơm gạo lứt (150g chín): 168 kcal | 3.9g Protein | 35.2g Carbs | 1.4g Fat
   - 1 đĩa cơm tấm (200g cơm): 270 kcal | 5.6g Protein | 59.0g Carbs | 0.8g Fat
   - 1 vắt bún tươi / bánh phở (180g): 200 kcal | 3.5g Protein | 46.0g Carbs | 0.4g Fat
   - 1 củ khoai lang luộc vừa (200g): 172 kcal | 3.2g Protein | 40.2g Carbs | 0.2g Fat
   - 1 ổ bánh mì không Việt Nam (90g): 238 kcal | 8.1g Protein | 44.1g Carbs | 2.9g Fat
2. Đạm động vật & thực vật (Protein Sources - Tính theo trọng lượng chín):
   - 100g ức gà phi lê chín (không da): 165 kcal | 31.0g Protein | 0g Carbs | 3.6g Fat
   - 150g ức gà áp chảo: 248 kcal | 46.5g Protein | 0g Carbs | 5.4g Fat
   - 100g thịt bò nạc chín (thăn/bắp): 215 kcal | 28.5g Protein | 0g Carbs | 10.5g Fat
   - 1 miếng sườn cốt lết heo nướng (110g): 285 kcal | 24.0g Protein | 5.0g Carbs | 18.0g Fat
   - 100g cá hồi áp chảo: 208 kcal | 22.5g Protein | 0g Carbs | 13.0g Fat
   - 1 quả trứng gà luộc (50g): 78 kcal | 6.3g Protein | 0.6g Carbs | 5.3g Fat
   - 1 quả trứng ốp la có dầu (60g): 96 kcal | 6.3g Protein | 0.6g Carbs | 7.5g Fat
   - 1 bìa đậu phụ / đậu hũ trắng (100g): 85 kcal | 9.0g Protein | 2.0g Carbs | 4.8g Fat
   - 1 muỗng Whey Protein Isolate (30g): 120 kcal | 25.0g Protein | 2.0g Carbs | 1.0g Fat
3. Món ăn hoàn chỉnh phổ biến:
   - Cơm tấm sườn nướng (1 đĩa): 615 kcal (31g P, 71g C, 21.5g F)
   - Cơm tấm sườn bì chả ốp la (1 đĩa): 785 kcal (41.5g P, 82g C, 31g F)
   - Phở bò tái nạm (1 tô vừa): 485 kcal (31.5g P, 58g C, 13.5g F)
   - Bún bò Huế đầy đủ (1 tô): 580 kcal (35g P, 62g C, 21g F)
   - Bánh mì thịt chả pate (1 ổ): 475 kcal (21.5g P, 51g C, 20g F)

QUY TẮC TÍNH TOÁN BẮT BUỘC:
- Tổng Calories PHẢI tuân thủ định luật nhiệt động lực học Atwater: Calories ≈ (Protein_g * 4) + (Carbs_g * 4) + (Fat_g * 9). Sai số không được vượt quá ±5%.
- Tuyệt đối không ước lượng cảm tính thiếu căn cứ. Phải bóc tách từng nguyên liệu trên đĩa, ước lượng số gram từng món rồi cộng tổng.
`;

module.exports = {
    INGREDIENT_DENSITY_PER_100G,
    VIETNAMESE_COMPOSITE_DISHES,
    VIETNAMESE_NUTRITION_SYSTEM_CONTEXT,
    parseAndCalculateMealFromText
};
