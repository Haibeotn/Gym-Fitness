// controllers/nutritionCtrl.js
const nutritionService = require('../services/nutritionService');

const getNutritionPlan = (req, res) => {
    const { weight, height, age, gender, activityLevel, goal } = req.body;

    // Validation cơ bản
    if (!weight || !height || !age || !gender || !goal) {
        return res.status(400).json({
            status: "error",
            message: "Vui lòng cung cấp đủ: cân nặng, chiều cao, tuổi, giới tính và mục tiêu."
        });
    }

    try {
        const plan = nutritionService.generateNutritionPlan({
            weight, height, age, gender, activityLevel, goal
        });

        res.status(200).json({
            status: "success",
            message: "Đã tính toán xong chỉ số dinh dưỡng!",
            data: plan
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

module.exports = { getNutritionPlan };