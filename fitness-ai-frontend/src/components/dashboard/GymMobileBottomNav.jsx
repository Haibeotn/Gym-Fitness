// src/components/dashboard/GymMobileBottomNav.jsx
import React from 'react';
import { Dumbbell, Utensils, Play, MessageSquare, User } from 'lucide-react';

export default function GymMobileBottomNav({
  activeTab,
  onSelectTab,
  unreadChatCount = 0,
  onStartLiveWorkout,
  isRegistered,
  onOpenAuth,
}) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Lịch tập (Workouts) */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('workout');
            const target = document.getElementById('workout-schedule-section');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'workout'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <Dumbbell className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Lịch tập</span>
        </button>

        {/* 2. Dinh dưỡng (Nutrition) */}
        <button
          type="button"
          onClick={() => onSelectTab('mealTracker')}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-emerald-500 transition"
        >
          <Utensils className="w-5 h-5 mb-0.5 text-emerald-500" />
          <span className="text-[10px] tracking-tight">Dinh dưỡng</span>
        </button>

        {/* 3. Nút nổi chính giữa: TẬP NGAY (Live Workout) */}
        <button
          type="button"
          onClick={onStartLiveWorkout}
          className="relative -top-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition transform border-2 border-white dark:border-slate-900 ring-2 ring-indigo-500/30"
          title="Bắt đầu buổi tập trực tiếp (Live Workout)"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>

        {/* 4. Chat Coach */}
        <button
          type="button"
          onClick={() => {
            if (!isRegistered) {
              onOpenAuth();
            } else {
              onSelectTab('chat');
            }
          }}
          className="relative flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-indigo-500 transition"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 mb-0.5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">HLV Chat</span>
        </button>

        {/* 5. Hồ sơ (Profile) */}
        <button
          type="button"
          onClick={() => {
            if (!isRegistered) {
              onOpenAuth();
            } else {
              onSelectTab('profile');
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-indigo-500 transition"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Hồ sơ</span>
        </button>
      </div>
    </nav>
  );
}
