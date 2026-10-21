// src/components/ThemeToggle.jsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ variant = 'navbar', className = '' }) {
    const { theme, toggleTheme, isDark } = useTheme();

    if (variant === 'floating') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={`fixed bottom-6 right-6 z-50 p-3 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 cursor-pointer flex items-center justify-center border ${
                    isDark
                        ? 'bg-slate-900/90 text-amber-300 border-slate-700 shadow-cyan-950/50 hover:bg-slate-800'
                        : 'bg-white/95 text-slate-800 border-gray-200 shadow-slate-300/60 hover:bg-gray-50'
                } backdrop-blur-md ${className}`}
                title={isDark ? 'Chuyển sang Chế độ Sáng (Light Mode)' : 'Chuyển sang Chế độ Tối (Dark Mode)'}
                aria-label="Toggle Theme"
            >
                {isDark ? (
                    <Sun className="w-5 h-5 animate-spin-slow text-amber-300" />
                ) : (
                    <Moon className="w-5 h-5 text-indigo-600" />
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-slate-700 border-gray-200'
            } ${className}`}
            title={isDark ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
            aria-label="Toggle Theme"
        >
            {isDark ? (
                <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline text-slate-200">Sáng</span>
                </>
            ) : (
                <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline text-slate-700">Tối</span>
                </>
            )}
        </button>
    );
}
