// src/components/dashboard/WorkoutScheduleSection.jsx
import React from 'react';
import { Plus, TrendingUp, Play, Trash2, ShieldAlert } from 'lucide-react';
import { getMuscleTagStyle } from '../WorkoutStudioGenerator';

export default function WorkoutScheduleSection({
  filteredExercises,
  exerciseMuscleFilter,
  setExerciseMuscleFilter,
  onOpenLibrary,
  onOpenProgress,
  onOpenLiveWorkout,
  onRemoveExercise,
}) {
  const muscleChips = [
    { id: 'all', label: 'Tất cả' },
    { id: 'Chest', label: 'Ngực' },
    { id: 'Back', label: 'Lưng & Xô' },
    { id: 'Shoulders', label: 'Vai' },
    { id: 'Biceps', label: 'Tay' },
    { id: 'Quadriceps', label: 'Chân & Mông' },
    { id: 'Core', label: 'Bụng & Core' },
    { id: 'Full Body', label: 'Toàn thân' }
  ];

  return (
    <div id="workout-schedule-section" className="space-y-4">
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
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Tự động gán tag nhóm cơ, cú pháp, dụng cụ & hướng dẫn form chuẩn
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenLibrary}
              className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Thêm Từ Thư Viện
            </button>
            <button
              onClick={onOpenProgress}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <TrendingUp className="w-4 h-4 text-blue-500" /> Tiến Độ
            </button>
            <button
              onClick={onOpenLiveWorkout}
              className="px-4.5 py-2.5 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-orange-700 text-white text-xs sm:text-sm font-black rounded-xl transition shadow-md hover:shadow-orange-500/20 cursor-pointer flex items-center gap-1.5 animate-pulse active:scale-95"
              title="Tập luyện trực tiếp có Huấn Luyện Viên Giọng Nói AI đếm nhịp & nhắc form"
            >
              <Play className="w-4 h-4 fill-current" /> Bắt Đầu Tập
            </button>
          </div>
        </div>

        {/* Muscle Group Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm no-scrollbar">
          <span className="text-xs font-bold text-gray-400 uppercase shrink-0">Lọc cơ:</span>
          {muscleChips.map(chip => (
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
                    
                    {exercise.phase_title && (
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        {exercise.phase_title}
                      </span>
                    )}

                    {exercise.primary_muscle && (
                      <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-lg border ${muscleStyle}`}>
                        {exercise.primary_muscle}
                      </span>
                    )}

                    <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                      {exercise.mechanic || exercise.type || 'Compound'}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300 pl-0 sm:pl-10 leading-relaxed">
                    {exercise.instructions || exercise.description || 'Thực hiện động tác đúng form, kiểm soát nhịp thở và gồng chặt cơ mục tiêu.'}
                  </p>

                  {(exercise.target_sets || exercise.target_reps) && (
                    <div className="flex flex-wrap items-center gap-3 pl-0 sm:pl-10 text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        <span>Mục tiêu: {exercise.target_sets || 3} hiệp x {exercise.target_reps || '10-12'} lần {exercise.target_rpe ? `(RPE ${exercise.target_rpe}/10)` : ''}</span>
                      </div>
                      {exercise.tempo && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Tempo {exercise.tempo}
                        </span>
                      )}
                      {exercise.rest_seconds && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Nghỉ {exercise.rest_seconds}s
                        </span>
                      )}
                    </div>
                  )}

                  {exercise.coaching_tip && (
                    <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 pl-0 sm:pl-10 flex items-center gap-1.5">
                      <span>💡</span> <strong>HLV dặn dò:</strong> <span>{exercise.coaching_tip}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-10 pt-1 text-xs sm:text-sm">
                    {exercise.equipment_required && Array.isArray(exercise.equipment_required) && exercise.equipment_required.length > 0 ? (
                      exercise.equipment_required.map((eq, eqIdx) => (
                        <span key={eqIdx} className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {eq}
                        </span>
                      ))
                    ) : (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                        Bodyweight (Không tạ)
                      </span>
                    )}

                    {exercise.avoid_if && (
                      <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900/40">
                        <ShieldAlert className="w-3.5 h-3.5" /> Tránh nếu: {exercise.avoid_if}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRemoveExercise(index)}
                    title="Xóa bài tập này"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 text-slate-500">
          Không tìm thấy bài tập nào phù hợp với bộ lọc hiện tại.
        </div>
      )}
    </div>
  );
}
