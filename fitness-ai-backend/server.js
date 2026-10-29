// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');
const workoutRoutes = require('./routes/workoutRoutes'); // MỚI THÊM: Import file routes
const nutritionRoutes = require('./routes/nutritionRoutes'); // IMPORT THÊM
const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

app.get('/', (req, res) => {
    res.json({
        status: "success",
        message: "💪 Chào mừng đến với API Thể hình AI! Trái tim hệ thống đang đập rất khỏe."
    });
});

// MỚI THÊM: Gắn Router vào đường dẫn gốc /api/workouts
app.use('/api/workouts', workoutRoutes);

// IMPORT & GẮN ROUTE MỚI
app.use('/api/nutrition', nutritionRoutes);

// Nối router xử lý dữ liệu người dùng
app.use('/api/users', userRoutes);

app.use('/api/auth', authRoutes);

// Route Quản lý Gói tập (Session-based & Auto-assign PT)
const packageRoutes = require('./routes/packageRoutes');
app.use('/api/packages', packageRoutes);

// Route PT Portal & Workspace (PT > AI Approval Flow)
const ptRoutes = require('./routes/ptRoutes');
app.use('/api/pt', ptRoutes);

// Route Đặt lịch tập 1-1 với PT & Lịch trống (Booking & Scheduling)
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Route Admin Management & Analytics (RBAC Protected)
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Route Nhật ký tập luyện thực tế & Tiến độ thể hình (Live Tracking & Progress)
const workoutLogRoutes = require('./routes/workoutLogRoutes');
app.use('/api/workouts', workoutLogRoutes);

// Route Nhật ký dinh dưỡng & Theo dõi Macro hàng ngày (Meal & Macro Tracking)
const mealRoutes = require('./routes/mealRoutes');
const { smartFoodVisionHandler } = require('./controllers/smartFoodVisionCtrl');
app.post('/api/meals/analyze-image', smartFoodVisionHandler);
app.use('/api/meals', mealRoutes);

// Route Trao đổi trực tiếp 1-1 Học viên & PT (In-App Chat)
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Route Tổng hợp giọng nói Tiếng Việt Tự Nhiên (Natural Voice TTS)
const ttsRoutes = require('./routes/ttsRoutes');
app.use('/api/tts', ttsRoutes);

// Route Hồ Sơ Cá Nhân (Personal Profile CRUD)
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profile', profileRoutes);

// Route Bảng xếp hạng & Danh hiệu (Leaderboard & Gamification)
const leaderboardRoutes = require('./routes/leaderboardRoutes');
app.use('/api/leaderboard', leaderboardRoutes);

// Route Cổng thanh toán VietQR & MoMo (Payment Gateway & Billing)
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);



const PORT = process.env.PORT || 3000;



// === FAST MICRO-RAG & ANTI-HALLUCINATION ROUTES ===
const { ragContextHandler, ragChatHandler, ragAdjustWorkoutHandler } = require('./controllers/ragChatCtrl');
app.post('/api/rag-context', ragContextHandler);
app.post('/api/rag-chat', ragChatHandler);
app.post('/api/rag-adjust-workout', ragAdjustWorkoutHandler);
const { visionFoodScanHandler } = require('./controllers/visionFoodScanCtrl');
app.post('/api/vision-food-scan', visionFoodScanHandler);
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống đang bơm máu tại cổng (port) ${PORT}... Sẵn sàng luyện tập!`);
});

