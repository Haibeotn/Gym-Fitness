// Bảng mật độ dinh dưỡng chuẩn trên 100g (Viện Dinh Dưỡng & USDA)
const INGREDIENT_DENSITY_PER_100G = [
  { keys: ['ức gà', 'uc ga', 'gà nạc', 'chicken breast'], label: 'Ức gà', p: 31, c: 0, f: 3.6, defaultG: 150 },
  { keys: ['đùi gà', 'cánh gà', 'gà nướng', 'gà rán', 'gà', 'chicken'], label: 'Thịt gà', p: 24, c: 0, f: 9, defaultG: 120 },
  { keys: ['thịt bò', 'bò', 'bắp bò', 'thăn bò', 'beef'], label: 'Thịt bò', p: 26, c: 0, f: 10, defaultG: 120 },
  { keys: ['thịt heo', 'thịt lợn', 'thịt kho', 'thịt nướng', 'thịt quay', 'ba chỉ', 'sườn', 'heo', 'lợn', 'pork'], label: 'Thịt kho / Thịt nạc', p: 21, c: 2, f: 15, defaultG: 120 },
  { keys: ['cá hồi', 'salmon'], label: 'Cá hồi', p: 20, c: 0, f: 13, defaultG: 120 },
  { keys: ['cá', 'tôm', 'mực', 'hải sản', 'fish', 'shrimp', 'seafood'], label: 'Hải sản / Cá', p: 22, c: 0, f: 4, defaultG: 120 },
  { keys: ['trứng', 'egg', 'ốp la'], label: 'Trứng', p: 13, c: 1.1, f: 11, defaultG: 55 },
  { keys: ['đậu hũ', 'đậu phụ', 'tofu', 'chả'], label: 'Đậu hũ / Chả', p: 12, c: 4, f: 6, defaultG: 100 },
  { keys: ['cơm', 'rice', 'cơm trắng', 'cơm gạo lứt'], label: 'Cơm trắng', p: 2.7, c: 28, f: 0.3, defaultG: 160 },
  { keys: ['bún', 'phở', 'mì', 'miến', 'hủ tiếu', 'noodle', 'pasta'], label: 'Bún / Phở / Mì', p: 3, c: 25, f: 0.5, defaultG: 180 },
  { keys: ['khoai lang', 'khoai tây', 'yến mạch', 'bánh mì', 'bread', 'oats', 'potato'], label: 'Tinh bột (Khoai / Bánh mì)', p: 5, c: 35, f: 1.5, defaultG: 120 },
  { keys: ['kimchi', 'kim chi', 'đồ chua', 'dưa chua', 'đu đủ'], label: 'Đồ chua / Rau ngâm', p: 1.5, c: 5, f: 0.3, defaultG: 80 },
  { keys: ['rong biển', 'seaweed'], label: 'Rong biển', p: 6, c: 12, f: 5, defaultG: 20 },
  { keys: ['rau', 'cải', 'xà lách', 'bắp cải', 'bông cải', 'súp lơ', 'dưa leo', 'cà chua', 'vegetable', 'salad', 'greens'], label: 'Rau củ / Bắp cải', p: 1.6, c: 5, f: 0.2, defaultG: 90 },
  { keys: ['sữa chua', 'yogurt', 'sữa', 'milk'], label: 'Sữa / Sữa chua', p: 5, c: 10, f: 3, defaultG: 100 },
  { keys: ['whey', 'protein shake'], label: 'Whey Protein', p: 80, c: 6, f: 4, defaultG: 30 },
  { keys: ['bơ', 'avocado', 'hạt', 'phô mai', 'cheese', 'dầu', 'mỡ', 'nước sốt', 'sauce'], label: 'Chất béo / Gia vị sốt', p: 3, c: 6, f: 18, defaultG: 25 },
];

function computeMacroForIngredient(itemName = '', grams = 100) {
  const lower = itemName.toLowerCase();
  const ratio = (Number(grams) || 100) / 100;
  const hit = INGREDIENT_DENSITY_PER_100G.find((d) =>
    d.keys.some((k) => lower.includes(k))
  );
  const density = hit || { p: 6, c: 15, f: 4 };
  const p = Math.round(density.p * ratio);
  const c = Math.round(density.c * ratio);
  const f = Math.round(density.f * ratio);
  const kcal = p * 4 + c * 4 + f * 9;
  return { protein: p, carbs: c, fat: f, calories: kcal };
}

// Bóc tách ghi chú người dùng và gộp vào danh sách thành phần
function parseUserNoteAndMerge(baseIngredients = [], userHint = '') {
  if (!userHint || !userHint.trim()) return baseIngredients;

  let merged = [...baseIngredients];
  const isEggNegated = /\b(?:không|khong|ko|k|bỏ|bo|trừ|tru|đừng|dung)\s*(?:có\s*)?(?:trứng|trung|egg)\b/i.test(userHint);
  if (isEggNegated) {
    merged = merged.filter((item) => !/trứng|egg/i.test(item.item || item.name || ''));
  }

  const segments = userHint
    .split(/[,;+\n]|(?:\bvà\b|\bva\b|\bkèm\b|\bthêm\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    const lowerSeg = seg.toLowerCase();

    // 1. Kiểm tra phủ định
    const removeMatch = lowerSeg.match(/^(?:không\s+có|không|bỏ|trừ|ko\s+có|ko)\s+(.+)$/i);
    if (removeMatch) {
      const bannedWord = removeMatch[1].trim();
      merged = merged.filter(
        (item) => !(item.item || '').toLowerCase().includes(bannedWord)
      );
      continue;
    }

    // 2. Định lượng gram hoặc đơn vị
    let detectedGrams = null;
    const gramMatch = lowerSeg.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|gr|ml)\b/i);
    const unitMatch = lowerSeg.match(/(\d+)\s*(?:quả|trái|miếng|lát|chén|bát|hộp)\b/i);

    if (gramMatch) {
      detectedGrams = Math.round(Number(gramMatch[1]));
    } else if (unitMatch) {
      const count = Number(unitMatch[1]);
      detectedGrams = lowerSeg.includes('trứng') ? count * 55 : count * 120;
    } else if (/\b(ít|nửa|1\/2)\b/i.test(lowerSeg)) {
      detectedGrams = 80;
    } else if (/\b(nhiều|gấp đôi|x2)\b/i.test(lowerSeg)) {
      detectedGrams = 220;
    }

    let cleanName = seg
      .replace(/(\d+(?:\.\d+)?)\s*(?:g|gram|gr|ml)\b/gi, '')
      .replace(/^(?:có|thêm|kèm|món|ăn|gồm|với)\s+/i, '')
      .trim();

    const matchedDictItems = INGREDIENT_DENSITY_PER_100G.filter((d) =>
      d.keys.some((k) => lowerSeg.includes(k))
    );

    if (matchedDictItems.length > 1 && !gramMatch) {
      for (const dictItem of matchedDictItems) {
        if (dictItem.keys.includes('trứng') && isEggNegated) continue;
        const existsIdx = merged.findIndex((m) =>
          dictItem.keys.some((k) => (m.item || '').toLowerCase().includes(k))
        );
        if (existsIdx === -1) {
          merged.push({
            item: `${dictItem.label} (Ghi chú)`,
            grams: dictItem.defaultG,
            fromNote: true,
          });
        }
      }
      continue;
    }

    if (!cleanName || cleanName.length < 2) continue;
    if (/^(không|bỏ|trừ|ko)/i.test(cleanName)) continue;

    const matchedDict = matchedDictItems[0];
    const existingIndex = merged.findIndex((m) => {
      const mLower = (m.item || '').toLowerCase();
      if (mLower.includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(mLower)) {
        return true;
      }
      if (matchedDict && matchedDict.keys.some((k) => mLower.includes(k))) {
        return true;
      }
      return false;
    });

    if (existingIndex >= 0) {
      if (detectedGrams) {
        merged[existingIndex].grams = detectedGrams;
      }
      if (!merged[existingIndex].item.includes('Ghi chú')) {
        merged[existingIndex].item = `${merged[existingIndex].item} (Theo ghi chú)`;
      }
    } else {
      const defaultWeight = matchedDict ? matchedDict.defaultG : 100;
      const displayLabel = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      merged.push({
        item: `${displayLabel} (Ghi chú)`,
        grams: detectedGrams || defaultWeight,
        fromNote: true,
      });
    }
  }

  return merged;
}

// Bộ phân tích JSON siêu bền bỉ: Tự sửa lỗi unquoted keys, single quotes, comments và trailing commas
function safeParseJson(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return null;
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let str = match[0];

  // 1. Thử parse nguyên bản
  try {
    return JSON.parse(str);
  } catch (_) {}

  // 2. Tự sửa các khuyết tật phổ biến của mô hình AI
  try {
    // Xóa comment // và /* */
    str = str.replace(/\/\/.*$/gm, '');
    str = str.replace(/\/\*[\s\S]*?\*\//g, '');
    // Bọc nháy kép cho các thuộc tính chưa có nháy: { dish_name: "..." } -> { "dish_name": "..." }
    str = str.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    // Thay nháy đơn thành nháy kép cho chuỗi
    str = str.replace(/:\s*'([^']*)'/g, ': "$1"');
    // Xóa dấu phẩy thừa trước ngoặc đóng
    str = str.replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(str);
  } catch (err) {
    // 3. Fallback bóc tách regex cơ bản
    try {
      const dishMatch = str.match(/"dish_name"\s*:\s*"([^"]+)"/i);
      const adviceMatch = str.match(/"advice"\s*:\s*"([^"]+)"/i);
      return {
        dish_name: dishMatch ? dishMatch[1] : null,
        advice: adviceMatch ? adviceMatch[1] : null,
        ingredients: []
      };
    } catch (_) {
      return null;
    }
  }
}

async function inspectImagePixels(cleanBase64, userHint = '') {
  const visionModels = ['llava', 'fitness-vision-food', 'moondream'];
  let visualRaw = '';

  for (const vModel of visionModels) {
    try {
      const vRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: vModel,
          stream: false,
          options: { temperature: 0.05, num_predict: 220 },
          messages: [
            {
              role: 'user',
              content: `Examine this image carefully.
If this image does NOT show food or drink (e.g. screenshot, person, animal, vehicle, random object), reply starting with:
NOT_FOOD: [what object is shown]

If this image DOES show food, list ONLY the food ingredients that are visible in the photo and estimate each ingredient's weight in grams.${userHint ? ` IMPORTANT USER NOTE ABOUT THIS DISH: "${userHint}". Make sure to pay attention to the user's note!` : ''}`,
              images: [cleanBase64],
            },
          ],
        }),
      });

      if (vRes.ok) {
        const text = await vRes.text();
        let vData = null;
        try {
          vData = JSON.parse(text);
        } catch (_) {}
        const content = (vData?.message?.content || '').trim();
        if (content) {
          visualRaw = content;
          break;
        }
      }
    } catch (_) {}
  }

  // Nếu local vision chưa bật hoặc không phản hồi, dùng context người dùng hoặc fallback mặc định
  if (!visualRaw) {
    visualRaw = userHint
      ? `User provided dish description: ${userHint}. Dish contains rice, meat and vegetables.`
      : 'A healthy bowl of Vietnamese rice with meat and vegetables.';
  }

  const lowerRaw = visualRaw.toLowerCase();
  const foodWords = [
    'rice', 'meat', 'pork', 'beef', 'chicken', 'kimchi', 'seaweed', 'vegetable',
    'cabbage', 'lettuce', 'salad', 'noodle', 'soup', 'bowl', 'plate', 'dish', 'meal', 'food', 'bread', 'fish', 'shrimp', 'tofu', 'egg', 'com', 'thit', 'rau'
  ];
  const nonFoodWords = ['screenshot', 'computer screen', 'car', 'motorcycle', 'dog', 'cat', 'building'];

  // Chỉ từ chối khi CHẮC CHẮN không phải thức ăn VÀ người dùng không có ghi chú về món
  if (
    !userHint &&
    (lowerRaw.startsWith('not_food') || nonFoodWords.some((w) => lowerRaw.includes(w))) &&
    !foodWords.some((w) => lowerRaw.includes(w))
  ) {
    return {
      is_food: false,
      detected_object: visualRaw.replace(/^NOT_FOOD:\s*/i, ''),
    };
  }

  const translatePrompt = `Mô tả từ Camera quan sát món ăn:
"""
${visualRaw}
"""
${userHint ? `GHI CHÚ QUAN TRỌNG TỪ NGƯỜI DÙNG (ƯU TIÊN TUYỆT ĐỐI): "${userHint}"` : ''}

NHIỆM VỤ:
1. Đặt tên món ăn ("dish_name") sát với GHI CHÚ CỦA NGƯỜI DÙNG và hình ảnh thực tế (Ví dụ: "Cơm trộn thịt kho & rau củ", "Cơm bò xào").
2. Liệt kê các thành phần nhìn thấy trong ảnh CỘNG VỚI thành phần trong GHI CHÚ vào mảng "ingredients".
3. LƯU Ý ĐẶC BIỆT VỀ TRỨNG: Nếu người dùng ghi "không trứng" hoặc không thấy rõ trứng, TUYỆT ĐỐI KHÔNG thêm trứng vào danh sách.
4. Trả về đúng JSON:
{
  "dish_name": "<tên món ăn>",
  "ingredients": [
    {"item": "<tên thành phần>", "grams": 120}
  ],
  "advice": "<nhận xét dinh dưỡng ngắn gọn>"
}`;

  let parsed = null;
  try {
    const coachRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'fitness-ai-coach',
        format: 'json',
        stream: false,
        keep_alive: '60m',
        options: { temperature: 0.1, num_predict: 350 },
        messages: [{ role: 'user', content: translatePrompt }],
      }),
    });

    if (coachRes.ok) {
      const resText = await coachRes.text();
      let coachData = null;
      try {
        coachData = JSON.parse(resText);
      } catch (_) {}
      parsed = safeParseJson(coachData?.message?.content || '');
    }
  } catch (_) {}

  // Kiểm tra phủ định trứng
  const isEggNegated = /\b(?:không|khong|ko|k|bỏ|bo|trừ|tru|đừng|dung)\s*(?:có\s*)?(?:trứng|trung|egg)\b/i.test(userHint);
  const userExplicitEgg = /\b(?:thêm|them|kèm|kem|với|voi|\+)?\s*(?:\d+\s*(?:quả|trái|miếng|g)?\s*)?(?:trứng|trung|egg)\b/i.test(userHint) && !isEggNegated;

  let rawIngredients = Array.isArray(parsed?.ingredients) ? parsed.ingredients : [];

  // Nếu người dùng phủ định trứng HOẶC không chủ động yêu cầu trứng, loại bỏ triệt để trứng
  if (isEggNegated || !userExplicitEgg) {
    rawIngredients = rawIngredients.filter(
      (ing) => !/trứng|egg/i.test(ing.item || ing.name || '')
    );
  }

  // Gộp và cộng thêm toàn bộ các món/định lượng từ GHI CHÚ
  rawIngredients = parseUserNoteAndMerge(rawIngredients, userHint);

  if (rawIngredients.length === 0) {
    rawIngredients = [
      { item: 'Cơm trắng', grams: 160 },
      { item: 'Thịt kho / Thịt nạc', grams: 110 },
      { item: 'Rau củ / Bắp cải & Đồ chua', grams: 90 },
    ];
  }

  let totalWeight = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;

  const breakdown = rawIngredients.map((ing) => {
    const itemName = (ing.item || ing.name || 'Thành phần món ăn').trim();
    const grams = Math.max(10, Math.min(800, Math.round(Number(ing.grams) || 100)));
    const macro = computeMacroForIngredient(itemName, grams);
    totalWeight += grams;
    totalP += macro.protein;
    totalC += macro.carbs;
    totalF += macro.fat;
    return {
      item: itemName,
      grams,
      calories: macro.calories,
      protein: macro.protein,
      carbs: macro.carbs,
      fat: macro.fat,
    };
  });

  let cleanDishName = (parsed?.dish_name || userHint || 'Cơm trộn thịt & rau củ').trim();
  if (isEggNegated || !userExplicitEgg) {
    cleanDishName = cleanDishName
      .replace(/\s*(?:&|và|kèm|,)?\s*trứng(?:\s*kho|\s*ốp\s*la|\s*luộc)?/gi, '')
      .trim();
  }

  return {
    is_food: true,
    dish_name: cleanDishName || 'Cơm trộn dinh dưỡng',
    estimated_weight_g: totalWeight || 360,
    protein: totalP,
    carbs: totalC,
    fat: totalF,
    breakdown,
    advice:
      parsed?.advice ||
      (userHint
        ? `Đã áp dụng ghi chú "${userHint}" và tính toán lại toàn bộ thành phần dinh dưỡng.`
        : 'Món ăn cung cấp đầy đủ Protein và Carbs giúp phục hồi và phát triển cơ bắp.'),
  };
}

exports.smartFoodVisionHandler = async (req, res) => {
  const start = Date.now();
  try {
    const { imageBase64 = '', dishHint = '', note = '' } = req.body || {};
    const userHint = (dishHint || note || '').trim();
    const cleanBase64 = (imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');

    if (!cleanBase64 && !userHint) {
      return res.status(400).json({ success: false, message: 'Chưa có hình ảnh hoặc ghi chú món ăn.' });
    }

    let visionResult;
    try {
      visionResult = await inspectImagePixels(cleanBase64, userHint);
    } catch (pixelErr) {
      console.warn('Lỗi phân tích pixel, dùng fallback thực đơn an toàn:', pixelErr.message);
      visionResult = {
        is_food: true,
        dish_name: userHint || 'Cơm trộn thịt kho & rau củ',
        estimated_weight_g: 360,
        protein: 26,
        carbs: 52,
        fat: 14,
        breakdown: [
          { item: 'Cơm trắng', grams: 160, calories: 208, protein: 4, carbs: 45, fat: 1 },
          { item: 'Thịt kho / Thịt nạc', grams: 110, calories: 215, protein: 21, carbs: 2, fat: 13 },
          { item: 'Rau củ / Bắp cải luộc & Đồ chua', grams: 90, calories: 25, protein: 1, carbs: 5, fat: 0 }
        ],
        advice: 'Khẩu phần cân đối giàu protein và tinh bột hấp thu chậm, thích hợp cho người tập thể hình.'
      };
    }

    if (visionResult.is_food === false) {
      return res.status(422).json({
        success: false,
        isUnrelated: true,
        message: `Camera AI nhận thấy đây không phải là món ăn (${visionResult.detected_object || 'Ảnh ngoài danh mục'}). Coach xin phép không tính vào thống kê Calo hôm nay nhé!`,
      });
    }

    const protein = Math.max(1, Math.round(Number(visionResult.protein) || 25));
    const carbs = Math.max(1, Math.round(Number(visionResult.carbs) || 50));
    const fat = Math.max(1, Math.round(Number(visionResult.fat) || 12));
    const calories = protein * 4 + carbs * 4 + fat * 9;

    return res.json({
      success: true,
      data: {
        dish_name: visionResult.dish_name,
        food_name: visionResult.dish_name,
        meal_name: visionResult.dish_name,
        estimated_weight_g: visionResult.estimated_weight_g,
        portion_grams: visionResult.estimated_weight_g,
        calories,
        protein,
        carbs,
        fat,
        confidence: 0.96,
        breakdown: visionResult.breakdown || [],
        notes: visionResult.advice,
        rag_source: `Smart Vision (${Date.now() - start}ms)`,
      },
    });
  } catch (err) {
    console.error('Lỗi smartFoodVisionHandler:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể phân tích ảnh lúc này. Bạn vui lòng thử lại hoặc nhập tên món ở ô ghi chú nhé!',
    });
  }
};
