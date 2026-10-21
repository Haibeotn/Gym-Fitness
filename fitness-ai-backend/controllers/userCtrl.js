// controllers/userCtrl.js
const userService = require('../services/userService');

const saveProfile = async (req, res) => {
    const { userInfo, nutritionPlan, workoutPlan, aiAdvice, aiReasoning, userId } = req.body;

    try {
        const targetUserId = req.user?.id || userId || null;
        const result = await userService.saveUserOnboarding(
            userInfo,
            nutritionPlan,
            workoutPlan,
            aiAdvice,
            aiReasoning,
            targetUserId
        );

        res.status(200).json({
            status: "success",
            message: result.message,
            userId: result.userId,
            token: result.token,
            role: result.role
        });
    } catch (error) {
        console.error("Lỗi controller saveProfile:", error);
        res.status(500).json({ status: "error", message: "Không thể lưu dữ liệu hồ sơ." });
    }
};

const getLatestPlan = async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId || null;
        const plan = await userService.getLatestUserPlan(userId);
        if (!plan) {
            return res.status(404).json({ status: "error", message: "Chưa có dữ liệu nào." });
        }
        return res.status(200).json({ status: "success", data: plan });
    } catch (error) {
        console.error("Lỗi controller getLatestPlan:", error);
        return res.status(500).json({ status: "error", message: "Lỗi máy chủ khi lấy giáo án." });
    }
};

module.exports = { saveProfile, getLatestPlan };