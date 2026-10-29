const express = require('express');
const router = express.Router();
const mealCtrl = require('../controllers/mealCtrl');
const { verifyToken } = require('../middleware/authMiddleware');

// Gợi ý món ăn (công khai hoặc đăng nhập đều xem được)
router.get('/suggestions', mealCtrl.getFoodSuggestions);

// AI Vision Food Scanner: Phân tích ảnh món ăn bóc tách Calo & Macro
router.post('/analyze-image', mealCtrl.analyzeFoodImage);

// Bắt buộc xác thực học viên
router.use(verifyToken);

router.get('/daily', mealCtrl.getDailyMeals);
router.get('/', mealCtrl.getDailyMeals);
router.post('/logs', mealCtrl.addMealLog);
router.post('/', mealCtrl.addMealLog);
router.delete('/logs/:id', mealCtrl.deleteMealLog);
router.get('/history', mealCtrl.getMealHistory);

module.exports = router;
