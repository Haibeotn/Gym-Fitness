// src/components/LoadingFallback.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingFallback({ message = "Đang tải dữ liệu..." }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-900/40 border-t-indigo-600 animate-spin"></div>
        <Loader2 className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );
}
