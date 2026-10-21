import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLatestPlan, registerUser, fetchMe, fetchMyCurrentPackage, fetchMyBookings, updateBookingStatus, fetchDailyMeals, fetchUnreadCount } from '../services/api';
import AuthModal from '../components/AuthModal';
import PackageModal from '../components/PackageModal';
import BookingModal from '../components/BookingModal';
import ReviewModal from '../components/ReviewModal';
import LiveWorkoutModal from '../components/LiveWorkoutModal';
import ProgressAnalyticsModal from '../components/ProgressAnalyticsModal';
import MealTrackerModal from '../components/MealTrackerModal';
import ChatModal from '../components/ChatModal';
import LeaderboardModal from '../components/LeaderboardModal';
import ProgressReportModal from '../components/ProgressReportModal';
import WorkoutStudioGenerator, { getMuscleTagStyle } from '../components/WorkoutStudioGenerator';
import ExerciseLibraryModal from '../components/ExerciseLibraryModal';
import ProfileModal from '../components/ProfileModal';
import { saveUserProfile } from '../services/api';
import audioCoach from '../services/audioCoach';
import { getMemberTierInfo } from '../utils/tierBadge';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(!!localStorage.getItem('fitness_token'));
    const [userRole, setUserRole] = useState(localStorage.getItem('fitness_role') || 'guest');
    const [currentUser, setCurrentUser] = useState(null);
    const [userPackage, setUserPackage] = useState(null);
    const [myBookings, setMyBookings] = useState([]);
    const [todayMealTotals, setTodayMealTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const [showReasoningModal, setShowReasoningModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('register');
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showLiveWorkoutModal, setShowLiveWorkoutModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showMealTrackerModal, setShowMealTrackerModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCategory, setSearchCategory] = useState('all');
    const [showPromoBanner, setShowPromoBanner] = useState(true);
    const [openNavDropdown, setOpenNavDropdown] = useState(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    useEffect(() => {
        const storedRole = localStorage.getItem('fitness_role');
        if (storedRole === 'pt') {
            navigate('/pt');
            return;
        } else if (storedRole === 'admin') {
            navigate('/admin');
            return;
        }
        loadData();

        // Polling tin nhắn chưa đọc từ Huấn luyện viên PT
        const unreadInterval = setInterval(async () => {
            if (localStorage.getItem('fitness_token')) {
                try {
                    const unreadRes = await fetchUnreadCount();
                    if (unreadRes?.unreadCount !== undefined) {
                        setUnreadChatCount(unreadRes.unreadCount);
                    }
                } catch (e) {}
            }
        }, 5000);

        return () => clearInterval(unreadInterval);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            let activeUserId = localStorage.getItem('fitness_user_id');

            if (localStorage.getItem('fitness_token')) {
                try {
                    const meRes = await fetchMe();
                    if (meRes?.user) {
                        setCurrentUser(meRes.user);
                        setUserRole(meRes.user.role || 'member');
                        activeUserId = meRes.user.id;
                        localStorage.setItem('fitness_user_id', meRes.user.id);

                        if (meRes.user.role === 'pt') {
                            navigate('/pt');
                            return;
                        } else if (meRes.user.role === 'admin') {
                            navigate('/admin');
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Không thể lấy profile user:", e);
                }
            }

            // Lấy giáo án của user hoặc khách
            if (localStorage.getItem('fitness_token') && activeUserId) {
                try {
                    const result = await fetchLatestPlan(activeUserId);
                    if (result?.data) {
                        setData(result.data);
                    }
                } catch (e) {
                    console.warn("Chưa có plan hoặc lỗi lấy plan:", e);
                }
            } else {
                // Chế độ Khách (Guest) - Đọc trực tiếp từ LocalStorage, hoàn toàn không phụ thuộc Database
                const guestPlanStr = localStorage.getItem('fitness_guest_plan');
                if (guestPlanStr) {
                    try {
                        const parsed = JSON.parse(guestPlanStr);
                        setData(parsed);
                    } catch (err) {
                        console.warn("Lỗi parse guest plan:", err);
                    }
                } else if (activeUserId) {
                    try {
                        const result = await fetchLatestPlan(activeUserId);
                        if (result?.data) setData(result.data);
                    } catch (e) {}
                }
            }

            // Lấy gói tập hiện tại của user
            if (localStorage.getItem('fitness_token')) {
                try {
                    const pkgRes = await fetchMyCurrentPackage();
                    const pkg = pkgRes?.userPackage || pkgRes?.currentPackage;
                    if (pkg) {
                        setUserPackage(pkg);
                        if (pkg.needs_review) {
                            setShowReviewModal(true);
                        }
                    } else {
                        setUserPackage(null);
                    }
                } catch (e) {
                    console.warn("Không thể lấy gói tập:", e);
                }

                // Lấy danh sách booking
                try {
                    const bookRes = await fetchMyBookings();
                    if (bookRes?.bookings) {
                        setMyBookings(bookRes.bookings);
                    }
                } catch (e) {
                    console.warn("Không thể lấy lịch tập:", e);
                }

                // Lấy thống kê bữa ăn hôm nay
                try {
                    const mealRes = await fetchDailyMeals();
                    if (mealRes?.totals) {
                        setTodayMealTotals(mealRes.totals);
                    }
                } catch (e) {
                    console.warn("Không thể lấy bữa ăn:", e);
                }

                // Lấy số lượng tin nhắn chưa đọc
                try {
                    const unreadRes = await fetchUnreadCount();
                    if (unreadRes?.unreadCount !== undefined) {
                        setUnreadChatCount(unreadRes.unreadCount);
                    }
                } catch (e) {
                    console.warn("Không thể lấy tin nhắn chưa đọc:", e);
                }
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('fitness_token');
        localStorage.removeItem('fitness_user_id');
        localStorage.removeItem('fitness_role');
        setIsRegistered(false);
        setUserRole('guest');
        setCurrentUser(null);
        setUserPackage(null);
        setMyBookings([]);
        navigate('/');
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy lịch buổi tập này?')) return;
        try {
            await updateBookingStatus(bookingId, { status: 'cancelled', cancelReason: 'Học viên hủy lịch' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể hủy lịch.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-slate-50">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-700 font-semibold text-base">Đang tải lộ trình thể hình...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6 text-center bg-slate-50">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                    📋
                </div>
                <h2 className="text-xl font-bold text-gray-800">Chưa có dữ liệu lộ trình</h2>
                <p className="text-gray-500 text-sm max-w-md">Vui lòng hoàn thành khảo sát hoặc chọn Khám phá nhanh để AI thiết lập lộ trình cho bạn.</p>
                <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-sm">
                    Khảo sát ngay
                </button>
            </div>
        );
    }

    // 1. Parse Dữ liệu Dinh dưỡng
    let nutrition = {};
    try {
        nutrition = typeof data.nutrition_data === 'string'
            ? JSON.parse(data.nutrition_data)
            : (data.nutrition_data || {});
        if (nutrition.data && typeof nutrition.data === 'object') nutrition = { ...nutrition, ...nutrition.data };
        if (nutrition.nutritionPlan && typeof nutrition.nutritionPlan === 'object') nutrition = { ...nutrition, ...nutrition.nutritionPlan };
    } catch (e) {
        console.error("Lỗi parse dinh dưỡng:", e);
    }

    const dailyTargets = nutrition.daily_targets || nutrition.dailyTargets || nutrition;
    const macros = dailyTargets.macros || nutrition.macros || nutrition;

    const calories = dailyTargets.targetCalories || dailyTargets.calories || nutrition.targetCalories || nutrition.calories || data.target_calories || 2000;

    const rawProtein = macros.protein ?? macros.protein_g ?? macros.target_protein ?? nutrition.protein ?? nutrition.protein_g ?? dailyTargets.protein;
    const protein = (rawProtein !== undefined && rawProtein !== null && rawProtein !== '---')
        ? String(rawProtein).replace(/[^0-9.]/g, '')
        : Math.round((parseFloat(data.weight) || 70) * 2.2);

    const rawCarb = macros.carb ?? macros.carbs ?? macros.carb_g ?? macros.carbs_g ?? macros.target_carbs ?? nutrition.carb ?? nutrition.carbs ?? dailyTargets.carb;
    const carbs = (rawCarb !== undefined && rawCarb !== null && rawCarb !== '---')
        ? String(rawCarb).replace(/[^0-9.]/g, '')
        : 250;

    const rawFat = macros.fat ?? macros.fat_g ?? macros.target_fat ?? nutrition.fat ?? nutrition.fat_g ?? dailyTargets.fat;
    const fat = (rawFat !== undefined && rawFat !== null && rawFat !== '---')
        ? String(rawFat).replace(/[^0-9.]/g, '')
        : Math.round(((parseFloat(calories) || 2000) * 0.25) / 9);


    // 2. Parse Dữ liệu AI Reasoning
    let aiReasoning = null;
    try {
        if (data.ai_reasoning) {
            aiReasoning = typeof data.ai_reasoning === 'string' ? JSON.parse(data.ai_reasoning) : data.ai_reasoning;
        } else if (nutrition.reasoning) {
            aiReasoning = nutrition.reasoning;
        }
    } catch (e) {
        console.error("Lỗi parse reasoning:", e);
    }

    // 3. Parse Danh sách bài tập
    let exercises = [];
    try {
        const rawWorkout = typeof data.workout_data === 'string'
            ? JSON.parse(data.workout_data)
            : data.workout_data;
        exercises = Array.isArray(rawWorkout) ? rawWorkout : (rawWorkout?.data || []);
    } catch (e) {
        console.error("Lỗi parse bài tập:", e);
    }

    const handleWorkoutGenerated = (newExercises, coachAdvice) => {
        setData(prev => {
            const updated = {
                ...prev,
                workout_data: newExercises,
                ai_advice: coachAdvice || prev?.ai_advice
            };
            const storedGuest = localStorage.getItem('fitness_guest_plan');
            if (storedGuest) {
                try {
                    const parsed = JSON.parse(storedGuest);
                    parsed.workout_data = newExercises;
                    if (coachAdvice) parsed.ai_advice = coachAdvice;
                    localStorage.setItem('fitness_guest_plan', JSON.stringify(parsed));
                } catch (e) {}
            }
            return updated;
        });
    };

    const handleAddExerciseFromLibrary = async (newEx) => {
        const updatedExercises = [...exercises, newEx];
        setData(prev => ({
            ...prev,
            workout_data: updatedExercises
        }));

        const activeId = currentUser?.id || localStorage.getItem('fitness_user_id');
        const token = localStorage.getItem('fitness_token');

        if (token && activeId) {
            try {
                await saveUserProfile({
                    userInfo: currentUser || data,
                    workoutPlan: updatedExercises,
                    nutritionPlan: nutrition,
                    aiAdvice: data?.ai_advice,
                    userId: activeId
                });
            } catch (err) {
                console.warn("Lỗi lưu plan khi thêm bài:", err);
            }
        } else {
            // Guest mode -> Lưu vào LocalStorage
            const storedGuest = localStorage.getItem('fitness_guest_plan');
            if (storedGuest) {
                try {
                    const parsed = JSON.parse(storedGuest);
                    parsed.workout_data = updatedExercises;
                    localStorage.setItem('fitness_guest_plan', JSON.stringify(parsed));
                } catch (e) {}
            }
        }
    };

    const handleRemoveExercise = async (indexToRemove) => {
        if (!window.confirm("Bạn có muốn xóa bài tập này khỏi danh sách hôm nay?")) return;
        const updatedExercises = exercises.filter((_, idx) => idx !== indexToRemove);
        setData(prev => ({
            ...prev,
            workout_data: updatedExercises
        }));

        const activeId = currentUser?.id || localStorage.getItem('fitness_user_id');
        const token = localStorage.getItem('fitness_token');

        if (token && activeId) {
            try {
                await saveUserProfile({
                    userInfo: currentUser || data,
                    workoutPlan: updatedExercises,
                    nutritionPlan: nutrition,
                    aiAdvice: data?.ai_advice,
                    userId: activeId
                });
            } catch (err) {
                console.warn("Lỗi lưu plan khi xóa bài:", err);
            }
        } else {
            // Guest mode -> Lưu vào LocalStorage
            const storedGuest = localStorage.getItem('fitness_guest_plan');
            if (storedGuest) {
                try {
                    const parsed = JSON.parse(storedGuest);
                    parsed.workout_data = updatedExercises;
                    localStorage.setItem('fitness_guest_plan', JSON.stringify(parsed));
                } catch (e) {}
            }
        }
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const q = searchQuery.toLowerCase().trim();
        if (searchCategory === 'exercise' || q.includes('bài tập')) {
            setShowLibraryModal(true);
        } else if (searchCategory === 'meal' || q.includes('ăn') || q.includes('calo') || q.includes('dinh dưỡng')) {
            setShowMealTrackerModal(true);
        } else if (searchCategory === 'pt' || q.includes('pt') || q.includes('coach') || q.includes('huấn luyện')) {
            if (userPackage) {
                setShowBookingModal(true);
            } else {
                setShowPackageModal(true);
            }
        }
    };

    const filteredExercises = exercises.filter(ex => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const nameMatch = (ex.name || ex.exercise_name || '').toLowerCase().includes(q);
            const muscleMatch = (ex.primary_muscle || '').toLowerCase().includes(q);
            const notesMatch = (ex.instructions || ex.notes || '').toLowerCase().includes(q);
            if (!nameMatch && !muscleMatch && !notesMatch) return false;
        }
        if (exerciseMuscleFilter === 'all') return true;
        const pMuscle = (ex.primary_muscle || '').toLowerCase();
        const target = exerciseMuscleFilter.toLowerCase();
        if (pMuscle.includes(target)) return true;
        if (ex.secondary_muscles && Array.isArray(ex.secondary_muscles)) {
            return ex.secondary_muscles.some(s => s.toLowerCase().includes(target));
        }
        if (ex.tags && Array.isArray(ex.tags)) {
            return ex.tags.some(t => t.toLowerCase().includes(target));
        }
        return false;
    });

    const isPendingPtApproval = data.status === 'pending_pt_approval';

    return (
        <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-20 transition-colors duration-200">
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 font-sans space-y-7">

                {/* 1. TOP NAV & PROMO BANNER (DRIBBBLE-STYLE) */}
                <header className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:px-6 sm:py-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative z-30">
                    {/* Left: Brand Logo & Navigation Dropdowns */}
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                        {/* Brand Logo */}
                        <div 
                            onClick={() => navigate('/')}
                            className="flex items-center gap-1.5 cursor-pointer group select-none"
                        >
                            <span className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white font-serif group-hover:opacity-90 transition">
                                Thế Tài Fit<span className="text-[#ea4c89] text-3xl font-sans not-italic">.</span>
                            </span>
                        </div>

                        {/* Navigation items / Dropdowns */}
                        <nav className="hidden lg:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {/* Khám phá Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenNavDropdown(openNavDropdown === 'explore' ? null : 'explore')}
                                    className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Khám phá</span>
                                    <span className="text-[10px] text-slate-400">▾</span>
                                </button>
                                {openNavDropdown === 'explore' && (
                                    <div 
                                        onMouseLeave={() => setOpenNavDropdown(null)}
                                        className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-fadeIn"
                                    >
                                        <button
                                            onClick={() => { setShowLibraryModal(true); setOpenNavDropdown(null); }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <span>📚</span> Thư viện bài tập
                                        </button>
                                        <button
                                            onClick={() => { setShowMealTrackerModal(true); setOpenNavDropdown(null); }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <span>🥗</span> Theo dõi bữa ăn & Calo
                                        </button>
                                        <button
                                            onClick={() => { setShowProgressModal(true); setOpenNavDropdown(null); }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <span>📈</span> Phân tích tiến độ
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Tiện ích Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenNavDropdown(openNavDropdown === 'tools' ? null : 'tools')}
                                    className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Tiện ích</span>
                                    <span className="text-[10px] text-slate-400">▾</span>
                                </button>
                                {openNavDropdown === 'tools' && (
                                    <div 
                                        onMouseLeave={() => setOpenNavDropdown(null)}
                                        className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-fadeIn"
                                    >
                                        <button
                                            onClick={() => { setShowLeaderboardModal(true); setOpenNavDropdown(null); }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <span>🏆</span> Bảng Vàng & Streaks
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!isRegistered) { setAuthModalMode('register'); setShowAuthModal(true); }
                                                else { setShowReportModal(true); }
                                                setOpenNavDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <span>📊</span> Xuất Báo Cáo / PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!isRegistered) { setAuthModalMode('register'); setShowAuthModal(true); }
                                                else { setShowBookingModal(true); }
                                                setOpenNavDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <span>🎟️</span> Đặt Lịch & Vé QR
                                        </button>
                                    </div>
                                )}
                            </div>


                            {/* Mua Gói */}
                            <button
                                onClick={() => {
                                    if (!isRegistered) { setAuthModalMode('register'); setShowAuthModal(true); }
                                    else { setShowPackageModal(true); }
                                }}
                                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                            >
                                <span>💳</span>
                                <span>Gói tập</span>
                            </button>

                            {/* PT Workspace if role */}
                            {(userRole === 'pt' || userRole === 'admin') && (
                                <button
                                    onClick={() => navigate('/pt')}
                                    className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center gap-1 cursor-pointer"
                                >
                                    <span>🏋️</span>
                                    <span>PT Workspace</span>
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Center: Dribbble-style Pill Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md lg:max-w-lg flex items-center bg-slate-100/90 dark:bg-slate-800/80 rounded-full px-2 sm:px-3 py-1.5 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-[#ea4c89] focus-within:ring-2 focus-within:ring-[#ea4c89]/20 transition shadow-inner">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm bài tập, thực đơn, PT..."
                            className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                        />

                        <div className="flex items-center gap-1.5 shrink-0">
                            <select
                                value={searchCategory}
                                onChange={(e) => setSearchCategory(e.target.value)}
                                className="bg-transparent text-slate-500 dark:text-slate-400 text-xs font-semibold focus:outline-none cursor-pointer pr-1 border-r border-slate-300 dark:border-slate-600"
                            >
                                <option value="all">Tất cả</option>
                                <option value="exercise">Bài tập</option>
                                <option value="meal">Dinh dưỡng</option>
                                <option value="pt">HLV</option>
                            </select>

                            <button
                                type="submit"
                                title="Tìm kiếm"
                                className="w-8 h-8 rounded-full bg-[#ea4c89] hover:bg-[#d83a78] text-white flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>
                    </form>

                    {/* Right: Auth / Profile dropdown & Theme Toggle */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <ThemeToggle variant="navbar" />

                        {!isRegistered ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthModalMode('login');
                                        setShowAuthModal(true);
                                    }}
                                    className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 cursor-pointer transition"
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthModalMode('register');
                                        setShowAuthModal(true);
                                    }}
                                    className="bg-[#0d0c22] hover:bg-black text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                    <span>⚡</span>
                                    <span>Đăng ký</span>
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* User pill trigger */}
                                <button
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                    className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                                >
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs ring-2 ring-white dark:ring-slate-900">
                                        {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[110px]">
                                            {currentUser?.full_name || 'Học viên'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {userRole}
                                        </p>
                                    </div>
                                    <span className="text-slate-400 text-xs hidden sm:inline">▾</span>
                                </button>

                                {/* User Dropdown Menu */}
                                {showUserDropdown && (
                                    <div 
                                        onMouseLeave={() => setShowUserDropdown(false)}
                                        className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1.5 animate-fadeIn"
                                    >
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                {currentUser?.full_name || currentUser?.email || 'Học viên'}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                {(() => {
                                                    const tier = getMemberTierInfo(currentUser, userPackage);
                                                    return (
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${tier.badgeClass}`}>
                                                            {tier.icon} {tier.tierName}
                                                        </span>
                                                    );
                                                })()}
                                                <span className="text-[11px] text-slate-500">
                                                    • {userPackage ? `${userPackage.remaining_sessions || 0} buổi` : 'Chưa có gói'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowProfileModal(true);
                                                setShowUserDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>👤</span> Hồ sơ cá nhân
                                            </span>
                                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                                                Xem/Sửa
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowLeaderboardModal(true);
                                                setShowUserDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>🏆</span> Bảng Vàng & Streaks
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowPackageModal(true);
                                                setShowUserDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>💳</span> Nâng cấp gói tập
                                        </button>

                                        <hr className="border-slate-100 dark:border-slate-800 my-1" />

                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                handleLogout();
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition"
                                        >
                                            <span>🚪</span> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* DRIBBBLE-STYLE PROMO / ANNOUNCEMENT BANNER */}
                {showPromoBanner && (
                    <div className="bg-[#fcf4f8] dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs animate-fadeIn">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                            <span className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-sm shrink-0">
                                🏷️
                            </span>
                            <p className="truncate font-medium">
                                Nhận ưu đãi <strong className="font-bold text-slate-900 dark:text-white">giảm 20%</strong> cho dịch vụ PT & tập luyện chuyên nghiệp. Dùng mã: <span className="font-mono font-bold bg-pink-100 dark:bg-pink-900/50 text-[#ea4c89] px-2 py-0.5 rounded-md">WELCOME20</span> 🎉
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isRegistered) {
                                        setAuthModalMode('register');
                                        setShowAuthModal(true);
                                    } else {
                                        setShowPackageModal(true);
                                    }
                                }}
                                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-xs border border-pink-100/50 dark:border-pink-900/20 transition cursor-pointer"
                            >
                                Khám phá ngay
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPromoBanner(false)}
                                title="Đóng banner"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer transition p-1"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}


                {/* 2. KHU VỰC GÓI TẬP VÀ HUẤN LUYỆN VIÊN (PT > AI) */}
                {userPackage ? (
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                            <div className="space-y-3.5 max-w-2xl">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-xs">
                                        {userPackage.package_name || 'Gói PT 1-1'}
                                    </span>
                                    {isPendingPtApproval ? (
                                        <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                                            <span>⏳</span> Đang chờ PT thẩm định giáo án
                                        </span>
                                    ) : (
                                        <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                                            <span>✓</span> Giáo án đã được PT phê duyệt
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                                        Huấn Luyện Viên: {userPackage.trainer_name || 'Chuyên gia thể hình'}
                                    </h3>
                                    <p className="text-sm sm:text-base text-slate-300 mt-1.5 leading-relaxed">
                                        Chuyên môn: <span className="text-amber-300 font-bold">{userPackage.specialization || 'Tăng cơ & Giảm mỡ nâng cao'}</span> • Đánh giá: ⭐ {userPackage.trainer_rating || '5.0'} • Liên hệ: {userPackage.trainer_phone || 'Tại phòng gym'}
                                    </p>
                                </div>
                            </div>

                            {/* Số buổi còn lại & Button Đặt Lịch */}
                            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3.5 w-full lg:w-auto">
                                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center w-full sm:w-auto min-w-[200px]">
                                    <p className="text-xs text-slate-300 uppercase tracking-wider font-bold">Buổi tập khả dụng</p>
                                    <p className="text-4xl sm:text-5xl font-black text-amber-300 mt-1">
                                        {userPackage.remaining_sessions} <span className="text-sm sm:text-base text-slate-300 font-normal">/ {userPackage.total_sessions} buổi</span>
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium mt-2 pt-2 border-t border-white/10">
                                        <span>Đã tập: <strong className="text-white font-bold">{Math.max(0, (userPackage.total_sessions || 0) - (userPackage.remaining_sessions || 0))}</strong> buổi</span>
                                        <span>Còn: <strong className="text-emerald-400 font-bold">{userPackage.remaining_sessions}</strong></span>
                                    </div>
                                    <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden mt-1.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, Math.round(((Math.max(0, (userPackage.total_sessions || 0) - (userPackage.remaining_sessions || 0))) / (userPackage.total_sessions || 1)) * 100))}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {userPackage.remaining_sessions > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowBookingModal(true)}
                                        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>📅</span> Đặt Lịch Tập Buổi Tiếp Theo
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewModal(true)}
                                        className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>⭐</span> Đánh Giá & Gia Hạn Gói Mới
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Danh sách các buổi tập đã đặt sắp tới */}
                        {myBookings.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-white/10 space-y-3.5">
                                <p className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                    <span>🗓️</span> Lịch tập sắp tới cùng PT:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                    {myBookings.slice(0, 3).map((b) => (
                                        <div key={b.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-bold text-white text-base">
                                                    {new Date(b.booking_date).toLocaleDateString('vi-VN')}
                                                </p>
                                                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                                                    {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                                                </p>
                                                {b.notes && <p className="text-xs text-amber-200 mt-1 italic">"{b.notes}"</p>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    b.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' :
                                                    b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {b.status === 'confirmed' ? 'Đã xác nhận' : b.status === 'completed' ? 'Đã tập' : 'Đã hủy'}
                                                </span>
                                                {b.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleCancelBooking(b.id)}
                                                        className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                                                    >
                                                        Hủy lịch
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Gợi ý nâng cấp gói kèm PT 1-1 */
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-2.5 max-w-2xl">
                            <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-widest rounded-full">
                                🌟 Mô Hình Đột Phá: PT &gt; AI
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black">
                                Bạn Muốn Có Huấn Luyện Viên Kèm 1-1 & Sửa Form Tận Nơi?
                            </h3>
                            <p className="text-sm sm:text-base text-amber-100 leading-relaxed">
                                AI đã lập phác đồ hoàn hảo. Đăng ký ngay gói tập (12, 24, 36 buổi) để Huấn Luyện Viên trực tiếp hướng dẫn kỹ thuật, phòng ngừa chấn thương và bảo đảm kết quả.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!isRegistered) {
                                    setAuthModalMode('register');
                                    setShowAuthModal(true);
                                } else {
                                    setShowPackageModal(true);
                                }
                            }}
                            className="whitespace-nowrap px-7 py-4 bg-slate-950 hover:bg-black text-white font-black text-sm sm:text-base rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer flex items-center gap-2"
                        >
                            <span>🔥</span> Xem Các Gói PT 1-1
                        </button>
                    </div>
                )}

                {/* 3. HEADER TỔNG QUAN THỂ TRẠNG */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Tổng Quan Lộ Trình</h1>
                            <span className="px-3 py-1 text-xs sm:text-sm font-bold rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                                {data.goal || 'Giảm mỡ'}
                            </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
                            Thể trạng: <span className="font-bold text-gray-800 dark:text-slate-200">{data.weight} kg</span> • Chiều cao: <span className="font-bold text-gray-800 dark:text-slate-200">{data.height} cm</span> • Tuổi: <span className="font-bold text-gray-800 dark:text-slate-200">{data.age}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowReasoningModal(true)} 
                            className="px-4.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center gap-2 shadow-xs"
                        >
                            <span>🧠</span> Lý giải AI
                        </button>
                        <button 
                            onClick={() => navigate('/')} 
                            className="px-4.5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition cursor-pointer"
                        >
                            Khảo sát mới
                        </button>
                    </div>
                </header>

                {/* 4. LỜI KHUYÊN HLV */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 sm:p-7 rounded-3xl shadow-md">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="text-2xl">💪</span>
                        <h2 className="text-lg sm:text-xl font-bold tracking-wide">Lời Khuyên Huấn Luyện Viên AI</h2>
                    </div>
                    <p className="text-sm sm:text-base text-blue-50 leading-relaxed whitespace-pre-line font-medium">
                        {data.ai_advice || "HLV đang phân tích thể trạng của bạn..."}
                    </p>
                </div>

                {/* 4b. AI WORKOUT STUDIO & TÙY BIẾN NHÓM CƠ / DỤNG CỤ (NEW) */}
                <WorkoutStudioGenerator
                    userInjuries={data.injuries || []}
                    onWorkoutGenerated={handleWorkoutGenerated}
                    onOpenLibrary={() => setShowLibraryModal(true)}
                />

                {/* 5. GRID BÀI TẬP VÀ DINH DƯỠNG */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
                    {/* Danh sách bài tập (2 Cột) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xs space-y-4">
                            
                            {/* Top Bar: Title & Action buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Danh Sách Bài Tập Phù Hợp</h2>
                                        <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold font-mono">
                                            {filteredExercises.length} bài
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">Tự động gắn tag nhóm cơ, cơ phụ, dụng cụ &amp; hướng dẫn form</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowLibraryModal(true)}
                                        className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    >
                                        <span>➕</span> Thêm Từ Thư Viện
                                    </button>
                                    <button
                                        onClick={() => setShowProgressModal(true)}
                                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    >
                                        <span>📈</span> Tiến Độ
                                    </button>
                                    <button
                                        onClick={() => setShowLiveWorkoutModal(true)}
                                        className="px-4.5 py-2.5 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-orange-700 text-white text-xs sm:text-sm font-black rounded-xl transition shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 animate-pulse"
                                        title="Tập luyện trực tiếp có Huấn Luyện Viên Giọng Nói AI đếm nhịp & nhắc form"
                                    >
                                        <span>🎙️🔥</span> Bắt Đầu Tập
                                    </button>
                                </div>
                            </div>

                            {/* Muscle Group Filter Chips */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
                                <span className="text-xs font-bold text-gray-400 uppercase shrink-0">Lọc cơ:</span>
                                {[
                                    { id: 'all', label: 'Tất cả' },
                                    { id: 'Chest', label: '🛡️ Ngực' },
                                    { id: 'Back', label: '🦅 Lưng & Xô' },
                                    { id: 'Shoulders', label: '🎯 Vai' },
                                    { id: 'Biceps', label: '💪 Tay' },
                                    { id: 'Quadriceps', label: '🦵 Chân & Mông' },
                                    { id: 'Core', label: '🔥 Bụng & Core' },
                                    { id: 'Full Body', label: '⚡ Toàn thân' }
                                ].map(chip => (
                                    <button
                                        key={chip.id}
                                        type="button"
                                        onClick={() => setExerciseMuscleFilter(chip.id)}
                                        className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer border text-xs sm:text-sm ${
                                            exerciseMuscleFilter === chip.id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredExercises.length > 0 ? (
                            <div className="space-y-3.5">
                                {filteredExercises.map((exercise, index) => {
                                    const muscleStyle = getMuscleTagStyle(exercise.primary_muscle || '');
                                    return (
                                        <div key={index} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition">
                                            <div className="space-y-2.5 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-black flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{exercise.name || 'Bài tập tùy chỉnh'}</h3>
                                                    
                                                    {/* Phase Badge */}
                                                    {exercise.phase_title && (
                                                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                            ⚡ {exercise.phase_title}
                                                        </span>
                                                    )}

                                                    {/* Primary Muscle Badge with Dynamic Colors */}
                                                    {exercise.primary_muscle && (
                                                        <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-lg border ${muscleStyle}`}>
                                                            🎯 {exercise.primary_muscle}
                                                        </span>
                                                    )}

                                                    {/* Mechanic Badge */}
                                                    <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                                                        {exercise.mechanic || exercise.type || 'Compound'}
                                                    </span>
                                                </div>

                                                <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300 pl-0 sm:pl-10 leading-relaxed">
                                                    {exercise.instructions || exercise.description || 'Thực hiện động tác đúng form, kiểm soát nhịp thở và gồng chặt cơ mục tiêu.'}
                                                </p>

                                                {/* Target Sets & Reps & Tempo */}
                                                {(exercise.target_sets || exercise.target_reps) && (
                                                    <div className="flex flex-wrap items-center gap-3 pl-0 sm:pl-10 text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                                            <span>Mục tiêu: {exercise.target_sets || 3} hiệp x {exercise.target_reps || '10-12'} lần {exercise.target_rpe ? `(RPE ${exercise.target_rpe}/10)` : ''}</span>
                                                        </div>
                                                        {exercise.tempo && (
                                                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                                ⏱️ Tempo {exercise.tempo}
                                                            </span>
                                                        )}
                                                        {exercise.rest_seconds && (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                                ⏸️ Nghỉ {exercise.rest_seconds}s
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* AI / Scientific Coaching Tip */}
                                                {exercise.coaching_tip && (
                                                    <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 pl-0 sm:pl-10 flex items-center gap-1.5">
                                                        <span>💡</span> <strong>HLV dặn dò:</strong> <span>{exercise.coaching_tip}</span>
                                                    </p>
                                                )}

                                                {/* Tags, Equipment & Secondary Muscles Breakdown */}
                                                <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-10 pt-1 text-xs sm:text-sm">
                                                    {/* Equipment Required Tags */}
                                                    {exercise.equipment_required && Array.isArray(exercise.equipment_required) && exercise.equipment_required.length > 0 ? (
                                                        exercise.equipment_required.map((eq, eqIdx) => (
                                                            <span key={eqIdx} className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                                                🛠️ {eq}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                                            🤸‍♂️ Bodyweight (Không tạ)
                                                        </span>
                                                    )}

                                                    {/* Secondary Muscles */}
                                                    {exercise.secondary_muscles && Array.isArray(exercise.secondary_muscles) && exercise.secondary_muscles.length > 0 && (
                                                        <span className="text-gray-500 dark:text-slate-400">
                                                            • Cơ phụ: <strong>{exercise.secondary_muscles.join(', ')}</strong>
                                                        </span>
                                                    )}

                                                    {/* Hash Tags */}
                                                    {exercise.tags && Array.isArray(exercise.tags) && exercise.tags.map((tag, tIdx) => (
                                                        <span key={tIdx} className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right Action buttons */}
                                            <div className="flex sm:flex-col items-center sm:items-end gap-2 self-end sm:self-start shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => audioCoach.speakExerciseForm(exercise.name || 'Bài tập')}
                                                    className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                                    title="Nghe HLV AI hướng dẫn form chuẩn"
                                                >
                                                    <span>🔊</span> Nghe HLV Form
                                                </button>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExercise(index)}
                                                    className="px-3 py-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs sm:text-sm rounded-lg transition cursor-pointer"
                                                    title="Xóa bài này khỏi lộ trình hôm nay"
                                                >
                                                    ✕ Xóa
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl text-gray-500 dark:text-slate-400 text-base border border-gray-100 dark:border-slate-800 text-center space-y-3">
                                <p className="font-semibold">Không tìm thấy bài tập nào cho nhóm cơ đã lọc.</p>
                                <button
                                    type="button"
                                    onClick={() => setExerciseMuscleFilter('all')}
                                    className="px-5 py-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900 transition cursor-pointer"
                                >
                                    Xem tất cả bài tập
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Dinh dưỡng (1 Cột) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Dinh Dưỡng Hôm Nay</h2>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowReasoningModal(true)} 
                                    className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold cursor-pointer underline"
                                >
                                    BMR/TDEE
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800 flex flex-col space-y-5">
                            {/* Target vs Consumed */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/60 border border-blue-100 dark:border-indigo-900/40 p-5 sm:p-6 rounded-2xl text-center space-y-2.5">
                                <div className="flex justify-between items-center text-sm sm:text-base text-blue-900 dark:text-blue-200 font-bold">
                                    <span>Mục Tiêu AI: {calories} kcal</span>
                                    <span className="text-emerald-700 dark:text-emerald-400">Đã nạp: {todayMealTotals.calories || 0} kcal</span>
                                </div>

                                <div className="w-full bg-blue-200/60 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, Math.round(((todayMealTotals.calories || 0) / (parseFloat(calories) || 2000)) * 100))}%`
                                        }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600 dark:text-slate-400 pt-1">
                                    <span>Còn lại: <strong className="text-indigo-900 dark:text-indigo-300 font-black">{Math.max(0, (parseFloat(calories) || 2000) - (todayMealTotals.calories || 0))} kcal</strong></span>
                                    <span className="font-black text-blue-800 dark:text-blue-400 text-sm">
                                        {Math.round(((todayMealTotals.calories || 0) / (parseFloat(calories) || 2000)) * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* Macro status */}
                            <div className="grid grid-cols-2 gap-3.5">
                                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 p-4 rounded-2xl text-center space-y-1">
                                    <p className="text-xs sm:text-sm font-bold">Protein (Đạm)</p>
                                    <p className="text-xl sm:text-2xl font-black">{todayMealTotals.protein || 0} / {protein}g</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Phục hồi cơ bắp</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 p-4 rounded-2xl text-center space-y-1">
                                    <p className="text-xs sm:text-sm font-bold">Carb / Fat</p>
                                    <p className="text-xl sm:text-2xl font-black">{todayMealTotals.carbs || 0}g / {todayMealTotals.fat || 0}g</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Mục tiêu: {carbs}g / {fat}g</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (!isRegistered) {
                                        setAuthModalMode('register');
                                        setShowAuthModal(true);
                                    } else {
                                        setShowMealTrackerModal(true);
                                    }
                                }}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold rounded-xl transition shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">🍽️</span> Ghi Nhận Bữa Ăn & Macro
                            </button>

                            {nutrition.tdee && (
                                <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl space-y-1.5">
                                    <div className="flex justify-between">
                                        <span>Chuyển hóa nền (BMR):</span>
                                        <span className="font-bold text-gray-700 dark:text-slate-200">{nutrition.bmr || '---'} kcal</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tiêu hao hàng ngày (TDEE):</span>
                                        <span className="font-bold text-gray-700 dark:text-slate-200">{nutrition.tdee} kcal</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODALS */}
                {/* 1. Auth Modal */}
                <AuthModal
                    isOpen={showAuthModal}
                    initialMode={authModalMode}
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={async (userData) => {
                        setIsRegistered(true);
                        setUserRole(userData.role || 'member');
                        setCurrentUser(userData);

                        // Nếu học viên trước đó có kế hoạch khách ở LocalStorage, đồng bộ ngay lên tài khoản mới
                        const guestPlanStr = localStorage.getItem('fitness_guest_plan');
                        if (guestPlanStr && userData?.id) {
                            try {
                                const guestPlan = JSON.parse(guestPlanStr);
                                await saveUserProfile({
                                    userInfo: {
                                        gender: guestPlan.gender || 'male',
                                        age: guestPlan.age || 24,
                                        weight: guestPlan.weight || 70,
                                        height: guestPlan.height || 172,
                                        goal: guestPlan.goal || 'Giảm mỡ',
                                        activityLevel: guestPlan.activity_level || 'moderate',
                                        injuries: guestPlan.injuries || []
                                    },
                                    nutritionPlan: guestPlan.nutrition_data,
                                    workoutPlan: guestPlan.workout_data,
                                    aiAdvice: guestPlan.ai_advice,
                                    aiReasoning: guestPlan.ai_reasoning,
                                    userId: userData.id
                                });
                                localStorage.removeItem('fitness_guest_plan');
                            } catch (err) {
                                console.warn("Lỗi đồng bộ guest plan lên user mới:", err);
                            }
                        }

                        loadData();
                    }}
                />

                {/* 2. Package Store Modal */}
                <PackageModal
                    isOpen={showPackageModal}
                    onClose={() => setShowPackageModal(false)}
                    onOpenAuth={() => {
                        setShowPackageModal(false);
                        setShowAuthModal(true);
                    }}
                    onSuccess={() => {
                        loadData();
                    }}
                />

                {/* 3. Booking Modal */}
                <BookingModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    userPackage={userPackage}
                    onSuccess={() => {
                        loadData();
                    }}
                />

                {/* 4. Experience Review Modal (Mandatory feedback when sessions == 0) */}
                <ReviewModal
                    isOpen={showReviewModal}
                    userPackage={userPackage}
                    onSuccess={() => {
                        setShowReviewModal(false);
                        loadData();
                    }}
                />

                {/* 5. AI Reasoning Modal */}
                {showReasoningModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-5">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">🧠 Cơ Sở Khoa Học & Lý Giải AI</h3>
                                    <p className="text-xs text-gray-500">Minh bạch thuật toán & công thức tính toán dinh dưỡng, bài tập</p>
                                </div>
                                <button
                                    onClick={() => setShowReasoningModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4 text-sm text-gray-700">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🔬</span> 1. Công Thức Tính Năng Lượng (Mifflin-St Jeor)
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                        {aiReasoning?.bmr_explanation || `BMR tính toán dựa trên cân nặng ${data.weight}kg, chiều cao ${data.height}cm và giới tính ${data.gender === 'male' ? 'Nam' : 'Nữ'}.`}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {aiReasoning?.tdee_explanation || `TDEE phản ánh tổng năng lượng tiêu hao kết hợp giữa chuyển hóa nền và hệ số vận động.`}
                                    </p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
                                    <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🎯</span> 2. Chiến Lược Calo Mục Tiêu ({data.goal})
                                    </h4>
                                    <p className="text-xs text-blue-800">
                                        {aiReasoning?.calorie_strategy || `Lượng calo được điều chỉnh tự động nhằm đạt tốc độ thay đổi thể trạng bền vững mà không gây suy kiệt trao đổi chất.`}
                                    </p>
                                </div>

                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                                    <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🥗</span> 3. Phân Bổ Macro Dinh Dưỡng
                                    </h4>
                                    <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                                        <li>{aiReasoning?.macro_breakdown?.protein || `Protein (${protein}g): Đảm bảo khối lượng cơ nạc được bảo vệ tối đa.`}</li>
                                        <li>{aiReasoning?.macro_breakdown?.fat || `Chất béo (${fat}g): Duy trì sức khỏe hệ nội tiết và màng tế bào.`}</li>
                                        <li>{aiReasoning?.macro_breakdown?.carb || `Carbohydrate (${carbs}g): Cung cấp năng lượng chính cho các bài tập nặng.`}</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-2">
                                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🛡️</span> 4. Kiểm Soát An Toàn (Safety Rules)
                                    </h4>
                                    <p className="text-xs text-amber-800">
                                        Các bài tập có nguy cơ chấn thương hoặc yêu cầu thiết bị ngoài phòng tập/dụng cụ khả dụng đã được Calculation Engine tự động loại trừ. Khi tham gia gói tập có PT, Huấn luyện viên sẽ là người duyệt cuối cùng.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={() => setShowReasoningModal(false)}
                                    className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Live Workout Modal */}
                <LiveWorkoutModal
                    isOpen={showLiveWorkoutModal}
                    onClose={() => setShowLiveWorkoutModal(false)}
                    exercises={exercises}
                    planId={data?.id}
                    onSuccess={() => {
                        loadData();
                        setShowLiveWorkoutModal(false);
                        setShowProgressModal(true);
                    }}
                />

                {/* 7. Progress & Weight Analytics Modal */}
                <ProgressAnalyticsModal
                    isOpen={showProgressModal}
                    onClose={() => setShowProgressModal(false)}
                    onWeightUpdated={() => {
                        loadData();
                    }}
                />

                {/* 8. Meal Tracker Modal */}
                <MealTrackerModal
                    isOpen={showMealTrackerModal}
                    onClose={() => setShowMealTrackerModal(false)}
                    targetNutrition={{
                        targetCalories: calories,
                        protein,
                        carbs,
                        fat
                    }}
                    onMealsUpdated={() => {
                        loadData();
                    }}
                />

                {/* 9. Direct Chat with PT Modal */}
                <ChatModal
                    isOpen={showChatModal}
                    onClose={() => {
                        setShowChatModal(false);
                        loadData();
                    }}
                    defaultPartnerId={userPackage?.trainer_user_id || 2}
                    defaultPartnerName={userPackage?.trainer_name || 'Coach Minh Tuấn'}
                    initialMode={unreadChatCount > 0 ? 'pt' : 'ai'}
                />

                {/* 10. Leaderboard & Achievements Modal */}
                <LeaderboardModal
                    isOpen={showLeaderboardModal}
                    onClose={() => setShowLeaderboardModal(false)}
                />

                {/* 11. Booking & QR Check-in Modal */}
                <BookingModal
                    isOpen={showBookingModal}
                    onClose={() => {
                        setShowBookingModal(false);
                        loadData();
                    }}
                    user={currentUser}
                    defaultTrainerId={userPackage?.trainer_id}
                />

                {/* 12. Package Purchase Modal */}
                <PackageModal
                    isOpen={showPackageModal}
                    onClose={() => {
                        setShowPackageModal(false);
                        loadData();
                    }}
                    currentPackage={userPackage}
                />

                {/* 13. Experience Review Modal */}
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => {
                        setShowReviewModal(false);
                        loadData();
                    }}
                    packageId={userPackage?.id}
                />

                {/* 14. Progress Report & Certificate Modal */}
                <ProgressReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    userId={currentUser?.id}
                    userName={currentUser?.full_name}
                />

                {/* 15. Exercise Library & Muscle / Equipment Browser Modal */}
                <ExerciseLibraryModal
                    isOpen={showLibraryModal}
                    onClose={() => setShowLibraryModal(false)}
                    onAddExercise={handleAddExerciseFromLibrary}
                />

                {/* 16. Personal Profile Modal */}
                <ProfileModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    currentUser={currentUser}
                    onProfileUpdated={(updated) => {
                        setCurrentUser(prev => ({ ...prev, ...updated }));
                    }}
                />

                {/* FLOATING CHAT BUBBLE (BONG BÓNG CHAT COACH ĐÀO CHI GÓC DƯỚI) */}
                <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-none">
                    {/* Speech teaser tooltip */}
                    {!showChatModal && (
                        <div
                            onClick={() => {
                                if (!isRegistered) {
                                    setAuthModalMode('register');
                                    setShowAuthModal(true);
                                } else {
                                    setShowChatModal(true);
                                    setUnreadChatCount(0);
                                }
                            }}
                            className={`pointer-events-auto border shadow-xl rounded-2xl px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 animate-fadeIn ${
                                unreadChatCount > 0
                                    ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse'
                                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                            }`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${unreadChatCount > 0 ? 'bg-amber-300' : 'bg-emerald-500'} animate-ping`}></span>
                            <span>{unreadChatCount > 0 ? `💬 HLV vừa gửi ${unreadChatCount} tin nhắn mới!` : 'Chat với Coach Đào Chi'}</span>
                            <span className="text-sm">💬</span>
                        </div>
                    )}

                    {/* Floating Action Button / Chat Bubble */}
                    <button
                        type="button"
                        onClick={() => {
                            if (!isRegistered) {
                                setAuthModalMode('register');
                                setShowAuthModal(true);
                            } else {
                                setShowChatModal(!showChatModal);
                                if (!showChatModal) setUnreadChatCount(0);
                            }
                        }}
                        title={showChatModal ? "Đóng cửa sổ chat" : "Mở chat với Coach Đào Chi"}
                        className="pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-white/70 dark:ring-slate-900/70"
                    >
                        {showChatModal ? (
                            <span className="text-2xl font-black">✕</span>
                        ) : (
                            <>
                                <span className="text-2xl sm:text-3xl">🧘‍♀️</span>
                                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online 24/7"></span>
                                {unreadChatCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                                        {unreadChatCount}
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}