// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchLatestPlan,
  fetchMe,
  fetchMyCurrentPackage,
  fetchMyBookings,
  updateBookingStatus,
  fetchDailyMeals,
  fetchUnreadCount,
  saveUserProfile
} from '../services/api';

import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import PackageBanner from '../components/dashboard/PackageBanner';
import OverviewHeader from '../components/dashboard/OverviewHeader';
import WorkoutScheduleSection from '../components/dashboard/WorkoutScheduleSection';
import NutritionOverviewCard from '../components/dashboard/NutritionOverviewCard';
import FloatingChatBubble from '../components/dashboard/FloatingChatBubble';
import GymMobileBottomNav from '../components/dashboard/GymMobileBottomNav';
import DashboardModalManager from '../components/dashboard/DashboardModalManager';
import WorkoutStudioGenerator from '../components/WorkoutStudioGenerator';
import LoadingFallback from '../components/LoadingFallback';
import { X, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // Core Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(!!localStorage.getItem('fitness_token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('fitness_role') || 'guest');
  const [currentUser, setCurrentUser] = useState(null);
  const [userPackage, setUserPackage] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [todayMealTotals, setTodayMealTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Unified Modal Management State (Thay vì 14 cờ boolean riêng lẻ)
  const [activeModal, setActiveModal] = useState(null); // 'auth' | 'package' | 'booking' | 'review' | 'reasoning' | 'liveWorkout' | 'progress' | 'mealTracker' | 'chat' | 'leaderboard' | 'report' | 'library' | 'profile' | null
  const [authModalMode, setAuthModalMode] = useState('register');

  // Filter & Search States
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [mobileActiveTab, setMobileActiveTab] = useState('workout');

  const openModal = useCallback((modalName, mode = null) => {
    if (mode) setAuthModalMode(mode);
    setActiveModal(modalName);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const loadData = useCallback(async () => {
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
          } else {
            setData(null);
          }
        } catch (e) {
          console.warn("Chưa có plan hoặc lỗi lấy plan:", e);
          setData(null);
        }
      } else {
        // Chế độ Khách (Guest) - Đọc trực tiếp từ LocalStorage
        const guestPlanStr = localStorage.getItem('fitness_guest_plan');
        if (guestPlanStr) {
          try {
            const parsed = JSON.parse(guestPlanStr);
            setData(parsed);
          } catch (err) {
            console.warn("Lỗi parse guest plan:", err);
            setData(null);
          }
        } else if (activeUserId) {
          try {
            const result = await fetchLatestPlan(activeUserId);
            if (result?.data) setData(result.data);
            else setData(null);
          } catch (e) {
            setData(null);
          }
        } else {
          setData(null);
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
              setActiveModal('review');
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
          } else {
            setTodayMealTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
          }
        } catch (e) {
          console.warn("Không thể lấy bữa ăn:", e);
          setTodayMealTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
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
  }, [navigate]);

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
  }, [loadData, navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('fitness_token');
    localStorage.removeItem('fitness_user_id');
    localStorage.removeItem('fitness_role');
    setIsRegistered(false);
    setUserRole('guest');
    setCurrentUser(null);
    setData(null);
    setUserPackage(null);
    setMyBookings([]);
    setTodayMealTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    navigate('/');
  }, [navigate]);

  const handleCancelBooking = useCallback(async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch buổi tập này?')) return;
    try {
      await updateBookingStatus(bookingId, { status: 'cancelled', cancelReason: 'Học viên hủy lịch' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy lịch.');
    }
  }, [loadData]);

  // 1. Parse Dữ liệu Dinh dưỡng (memoized)
  const parsedNutrition = useMemo(() => {
    if (!data) return {};
    let nut = {};
    try {
      nut = typeof data.nutrition_data === 'string'
        ? JSON.parse(data.nutrition_data)
        : (data.nutrition_data || {});
      if (nut.data && typeof nut.data === 'object') nut = { ...nut, ...nut.data };
      if (nut.nutritionPlan && typeof nut.nutritionPlan === 'object') nut = { ...nut, ...nut.nutritionPlan };
    } catch (e) {
      console.error("Lỗi parse dinh dưỡng:", e);
    }
    return nut;
  }, [data]);

  const nutritionGoals = useMemo(() => {
    const dailyTargets = parsedNutrition.daily_targets || parsedNutrition.dailyTargets || parsedNutrition;
    const macros = dailyTargets.macros || parsedNutrition.macros || parsedNutrition;

    const calories = dailyTargets.targetCalories || dailyTargets.calories || parsedNutrition.targetCalories || parsedNutrition.calories || data?.target_calories || 2000;

    const rawProtein = macros.protein ?? macros.protein_g ?? macros.target_protein ?? parsedNutrition.protein ?? parsedNutrition.protein_g ?? dailyTargets.protein;
    const protein = (rawProtein !== undefined && rawProtein !== null && rawProtein !== '---')
      ? String(rawProtein).replace(/[^0-9.]/g, '')
      : Math.round((parseFloat(data?.weight) || 70) * 2.2);

    const rawCarb = macros.carb ?? macros.carbs ?? macros.carb_g ?? macros.carbs_g ?? macros.target_carbs ?? parsedNutrition.carb ?? parsedNutrition.carbs ?? dailyTargets.carb;
    const carbs = (rawCarb !== undefined && rawCarb !== null && rawCarb !== '---')
      ? String(rawCarb).replace(/[^0-9.]/g, '')
      : 250;

    const rawFat = macros.fat ?? macros.fat_g ?? macros.target_fat ?? parsedNutrition.fat ?? parsedNutrition.fat_g ?? dailyTargets.fat;
    const fat = (rawFat !== undefined && rawFat !== null && rawFat !== '---')
      ? String(rawFat).replace(/[^0-9.]/g, '')
      : Math.round(((parseFloat(calories) || 2000) * 0.25) / 9);

    return { calories, protein, carbs, fat, dailyTargets };
  }, [parsedNutrition, data]);

  // 2. Parse Danh sách bài tập (memoized)
  const exercises = useMemo(() => {
    if (!data) return [];
    try {
      const rawWorkout = typeof data.workout_data === 'string'
        ? JSON.parse(data.workout_data)
        : data.workout_data;
      return Array.isArray(rawWorkout) ? rawWorkout : (rawWorkout?.data || []);
    } catch (e) {
      console.error("Lỗi parse bài tập:", e);
      return [];
    }
  }, [data]);

  const handleWorkoutGenerated = useCallback((newExercises, coachAdvice) => {
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
  }, []);

  const handleApplyWorkoutFromChat = useCallback(async (newExercises, mode = 'replace', aiAdvice = '', detectedInjuries = []) => {
    if (!Array.isArray(newExercises) || newExercises.length === 0) return;
    const updatedExercises = mode === 'append' ? [...exercises, ...newExercises] : newExercises;
    const existingInjuries = Array.isArray(currentUser?.injuries)
      ? currentUser.injuries
      : (Array.isArray(data?.injuries) ? data.injuries : []);
    const mergedInjuries = [...new Set([...existingInjuries, ...(detectedInjuries || [])])];

    setExerciseMuscleFilter('all');
    setData(prev => ({
      ...(prev || {}),
      workout_data: updatedExercises,
      ai_advice: aiAdvice || prev?.ai_advice,
      injuries: mergedInjuries,
    }));

    if (currentUser && mergedInjuries.length > 0) {
      setCurrentUser(prev => prev ? { ...prev, injuries: mergedInjuries } : prev);
    }

    const activeId = currentUser?.id || localStorage.getItem('fitness_user_id');
    const token = localStorage.getItem('fitness_token');

    if (token && activeId) {
      try {
        await saveUserProfile({
          userInfo: {
            ...(currentUser || data || {}),
            injuries: mergedInjuries,
          },
          workoutPlan: updatedExercises,
          nutritionPlan: parsedNutrition,
          aiAdvice: aiAdvice || data?.ai_advice,
          userId: activeId
        });
      } catch (err) {
        console.warn("Lỗi lưu giáo án từ AI Chat vào Database:", err);
      }
    } else {
      const storedGuest = localStorage.getItem('fitness_guest_plan');
      try {
        const parsed = storedGuest ? JSON.parse(storedGuest) : {};
        parsed.workout_data = updatedExercises;
        if (aiAdvice) parsed.ai_advice = aiAdvice;
        parsed.injuries = mergedInjuries;
        localStorage.setItem('fitness_guest_plan', JSON.stringify(parsed));
      } catch (e) {}
    }
  }, [exercises, currentUser, data, parsedNutrition]);

  const handleAddExerciseFromLibrary = useCallback(async (newEx) => {
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
          nutritionPlan: parsedNutrition,
          aiAdvice: data?.ai_advice,
          userId: activeId
        });
      } catch (err) {
        console.warn("Lỗi lưu plan khi thêm bài:", err);
      }
    } else {
      const storedGuest = localStorage.getItem('fitness_guest_plan');
      if (storedGuest) {
        try {
          const parsed = JSON.parse(storedGuest);
          parsed.workout_data = updatedExercises;
          localStorage.setItem('fitness_guest_plan', JSON.stringify(parsed));
        } catch (e) {}
      }
    }
  }, [exercises, currentUser, data, parsedNutrition]);

  const handleRemoveExercise = useCallback(async (indexToRemove) => {
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
          nutritionPlan: parsedNutrition,
          aiAdvice: data?.ai_advice,
          userId: activeId
        });
      } catch (err) {
        console.warn("Lỗi lưu plan khi xóa bài:", err);
      }
    } else {
      const storedGuest = localStorage.getItem('fitness_guest_plan');
      if (storedGuest) {
        try {
          const parsed = JSON.parse(storedGuest);
          parsed.workout_data = updatedExercises;
          localStorage.setItem('fitness_guest_plan', JSON.stringify(parsed));
        } catch (e) {}
      }
    }
  }, [exercises, currentUser, data, parsedNutrition]);

  const handleSearchSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const q = searchQuery.toLowerCase().trim();
    if (searchCategory === 'exercise' || q.includes('bài tập')) {
      openModal('library');
    } else if (searchCategory === 'meal' || q.includes('ăn') || q.includes('calo') || q.includes('dinh dưỡng')) {
      openModal('mealTracker');
    } else if (searchCategory === 'pt' || q.includes('pt') || q.includes('coach') || q.includes('huấn luyện')) {
      if (userPackage) {
        openModal('booking');
      } else {
        openModal('package');
      }
    }
  }, [searchQuery, searchCategory, openModal, userPackage]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
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
  }, [exercises, searchQuery, exerciseMuscleFilter]);

  if (loading) {
    return <LoadingFallback message="Đang nạp lộ trình thể hình cá nhân hóa..." />;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6 text-center bg-slate-50 dark:bg-slate-950">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-sm">
          📋
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Chưa có dữ liệu lộ trình</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
          Vui lòng hoàn thành khảo sát hoặc chọn Khám phá nhanh để AI thiết lập lộ trình cho bạn.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-sm active:scale-95"
        >
          Khảo sát ngay
        </button>
      </div>
    );
  }

  const isPendingPtApproval = data.status === 'pending_pt_approval';

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-28 md:pb-20 transition-colors duration-200">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 font-sans space-y-7">
        
        {/* 1. TOP NAV */}
        <DashboardNavbar
          currentUser={currentUser}
          userRole={userRole}
          isRegistered={isRegistered}
          userPackage={userPackage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchCategory={searchCategory}
          setSearchCategory={setSearchCategory}
          onSearchSubmit={handleSearchSubmit}
          openModal={openModal}
          onLogout={handleLogout}
        />

        {/* PROMO BANNER */}
        {showPromoBanner && (
          <div className="bg-[#fcf4f8] dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
              <span className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-sm shrink-0">
                🎁
              </span>
              <p className="truncate font-medium">
                Nhận ưu đãi <strong className="font-bold text-slate-900 dark:text-white">giảm 20%</strong> cho dịch vụ PT & tập luyện chuyên nghiệp. Dùng mã: <span className="font-mono font-bold bg-pink-100 dark:bg-pink-900/50 text-[#ea4c89] px-2 py-0.5 rounded-md">WELCOME20</span> 🔥
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isRegistered) {
                    openModal('auth', 'register');
                  } else {
                    openModal('package');
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
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. GÓI TẬP VÀ HUẤN LUYỆN VIÊN (PT > AI) */}
        <PackageBanner
          userPackage={userPackage}
          isPendingPtApproval={isPendingPtApproval}
          myBookings={myBookings}
          onOpenBooking={() => openModal('booking')}
          onOpenReview={() => openModal('review')}
          onCancelBooking={handleCancelBooking}
          onOpenPackageModal={() => openModal('package')}
          isRegistered={isRegistered}
          onOpenAuth={() => openModal('auth', 'register')}
        />

        {/* 3. TỔNG QUAN THỂ TRẠNG & LỜI KHUYÊN HLV */}
        <OverviewHeader
          goal={data.goal}
          weight={data.weight}
          height={data.height}
          age={data.age}
          aiAdvice={data.ai_advice}
          onOpenReasoning={() => openModal('reasoning')}
        />

        {/* 4. AI WORKOUT STUDIO */}
        <WorkoutStudioGenerator
          userInjuries={data.injuries || []}
          onWorkoutGenerated={handleWorkoutGenerated}
          onOpenLibrary={() => openModal('library')}
        />

        {/* 5. GRID BÀI TẬP VÀ DINH DƯỠNG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
          {/* Cột 1 & 2: Danh sách bài tập */}
          <div className="lg:col-span-2">
            <WorkoutScheduleSection
              filteredExercises={filteredExercises}
              exerciseMuscleFilter={exerciseMuscleFilter}
              setExerciseMuscleFilter={setExerciseMuscleFilter}
              onOpenLibrary={() => openModal('library')}
              onOpenProgress={() => openModal('progress')}
              onOpenLiveWorkout={() => openModal('liveWorkout')}
              onRemoveExercise={handleRemoveExercise}
            />
          </div>

          {/* Cột 3: Dinh dưỡng & Macro */}
          <div className="lg:col-span-1">
            <NutritionOverviewCard
              currentUser={currentUser}
              planData={data}
              nutrition={parsedNutrition}
              calories={nutritionGoals.calories}
              protein={nutritionGoals.protein}
              carbs={nutritionGoals.carbs}
              fat={nutritionGoals.fat}
              todayMealTotals={todayMealTotals}
              onOpenMealTracker={() => openModal('mealTracker')}
              onRefresh={loadData}
              isRegistered={isRegistered}
              onOpenAuth={() => openModal('auth', 'register')}
            />
          </div>
        </div>

        {/* FLOATING ACTION CHAT BUBBLE */}
        <FloatingChatBubble
          currentUser={currentUser}
          onApplyWorkoutFromChat={handleApplyWorkoutFromChat}
          isChatOpen={activeModal === 'chat'}
          onToggleChat={() => {
            if (!isRegistered) {
              openModal('auth', 'register');
            } else {
              if (activeModal === 'chat') {
                closeModal();
              } else {
                openModal('chat');
                setUnreadChatCount(0);
              }
            }
          }}
          unreadCount={unreadChatCount}
        />

        {/* MOBILE BOTTOM NAVIGATION (GYM MOBILE FIRST) */}
        <GymMobileBottomNav
          activeTab={mobileActiveTab}
          onSelectTab={(tab) => {
            setMobileActiveTab(tab);
            if (tab === 'mealTracker') openModal('mealTracker');
            else if (tab === 'chat') openModal('chat');
            else if (tab === 'profile') openModal('profile');
          }}
          unreadChatCount={unreadChatCount}
          onStartLiveWorkout={() => openModal('liveWorkout')}
          isRegistered={isRegistered}
          onOpenAuth={() => openModal('auth', 'register')}
        />

        {/* MODAL MANAGER (TẢI BẤT ĐỒNG BỘ CÁC CỬA SỔ NẶNG) */}
        <DashboardModalManager
          activeModal={activeModal}
          closeModal={closeModal}
          openModal={openModal}
          authModalMode={authModalMode}
          userPackage={userPackage}
          currentUser={currentUser}
          exercises={exercises}
          planData={data}
          nutritionGoals={nutritionGoals}
          unreadChatCount={unreadChatCount}
          onAuthSuccess={async (userData) => {
            setIsRegistered(true);
            setUserRole(userData.role || 'member');
            setCurrentUser(userData);

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
            closeModal();
            loadData();
          }}
          onDataRefresh={loadData}
          onAddExerciseFromLibrary={handleAddExerciseFromLibrary}
          onProfileUpdated={(updated) => {
            setCurrentUser(prev => ({ ...prev, ...updated }));
          }}
        />

      </div>
    </div>
  );
}
