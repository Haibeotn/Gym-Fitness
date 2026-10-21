// routes/workoutRoutes.js
const express = require('express');
const router = express.Router();
const workoutCtrl = require('../controllers/workoutCtrl');

// 1. Tạo lộ trình bài tập thông minh đa nhóm cơ & dụng cụ
router.post('/generate', workoutCtrl.getPersonalizedWorkout);

// 2. Tra cứu & Lọc thư viện bài tập
router.get('/library', workoutCtrl.getExerciseLibrary);

module.exports = router;