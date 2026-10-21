// src/components/ProgressAnalyticsModal.jsx
import React, { useState, useEffect } from 'react';
import { fetchProgressAnalytics, fetchWorkoutHistory, logWeightProgress } from '../services/api';

export default function ProgressAnalyticsModal({ isOpen, onClose, onWeightUpdated }) {
    const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'history' | 'weight'
    const [analytics, setAnalytics] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form Log Weight State
    const [newWeight, setNewWeight] = useState('');
    const [newFat, setNewFat] = useState('');
    const [weightNotes, setWeightNotes] = useState('');
    const [weightLoading, setWeightLoading] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 4000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, historyRes] = await Promise.allSettled([
                fetchProgressAnalytics(),
                fetchWorkoutHistory()
            ]);

            if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success) {
                setAnalytics(analyticsRes.value);
            }
            if (historyRes.status === 'fulfilled' && historyRes.value?.success) {
                setHistory(historyRes.value.history || []);
            }
        } catch (err) {
            console.error("Lỗi tải tiến độ:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLogWeight = async (e) => {
        e.preventDefault();
        setWeightLoading(true);
        try {
            const res = await logWeightProgress({
                weight: parseFloat(newWeight),
                bodyFatPercentage: newFat ? parseFloat(newFat) : null,
                notes: weightNotes
            });

            if (res.success) {
                showToast("✅ Đã cập nhật cân nặng thành công!");
                setNewWeight('');
                setNewFat('');
                setWeightNotes('');
                loadData();
                if (onWeightUpdated) onWeightUpdated();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Không thể lưu cân nặng.");
        } finally {
            setWeightLoading(false);
        }
    };

    const summary = analytics?.summary || {};
    const weightHistory = analytics?.weightHistory || [];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-5xl xl:max-w-6xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto space-y-6 transition-colors duration-300">
                
                {toast && (
                    <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl text-sm sm:text-base font-black animate-fadeIn flex items-center gap-2">
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold shadow-sm shrink-0">
                            📈
                        </div>
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Nhật Ký Tiến Độ &amp; Thống Kê Tập Luyện
                            </h3>
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
                                Theo dõi khối lượng tạ tích lũy, tần suất tập và biểu đồ thay đổi thể trọng.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xl flex items-center justify-center transition cursor-pointer self-end sm:self-center"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 max-w-xl">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'analytics'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>⚡</span> Tổng Quan Tiến Độ
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'history'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>📜</span> Lịch Sử Buổi Tập ({history.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('weight')}
                        className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'weight'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>⚖️</span> Cập Nhật Cân Nặng
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Đang đồng bộ dữ liệu tiến độ...</p>
                    </div>
                ) : (
                    <>
                        {/* TAB 1: TỔNG QUAN TIẾN ĐỘ */}
                        {activeTab === 'analytics' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                                    <div className="bg-slate-50 dark:bg-slate-800/70 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
                                        <p className="text-xs sm:text-sm uppercase font-black text-amber-600 dark:text-amber-400 tracking-wider">
                                            BUỔI ĐÃ TẬP
                                        </p>
                                        <p className="text-4xl sm:text-5xl font-black text-amber-500 dark:text-amber-300 my-2">
                                            {summary.totalWorkouts || 0}
                                        </p>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            Hoàn thành đúng mục tiêu
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/70 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
                                        <p className="text-xs sm:text-sm uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                                            TỔNG VOLUME TẠ
                                        </p>
                                        <div className="my-2">
                                            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-600 dark:text-emerald-400">
                                                {Number(summary.totalVolumeLifted || 0).toLocaleString('vi-VN')}
                                            </span>
                                            <span className="text-base sm:text-lg font-bold text-emerald-600/80 dark:text-emerald-400/80 ml-1.5">
                                                kg
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            Tích lũy tạ đã nâng
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/70 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
                                        <p className="text-xs sm:text-sm uppercase font-black text-blue-600 dark:text-blue-400 tracking-wider">
                                            THỜI LƯỢNG TB
                                        </p>
                                        <div className="my-2">
                                            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-600 dark:text-blue-400">
                                                {summary.avgDurationMinutes || 0}
                                            </span>
                                            <span className="text-base sm:text-lg font-bold text-blue-600/80 dark:text-blue-400/80 ml-1.5">
                                                phút
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            Mỗi buổi tập
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/70 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
                                        <p className="text-xs sm:text-sm uppercase font-black text-purple-600 dark:text-purple-400 tracking-wider">
                                            RPE TRUNG BÌNH
                                        </p>
                                        <div className="my-2">
                                            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-purple-600 dark:text-purple-400">
                                                {summary.avgSessionRpe || 0}
                                            </span>
                                            <span className="text-base sm:text-lg font-bold text-purple-600/80 dark:text-purple-400/80 ml-1.5">
                                                /10
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            Mức độ gắng sức
                                        </p>
                                    </div>
                                </div>

                                {/* Weight Progression List */}
                                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                                    <h4 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>⚖️</span> Lịch Sử Biến Động Cân Nặng
                                    </h4>
                                    {weightHistory.length === 0 ? (
                                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 py-6 text-center">
                                            Chưa có bản ghi cân nặng nào. Hãy bấm sang tab "Cập Nhật Cân Nặng" để bắt đầu theo dõi!
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
                                            {weightHistory.map((w) => (
                                                <div key={w.id} className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center shadow-xs hover:border-amber-500/50 transition">
                                                    <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                                                        {new Date(w.recorded_at).toLocaleDateString('vi-VN')}
                                                    </p>
                                                    <p className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-300 my-1">
                                                        {w.weight} <span className="text-xs sm:text-sm">kg</span>
                                                    </p>
                                                    {w.body_fat_percentage && (
                                                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 inline-block mt-1">
                                                            {w.body_fat_percentage}% mỡ
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: LỊCH SỬ BUỔI TẬP */}
                        {activeTab === 'history' && (
                            <div className="space-y-4 animate-fadeIn">
                                {history.length === 0 ? (
                                    <div className="p-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-sm sm:text-base border border-slate-200 dark:border-slate-700/40 font-medium">
                                        Bạn chưa hoàn thành buổi tập nào. Bấm nút "Vào Buổi Tập Live" trên Dashboard để bắt đầu buổi đầu tiên!
                                    </div>
                                ) : (
                                    history.map((log) => (
                                        <div key={log.id} className="bg-slate-50 dark:bg-slate-800/60 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-600 transition">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-300">
                                                        📅 {new Date(log.started_at).toLocaleDateString('vi-VN')} ({new Date(log.started_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                                                    </p>
                                                    <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                                                        Thời gian tập: {log.duration_minutes || 45} phút • Volume: {Number(log.total_volume_kg || 0).toLocaleString('vi-VN')} kg
                                                    </p>
                                                </div>
                                                <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 self-start sm:self-center">
                                                    Độ gắng sức: RPE {log.session_rpe || 8}/10
                                                </span>
                                            </div>

                                            {log.notes && (
                                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/40 italic">
                                                    "{log.notes}"
                                                </p>
                                            )}

                                            {/* Hiển thị tóm tắt các bài & hiệp */}
                                            {log.sets && log.sets.length > 0 && (
                                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/40">
                                                    <p className="text-xs sm:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                                        Chi tiết các hiệp đã đẩy:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {log.sets.map((s, idx) => (
                                                             <span key={idx} className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold shadow-2xs">
                                                                {s.exercise_name}: <strong>{s.actual_weight}kg</strong> x {s.actual_reps} reps
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* TAB 3: CẬP NHẬT CÂN NẶNG */}
                        {activeTab === 'weight' && (
                            <form onSubmit={handleLogWeight} className="bg-slate-50 dark:bg-slate-800/60 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-5 max-w-lg mx-auto animate-fadeIn">
                                <div className="text-center space-y-1.5">
                                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                        Ghi Nhận Cân Nặng Hôm Nay
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Theo dõi định kỳ vào buổi sáng sau khi thức dậy để có độ chính xác cao nhất.
                                    </p>
                                </div>

                                <div className="space-y-4 text-sm sm:text-base">
                                    <div>
                                        <label className="font-black text-slate-700 dark:text-slate-200 block mb-1">
                                            Cân Nặng (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            value={newWeight}
                                            onChange={(e) => setNewWeight(e.target.value)}
                                            placeholder="VD: 72.5"
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3.5 rounded-2xl text-slate-900 dark:text-white font-mono text-lg font-bold focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-black text-slate-700 dark:text-slate-200 block mb-1">
                                            Tỷ Lệ Mỡ Cơ Thể % (Tùy chọn)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newFat}
                                            onChange={(e) => setNewFat(e.target.value)}
                                            placeholder="VD: 18.5"
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3.5 rounded-2xl text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-black text-slate-700 dark:text-slate-200 block mb-1">
                                            Ghi chú thể trạng (Tùy chọn)
                                        </label>
                                        <input
                                            type="text"
                                            value={weightNotes}
                                            onChange={(e) => setWeightNotes(e.target.value)}
                                            placeholder="VD: Cảm thấy người gọn hơn, cơ bụng rõ hơn..."
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={weightLoading || !newWeight}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg transition cursor-pointer disabled:opacity-50 active:scale-95 mt-3"
                                    >
                                        {weightLoading ? 'Đang lưu...' : 'Lưu Chỉ Số Cân Nặng ⚡'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
