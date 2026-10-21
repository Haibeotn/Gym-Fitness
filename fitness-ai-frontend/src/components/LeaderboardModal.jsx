// src/components/LeaderboardModal.jsx
import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../services/api';

export default function LeaderboardModal({ isOpen, onClose }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myStats, setMyStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchLeaderboard();
            if (res.success) {
                setLeaderboard(res.leaderboard || []);
                setMyStats(res.myStats);
            }
        } catch (err) {
            console.error('Lỗi tải bảng xếp hạng:', err);
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

    const currentUserId = parseInt(localStorage.getItem('fitness_user_id'), 10);

    return (
        <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-60 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative border border-slate-200 dark:border-slate-700/80 max-h-[88vh] overflow-y-auto space-y-6 transition-colors duration-300">

                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold">
                                🏆
                            </span>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Bảng Vinh Danh &amp; Thành Tích</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Xếp hạng học viên chăm chỉ và tổng khối lượng tạ tích lũy toàn phòng tập.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold text-xl cursor-pointer p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Personal Streaks & Badge Banner */}
                {myStats && (
                    <div className="bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/20 dark:via-orange-500/20 dark:to-red-500/20 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4.5 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <span className="text-2xl animate-bounce">🔥</span>
                                <div>
                                    <h4 className="text-sm font-black text-amber-700 dark:text-amber-300">
                                        Chuỗi Lửa Tập Luyện: {myStats.streakDays || 1} Ngày Liên Tiếp
                                    </h4>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                        Tổng khối lượng tạ nâng cá nhân: <strong className="text-slate-900 dark:text-white">{myStats.totalVolume.toLocaleString()} kg</strong> ({myStats.totalWorkouts} buổi)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {myStats.badges && myStats.badges.length > 0 && (
                            <div className="pt-1 border-t border-amber-200 dark:border-amber-500/20 flex flex-wrap gap-2">
                                {myStats.badges.map((badge, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white dark:bg-slate-900/80 border border-amber-300 dark:border-amber-500/40 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                                    >
                                        <span className="font-bold text-amber-700 dark:text-amber-300">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard Table */}
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs">Đang đồng bộ bảng vàng...</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span>🥇</span> Top 10 Quái Vật Tạ Của Phòng Gym:
                        </h4>

                        {leaderboard.length > 0 ? (
                            leaderboard.map((user) => {
                                const isMe = user.userId === currentUserId;
                                const rankIcon = user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`;

                                return (
                                    <div
                                        key={user.userId}
                                        className={`p-3.5 rounded-2xl flex items-center justify-between transition border ${
                                            isMe
                                                ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 text-center text-base font-black text-amber-500 dark:text-amber-400">
                                                {rankIcon}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                        {user.name}
                                                    </p>
                                                    {isMe && (
                                                        <span className="px-2 py-0.2 bg-indigo-600 text-white text-[9px] font-extrabold rounded">
                                                            BẠN
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {user.totalWorkouts} buổi tập hoàn thành
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                                                {user.totalVolumeKg.toLocaleString()} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">kg</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Tổng Volume Lifted</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                                Chưa có học viên nào ghi nhận buổi tập. Hãy là người đầu tiên leo rank!
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
