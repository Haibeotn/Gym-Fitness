// routes/nutritionRoutes.js
const express = require('express');
const router = express.Router();
const nutritionCtrl = require('../controllers/nutritionCtrl');

// Đường dẫn: POST /api/nutrition/calculate
router.post('/calculate', nutritionCtrl.getNutritionPlan);

module.exports = router;