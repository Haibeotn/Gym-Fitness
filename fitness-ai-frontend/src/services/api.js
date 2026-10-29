// src/services/api.js
import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:3000/api', // Bắt buộc phải có http://localhost:3000/api khi chạy localhost
    headers: {
        'Content-Type': 'application/json',
    },
})

// Tự động đính kèm JWT Token vào Header của mọi Request nếu có
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('fitness_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const registerUser = async (data) => {
    const response = await API.post('/auth/register', data);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await API.post('/auth/login', data);
    return response.data;
};

export const fetchMe = async () => {
    const response = await API.get('/auth/me');
    return response.data;
};

export const fetchLatestPlan = async (userId = null) => {
    const response = await API.get('/users/latest-plan', {
        params: userId ? { userId } : {}
    });
    return response.data;
};

// Hàm gọi API tạo lịch tập
export const generateWorkout = async (payload) => {
    const response = await API.post('/workouts/generate', payload);
    return response.data;
};

// Hàm tra cứu thư viện bài tập và lọc theo nhóm cơ / dụng cụ
export const fetchExerciseLibrary = async (params = {}) => {
    const response = await API.get('/workouts/library', { params });
    return response.data;
};

// Hàm gọi API tính toán dinh dưỡng (BMR, TDEE, Macros)
export const calculateNutrition = async (payload) => {
    const response = await API.post('/nutrition/calculate', payload);
    return response.data;
};

/**
 * Gửi yêu cầu lưu trữ hồ sơ người dùng và lộ trình vào Database
 * @param {Object} payload { userInfo, nutritionPlan, workoutPlan, aiAdvice, aiReasoning, userId }
 */
export const saveUserProfile = async (payload) => {
    const response = await API.post('/users/save-profile', payload);
    return response.data;
};

export const authGoogle = async (data) => {
    const response = await API.post('/auth/google', data);
    return response.data;
};

export const sendPhoneOtp = async (data) => {
    const response = await API.post('/auth/phone/send-otp', data);
    return response.data;
};

export const verifyPhoneOtp = async (data) => {
    const response = await API.post('/auth/phone/verify-otp', data);
    return response.data;
};

// ==================== PACKAGES & SESSIONS ====================
export const fetchPackages = async () => {
    const response = await API.get('/packages');
    return response.data;
};

export const purchasePackage = async (payload) => {
    const response = await API.post('/packages/purchase', payload);
    return response.data;
};

export const submitExperienceReview = async (payload) => {
    const response = await API.post('/packages/review', payload);
    return response.data;
};

export const fetchMyCurrentPackage = async (userId = null) => {
    const response = await API.get('/packages/my-package', {
        params: userId ? { userId } : {}
    });
    return response.data;
};

// ==================== PT WORKSPACE ====================
export const fetchPtClients = async () => {
    const response = await API.get('/pt/clients');
    return response.data;
};

export const fetchPtClientPlan = async (clientId) => {
    const response = await API.get(`/pt/clients/${clientId}`);
    return response.data;
};

export const approvePtClientPlan = async (clientId, payload) => {
    const response = await API.put(`/pt/clients/${clientId}/approve`, payload);
    return response.data;
};

export const deductPtClientSession = async (clientId, payload = {}) => {
    const response = await API.post(`/pt/clients/${clientId}/deduct-session`, payload);
    return response.data;
};

export const expelPtClient = async (clientId) => {
    const response = await API.delete(`/pt/clients/${clientId}`);
    return response.data;
};

export const addPtClientExercise = async (clientId, payload) => {
    const response = await API.post(`/pt/clients/${clientId}/add-exercise`, payload);
    return response.data;
};

// ==================== BOOKING & SCHEDULING ====================
export const fetchTrainersList = async () => {
    const response = await API.get('/bookings/trainers');
    return response.data;
};

export const fetchTrainerAvailability = async (trainerId, date) => {
    const response = await API.get('/bookings/availability', {
        params: { trainerId, date }
    });
    return response.data;
};

export const createBooking = async (payload) => {
    const response = await API.post('/bookings', payload);
    return response.data;
};

export const fetchMyBookings = async () => {
    const response = await API.get('/bookings/my-bookings');
    return response.data;
};

export const updateBookingStatus = async (bookingId, payload) => {
    const response = await API.put(`/bookings/${bookingId}/status`, payload);
    return response.data;
};

export const checkInBooking = async (payload) => {
    const response = await API.post('/bookings/check-in', payload);
    return response.data;
};

export const reviewBooking = async (bookingId, payload) => {
    const response = await API.post(`/bookings/${bookingId}/review`, payload);
    return response.data;
};

// ==================== ADMIN MANAGEMENT ====================
export const fetchAdminStats = async () => {
    const response = await API.get('/admin/stats');
    return response.data;
};

export const fetchAdminTrainers = async () => {
    const response = await API.get('/admin/trainers');
    return response.data;
};

export const createAdminTrainer = async (payload) => {
    const response = await API.post('/admin/trainers', payload);
    return response.data;
};

export const toggleAdminTrainerStatus = async (trainerId) => {
    const response = await API.put(`/admin/trainers/${trainerId}/toggle`);
    return response.data;
};

export const fetchAdminExercises = async (params = {}) => {
    const response = await API.get('/admin/exercises', { params });
    return response.data;
};

export const createAdminExercise = async (payload) => {
    const response = await API.post('/admin/exercises', payload);
    return response.data;
};

export const deleteAdminExercise = async (id) => {
    const response = await API.delete(`/admin/exercises/${id}`);
    return response.data;
};

// ==================== WORKOUT LOGS & PROGRESS ====================
export const saveWorkoutLog = async (payload) => {
    const response = await API.post('/workouts/logs', payload);
    return response.data;
};

export const fetchWorkoutHistory = async () => {
    const response = await API.get('/workouts/logs/history');
    return response.data;
};

export const logWeightProgress = async (payload) => {
    const response = await API.post('/workouts/progress/weight', payload);
    return response.data;
};

export const fetchProgressAnalytics = async () => {
    const response = await API.get('/workouts/progress/analytics');
    return response.data;
};

// ==================== DAILY NUTRITION & MEAL TRACKING ====================
export const fetchFoodSuggestions = async (search = '') => {
    const response = await API.get('/meals/suggestions', {
        params: { search }
    });
    return response.data;
};

export const fetchDailyMeals = async (date) => {
    let targetDate = date;
    if (!targetDate) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        targetDate = `${yyyy}-${mm}-${dd}`;
    }
    const response = await API.get('/meals/daily', {
        params: { date: targetDate }
    });
    return response.data;
};

export const addMealLog = async (payload) => {
    const response = await API.post('/meals/logs', payload);
    return response.data;
};

export const deleteMealLog = async (mealId) => {
    const response = await API.delete(`/meals/logs/${mealId}`);
    return response.data;
};

export const fetchMealHistory = async (days = 7) => {
    const response = await API.get('/meals/history', {
        params: { days }
    });
    return response.data;
};

export const analyzeFoodImage = async (payload) => {
    const response = await API.post('/meals/analyze-image', payload);
    return response.data;
};

// ==================== IN-APP CHAT & COACHING ====================
export const fetchConversations = async () => {
    const response = await API.get('/chat/conversations');
    return response.data;
};

export const fetchMessages = async (partnerId) => {
    const response = await API.get(`/chat/messages/${partnerId}`);
    return response.data;
};

export const sendMessage = async (payload) => {
    const response = await API.post('/chat/messages', payload);
    return response.data;
};

export const fetchUnreadCount = async () => {
    const response = await API.get('/chat/unread-count');
    return response.data;
};

export const askLocalAiCoach = async (prompt, history = [], options = {}) => {
    const response = await API.post('/chat/local-coach', {
        prompt,
        history,
        assistantType: options.assistantType,
        clientContext: options.clientContext
    });
    return response.data;
};

// ==================== GAMIFICATION & LEADERBOARD ====================
export const fetchLeaderboard = async () => {
    const response = await API.get('/leaderboard');
    return response.data;
};

// ==================== VIETQR & MOMO PAYMENT GATEWAY ====================
export const createPaymentOrder = async (payload) => {
    const response = await API.post('/payments/create-order', payload);
    return response.data;
};

export const verifyPaymentOrder = async (transactionCode) => {
    const response = await API.post(`/payments/verify/${transactionCode}`);
    return response.data;
};

export const fetchMyPaymentHistory = async () => {
    const response = await API.get('/payments/my-history');
    return response.data;
};

export const cancelPaymentOrder = async (transactionCode) => {
    const response = await API.put(`/payments/${transactionCode}/cancel`);
    return response.data;
};

export const fetchAdminPayments = async () => {
    const response = await API.get('/payments/admin/all');
    return response.data;
};

export const fetchAdminMemberships = async () => {
    const response = await API.get('/admin/memberships');
    return response.data;
};

export const fetchAdminPurchaseHistory = async () => {
    const response = await API.get('/admin/purchase-history');
    return response.data;
};

// ==================== PROGRESS REPORT & CERTIFICATE ====================
export const fetchProgressReport = async (userId = null) => {
    const response = await API.get('/workouts/progress/report', {
        params: userId ? { userId } : {}
    });
    return response.data;
};

// ==================== HỒ SƠ CÁ NHÂN (Personal Profile) ====================
export const fetchMyPersonalProfile = async () => {
    const response = await API.get('/profile/me');
    return response.data;
};

export const updateMyPersonalProfile = async (payload) => {
    const response = await API.put('/profile/me', payload);
    return response.data;
};

export const clearProfileField = async (field) => {
    const response = await API.delete(`/profile/me/field/${field}`);
    return response.data;
};

export default API;
