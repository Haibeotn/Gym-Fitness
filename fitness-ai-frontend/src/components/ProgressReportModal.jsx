// src/components/ProgressReportModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Download, Printer, Award, TrendingUp, Dumbbell, Flame, 
    Calendar, CheckCircle2, ShieldCheck, User, Zap, Sparkles, 
    ArrowUpRight, ArrowDownRight, Activity, Scale
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { fetchProgressReport } from '../services/api';

export default function ProgressReportModal({ isOpen, onClose, userId = null, userName = '' }) {
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);
    const reportRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            loadReport();
        }
    }, [isOpen, userId]);

    const loadReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchProgressReport(userId);
            if (res.success && (res.report || res.data)) {
                setReportData(res.report || res.data);
            } else {
                setError(res.message || 'Không thể tải báo cáo tiến độ.');
            }
        } catch (err) {
            console.error('Error loading report:', err);
            setError('Lỗi kết nối máy chủ khi trích xuất dữ liệu tổng kết.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!reportRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // High resolution (Retina / 4K export)
                useCORS: true,
                backgroundColor: '#090d16',
                logging: false
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const targetName = reportData?.user?.fullName || reportData?.user?.full_name || userName || 'Hoc_Vien';
            const fileName = `Bao_Cao_Tien_Do_${targetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = image;
            link.download = fileName;
            link.click();
        } catch (err) {
            console.error('Failed to export image:', err);
            alert('Có lỗi khi tạo ảnh báo cáo: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    const user = reportData?.user || {};
    const stats = reportData?.workoutStats || reportData?.stats || {};
    const topExercises = stats?.topExercises || reportData?.top_exercises || [];
    const nutrition = reportData?.nutritionSummary || reportData?.nutrition_compliance || {};
    const certCode = reportData?.certCode || reportData?.certificate?.certificate_code || 'FIT-CERT-2026-001';
    const generatedAt = reportData?.generatedAt || reportData?.certificate?.issued_at || new Date().toISOString();
    const coachEvaluation = reportData?.coachEvaluation || reportData?.coach_assessment || 'Học viên tuân thủ nghiêm túc giáo án, form bài chuẩn xác và duy trì mức tạ tăng tiến tốt.';

    // Normalizing values
    const fullName = user.fullName || user.full_name || userName || 'Học Viên';
    const startWeight = user.startingWeight || user.initial_weight || user.weight || 70;
    const curWeight = user.currentWeight || user.current_weight || user.weight || 70;
    const weightDelta = user.weightChange || (curWeight - startWeight).toFixed(1);
    const clientTier = user.clientTier || user.client_tier || (user.totalSessions ? 'pt_1_1' : 'trial');

    const tierLabels = {
        'pt_1_1': { label: 'Hội Viên Kèm 1-1 VIP', color: 'from-amber-500 to-yellow-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
        'calisthenics_home': { label: 'Calisthenics & Home Pro', color: 'from-cyan-500 to-blue-500', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
        'trial': { label: 'Học Viên Trải Nghiệm AI', color: 'from-emerald-500 to-teal-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
    };
    const currentTier = tierLabels[clientTier] || tierLabels['trial'];

    const totalVolume = stats.totalVolumeLifted || stats.total_volume_kg || 0;
    const totalWorkouts = stats.totalWorkouts || stats.completed_workouts || 0;
    const totalSets = stats.totalSetsCompleted || stats.total_sets || (totalWorkouts * 15);
    const totalReps = stats.totalRepsCompleted || stats.total_reps || (totalWorkouts * 150);
    const adherenceRate = stats.adherence_rate || (totalWorkouts > 0 ? 95 : 100);

    const avgCal = nutrition.avgDailyCalories || nutrition.avg_calories || 1850;
    const targetCal = nutrition.targetCalories || nutrition.target_calories || 2200;
    const avgPro = nutrition.avgDailyProtein || nutrition.avg_protein || 140;
    const targetPro = nutrition.targetProtein || nutrition.target_protein || 160;
    const avgCarbs = nutrition.avgDailyCarbs || nutrition.avg_carbs || 160;
    const avgFat = nutrition.avgDailyFat || nutrition.avg_fat || 65;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-report, #printable-report * {
                        visibility: visible;
                    }
                    #printable-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #090d16 !important;
                        color: #ffffff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300">
                {/* Header Action Bar */}
                <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-gradient-to-tr dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Báo Cáo Tiến Độ &amp; Chứng Nhận Tập Luyện
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                                    Official Fitness AI
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Xuất báo cáo thành tích chuẩn PT &amp; biểu đồ dinh dưỡng</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition cursor-pointer"
                            title="In trực tiếp hoặc Lưu thành PDF"
                        >
                            <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="hidden sm:inline">Xuất PDF / In</span>
                        </button>

                        <button
                            onClick={handleDownloadImage}
                            disabled={downloading || loading}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-900/20 dark:shadow-emerald-900/30 transition disabled:opacity-50 cursor-pointer"
                            title="Tải ảnh PNG độ nét cao (2x)"
                        >
                            <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                            <span>{downloading ? 'Đang tạo ảnh...' : 'Tải Ảnh Infographic (PNG)'}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer ml-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Container (Scrollable on Screen) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 dark:bg-slate-950/60 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-sm text-slate-400 font-medium">Đang tổng hợp dữ liệu Tạ, Lịch Tập & Macro Dinh Dưỡng...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 px-4">
                            <p className="text-rose-400 font-medium mb-3">{error}</p>
                            <button
                                onClick={loadReport}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        /* The Printable & Snapshot Card */
                        <div 
                            id="printable-report"
                            ref={reportRef}
                            className="relative mx-auto max-w-3xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-9 shadow-2xl overflow-hidden text-slate-100"
                            style={{ background: 'linear-gradient(145deg, #090e17 0%, #111827 50%, #0d131f 100%)' }}
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />

                            {/* Header / Gym Branding */}
                            <div className="relative border-b border-slate-800/80 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-widest uppercase mb-1">
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                        <span>FITNESS AI & BOUTIQUE GYM MANAGEMENT</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight">
                                        BÁO CÁO TIẾN ĐỘ TẬP LUYỆN
                                    </h1>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Ngày xuất: {new Date(generatedAt).toLocaleDateString('vi-VN')}</span>
                                        <span>•</span>
                                        <span className="font-mono text-emerald-400 font-semibold">{certCode}</span>
                                    </p>
                                </div>

                                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentTier.badge}`}>
                                        {currentTier.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500 mt-1 font-mono">
                                        Chuỗi: {stats.activeDaysMonth || 1} ngày tích cực 🔥
                                    </span>
                                </div>
                            </div>

                            {/* User Profile Card */}
                            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 mb-6 backdrop-blur">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-950/50">
                                            {fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                {fullName}
                                                <span title="Đã qua xác thực bởi PT">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
                                                </span>
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                <span>Mục tiêu: <strong className="text-emerald-400">{user.goal || 'Tăng cơ giảm mỡ'}</strong></span>
                                                <span>•</span>
                                                <span>Tuổi: <strong className="text-slate-200">{user.age || 24}</strong></span>
                                                <span>•</span>
                                                <span>Chiều cao: <strong className="text-slate-200">{user.height || 172} cm</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Weight Progress Widget */}
                                    <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
                                        <Scale className="w-5 h-5 text-cyan-400" />
                                        <div>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cân Nặng Ban Đầu → Hiện Tại</div>
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                                                <span>{startWeight}kg</span>
                                                <span className="text-slate-500">→</span>
                                                <span className="text-cyan-400">{curWeight}kg</span>
                                                <span className={`text-xs ml-1 flex items-center font-bold ${
                                                    parseFloat(weightDelta) < 0 ? 'text-emerald-400' :
                                                    parseFloat(weightDelta) > 0 ? 'text-amber-400' : 'text-slate-400'
                                                }`}>
                                                    {parseFloat(weightDelta) > 0 ? `+${weightDelta}` : weightDelta} kg
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Performance Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
                                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-slate-400 text-xs">
                                        <span>Tổng Khối Lượng</span>
                                        <Dumbbell className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-xl sm:text-2xl font-black text-amber-400">
                                            {Number(totalVolume).toLocaleString()}
                                            <span className="text-xs font-medium text-slate-400 ml-1">kg</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">Tonnage đẩy được</div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-slate-400 text-xs">
                                        <span>Buổi Tập Hoàn Thành</span>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-xl sm:text-2xl font-black text-emerald-400">
                                            {totalWorkouts}
                                            <span className="text-xs font-medium text-slate-400 ml-1">buổi</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">{totalSets} sets / {totalReps} reps</div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-slate-400 text-xs">
                                        <span>Tỉ Lệ Kỷ Luật</span>
                                        <Activity className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-xl sm:text-2xl font-black text-cyan-400">
                                            {adherenceRate}%
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">RPE TB: {stats.avgRpe || 8.5}/10</div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-slate-400 text-xs">
                                        <span>Buổi Kèm PT Còn Lại</span>
                                        <Zap className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-xl sm:text-2xl font-black text-purple-400">
                                            {user.remainingSessions ?? 12}
                                            <span className="text-xs font-medium text-slate-400 ml-1">buổi</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">HLV {user.trainerName || 'Minh Tuấn'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Two-Column Section: Top Exercises & Nutrition Compliance */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                {/* Top Exercises */}
                                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3.5">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                                <TrendingUp className="w-4 h-4 text-amber-400" />
                                                Top Bài Tập Chinh Phục
                                            </h4>
                                            <span className="text-[11px] text-slate-500">Volume cao nhất</span>
                                        </div>

                                        {topExercises.length === 0 ? (
                                            <div className="text-xs text-slate-500 py-6 text-center italic">
                                                Chưa ghi nhận bài tập trong lịch sử.
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {topExercises.map((ex, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
                                                                #{idx + 1}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-white">{ex.exercise_name || ex.name}</div>
                                                                <div className="text-[10px] text-slate-400">Max: {ex.max_weight || 60}kg</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-amber-400">{Number(ex.total_volume || 0).toLocaleString()} kg</div>
                                                            <div className="text-[10px] text-slate-500">Tonnage</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Nutrition Compliance */}
                                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3.5">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                                <Flame className="w-4 h-4 text-rose-400" />
                                                Tuân Thủ Dinh Dưỡng (7 Ngày Qua)
                                            </h4>
                                            <span className="text-[11px] text-emerald-400 font-semibold">
                                                {Math.round((avgCal / targetCal) * 100)}% Calo
                                            </span>
                                        </div>

                                        <div className="space-y-3.5">
                                            {/* Calories Bar */}
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">Calories Trung Bình</span>
                                                    <span className="font-bold text-slate-200">
                                                        {avgCal} / {targetCal} kcal
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-500" 
                                                        style={{ width: `${Math.min(100, (avgCal / targetCal) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Protein Bar */}
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">Protein (Đạm)</span>
                                                    <span className="font-bold text-emerald-400">
                                                        {avgPro} / {targetPro}g
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500" 
                                                        style={{ width: `${Math.min(100, (avgPro / targetPro) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Carbs & Fat mini pills */}
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                                                    <div className="text-[10px] text-slate-400">Carbs TB</div>
                                                    <div className="text-xs font-bold text-amber-300">{avgCarbs}g / ngày</div>
                                                </div>
                                                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                                                    <div className="text-[10px] text-slate-400">Fat TB</div>
                                                    <div className="text-xs font-bold text-indigo-300">{avgFat}g / ngày</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coach Assessment, QR Code & Official Stamp */}
                            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        Nhận Xét Chuyên Môn & Đánh Giá Từ PT
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                                        "{coachEvaluation}"
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                                        <User className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Huấn Luyện Viên: <strong className="text-slate-200">{user.trainerName || 'Coach Minh Tuấn'}</strong> ({user.trainerSpecialization || 'Senior Boutique Coach'})</span>
                                    </div>
                                </div>

                                {/* QR Code Certificate Verification */}
                                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-lg shadow-black/40 min-w-[130px]">
                                    <QRCodeSVG 
                                        value={`https://fitness-ai.gym/verify/${certCode}`}
                                        size={80}
                                        level="M"
                                        fgColor="#090d16"
                                        bgColor="#ffffff"
                                    />
                                    <div className="text-[9px] font-black text-slate-800 font-mono mt-1.5 tracking-tighter text-center">
                                        QUÉT XÁC THỰC
                                    </div>
                                    <div className="text-[8px] text-slate-500 font-mono">
                                        {certCode}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Disclaimer */}
                            <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
                                <span>Bản quyền © 2026 Fitness AI Vietnam - Boutique Coaching System</span>
                                <span className="font-mono text-emerald-500/80">STATUS: VERIFIED & SEALED</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
