// src/pages/Onboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateNutrition, generateWorkout, saveUserProfile } from '../services/api';
import AuthModal from '../components/AuthModal';
import ThemeToggle from '../components/ThemeToggle';
import { 
    Sparkles, Dumbbell, ShieldCheck, AlertCircle, 
    Activity, Flame, User, Check, Layers, ArrowRight, Zap, Target
} from 'lucide-react';

const MUSCLE_CHOICES = [
    { id: 'Chest', name: 'Ngực (Chest)', icon: '🛡️', sub: 'Ngực trên, giữa, dưới' },
    { id: 'Back', name: 'Lưng & Xô (Back & Lats)', icon: '🦅', sub: 'Độ rộng V-Taper & độ dày' },
    { id: 'Shoulders', name: 'Vai (Shoulders 3D)', icon: '🎯', sub: 'Vai trước, vai giữa, vai sau' },
    { id: 'Biceps', name: 'Tay Trước (Biceps)', icon: '💪', sub: 'Đỉnh bắp tay' },
    { id: 'Triceps', name: 'Tay Sau (Triceps)', icon: '⚡', sub: 'Hình móng ngựa 3 đầu' },
    { id: 'Quadriceps', name: 'Đùi Trước (Quads)', icon: '🦵', sub: 'Khối cơ đùi & Squat' },
    { id: 'Hamstrings', name: 'Đùi Sau (Hamstrings)', icon: '🍗', sub: 'Chuỗi cơ sau đùi' },
    { id: 'Glutes', name: 'Mông (Glutes)', icon: '🍑', sub: 'Nâng mông cao săn chắc' },
    { id: 'Core', name: 'Bụng & Core (Abs)', icon: '🔥', sub: '6 múi & cơ liên sườn' },
    { id: 'Full Body', name: 'Toàn Thân & HIIT', icon: '⚡', sub: 'Đốt mỡ toàn diện' }
];

const EQUIPMENT_CHOICES = [
    { id: 'Full Gym', name: 'Phòng Gym Đầy Đủ Thiết Bị', icon: '🏢' },
    { id: 'Bodyweight', name: 'Trọng Lượng Cơ Thể (Bodyweight)', icon: '🤸‍♂️' },
    { id: 'Dumbbell', name: 'Tạ Đơn (Dumbbells)', icon: '🏋️' },
    { id: 'Barbell', name: 'Tạ Đòn & Bánh Tạ (Barbell)', icon: '🏋️‍♂️' },
    { id: 'Cable Machine', name: 'Dàn Kéo Cáp (Cable)', icon: '🏗️' },
    { id: 'Resistance Bands', name: 'Dây Kháng Lực (Bands)', icon: '⚡' },
    { id: 'Pull-Up Bar', name: 'Xà Đơn & Xà Kép', icon: '🪜' },
    { id: 'Flat Bench', name: 'Ghế Tập Phẳng / Dốc', icon: '🛋️' },
    { id: 'Yoga Mat', name: 'Thảm Tập & Sàn', icon: '🧘' }
];

const COMMON_INJURIES = [
    'Không có chấn thương',
    'Đau lưng dưới',
    'Đau khớp vai',
    'Chấn thương đầu gối',
    'Đau cổ tay',
    'Cổ vai gáy'
];

export default function Onboarding() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        weight: 70,
        height: 170,
        age: 24,
        gender: 'male',
        activityLevel: 'sedentary',
        goal: 'Giảm mỡ',
    });

    const [step, setStep] = useState('welcome'); // 'welcome' | 'experience' | 'survey'
    const [experienceLevel, setExperienceLevel] = useState('amateur'); // 'amateur' | 'pro'
    const [transitionDirection, setTransitionDirection] = useState('forward'); // 'forward' | 'backward'

    const goToStep = (nextStep, direction = 'forward') => {
        setTransitionDirection(direction);
        setStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [selectedMuscles, setSelectedMuscles] = useState(['Chest', 'Triceps']);
    const [selectedEquipment, setSelectedEquipment] = useState(['Full Gym', 'Dumbbell', 'Barbell']);
    const [selectedInjuries, setSelectedInjuries] = useState(['Không có chấn thương']);
    const [customInjury, setCustomInjury] = useState('');

    const [loading, setLoading] = useState(false);
    const [skipLoading, setSkipLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('login');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Toggle Muscle selection
    const toggleMuscle = (id) => {
        if (selectedMuscles.includes(id)) {
            if (selectedMuscles.length > 1) {
                setSelectedMuscles(selectedMuscles.filter(m => m !== id));
            }
        } else {
            setSelectedMuscles([...selectedMuscles, id]);
        }
    };

    // Toggle Equipment selection
    const toggleEquipment = (id) => {
        if (id === 'Full Gym') {
            setSelectedEquipment(['Full Gym', 'Dumbbell', 'Barbell', 'Cable Machine', 'Flat Bench']);
            return;
        }

        let updated = selectedEquipment.filter(e => e !== 'Full Gym');
        if (updated.includes(id)) {
            if (updated.length > 1) {
                updated = updated.filter(e => e !== id);
            }
        } else {
            updated.push(id);
        }
        setSelectedEquipment(updated);
    };

    // Toggle Injury selection
    const toggleInjury = (inj) => {
        if (inj === 'Không có chấn thương') {
            setSelectedInjuries(['Không có chấn thương']);
            return;
        }

        let updated = selectedInjuries.filter(i => i !== 'Không có chấn thương');
        if (updated.includes(inj)) {
            updated = updated.filter(i => i !== inj);
            if (updated.length === 0) updated = ['Không có chấn thương'];
        } else {
            updated.push(inj);
        }
        setSelectedInjuries(updated);
    };

    // Preset routine quick selects
    const handlePreset = (type) => {
        if (type === 'push') {
            setSelectedMuscles(['Chest', 'Shoulders', 'Triceps']);
        } else if (type === 'pull') {
            setSelectedMuscles(['Back', 'Biceps']);
        } else if (type === 'legs') {
            setSelectedMuscles(['Quadriceps', 'Hamstrings', 'Glutes']);
        } else if (type === 'full') {
            setSelectedMuscles(['Chest', 'Back', 'Quadriceps', 'Core', 'Full Body']);
        } else if (type === 'home') {
            setSelectedMuscles(['Chest', 'Back', 'Core']);
            setSelectedEquipment(['Bodyweight', 'Dumbbell', 'Resistance Bands', 'Yoga Mat']);
        }
    };

    // Calculate live BMI
    const weightNum = parseFloat(formData.weight) || 70;
    const heightNum = parseFloat(formData.height) || 170;
    const heightM = heightNum / 100;
    const bmi = heightM > 0 ? (weightNum / (heightM * heightM)).toFixed(1) : 22.0;

    const getBmiStatus = (val) => {
        if (val < 18.5) return { text: 'Thiếu cân (Gầy)', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
        if (val < 23) return { text: 'Thể trạng lý tưởng (Chuẩn)', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
        if (val < 25) return { text: 'Tiền thừa cân nhẹ', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' };
        return { text: 'Thừa cân / Cần giảm mỡ', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
    };
    const bmiStatus = getBmiStatus(parseFloat(bmi));

    // Submit Survey to AI Engine
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const nutritionPayload = {
                weight: Number(formData.weight),
                height: Number(formData.height),
                age: Number(formData.age),
                gender: formData.gender,
                activityLevel: formData.activityLevel,
                goal: formData.goal,
            };

            const allInjuries = selectedInjuries.filter(i => i !== 'Không có chấn thương');
            if (customInjury.trim()) {
                allInjuries.push(customInjury.trim());
            }

            const workoutPayload = {
                targetMuscles: selectedMuscles,
                userInjuries: allInjuries,
                availableEquipment: selectedEquipment,
                shouldSaveToPlan: true
            };

            // 1. Gọi song song API AI
            const [nutritionRes, workoutRes] = await Promise.all([
                calculateNutrition(nutritionPayload),
                generateWorkout(workoutPayload),
            ]);

            // 2. Phân loại Khách (Guest) vs Đã đăng nhập (Member)
            const token = localStorage.getItem('fitness_token');
            const loggedInUserId = localStorage.getItem('fitness_user_id');

            if (token && loggedInUserId) {
                // Người dùng đã có tài khoản -> Lưu trực tiếp vào Database
                const savePayload = {
                    userInfo: nutritionPayload,
                    nutritionPlan: nutritionRes.data,
                    workoutPlan: workoutRes.data || [],
                    aiAdvice: workoutRes.ai_coach_advice,
                    aiReasoning: nutritionRes.data?.reasoning || null,
                    userId: loggedInUserId
                };
                await saveUserProfile(savePayload);
            } else {
                // Khách chưa đăng nhập -> Lưu tạm LocalStorage, KHÔNG tạo rác Database
                const guestPlan = {
                    weight: nutritionPayload.weight,
                    height: nutritionPayload.height,
                    age: nutritionPayload.age,
                    gender: nutritionPayload.gender,
                    goal: nutritionPayload.goal,
                    activity_level: nutritionPayload.activityLevel,
                    injuries: allInjuries,
                    target_calories: nutritionRes.data?.targetCalories || 2000,
                    nutrition_data: nutritionRes.data,
                    workout_data: workoutRes.data || [],
                    ai_advice: workoutRes.ai_coach_advice,
                    ai_reasoning: nutritionRes.data?.reasoning || null,
                    status: 'guest_preview'
                };
                localStorage.setItem('fitness_guest_plan', JSON.stringify(guestPlan));
                localStorage.setItem('fitness_role', 'guest');
                localStorage.removeItem('fitness_user_id');
                localStorage.removeItem('fitness_token');
            }

            navigate('/dashboard');
        } catch (err) {
            console.error("Lỗi Onboarding API:", err);
            const msg = err.response?.data?.message || err.message || 'Không thể kết nối đến máy chủ.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Top Skip Action (Bỏ qua khảo sát bằng lộ trình mẫu)
    const handleSkip = async () => {
        setSkipLoading(true);
        setError(null);

        try {
            const defaultNutritionPayload = {
                weight: 70,
                height: 172,
                age: 24,
                gender: 'male',
                activityLevel: 'moderate',
                goal: 'Giảm mỡ',
            };

            const defaultWorkoutPayload = {
                targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
                userInjuries: [],
                availableEquipment: ['Full Gym', 'Dumbbell', 'Barbell'],
                shouldSaveToPlan: true
            };

            const [nutritionRes, workoutRes] = await Promise.all([
                calculateNutrition(defaultNutritionPayload),
                generateWorkout(defaultWorkoutPayload),
            ]);

            const token = localStorage.getItem('fitness_token');
            const loggedInUserId = localStorage.getItem('fitness_user_id');

            if (token && loggedInUserId) {
                // Người dùng đã có tài khoản -> Cập nhật giáo án mẫu vào Database
                const savePayload = {
                    userInfo: defaultNutritionPayload,
                    nutritionPlan: nutritionRes.data,
                    workoutPlan: workoutRes.data || [],
                    aiAdvice: workoutRes.ai_coach_advice,
                    aiReasoning: nutritionRes.data?.reasoning || null,
                    userId: loggedInUserId
                };
                await saveUserProfile(savePayload);
            } else {
                // Khách bấm "Bỏ qua" -> Lưu tạm LocalStorage, KHÔNG tạo bản ghi rác trong Database!
                const guestPlan = {
                    weight: defaultNutritionPayload.weight,
                    height: defaultNutritionPayload.height,
                    age: defaultNutritionPayload.age,
                    gender: defaultNutritionPayload.gender,
                    goal: defaultNutritionPayload.goal,
                    activity_level: defaultNutritionPayload.activityLevel,
                    injuries: [],
                    target_calories: nutritionRes.data?.targetCalories || 2000,
                    nutrition_data: nutritionRes.data,
                    workout_data: workoutRes.data || [],
                    ai_advice: workoutRes.ai_coach_advice,
                    ai_reasoning: nutritionRes.data?.reasoning || null,
                    status: 'guest_preview'
                };
                localStorage.setItem('fitness_guest_plan', JSON.stringify(guestPlan));
                localStorage.setItem('fitness_role', 'guest');
                localStorage.removeItem('fitness_user_id');
                localStorage.removeItem('fitness_token');
            }

            navigate('/dashboard');
        } catch (err) {
            console.error("Lỗi khi bỏ qua khảo sát:", err);
            navigate('/dashboard');
        } finally {
            setSkipLoading(false);
        }
    };

    // ── 1. MÀN HÌNH CHÀO MỪNG (WELCOME SCREEN) ──
    if (step === 'welcome') {
        return (
            <div className={`relative min-h-screen flex flex-col justify-between text-white overflow-hidden font-sans ${transitionDirection === 'backward' ? 'animate-step-backward' : 'animate-step-forward'}`}>
                {/* Ảnh nền tập luyện cơ bắp mờ mờ đằng sau */}
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-105 filter blur-[2px] transition-transform duration-1000"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/95" />

                {/* Top Header: Logo & Actions */}
                <div className="relative z-10 max-w-6xl w-full mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
                    <div className="flex items-center gap-2 select-none">
                        <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white font-serif">
                            Thế Tài Fit<span className="text-[#ea4c89] text-3xl font-sans not-italic">.</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle variant="navbar" />
                        <button
                            onClick={handleSkip}
                            disabled={skipLoading}
                            className="hidden sm:inline-flex text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl transition cursor-pointer"
                        >
                            {skipLoading ? 'Đang tải...' : 'Bỏ qua (Khám phá nhanh) ⚡'}
                        </button>
                        <button
                            onClick={() => {
                                setAuthModalMode('login');
                                setShowAuthModal(true);
                            }}
                            className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>

                {/* Center Hero: Câu chào & Giới thiệu */}
                <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 text-center space-y-6 my-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-pink-300 shadow-xs">
                        <span>⚡</span>
                        <span>Hệ Thống Thể Hình &amp; Lộ Trình Cá Nhân Hóa</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                        Chào Mừng Đến Với <br />
                        <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                            Thế Tài Fit
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Hành trình bứt phá giới hạn thể hình của bạn bắt đầu từ đây. Khám phá lộ trình tập luyện cơ bắp khoa học, tối ưu hóa thực đơn dinh dưỡng và đồng hành cùng HLV thông minh.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => goToStep('experience', 'forward')}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ea4c89] via-pink-600 to-purple-600 hover:from-[#d83a78] hover:to-purple-700 text-white font-black text-base sm:text-lg rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-pink-500/25 cursor-pointer flex items-center justify-center gap-2.5"
                        >
                            <span>Bắt Đầu Ngay</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={skipLoading}
                            className="sm:hidden w-full text-xs font-semibold text-slate-300 bg-white/10 px-5 py-3 rounded-xl"
                        >
                            Bỏ qua (Khám phá nhanh) ⚡
                        </button>
                    </div>

                    <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">✓</span> Chuẩn Form Kỹ Thuật
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">✓</span> Macro Dinh Dưỡng Khoa Học
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">✓</span> Đồng Hành Cùng HLV 24/7
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 max-w-6xl w-full mx-auto px-6 py-6 text-center text-xs text-slate-500">
                    © 2026 Thế Tài Fit. Nâng tầm thể lực của bạn.
                </div>

                <AuthModal
                    isOpen={showAuthModal}
                    initialMode={authModalMode}
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={() => navigate('/dashboard')}
                />
            </div>
        );
    }

    // ── 2. MÀN HÌNH HỎI NGHIỆP DƯ HAY CHUYÊN NGHIỆP ──
    if (step === 'experience') {
        return (
            <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-8 font-sans transition-colors duration-200 ${transitionDirection === 'backward' ? 'animate-step-backward' : 'animate-step-forward'}`}>
                {/* Top header */}
                <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
                    <div className="flex items-center gap-2 select-none">
                        <span className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white font-serif">
                            Thế Tài Fit<span className="text-[#ea4c89] text-3xl font-sans not-italic">.</span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => goToStep('welcome', 'backward')}
                        className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                    >
                        <span>←</span>
                        <span>Quay lại trang chào mừng</span>
                    </button>
                </div>

                {/* Center Question */}
                <div className="max-w-2xl w-full mx-auto my-auto py-8 text-center space-y-8">
                    <div className="space-y-3">
                        <span className="px-3.5 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-pink-100 dark:bg-pink-950/60 text-[#ea4c89] border border-pink-200 dark:border-pink-900/50">
                            Bước 1 / 2 • Phân Loại Trình Độ
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Kinh Nghiệm Tập Gym Của Bạn?
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                            Lựa chọn trình độ để chúng tôi tinh chỉnh khối lượng tạ, hiệp tập và cường độ phù hợp nhất với cơ thể bạn.
                        </p>
                    </div>

                    {/* 2 Lựa chọn chính: Nghiệp Dư vs Chuyên Nghiệp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                        {/* Lựa chọn 1: Nghiệp Dư */}
                        <div
                            onClick={() => {
                                setExperienceLevel('amateur');
                                setFormData(prev => ({ ...prev, activityLevel: 'light' }));
                                goToStep('survey', 'forward');
                            }}
                            className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-[#ea4c89] dark:hover:border-[#ea4c89] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-6 transform hover:-translate-y-1"
                        >
                            <div className="space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-2xl flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                                    🔰
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-[#ea4c89] transition">
                                    Nghiệp Dư / Mới Tập
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Chưa tập hoặc tập dưới 6 tháng. Cần học kỹ thuật form chuẩn, lộ trình thích nghi cơ bắp an toàn, tránh chấn thương và mệt mỏi quá mức.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#ea4c89]">
                                <span>Tiếp tục với cấp độ này</span>
                                <span className="group-hover:translate-x-1.5 transition">➔</span>
                            </div>
                        </div>

                        {/* Lựa chọn 2: Chuyên Nghiệp */}
                        <div
                            onClick={() => {
                                setExperienceLevel('pro');
                                setFormData(prev => ({ ...prev, activityLevel: 'heavy' }));
                                goToStep('survey', 'forward');
                            }}
                            className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-[#ea4c89] dark:hover:border-[#ea4c89] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-6 transform hover:-translate-y-1"
                        >
                            <div className="space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-2xl flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                                    🏆
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-[#ea4c89] transition">
                                    Chuyên Nghiệp / Nâng Cao
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Kinh nghiệm trên 1 năm. Muốn tối ưu hóa kích thích cơ bắp tối đa (Hypertrophy), nâng cao sức mạnh (1RM), superset, drop set và siết nét.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#ea4c89]">
                                <span>Tiếp tục với cấp độ này</span>
                                <span className="group-hover:translate-x-1.5 transition">➔</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-400">
                        Cấp độ này sẽ được tự động áp dụng vào thuật toán tạo giáo án tập luyện của bạn.
                    </div>
                </div>

                <div className="max-w-4xl w-full mx-auto text-center text-xs text-slate-400 py-4">
                    © 2026 Thế Tài Fit
                </div>
            </div>
        );
    }

    // ── 3. MÀN HÌNH ĐIỀN THÔNG TIN KHẢO SÁT CHI TIẾT ──
    return (
        <div className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans ${transitionDirection === 'backward' ? 'animate-step-backward' : 'animate-step-forward'}`}>
            
            {/* Top Bar Actions */}
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs transition">
                <div className="flex items-center gap-3 select-none">
                    <button
                        type="button"
                        onClick={() => goToStep('experience', 'backward')}
                        className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                        <span>←</span>
                        <span>Quay lại</span>
                    </button>
                    <span className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white font-serif">
                        Thế Tài Fit<span className="text-[#ea4c89] text-2xl font-sans not-italic">.</span>
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border hidden sm:inline-flex items-center gap-1 ${
                        experienceLevel === 'pro'
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                        {experienceLevel === 'pro' ? '🏆 Chuyên nghiệp' : '🔰 Nghiệp dư'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    <button
                        type="button"
                        onClick={handleSkip}
                        disabled={skipLoading || loading}
                        className="hidden md:inline-flex text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                        {skipLoading ? 'Đang tạo...' : 'Bỏ qua ⚡'}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => {
                            setAuthModalMode('login');
                            setShowAuthModal(true);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>

            {/* Modal Xác thực */}
            <AuthModal
                isOpen={showAuthModal}
                initialMode={authModalMode}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    navigate('/dashboard');
                }}
            />

            {/* Header Tiêu Đề */}
            <header className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    Khảo Sát Thể Trạng &amp; Thiết Kế Lộ Trình AI
                </h1>
                <p className="text-sm text-gray-600 dark:text-slate-400 max-w-xl mx-auto">
                    Điền các thông số cơ thể cốt lõi. Hệ thống sẽ tự động tính BMR/TDEE, phân tích thể trạng và tạo kế hoạch luyện tập an toàn.
                </p>
            </header>

            {/* Form Onboarding Nâng Cấp */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-6 transition">
                
                {/* 1. THÔNG SỐ CƠ BẢN (Cân nặng, Chiều cao, Tuổi) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">CÂN NẶNG (KG)</label>
                        <input 
                            type="number" 
                            name="weight" 
                            value={formData.weight} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold text-gray-800 dark:text-slate-100 text-sm transition" 
                            required 
                            min="30"
                            max="250"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">CHIỀU CAO (CM)</label>
                        <input 
                            type="number" 
                            name="height" 
                            value={formData.height} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold text-gray-800 dark:text-slate-100 text-sm transition" 
                            required 
                            min="100"
                            max="230"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">TUỔI</label>
                        <input 
                            type="number" 
                            name="age" 
                            value={formData.age} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold text-gray-800 dark:text-slate-100 text-sm transition" 
                            required 
                            min="12"
                            max="90"
                        />
                    </div>
                </div>

                {/* Live BMI Quick Strip */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-950/80 rounded-2xl border border-gray-200/80 dark:border-slate-800 text-xs transition">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                        <span className="text-gray-600 dark:text-slate-400">Chỉ số thể hình dự tính:</span>
                        <strong className="text-gray-900 dark:text-white font-mono font-bold">BMI {bmi}</strong>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg font-bold border text-[11px] ${bmiStatus.color}`}>
                        {bmiStatus.text}
                    </span>
                </div>

                {/* 2. GIỚI TÍNH, MỨC ĐỘ VẬN ĐỘNG & MỤC TIÊU */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">GIỚI TÍNH</label>
                        <select 
                            name="gender" 
                            value={formData.gender} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 dark:text-slate-200 text-sm transition"
                        >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">MỨC ĐỘ VẬN ĐỘNG</label>
                        <select 
                            name="activityLevel" 
                            value={formData.activityLevel} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 dark:text-slate-200 text-sm transition"
                        >
                            <option value="sedentary">Ít vận động (Văn phòng)</option>
                            <option value="light">Vận động nhẹ (1-3 ngày/tuần)</option>
                            <option value="moderate">Vận động vừa (3-5 ngày/tuần)</option>
                            <option value="active">Năng động (6-7 ngày/tuần)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">MỤC TIÊU THỂ HÌNH</label>
                        <select 
                            name="goal" 
                            value={formData.goal} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700 dark:text-blue-300 text-sm transition"
                        >
                            <option value="Giảm mỡ">Giảm mỡ (Fat Loss)</option>
                            <option value="Tăng cơ">Tăng cơ (Muscle Gain)</option>
                            <option value="Duy trì">Duy trì (Maintenance)</option>
                        </select>
                    </div>
                </div>

                {/* 3. CHỌN NHÓM CƠ MUỐN TẬP (INTERACTIVE CARDS & PRESETS) */}
                <div className="space-y-3 border-t border-gray-100 dark:border-slate-800 pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <label className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                                NHÓM CƠ MUỐN TẬP HÔM NAY ({selectedMuscles.length} nhóm cơ đã chọn):
                            </label>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Nhấp để chọn 1 hoặc nhiều nhóm cơ muốn AI lên phác đồ</p>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-semibold">
                            <button
                                type="button"
                                onClick={() => handlePreset('push')}
                                className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer"
                            >
                                Đẩy (Push)
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePreset('pull')}
                                className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer"
                            >
                                Kéo (Pull)
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePreset('legs')}
                                className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer"
                            >
                                Chân (Legs)
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePreset('full')}
                                className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer"
                            >
                                Toàn Thân
                            </button>
                        </div>
                    </div>

                    {/* Muscle Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {MUSCLE_CHOICES.map(muscle => {
                            const isSelected = selectedMuscles.includes(muscle.id);
                            return (
                                <div
                                    key={muscle.id}
                                    onClick={() => toggleMuscle(muscle.id)}
                                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center gap-2 ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border-blue-500 dark:border-cyan-500 ring-2 ring-blue-400 dark:ring-cyan-500 shadow-xs'
                                            : 'bg-gray-50/80 dark:bg-slate-950/70 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-xl shrink-0">{muscle.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900 dark:text-cyan-300' : 'text-gray-700 dark:text-slate-300'}`}>
                                            {muscle.name}
                                        </p>
                                    </div>
                                    {isSelected && <span className="text-blue-600 dark:text-cyan-400 font-bold text-xs">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. DỤNG CỤ HIỆN CÓ (SELECTABLE CHIPS) */}
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-5">
                    <label className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Dumbbell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        DỤNG CỤ HIỆN CÓ (Chọn những trang thiết bị bạn có thể dùng):
                    </label>

                    <div className="flex flex-wrap gap-2 pt-1">
                        {EQUIPMENT_CHOICES.map(eq => {
                            const isSelected = selectedEquipment.includes(eq.id);
                            return (
                                <button
                                    key={eq.id}
                                    type="button"
                                    onClick={() => toggleEquipment(eq.id)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                        isSelected
                                            ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 border-slate-900 dark:border-cyan-500 shadow-xs'
                                            : 'bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span>{eq.icon}</span>
                                    <span>{eq.name}</span>
                                    {isSelected && <span className="text-cyan-400 dark:text-slate-950 text-xs">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 5. CHẤN THƯƠNG / GIỚI HẠN VẬN ĐỘNG */}
                <div className="space-y-3 border-t border-gray-100 dark:border-slate-800 pt-5">
                    <label className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        CHẤN THƯƠNG / GIỚI HẠN VẬN ĐỘNG (AI sẽ tự động loại bỏ các bài tập nguy hiểm):
                    </label>

                    <div className="flex flex-wrap gap-2">
                        {COMMON_INJURIES.map(inj => {
                            const isSelected = selectedInjuries.includes(inj);
                            return (
                                <button
                                    key={inj}
                                    type="button"
                                    onClick={() => toggleInjury(inj)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                        isSelected
                                            ? inj === 'Không có chấn thương'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                            : 'bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {inj} {isSelected && '✓'}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom injury input */}
                    <input 
                        type="text" 
                        value={customInjury} 
                        onChange={(e) => setCustomInjury(e.target.value)} 
                        placeholder="Hoặc nhập chấn thương khác (VD: Thoát vị L4-L5, Kẹt khớp vai...)" 
                        className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-xs text-gray-800 dark:text-slate-100" 
                    />
                </div>

                {/* 6. NÚT SUBMIT */}
                <div className="pt-3">
                    <button 
                        type="submit" 
                        disabled={loading || skipLoading} 
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-blue-500/20 hover:shadow-xl disabled:bg-gray-400 cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang Tính Toán BMR/TDEE &amp; Lập Trình Lộ Trình AI...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 text-cyan-300" />
                                <span>Phân Tích Thể Trạng Bằng AI 🚀</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium rounded-2xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}