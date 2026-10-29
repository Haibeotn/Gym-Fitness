// src/components/dashboard/AiReasoningModal.jsx
import React from 'react';
import { X, Sparkles, Flame, Apple, ShieldCheck } from 'lucide-react';

export default function AiReasoningModal({ isOpen, onClose, data, aiReasoning, protein, fat, carbs }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100">
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Cơ Sở Khoa Học & Luận Điểm AI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Minh bạch thuật toán & công thức tính toán dinh dưỡng, phân bố bài tập
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* 1. Công thức năng lượng */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 1. Công Thức Tính Năng Lượng (Mifflin-St Jeor)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {aiReasoning?.bmr_explanation || `BMR tính toán dựa trên cân nặng ${data?.weight || 70}kg, chiều cao ${data?.height || 170}cm và giới tính ${data?.gender === 'female' ? 'Nữ' : 'Nam'}.`}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {aiReasoning?.tdee_explanation || `TDEE phản ánh tổng năng lượng tiêu hao kết hợp chuyển hóa nền và hệ số vận động.`}
            </p>
          </div>

          {/* 2. Mục tiêu calo */}
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-blue-500" /> 2. Chiến Lược Calo Mục Tiêu ({data?.goal || 'Cải thiện vóc dáng'})
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-200/90 leading-relaxed">
              {aiReasoning?.calorie_strategy || `Lượng calo được điều chỉnh nhằm đạt tốc độ thay đổi thể trạng bền vững mà không gây suy kiệt trao đổi chất.`}
            </p>
          </div>

          {/* 3. Phân bổ Macro */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
              <Apple className="w-4 h-4 text-emerald-500" /> 3. Phân Bổ Macro Dinh Dưỡng
            </h4>
            <ul className="text-xs text-emerald-800 dark:text-emerald-200/90 space-y-1 list-disc list-inside">
              <li>{aiReasoning?.macro_breakdown?.protein || `Protein (${protein || 0}g): Đảm bảo khối lượng cơ nạc được bảo vệ và tái tạo tối đa.`}</li>
              <li>{aiReasoning?.macro_breakdown?.fat || `Chất béo (${fat || 0}g): Duy trì sức khỏe hệ nội tiết và màng tế bào.`}</li>
              <li>{aiReasoning?.macro_breakdown?.carb || `Carbohydrate (${carbs || 0}g): Cung cấp nguồn năng lượng chính cho các bài tập nặng.`}</li>
            </ul>
          </div>

          {/* 4. Safety Rules */}
          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-2">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> 4. Kiểm Soát An Toàn (Safety Rules)
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
              Các bài tập có nguy cơ chấn thương hoặc yêu cầu thiết bị ngoài phòng tập/dụng cụ khả dụng đã được Calculation Engine tự động loại trừ. Khi tham gia gói tập có PT, Huấn luyện viên sẽ là người duyệt và tinh chỉnh cuối cùng.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
