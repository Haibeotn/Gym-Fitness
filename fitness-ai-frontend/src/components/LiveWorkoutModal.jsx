// src/components/LiveWorkoutModal.jsx
import React, { useState, useEffect } from 'react';
import { saveWorkoutLog } from '../services/api';
import audioCoach from '../services/audioCoach';
import AudioCoachBar from './AudioCoachBar';

export default function LiveWorkoutModal({ isOpen, onClose, exercises = [], planId, onSuccess }) {
    // 1. Live Session State
    const [readinessScore, setReadinessScore] = useState(8);
    const [sessionRpe, setSessionRpe] = useState(8);
    const [notes, setNotes] = useState('');
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);

    // 2. Rest Timer State
    const [restTimeLeft, setRestTimeLeft] = useState(0);
    const [restTotal, setRestTotal] = useState(60);
    const [isRestActive, setIsRestActive] = useState(false);

    // 3. Sets State for each exercise
    const [exerciseLogs, setExerciseLogs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [finishedSummary, setFinishedSummary] = useState(null);

    // Khởi tạo danh sách các hiệp tập từ bài tập của lộ trình
    useEffect(() => {
        if (!isOpen) {
            audioCoach.stop();
            return;
        }

        const initialLogs = exercises.map((ex, exIdx) => {
            const numSets = ex.target_sets || 3;
            const targetReps = ex.target_reps ? parseInt(ex.target_reps, 10) || 10 : 10;
            const sets = Array.from({ length: numSets }, (_, i) => ({
                setNumber: i + 1,
                targetReps: targetReps,
                actualWeight: 20 + i * 5, // Gợi ý mặc định
                actualReps: targetReps,
                actualRpe: 8,
                completed: false,
                isWarmup: i === 0 && numSets > 3
            }));

            return {
                exerciseName: ex.name || `Bài tập ${exIdx + 1}`,
                mechanic: ex.mechanic || 'Compound',
                sets
            };
        });

        setExerciseLogs(initialLogs);
        setDurationSeconds(0);
        setIsTimerRunning(true);
        setFinishedSummary(null);
        setError('');

        // Welcome voice cue from Audio Coach
        setTimeout(() => {
            audioCoach.speak('Bắt đầu buổi tập hôm nay! Hãy khởi động kỹ các khớp và tập trung vào hiệp đầu tiên!', true);
        }, 300);
    }, [isOpen, exercises]);

    // Đồng hồ đếm thời gian buổi tập
    useEffect(() => {
        let interval;
        if (isOpen && isTimerRunning && !finishedSummary) {
            interval = setInterval(() => {
                setDurationSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, isTimerRunning, finishedSummary]);

    // Đồng hồ đếm ngược thời gian nghỉ giữa các hiệp (Rest Timer) + Âm thanh đếm ngược
    useEffect(() => {
        let interval;
        if (isRestActive && restTimeLeft > 0) {
            interval = setInterval(() => {
                setRestTimeLeft(prev => {
                    const next = prev - 1;
                    if (next <= 5 && next >= 0) {
                        audioCoach.speakRestCountdown(next);
                    }
                    return next;
                });
            }, 1000);
        } else if (restTimeLeft === 0) {
            setIsRestActive(false);
        }
        return () => clearInterval(interval);
    }, [isRestActive, restTimeLeft]);

    if (!isOpen) return null;

    const startRestTimer = (seconds = 60) => {
        setRestTotal(seconds);
        setRestTimeLeft(seconds);
        setIsRestActive(true);
    };

    const handleToggleSetComplete = (exIdx, setIdx) => {
        setExerciseLogs(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            const targetSet = clone[exIdx].sets[setIdx];
            targetSet.completed = !targetSet.completed;

            // Nếu vừa hoàn thành hiệp -> Tự động bật đếm ngược nghỉ 60s & phát giọng HLV
            if (targetSet.completed) {
                audioCoach.playCountdownBeep(true);
                audioCoach.speakRestStart(60);
                startRestTimer(60);
            }
            return clone;
        });
    };

    const handleSetChange = (exIdx, setIdx, field, value) => {
        setExerciseLogs(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            clone[exIdx].sets[setIdx][field] = value;
            return clone;
        });
    };

    const handleAddSet = (exIdx) => {
        setExerciseLogs(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            const sets = clone[exIdx].sets;
            const lastSet = sets[sets.length - 1];
            sets.push({
                setNumber: sets.length + 1,
                targetReps: lastSet ? lastSet.targetReps : 10,
                actualWeight: lastSet ? lastSet.actualWeight : 20,
                actualReps: lastSet ? lastSet.actualReps : 10,
                actualRpe: 8,
                completed: false,
                isWarmup: false
            });
            return clone;
        });
    };

    // Tính tổng khối lượng tạ nâng realtime (Total Volume Load)
    let liveVolumeKg = 0;
    let completedSetsCount = 0;
    let totalSetsCount = 0;

    exerciseLogs.forEach(ex => {
        ex.sets.forEach(s => {
            totalSetsCount++;
            if (s.completed) {
                completedSetsCount++;
                if (!s.isWarmup) {
                    liveVolumeKg += (parseFloat(s.actualWeight) || 0) * (parseInt(s.actualReps, 10) || 0);
                }
            }
        });
    });

    const formatTime = (totalSec) => {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleFinishWorkout = async () => {
        // Gom toàn bộ hiệp tập
        const allCompletedSets = [];
        exerciseLogs.forEach(ex => {
            ex.sets.forEach(s => {
                if (s.completed) {
                    allCompletedSets.push({
                        exerciseName: ex.exerciseName,
                        setNumber: s.setNumber,
                        actualWeight: parseFloat(s.actualWeight) || 0,
                        actualReps: parseInt(s.actualReps, 10) || 0,
                        actualRpe: parseInt(s.actualRpe, 10) || 8,
                        isWarmup: s.isWarmup
                    });
                }
            });
        });

        if (allCompletedSets.length === 0) {
            setError('Bạn chưa tích hoàn thành hiệp tập nào. Hãy đánh dấu ít nhất 1 hiệp!');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const durationMins = Math.max(1, Math.round(durationSeconds / 60));
            const res = await saveWorkoutLog({
                planId,
                readinessScore,
                sessionRpe,
                notes,
                durationMinutes: durationMins,
                sets: allCompletedSets
            });

            if (res.success) {
                const finalVolume = res.totalVolumeKg || liveVolumeKg;
                const finalSetsCount = allCompletedSets.length;
                const durationText = formatTime(durationSeconds);
                
                setFinishedSummary({
                    duration: durationText,
                    volumeKg: finalVolume,
                    setsCount: finalSetsCount
                });
                
                // Audio Coach Victory celebration
                audioCoach.speakWorkoutCompleted(finalVolume, finalSetsCount, durationText);

                if (onSuccess) onSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhật ký buổi tập.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative border border-slate-200 dark:border-slate-700/80 my-auto max-h-[92vh] overflow-y-auto space-y-5">


                {/* CELEBRATION MODAL SAU KHI KẾT THÚC BUỔI TẬP */}
                {finishedSummary ? (
                    <div className="py-8 text-center space-y-6 animate-fadeIn">
                        <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 rounded-full flex items-center justify-center text-4xl font-black mx-auto shadow-xl animate-bounce">
                            🏆
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                Xuất Sắc! Hoàn Thành Buổi Tập!
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                Toàn bộ hiệp tập và khối lượng tạ đã được ghi vào nhật ký tiến độ cá nhân của bạn.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center">
                            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Thời Gian</p>
                                <p className="text-xl font-black text-amber-500 dark:text-amber-400 mt-1">{finishedSummary.duration}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Khối Lượng Tạ</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{finishedSummary.volumeKg} <span className="text-xs">kg</span></p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Hiệp Đã Tập</p>
                                <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{finishedSummary.setsCount} <span className="text-xs">hiệp</span></p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    audioCoach.stop();
                                    onClose();
                                }}
                                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition cursor-pointer"
                            >
                                Quay Về Trang Chủ ➔
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* TOP HEADER & LIVE STATS */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Live Workout Session</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-500/30">
                                        Đang Tập Luyện
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Thời lượng: <strong className="text-amber-600 dark:text-amber-300 font-mono">{formatTime(durationSeconds)}</strong> • Tổng Volume: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{liveVolumeKg} kg</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        audioCoach.stop();
                                        onClose();
                                    }}
                                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800 shadow-2xs"
                                >
                                    Tạm dừng / Đóng
                                </button>
                                <button
                                    onClick={handleFinishWorkout}
                                    disabled={saving}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <span>🏁</span> {saving ? 'Đang lưu...' : 'Kết Thúc Buổi Tập'}
                                </button>
                            </div>
                        </div>

                        {/* AI AUDIO COACH CONTROL BAR */}
                        <AudioCoachBar currentExercise={exerciseLogs[0]?.exerciseName} />

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
                                {error}
                            </div>
                        )}

                        {/* REST TIMER COMPONENT (Đồng hồ đếm ngược thời gian nghỉ) */}
                        {isRestActive && (
                            <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-900/60 to-purple-50 dark:to-purple-900/60 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-between animate-fadeIn shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/30 flex items-center justify-center font-bold text-sm">
                                        ⏱️
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Thời Gian Nghỉ Giữa Các Hiệp</p>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300">Hít thở sâu, nạp nước và chuẩn bị cho hiệp tiếp theo (Có âm thanh đếm)</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-black text-amber-600 dark:text-amber-300 font-mono animate-pulse">
                                        {formatTime(restTimeLeft)}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setRestTimeLeft(prev => prev + 30)}
                                            className="px-2 py-1 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-800 dark:text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-2xs border border-slate-200 dark:border-transparent"
                                        >
                                            +30s
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsRestActive(false);
                                                audioCoach.stop();
                                            }}
                                            className="px-2 py-1 bg-red-100 dark:bg-red-500/30 hover:bg-red-200 dark:hover:bg-red-500/40 text-red-700 dark:text-red-200 text-[10px] font-bold rounded-lg cursor-pointer border border-red-200 dark:border-transparent"
                                        >
                                            Bỏ qua
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EXERCISE SETS TRACKER */}
                        <div className="space-y-6">
                            {exerciseLogs.map((ex, exIdx) => (
                                <div key={exIdx} className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-black flex items-center justify-center border border-blue-100 dark:border-transparent">
                                                {exIdx + 1}
                                            </span>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{ex.exerciseName}</h4>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* Button to read exercise form tips */}
                                            <button
                                                type="button"
                                                onClick={() => audioCoach.speakExerciseForm(ex.exerciseName)}
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 rounded-xl text-[11px] font-bold transition cursor-pointer"
                                                title="HLV đọc hướng dẫn kỹ thuật chuẩn"
                                            >
                                                <span>🔊</span> Hướng Dẫn Form
                                            </button>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                {ex.mechanic}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Table of Sets */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                                                    <th className="py-2 text-center w-12">Hiệp</th>
                                                    <th className="py-2">Khối Lượng (kg)</th>

                                                    <th className="py-2">Số Lần (Reps)</th>
                                                    <th className="py-2 w-20">Độ Cực (RPE)</th>
                                                    <th className="py-2 text-center w-24">Hoàn thành</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/40">
                                                {ex.sets.map((s, setIdx) => {
                                                    return (
                                                        <tr key={setIdx} className={`transition ${s.completed ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700/20'}`}>
                                                            <td className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
                                                                {s.isWarmup ? (
                                                                    <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] rounded font-extrabold uppercase border border-amber-200 dark:border-transparent">Khởi động</span>
                                                                ) : (
                                                                    `#${s.setNumber}`
                                                                )}
                                                            </td>
                                                            <td className="py-2.5">
                                                                <input
                                                                    type="number"
                                                                    value={s.actualWeight}
                                                                    onChange={(e) => handleSetChange(exIdx, setIdx, 'actualWeight', e.target.value)}
                                                                    className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-lg text-slate-900 dark:text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="py-2.5">
                                                                <input
                                                                    type="number"
                                                                    value={s.actualReps}
                                                                    onChange={(e) => handleSetChange(exIdx, setIdx, 'actualReps', e.target.value)}
                                                                    className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-lg text-slate-900 dark:text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="py-2.5">
                                                                <select
                                                                    value={s.actualRpe}
                                                                    onChange={(e) => handleSetChange(exIdx, setIdx, 'actualRpe', e.target.value)}
                                                                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-lg text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                                                                >
                                                                    <option value={6}>RPE 6 (Nhẹ)</option>
                                                                    <option value={7}>RPE 7 (Vừa)</option>
                                                                    <option value={8}>RPE 8 (Chuẩn)</option>
                                                                    <option value={9}>RPE 9 (Nặng)</option>
                                                                    <option value={10}>RPE 10 (Tối đa)</option>
                                                                </select>
                                                            </td>
                                                            <td className="py-2.5 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                                                                    className={`w-8 h-8 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center mx-auto ${
                                                                        s.completed
                                                                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                                                            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                                                                    }`}
                                                                >
                                                                    {s.completed ? '✓' : '—'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="pt-2 flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => handleAddSet(exIdx)}
                                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>➕</span> Thêm 1 hiệp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startRestTimer(90)}
                                            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                        >
                                            ⏱️ Bắt đầu nghỉ 90s
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SESSION NOTES & RATING */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Điểm Thể Lực Trước Tập (Readiness 1-10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={readinessScore}
                                        onChange={(e) => setReadinessScore(e.target.value)}
                                        className="w-full mt-1 accent-indigo-500"
                                    />
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{readinessScore}/10 ({readinessScore >= 8 ? 'Rất sung sức 🔥' : readinessScore >= 5 ? 'Bình thường 👌' : 'Hơi mệt 🥱'})</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Độ Nặng Cả Buổi Tập (Session RPE 1-10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={sessionRpe}
                                        onChange={(e) => setSessionRpe(e.target.value)}
                                        className="w-full mt-1 accent-amber-500"
                                    />
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{sessionRpe}/10 ({sessionRpe >= 9 ? 'Cực kỳ nặng mỏi 💥' : sessionRpe >= 7 ? 'Vừa vặn hiệu quả 💪' : 'Nhẹ nhàng 🌿'})</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Cảm nhận / Ghi chú buổi tập
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Hôm nay form Squat xuống sâu và chắc hơn, không bị đau lưng..."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 mt-1"
                                />
                            </div>
                        </div>

                        {/* BOTTOM ACTION */}
                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                                Đóng lại
                            </button>
                            <button
                                type="button"
                                onClick={handleFinishWorkout}
                                disabled={saving}
                                className="px-7 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <span>🏁</span> {saving ? 'Đang lưu nhật ký...' : 'Xác Nhận Hoàn Thành Buổi Tập ⚡'}
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
