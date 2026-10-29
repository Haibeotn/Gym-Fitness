// src/components/dashboard/OverviewHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, MessageSquare } from 'lucide-react';

export default function OverviewHeader({
  goal,
  weight,
  height,
  age,
  aiAdvice,
  onOpenReasoning,
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 1. Header tổng quan thể trạng */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Tổng Quan Lộ Trình
            </h1>
            <span className="px-3 py-1 text-xs sm:text-sm font-bold rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              {goal || 'Giảm mỡ'}
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
            Thể trạng: <span className="font-bold text-gray-800 dark:text-slate-200">{weight} kg</span> • Chiều cao: <span className="font-bold text-gray-800 dark:text-slate-200">{height} cm</span> • Tuổi: <span className="font-bold text-gray-800 dark:text-slate-200">{age}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onOpenReasoning} 
            className="px-4.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Lý giải AI</span>
          </button>
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="px-4.5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Khảo sát lại</span>
          </button>
        </div>
      </header>

      {/* 2. Lời khuyên Huấn luyện viên AI */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-wide">Lời Khuyên Huấn Luyện Viên AI</h2>
        </div>
        <p className="text-sm sm:text-base text-blue-50 leading-relaxed whitespace-pre-line font-medium">
          {aiAdvice || "HLV đang phân tích thể trạng của bạn để đưa ra lời dặn chuẩn xác nhất..."}
        </p>
      </div>
    </div>
  );
}
