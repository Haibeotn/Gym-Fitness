import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Flame,
  Dumbbell,
  Award,
  Camera,
  Trash2,
  Clock,
  CheckCircle2,
  User,
} from 'lucide-react';
import AiFoodStudioModal from './AiFoodStudioModal';
import { deleteMealLog } from '../../services/api';

// Hàm lấy ngày chuẩn giờ địa phương Việt Nam (YYYY-MM-DD)
function getLocalTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Lấy User ID chính xác từ currentUser hoặc localStorage (fitness_user_id)
function getCurrentActiveUserId(currentUser) {
  if (currentUser?.id) return String(currentUser.id);
  const storedId = localStorage.getItem('fitness_user_id');
  if (storedId) return String(storedId);
  const token = localStorage.getItem('fitness_token');
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decoded = JSON.parse(atob(payloadBase64));
        if (decoded.id || decoded.userId) return String(decoded.id || decoded.userId);
      }
    } catch (_) {}
  }
  return 'guest';
}

function getUserStorageKey(userId) {
  return `fitness_user_${userId}_daily_meals_v5`;
}

function loadUserState(userId) {
  const todayKey = getLocalTodayKey();
  const key = getUserStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.dateKey === todayKey && Array.isArray(parsed.meals)) {
        return parsed;
      }
      // Nếu sang ngày mới, lưu ngày cũ vào lịch sử riêng của user này và reset
      if (parsed && parsed.dateKey && parsed.dateKey !== todayKey) {
        const histKey = `${key}_history`;
        const hist = JSON.parse(localStorage.getItem(histKey) || '[]');
        localStorage.setItem(histKey, JSON.stringify([parsed, ...hist].slice(0, 30)));
      }
    }
  } catch (_) {}

  return {
    dateKey: todayKey,
    userId,
    meals: [],
  };
}

const MEAL_BADGE = {
  breakfast: { label: 'Sáng', icon: '🌅' },
  lunch: { label: 'Trưa', icon: '☀️' },
  dinner: { label: 'Tối', icon: '🌙' },
  snack: { label: 'Phụ', icon: '🍎' },
};

export default function NutritionOverviewCard({
  currentUser,
  planData,
  nutrition,
  todayMealTotals,
  onOpenMealTracker,
  onRefresh,
  isRegistered,
  onOpenAuth,
}) {
  const [showStudio, setShowStudio] = useState(false);
  const activeUserId = getCurrentActiveUserId(currentUser);
  const [dailyState, setDailyState] = useState(() => loadUserState(activeUserId));

  // TỰ ĐỘNG ĐỔI DỮ LIỆU NGAY KHI ĐĂNG XUẤT HOẶC ĐĂNG NHẬP SANG TÀI KHOẢN KHÁC!
  useEffect(() => {
    const currentId = getCurrentActiveUserId(currentUser);
    setDailyState(loadUserState(currentId));
  }, [activeUserId, currentUser?.id]);

  // Lưu riêng biệt cho đúng User ID hiện tại
  useEffect(() => {
    if (dailyState.userId) {
      try {
        localStorage.setItem(
          getUserStorageKey(dailyState.userId),
          JSON.stringify(dailyState)
        );
      } catch (_) {}
    }
  }, [dailyState]);

  // Bộ đếm kiểm tra reset tự động đúng 00:00 đêm
  useEffect(() => {
    const timer = setInterval(() => {
      const todayKey = getLocalTodayKey();
      setDailyState((prev) => {
        if (prev.dateKey !== todayKey) {
          return loadUserState(getCurrentActiveUserId(currentUser));
        }
        return prev;
      });
    }, 15000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // TÍNH TOÁN CHỈ SỐ BMR, TDEE, MỤC TIÊU CALO & MACRO CÁ NHÂN HÓA 100% THEO TỪNG TÀI KHOẢN
  const computedTargets = useMemo(() => {
    // 1. Nếu tài khoản đã có giáo án chính thức trong database với chỉ số cụ thể
    if (planData?.target_calories || nutrition?.targetCalories) {
      const tCal = Number(planData?.target_calories || nutrition?.targetCalories) || 2000;
      const bmrVal = Number(nutrition?.bmr || planData?.nutrition_data?.bmr) || Math.round(tCal * 0.7);
      const tdeeVal = Number(nutrition?.tdee || planData?.nutrition_data?.tdee) || Math.round(tCal * 1.15);
      const proVal = Number(nutrition?.macros?.protein || planData?.nutrition_data?.daily_targets?.protein) || Math.round((currentUser?.weight || 70) * 2.2);
      const fatVal = Number(nutrition?.macros?.fat || planData?.nutrition_data?.daily_targets?.fat) || Math.round((tCal * 0.25) / 9);
      const carbVal = Number(nutrition?.macros?.carbs || planData?.nutrition_data?.daily_targets?.carbs) || Math.max(50, Math.round((tCal - proVal * 4 - fatVal * 9) / 4));

      return {
        bmr: bmrVal,
        tdee: tdeeVal,
        targetCalories: tCal,
        targetProtein: proVal,
        targetCarbs: carbVal,
        targetFat: fatVal,
      };
    }

    // 2. Tính toán khoa học theo công thức Mifflin-St Jeor từ Profile thực của User
    const isFemale = currentUser?.gender === 'female';
    const weight = Number(currentUser?.weight) || (isFemale ? 52 : 72);
    const height = Number(currentUser?.height) || (isFemale ? 160 : 174);
    const age = Number(currentUser?.age) || 24;
    const goal = String(currentUser?.goal || '').toLowerCase();

    // Công thức Mifflin-St Jeor chuẩn quốc tế
    const bmr = isFemale
      ? Math.round(10 * weight + 6.25 * height - 5 * age - 161)
      : Math.round(10 * weight + 6.25 * height - 5 * age + 5);

    // TDEE hệ số vận động trung bình 1.45 cho gymer
    const tdee = Math.round(bmr * 1.45);

    // Điều chỉnh theo mục tiêu của từng học viên
    let targetCalories = tdee;
    if (goal.includes('giảm') || goal.includes('cut') || goal.includes('mỡ')) {
      targetCalories = Math.max(1200, Math.round(tdee - 450));
    } else if (goal.includes('tăng') || goal.includes('bulk') || goal.includes('cơ')) {
      targetCalories = Math.round(tdee + 350);
    }

    const targetProtein = Math.round(weight * 2.2);
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    const targetCarbs = Math.max(50, Math.round((targetCalories - targetProtein * 4 - targetFat * 9) / 4));

    return {
      bmr,
      tdee,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
    };
  }, [currentUser, planData, nutrition]);

  const {
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
  } = computedTargets;

  // Tổng hợp calo và macro từ Database (ưu tiên) hoặc LocalState
  const dbCalories = Number(todayMealTotals?.calories) || 0;
  const dbProtein = Number(todayMealTotals?.protein) || 0;
  const dbCarbs = Number(todayMealTotals?.carbs) || 0;
  const dbFat = Number(todayMealTotals?.fat) || 0;

  const localAccumulated = useMemo(() => {
    return (dailyState.meals || []).reduce(
      (acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0),
        fat: acc.fat + (Number(item.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [dailyState.meals]);

  // Nếu người dùng đã có món trên Database, lấy lớn hơn giữa DB và local
  const currentCalories = Math.max(dbCalories, localAccumulated.calories);
  const currentProtein = Math.max(dbProtein, localAccumulated.protein);
  const currentCarbs = Math.max(dbCarbs, localAccumulated.carbs);
  const currentFat = Math.max(dbFat, localAccumulated.fat);

  const remainingCalories = Math.max(0, targetCalories - currentCalories);
  const caloriePercent = Math.min(
    100,
    Math.round((currentCalories / (targetCalories || 1)) * 100)
  );

  // XÁC NHẬN LƯU VÀ CỘNG DỒN CHO RIÊNG TÀI KHOẢN NÀY
  const handleConfirmAddMeal = (mealData) => {
    const todayKey = getLocalTodayKey();
    const currentId = getCurrentActiveUserId(currentUser);
    const nowTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMealEntry = {
      id: 'meal_' + Date.now(),
      food_name: mealData.food_name || mealData.meal_name || 'Bữa ăn dinh dưỡng',
      meal_type: mealData.meal_type || 'lunch',
      calories: Math.round(Number(mealData.calories) || 0),
      protein: Math.round(Number(mealData.protein) || 0),
      carbs: Math.round(Number(mealData.carbs) || 0),
      fat: Math.round(Number(mealData.fat) || 0),
      portion_grams: Math.round(Number(mealData.portion_grams) || 350),
      time: nowTime,
      dateKey: todayKey,
      userId: currentId,
    };

    setDailyState((prev) => {
      const baseMeals =
        prev.userId === currentId && prev.dateKey === todayKey ? prev.meals : [];
      return {
        dateKey: todayKey,
        userId: currentId,
        meals: [newMealEntry, ...baseMeals],
      };
    });

    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  };

  const handleRemoveMeal = async (mealId) => {
    // Nếu có db id dạng số, gọi API xóa trên Postgres
    if (typeof mealId === 'number' || !String(mealId).startsWith('meal_')) {
      try {
        await deleteMealLog(mealId);
      } catch (_) {}
    }

    setDailyState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== mealId),
    }));

    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  };

  return (
    <>
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl text-white flex flex-col justify-between">
        <div>
          {/* HEADER */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-black tracking-tight text-white">
                  Dinh Dưỡng & Macro
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hôm nay ({dailyState.dateKey}) • Tự reset 00:00</span>
              </p>
            </div>
            <span className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {currentUser?.full_name ? currentUser.full_name.split(' ').slice(-1)[0] : 'Cá nhân hóa'}
            </span>
          </div>

          {/* THANH TIẾN TRÌNH CALO CỦA RIÊNG TÀI KHOẢN NÀY */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 mb-4">
            <div className="flex items-center justify-between text-xs font-bold mb-2.5">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Flame className="w-4 h-4 text-orange-400" />
                Mục tiêu: <strong>{targetCalories} kcal</strong>
              </span>
              <span className="text-emerald-400 font-black">
                Đã nạp: {currentCalories} kcal
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mb-2.5">
              <div
                style={{ width: `${caloriePercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-orange-400 transition-all duration-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Còn lại:{' '}
                <strong className="text-indigo-400">{remainingCalories} kcal</strong>
              </span>
              <span className="font-black text-indigo-400">{caloriePercent}%</span>
            </div>
          </div>

          {/* 2 Ô CHỈ SỐ PROTEIN & CARB/FAT CÁ NHÂN HÓA */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                <Dumbbell className="w-3.5 h-3.5" /> Protein (Đạm)
              </div>
              <div className="text-2xl font-black text-white">
                {currentProtein} / {targetProtein}g
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                Phục hồi cơ bắp
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                <Award className="w-3.5 h-3.5" /> Carb / Fat
              </div>
              <div className="text-2xl font-black text-white">
                {currentCarbs}g / {currentFat}g
              </div>
              <div className="text-[11px] text-amber-400/80 mt-1">
                Mục tiêu: {targetCarbs}g / {targetFat}g
              </div>
            </div>
          </div>

          {/* 2 NÚT HÀNH ĐỘNG */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={onOpenMealTracker}
              className="cursor-pointer py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Utensils className="w-4 h-4" /> Ghi Nhận Bữa Ăn
            </button>

            <button
              type="button"
              onClick={() => setShowStudio(true)}
              className="cursor-pointer py-3 px-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
            >
              <Camera className="w-4 h-4" /> Quét Ảnh Món Ăn AI
            </button>
          </div>

          {/* DANH SÁCH BỮA ĂN CỦA RIÊNG TÀI KHOẢN NÀY */}
          {dailyState.meals.length > 0 && (
            <div className="mb-4 p-3 rounded-2xl bg-slate-950/85 border border-slate-800/90">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                <span className="flex items-center gap-1 text-lime-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bữa ăn hôm nay ({dailyState.meals.length})
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentUser?.email ? currentUser.email : 'Tài khoản cá nhân'}
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {dailyState.meals.map((meal) => {
                  const badge = MEAL_BADGE[meal.meal_type] || MEAL_BADGE.lunch;
                  return (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate">
                          {badge.icon} {meal.food_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {meal.time} • P:{meal.protein}g • C:{meal.carbs}g • F:{meal.fat}g
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-black text-orange-400 text-xs">
                          +{meal.calories} kcal
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMeal(meal.id)}
                          title="Xóa bữa này khỏi tài khoản của bạn"
                          className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CHỈ SỐ BMR & TDEE THEO CÂN NẶNG / CHIỀU CAO TÀI KHOẢN NÀY */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Chuyển hóa nền (BMR):</span>
            <strong className="text-white font-black">{bmr} kcal</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tiêu hao hàng ngày (TDEE):</span>
            <strong className="text-white font-black">{tdee} kcal</strong>
          </div>
        </div>
      </div>

      {/* STUDIO QUÉT ẢNH MÓN ĂN */}
      <AiFoodStudioModal
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        targetCalories={targetCalories}
        currentCalories={currentCalories}
        onMealAdded={handleConfirmAddMeal}
      />
    </>
  );
}
