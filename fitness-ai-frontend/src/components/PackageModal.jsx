// src/components/PackageModal.jsx
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
    CreditCard, QrCode, CheckCircle2, AlertCircle, X, Sparkles, 
    Copy, Check, Clock, ShieldCheck, History, ArrowRight, RefreshCw, 
    Smartphone, Landmark, Flame, UserCheck, MessageSquare, Crown, Zap
} from 'lucide-react';
import { 
    fetchPackages, fetchTrainersList, createPaymentOrder, 
    verifyPaymentOrder, fetchMyPaymentHistory, cancelPaymentOrder 
} from '../services/api';
import { getMemberTierInfo } from '../utils/tierBadge';

export default function PackageModal({ isOpen, onClose, onSuccess, onOpenAuth, initialTab = 'packages', currentPackage = null }) {
    const [activeTab, setActiveTab] = useState(initialTab); // 'packages', 'checkout', 'history'
    const [packages, setPackages] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('vietqr'); // 'vietqr' | 'momo'
    
    // Checkout state
    const [currentPayment, setCurrentPayment] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [countdown, setCountdown] = useState(900); // 15 mins
    const [verifying, setVerifying] = useState(false);
    
    // History state
    const [history, setHistory] = useState([]);
    
    // Status feedback
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        loadInitialData();
    }, [isOpen]);

    // Countdown timer for pending order
    useEffect(() => {
        if (activeTab === 'checkout' && currentPayment && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [activeTab, currentPayment, countdown]);

    const loadInitialData = async () => {
        setLoading(true);
        setError('');
        try {
            const [pkgRes, trainerRes, histRes] = await Promise.all([
                fetchPackages().catch(() => ({ packages: [] })),
                fetchTrainersList().catch(() => ({ trainers: [] })),
                fetchMyPaymentHistory().catch(() => ({ payments: [] }))
            ]);

            setPackages(pkgRes.packages || []);
            // Filter out any admin accidentally returned in trainers
            const actualTrainers = (trainerRes.trainers || []).filter(t => t.full_name !== 'Quản Trị Viên Hệ Thống' && t.role !== 'admin');
            setTrainers(actualTrainers);
            setHistory(histRes.payments || []);

            if (actualTrainers.length > 0 && !selectedTrainer) {
                setSelectedTrainer(actualTrainers[0]);
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu gói tập:", err);
            setError('Không thể tải danh sách gói tập lúc này.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPackageForPayment = async (pkg) => {
        const token = localStorage.getItem('fitness_token');
        if (!token) {
            if (onOpenAuth) onOpenAuth();
            return;
        }

        setSelectedPackage(pkg);
        setLoading(true);
        setError('');
        try {
            const res = await createPaymentOrder({
                packageId: pkg.id,
                trainerId: selectedTrainer?.trainer_id || selectedTrainer?.id || 1,
                paymentMethod
            });

            if (res.success) {
                setCurrentPayment(res);
                setCountdown(res.expiresInSeconds || 900);
                setActiveTab('checkout');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tạo đơn thanh toán.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async () => {
        if (!currentPayment?.payment?.transaction_code) return;
        setVerifying(true);
        setError('');
        try {
            const res = await verifyPaymentOrder(currentPayment.payment.transaction_code);
            if (res.success) {
                setSuccessMsg(`Kích hoạt thành công gói ${res.package?.name || 'tập'}! Bạn có ${res.userPackage?.remaining_sessions || 0} buổi tập.`);
                if (onSuccess) onSuccess();
                setTimeout(() => {
                    setActiveTab('history');
                    loadInitialData();
                }, 1800);
            } else {
                setError(res.message || 'Chưa nhận được giao dịch. Vui lòng thử lại sau 30 giây.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi xác thực đơn hàng.');
        } finally {
            setVerifying(false);
        }
    };

    const handleCancelOrder = async (transactionCode) => {
        if (!window.confirm('Bạn có chắc muốn hủy đơn chuyển khoản này?')) return;
        try {
            await cancelPaymentOrder(transactionCode);
            setCurrentPayment(null);
            setActiveTab('packages');
            loadInitialData();
        } catch (err) {
            alert('Không thể hủy đơn: ' + (err.response?.data?.message || err.message));
        }
    };

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    const currentTier = getMemberTierInfo({}, currentPackage);

    // Standardized 3 paid packages matching backend IDs 1, 2, 3
    const pkg12 = packages.find(p => p.session_count === 12) || { id: 1, name: 'Gói Khởi Động (12 Buổi)', session_count: 12, price: 3600000 };
    const pkg24 = packages.find(p => p.session_count === 24) || { id: 2, name: 'Gói Tiến Bộ (24 Buổi)', session_count: 24, price: 6800000 };
    const pkg36 = packages.find(p => p.session_count === 36) || { id: 3, name: 'Gói Chuyên Sâu (36 Buổi)', session_count: 36, price: 9500000 };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 dark:bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-7xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 transition-colors duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                Nâng Cấp Gói Tập &amp; Cổng Thanh Toán VietQR
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                                    Napas 24/7 Tự Động
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Đồng hành cùng Huấn luyện viên thể hình &amp; Kích hoạt tự động</p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40">
                    <button
                        onClick={() => { setActiveTab('packages'); setError(''); }}
                        className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition border-b-2 ${
                            activeTab === 'packages'
                                ? 'border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                        <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        Danh Sách Gói Tập Phân Hạng
                    </button>

                    {currentPayment && (
                        <button
                            onClick={() => { setActiveTab('checkout'); setError(''); }}
                            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition border-b-2 ${
                                activeTab === 'checkout'
                                    ? 'border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                            }`}
                        >
                            <QrCode className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                            Đơn Đang Chuyển Khoản
                        </button>
                    )}

                    <button
                        onClick={() => { setActiveTab('history'); setError(''); }}
                        className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition border-b-2 ${
                            activeTab === 'history'
                                ? 'border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        Lịch Sử Giao Dịch ({history.length})
                    </button>
                </div>

                {/* Feedback Banners */}
                {successMsg && (
                    <div className="mx-6 mt-4 p-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-3 text-sm animate-fadeIn">
                        <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500 dark:text-emerald-400" />
                        <div className="flex-1 font-semibold">{successMsg}</div>
                    </div>
                )}

                {error && (
                    <div className="mx-6 mt-4 p-3.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                    
                    {/* TAB 1: 4-COLUMN HORIZONTAL PRICING TIERS */}
                    {activeTab === 'packages' && (
                        <div className="space-y-6">
                            
                            {/* PT Selection Bar */}
                            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                        Huấn Luyện Viên Đồng Hành Kèm 1-1
                                    </label>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Chọn PT mong muốn để được duyệt giáo án &amp; kèm riêng</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {trainers.map((t) => {
                                        const isSelected = (selectedTrainer?.trainer_id || selectedTrainer?.id) === (t.trainer_id || t.id);
                                        return (
                                            <div
                                                key={t.trainer_id || t.id}
                                                onClick={() => setSelectedTrainer(t)}
                                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                                    isSelected
                                                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/50 shadow-md'
                                                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                                                    {t.full_name?.charAt(0) || 'PT'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-xs">
                                                        <span className="truncate">{t.full_name}</span>
                                                        <span className="text-amber-500 dark:text-amber-400 font-bold">★ {t.rating || '4.95'}</span>
                                                    </div>
                                                    <div className="text-[11px] text-cyan-600 dark:text-cyan-300 truncate mt-0.5">
                                                        {t.specialization}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="w-5 h-5 rounded-full bg-cyan-500 text-white dark:text-slate-950 flex items-center justify-center text-xs font-black shrink-0">
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 4-COLUMN HORIZONTAL PRICING CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                                
                                {/* COLUMN 1: MIỄN PHÍ */}
                                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 shadow-sm transition">
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Miễn phí</span>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Dùng thử AI</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed min-h-[48px]">
                                                Khám phá cách AI lên lịch tập, thực đơn dinh dưỡng và phân tích chỉ số thể hình cơ bản.
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900 dark:text-white">0 ₫</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">/ tháng</span>
                                            </div>
                                        </div>

                                        <button
                                            disabled
                                            className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700/60 cursor-default text-center"
                                        >
                                            {currentPackage ? 'Gói cơ bản' : 'Gói hiện tại của bạn'}
                                        </button>

                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                            <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Bắt đầu với những điều cơ bản:</p>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                <span>Trò chuyện và tạo lịch tập AI</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                <span>Tính toán Macro BMR &amp; TDEE</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                <span>Lưu trữ nhật ký cân nặng</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                <span>Giọng nói AI Audio Coach đếm nhịp</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 2: GÓI KHỞI ĐỘNG (12 BUỔI) */}
                                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-orange-300 dark:hover:border-slate-700 shadow-sm transition">
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">🥉 Bronze Member</span>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Gói Khởi Động</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed min-h-[48px]">
                                                Lý tưởng cho người mới bắt đầu làm quen form chuẩn và xây dựng kỷ luật cùng PT 1-1.
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{Number(pkg12.price).toLocaleString('vi-VN')} ₫</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">/ 12 buổi</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">~ 300.000 ₫ / buổi tập kèm</p>
                                        </div>

                                        <button
                                            onClick={() => handleSelectPackageForPayment(pkg12)}
                                            disabled={loading}
                                            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer text-center"
                                        >
                                            Nâng cấp Khởi Động ➔
                                        </button>

                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                            <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Mọi thứ trong gói Free, cộng thêm:</p>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                <span><strong>12 buổi kèm 1-1 trực tiếp</strong> cùng PT</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                <span>PT duyệt &amp; tinh chỉnh giáo án riêng</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                <span>Sửa form Squat/Deadlift chống đau mỏi</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                <span>Cấp vé QR Check-in VIP tại phòng tập</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 3: GÓI TIẾN BỘ (24 BUỔI) - BEST SELLER */}
                                <div className="bg-blue-50/70 dark:bg-gradient-to-b dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-950 border-2 border-blue-500 rounded-3xl p-5 flex flex-col justify-between shadow-xl shadow-blue-500/10 dark:shadow-blue-950/50 relative">
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                                        🔥 Phổ Biến Nhất
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">🥈 Silver Pro</span>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Gói Tiến Bộ</h3>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed min-h-[48px]">
                                                Tối ưu hóa thể trạng, xây dựng cơ bắp và giảm mỡ rõ rệt với lộ trình tăng tiến bền vững.
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-blue-600 dark:text-cyan-400">{Number(pkg24.price).toLocaleString('vi-VN')} ₫</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">/ 24 buổi</span>
                                            </div>
                                            <p className="text-[10px] text-blue-600 dark:text-cyan-300 mt-0.5 font-medium">~ 283.000 ₫ / buổi tập kèm</p>
                                        </div>

                                        <button
                                            onClick={() => handleSelectPackageForPayment(pkg24)}
                                            disabled={loading}
                                            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-cyan-900/20 dark:shadow-cyan-950/50 transition cursor-pointer text-center"
                                        >
                                            Nâng cấp Gói Tiến Bộ ⚡
                                        </button>

                                        <div className="pt-3 border-t border-blue-200 dark:border-slate-800 space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                                            <p className="font-semibold text-blue-700 dark:text-cyan-400 text-[11px] uppercase tracking-wider">Mọi thứ trong gói 12 Buổi, cộng thêm:</p>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                                                <span><strong>24 buổi đồng hành chuyên sâu</strong> 1-1</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Thực đơn dinh dưỡng ven đường linh hoạt</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Chat trực tiếp 1-1 cùng PT 24/7</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Xuất báo cáo &amp; chứng nhận tiến độ 4K</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Ưu tiên bảo lưu buổi tập khi có việc bận</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 4: GÓI TOÀN DIỆN VIP (36 BUỔI) */}
                                <div className="bg-amber-50/60 dark:bg-slate-900/80 border border-amber-300 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm transition">
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">👑 VIP Gold Champion</span>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Gói Toàn Diện VIP</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed min-h-[48px]">
                                                Chương trình cam kết lột xác vóc dáng đỉnh cao dành cho học viên quyết tâm thay đổi toàn diện.
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{Number(pkg36.price).toLocaleString('vi-VN')} ₫</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">/ 36 buổi</span>
                                            </div>
                                            <p className="text-[10px] text-amber-700 dark:text-amber-300/80 mt-0.5 font-medium">~ 266.000 ₫ / buổi (Tiết kiệm nhất)</p>
                                        </div>

                                        <button
                                            onClick={() => handleSelectPackageForPayment(pkg36)}
                                            disabled={loading}
                                            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-900/20 dark:shadow-amber-950/40 transition cursor-pointer text-center"
                                        >
                                            Nâng cấp VIP Toàn Diện 👑
                                        </button>

                                        <div className="pt-3 border-t border-amber-200 dark:border-slate-800/80 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                                            <p className="font-semibold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wider">Mọi thứ trong gói 24 Buổi, cộng thêm:</p>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <span><strong>36 buổi kèm 1-1 toàn diện</strong> cam kết kết quả</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <span>Đo chỉ số InBody &amp; Phân tích cơ mỡ định kỳ</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <span>Ưu tiên giữ ca tập khung giờ vàng (Peak Hours)</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <span>HLV trưởng trực tiếp theo dõi &amp; cố vấn 24/7</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* TAB 2: VIETQR / MOMO CHECKOUT */}
                    {activeTab === 'checkout' && currentPayment && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Hết hạn sau: {formatTime(countdown)}</span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quét Mã VietQR Chuyển Khoản Tự Động</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Mở ứng dụng ngân hàng hoặc MoMo quét mã QR dưới đây. Hệ thống sẽ tự động kích hoạt ngay sau khi nhận tiền.
                                </p>

                                {/* QR Code Display */}
                                <div className="flex justify-center py-2">
                                    <div className="p-4 bg-white rounded-3xl shadow-2xl inline-block border-4 border-cyan-500/30">
                                        {currentPayment.vietQrUrl ? (
                                            <img 
                                                src={currentPayment.vietQrUrl} 
                                                alt="VietQR Payment" 
                                                className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                                            />
                                        ) : (
                                            <QRCodeSVG 
                                                value={`2|99|0988776655|FITNESS AI|${currentPayment.payment?.transfer_content || ''}|0|0|${currentPayment.payment?.amount || 0}`}
                                                size={220}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Bank details with copy buttons */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-3 text-xs">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/80">
                                        <span className="text-slate-500 dark:text-slate-400">Ngân hàng thụ hưởng:</span>
                                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <Landmark className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                            MB Bank (Ngân hàng Quân Đội)
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/80">
                                        <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">62405082006</span>
                                            <button
                                                onClick={() => copyToClipboard('62405082006', 'account')}
                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                                title="Sao chép STK"
                                            >
                                                {copiedField === 'account' ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/80">
                                        <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">FITNESS AI GYM VIETNAM</span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/80">
                                        <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm font-mono">
                                                {Number(currentPayment.payment?.amount || 0).toLocaleString('vi-VN')} VNĐ
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(String(currentPayment.payment?.amount), 'amount')}
                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                                title="Sao chép số tiền"
                                            >
                                                {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-1 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                                        <span className="text-amber-700 dark:text-amber-300 font-semibold">Nội dung chuyển khoản (Bắt buộc):</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-xs">
                                                {currentPayment.payment?.transfer_content}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(currentPayment.payment?.transfer_content, 'content')}
                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white"
                                                title="Sao chép nội dung CK"
                                            >
                                                {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Button */}
                                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleVerifyPayment}
                                        disabled={verifying}
                                        className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white dark:text-slate-950 font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                                        <span>{verifying ? 'Đang kiểm tra giao dịch...' : 'Tôi Đã Chuyển Khoản Thành Công ✓'}</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleCancelOrder(currentPayment.payment?.transaction_code)}
                                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                    >
                                        Hủy đơn
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PAYMENT HISTORY */}
                    {activeTab === 'history' && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {history.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs space-y-2">
                                    <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                                    <p>Chưa có lịch sử giao dịch nào.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((h) => (
                                        <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">{h.transaction_code}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        h.status === 'completed' ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                                                        h.status === 'pending' ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30' :
                                                        'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30'
                                                    }`}>
                                                        {h.status === 'completed' ? '✓ Thành công' : h.status === 'pending' ? '⏳ Chờ thanh toán' : 'Đã hủy'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{h.package_name}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    HLV: {h.trainer_name || 'Coach Minh Tuấn'} • Ngày: {new Date(h.created_at).toLocaleString('vi-VN')}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                                                    {Number(h.amount).toLocaleString('vi-VN')} ₫
                                                </div>
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">{h.payment_method}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Disclaimer */}
                <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-slate-900/60 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Bảo mật giao dịch tiêu chuẩn Napas 247 &amp; Mã hóa SSL 256-bit
                    </span>
                    <button 
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition cursor-pointer text-xs font-semibold"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
}
