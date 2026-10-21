// services/nutritionService.js

/**
 * Tính BMR (Basal Metabolic Rate) - Năng lượng duy trì sự sống cơ bản
 * Áp dụng công thức Mifflin-St Jeor
 */
const calculateBMR = (weight, height, age, gender) => {
    // weight: kg, height: cm, age: năm
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);

    if (gender === 'male') {
        return bmr + 5;
    } else {
        return bmr - 161;
    }
};

/**
 * Tính TDEE (Total Daily Energy Expenditure) - Năng lượng tiêu hao thực tế
 */
const calculateTDEE = (bmr, activityLevel) => {
    const multipliers = {
        'sedentary': 1.2,       // Ít vận động (Dân văn phòng, không tập thể dục)
        'light': 1.375,         // Vận động nhẹ (Tập 1-3 ngày/tuần)
        'moderate': 1.55,       // Vận động vừa (Tập 3-5 ngày/tuần)
        'active': 1.725,        // Vận động nhiều (Tập 6-7 ngày/tuần)
        'very_active': 1.9      // Vận động cường độ cao (VĐV, lao động chân tay)
    };
    // Mặc định là ít vận động nếu không truyền vào
    const multiplier = multipliers[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
};

/**
 * Thuật toán tự động chia Macro (Protein, Carb, Fat)
 */
const calculateMacros = (weight, tdee, goal) => {
    // 1. Điều chỉnh Calo theo mục tiêu (Cắt mỡ / Tăng cơ)
    let targetCalories = tdee;
    if (goal === 'Giảm mỡ') {
        targetCalories -= 500; // Thâm hụt 500 calo để giảm ~0.5kg/tuần
    } else if (goal === 'Tăng cơ') {
        targetCalories += 300; // Dư thừa 300 calo để tăng cơ hạn chế mỡ (Lean bulk)
    }

    // Tối thiểu không được ăn dưới 1200 calo (Safety flag)
    if (targetCalories < 1200) targetCalories = 1200;

    // 2. Chia Macro theo quy tắc của PT:
    // - Protein: 2.2g / kg thể trọng (Để giữ cơ khi giảm mỡ hoặc xây cơ khi tăng cân)
    // - Fat (Chất béo): 25% tổng lượng Calo mục tiêu (Tốt cho hormone)
    // - Carb (Tinh bột): Phần Calo còn lại

    const proteinGrams = Math.round(weight * 2.2);
    const proteinCalories = proteinGrams * 4; // 1g Protein = 4 calo

    const fatCalories = targetCalories * 0.25;
    const fatGrams = Math.round(fatCalories / 9); // 1g Fat = 9 calo

    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4); // 1g Carb = 4 calo

    return {
        targetCalories: Math.round(targetCalories),
        macros: {
            protein: proteinGrams,
            fat: fatGrams,
            carb: carbGrams
        }
    };
};

const generateNutritionPlan = (user) => {
    const { weight, height, age, gender, activityLevel, goal } = user;

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const nutrition = calculateMacros(weight, tdee, goal);

    const deficitOrSurplus = goal === 'Giảm mỡ' ? -500 : (goal === 'Tăng cơ' ? 300 : 0);

    const reasoning = {
        formula: "Mifflin-St Jeor (Độ chính xác cao nhất cho thể hình hiện đại)",
        bmr_explanation: `Chỉ số trao đổi chất cơ bản (BMR) = ${Math.round(bmr)} kcal: Năng lượng tối thiểu để duy trì cơ thể sống khi nằm yên hoàn toàn.`,
        tdee_explanation: `Tổng năng lượng tiêu hao hàng ngày (TDEE) = ${tdee} kcal: Tính từ BMR nhân với hệ số vận động (${activityLevel || 'sedentary'}).`,
        calorie_strategy: goal === 'Giảm mỡ' 
            ? `Thâm hụt năng lượng an toàn 500 kcal/ngày so với TDEE (${tdee} -> ${nutrition.targetCalories} kcal) để giảm ~0.5kg mỡ/tuần mà không mất cơ.`
            : (goal === 'Tăng cơ' 
                ? `Thặng dư vừa phải 300 kcal/ngày (Lean Bulk: ${tdee} -> ${nutrition.targetCalories} kcal) nhằm tối ưu tổng hợp cơ bắp mà hạn chế tích mỡ thừa.`
                : `Duy trì calo tương đương TDEE (${tdee} kcal) để giữ ổn định cân nặng và tái cấu trúc cơ thể.`),
        macro_breakdown: {
            protein: `Protein (${nutrition.macros.protein}g): Đặt ở mức 2.2g/kg thể trọng để tối đa hóa phục hồi và bảo vệ mô cơ.`,
            fat: `Chất béo (${nutrition.macros.fat}g): Chiếm 25% tổng năng lượng để duy trì hormone testosterone và hấp thu vitamin tan trong dầu.`,
            carb: `Tinh bột (${nutrition.macros.carb}g): Chiếm phần năng lượng còn lại để nạp đầy glycogen cho các buổi tập cường độ cao.`
        }
    };

    return {
        bmr: Math.round(bmr),
        tdee: tdee,
        goal: goal,
        daily_targets: nutrition,
        reasoning: reasoning
    };
};

module.exports = { generateNutritionPlan };