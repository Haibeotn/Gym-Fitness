// src/components/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
    Calendar, Clock, User, QrCode, CheckCircle2, AlertCircle, X, 
    Sparkles, Star, Dumbbell, MapPin, ShieldCheck, ChevronRight,
    RefreshCw, Copy, Check, ThumbsUp, Send, ScanLine
} from 'lucide-react';
import { 
    fetchTrainersList, fetchTrainerAvailability, createBooking, 
    fetchMyBookings, updateBookingStatus, checkInBooking, reviewBooking 
} from '../services/api';

const TOPIC_SUGGESTIONS = [
    { label: '💪 Ngực & Tay Sau (Chest & Triceps)', icon: '🏋️' },
    { label: '🔥 Lưng Xô & Tay Trước (Back & Biceps)', icon: '⚡' },
    { label: '🦵 Chân & Mông Toàn Diện (Legs & Glutes)', icon: '🔥' },
    { label: '🛡️ Vai Càng & Bụng Sáu Múi (Shoulders & Abs)', icon: '🎯' },
    { label: '🚀 Sửa Kỹ Thuật Form (Squat/Bench/Deadlift)', icon: '🔬' },
    { label: '🥗 Tư Vấn Dinh Dưỡng & Đo InBody Chi Tiết', icon: '📊' }
];

export default function BookingModal({ isOpen, onClose, user, initialTab = 'tickets', defaultTrainerId = null }) {
    const [activeTab, setActiveTab] = useState(initialTab); // 'tickets', 'book', 'scan'
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [sessionTopic, setSessionTopic] = useState(TOPIC_SUGGESTIONS[0].label);
    const [notes, setNotes] = useState('');
    
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [slotLoading, setSlotLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Active ticket view & QR display
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [copiedCode, setCopiedCode] = useState(false);

    // PT / Kiosk Scanner state
    const [manualCodeInput, setManualCodeInput] = useState('');
    const [checkInResult, setCheckInResult] = useState(null);

    // Review state
    const [reviewingBookingId, setReviewingBookingId] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedTrainer && selectedDate) {
            loadSlots(selectedTrainer.trainer_id || selectedTrainer.id, selectedDate);
        }
    }, [selectedTrainer, selectedDate]);

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [trainersRes, bookingsRes] = await Promise.all([
                fetchTrainersList().catch(() => ({ trainers: [] })),
                fetchMyBookings().catch(() => ({ bookings: [] }))
            ]);

            const tList = trainersRes.trainers || [];
            setTrainers(tList);
            setBookings(bookingsRes.bookings || []);

            if (defaultTrainerId) {
                const found = tList.find(t => (t.trainer_id === defaultTrainerId || t.id === defaultTrainerId));
                if (found) setSelectedTrainer(found);
            } else if (tList.length > 0 && !selectedTrainer) {
                setSelectedTrainer(tList[0]);
            }

            // Auto-select latest active ticket if available
            const activeBk = (bookingsRes.bookings || []).find(b => b.status === 'confirmed');
            if (activeBk) {
                setSelectedTicket(activeBk);
            } else if ((bookingsRes.bookings || []).length > 0) {
                setSelectedTicket(bookingsRes.bookings[0]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải dữ liệu lịch tập.');
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async (trainerId, date) => {
        setSlotLoading(true);
        setSelectedSlot(null);
        try {
            const res = await fetchTrainerAvailability(trainerId, date);
            setAvailableSlots(res.availableSlots || []);
        } catch (err) {
            setAvailableSlots([]);
        } finally {
            setSlotLoading(false);
        }
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        if (!selectedTrainer || !selectedSlot) {
            setError('Vui lòng chọn Huấn luyện viên và Khung giờ tập khả dụng!');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await createBooking({
                trainerId: selectedTrainer.trainer_id || selectedTrainer.id,
                bookingDate: selectedDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                sessionTopic,
                notes
            });

            setSuccessMessage('🎉 Đặt lịch thành công! Vé điện tử và mã QR Check-in đã sẵn sàng.');
            // Refresh bookings list
            const bRes = await fetchMyBookings();
            setBookings(bRes.bookings || []);
            setSelectedTicket(res.booking);
            setActiveTab('tickets');
            setTimeout(() => setSuccessMessage(null), 4500);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckInSubmit = async (codeToUse) => {
        const code = (codeToUse || manualCodeInput).trim();
        if (!code) {
            setError('Vui lòng nhập mã Check-in QR!');
            return;
        }

        setLoading(true);
        setError(null);
        setCheckInResult(null);
        try {
            const res = await checkInBooking({ checkinCode: code });
            setCheckInResult(res);
            setManualCodeInput('');
            // Refresh bookings
            const bRes = await fetchMyBookings();
            setBookings(bRes.bookings || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Mã Check-in không hợp lệ hoặc không tìm thấy.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy lịch tập này không?')) return;
        setLoading(true);
        try {
            await updateBookingStatus(bookingId, { status: 'cancelled', cancelReason: 'Khách hàng yêu cầu hủy lịch' });
            const bRes = await fetchMyBookings();
            setBookings(bRes.bookings || []);
            if (selectedTicket && selectedTicket.id === bookingId) {
                setSelectedTicket(prev => ({ ...prev, status: 'cancelled' }));
            }
            setSuccessMessage('Đã hủy lịch tập thành công.');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể hủy lịch tập.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (bookingId) => {
        try {
            await reviewBooking(bookingId, { rating: reviewRating, reviewText: reviewComment });
            setReviewingBookingId(null);
            setSuccessMessage('⭐ Cảm ơn bạn đã gửi đánh giá buổi tập!');
            const bRes = await fetchMyBookings();
            setBookings(bRes.bookings || []);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi đánh giá.');
        }
    };

    const copyCheckinCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    if (!isOpen) return null;

    const isPt = user?.role === 'pt';

    return (
        <div className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/20 dark:shadow-cyan-950/40 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-100 via-indigo-50/60 to-slate-100 dark:from-slate-900 dark:via-indigo-950/50 dark:to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Lịch Tập &amp; Vé Check-in QR
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-semibold">
                                    {isPt ? 'PT Portal' : 'Smart Check-in'}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isPt ? 'Quản lý ca dạy & Quét mã QR đón tiếp học viên' : 'Đặt lịch 1-1 cùng HLV & Quét mã check-in tại quầy'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadInitialData}
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-cyan-500 dark:text-cyan-400' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                    <button
                        onClick={() => { setActiveTab('tickets'); setError(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 ${
                            activeTab === 'tickets'
                                ? 'border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-bold'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                        <QrCode className="w-4 h-4" />
                        {isPt ? `Lịch Dạy & Học Viên (${bookings.length})` : `Vé Tập Của Tôi (${bookings.length})`}
                    </button>

                    {!isPt && (
                        <button
                            onClick={() => { setActiveTab('book'); setError(null); }}
                            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 ${
                                activeTab === 'book'
                                    ? 'border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-bold'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                            }`}
                        >
                            <Calendar className="w-4 h-4" />
                            + Đặt Lịch Mới Với PT
                        </button>
                    )}

                    <button
                        onClick={() => { setActiveTab('scan'); setError(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 ${
                            activeTab === 'scan'
                                ? 'border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-bold'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                        <ScanLine className="w-4 h-4" />
                        Quét Mã QR Check-in
                    </button>
                </div>

                {/* Notifications */}
                {successMessage && (
                    <div className="mx-6 mt-4 p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="mx-6 mt-4 p-3.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-transparent">
                    
                    {/* TAB 1: TICKETS & ACTIVE PASSES */}
                    {activeTab === 'tickets' && (
                        <div>
                            {bookings.length === 0 ? (
                                <div className="text-center py-12 px-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                                        <Calendar className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Chưa có lịch tập nào</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
                                        {isPt ? 'Bạn chưa có ca dạy nào được học viên đặt.' : 'Hãy đặt một buổi tập 1-1 với Huấn luyện viên thể hình để tối ưu hóa vóc dáng!'}
                                    </p>
                                    {!isPt && (
                                        <button
                                            onClick={() => setActiveTab('book')}
                                            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-cyan-500/20"
                                        >
                                            + Đặt lịch tập ngay
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* List on left */}
                                    <div className="lg:col-span-5 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                            Danh sách ca tập ({bookings.length})
                                        </h4>
                                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                                            {bookings.map((b) => {
                                                const isSelected = selectedTicket?.id === b.id;
                                                const isCheckedIn = b.checkin_status === 'checked_in' || b.status === 'completed';
                                                const isCancelled = b.status === 'cancelled';

                                                return (
                                                    <div
                                                        key={b.id}
                                                        onClick={() => setSelectedTicket(b)}
                                                        className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                                                            isSelected 
                                                                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500' 
                                                                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                                            <div className="font-semibold text-slate-900 dark:text-white text-sm">
                                                                {isPt ? (b.client_name || 'Học viên') : (b.trainer_name || 'HLV Cá Nhân')}
                                                            </div>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                                isCheckedIn 
                                                                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                                                    : isCancelled 
                                                                        ? 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
                                                                        : 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 animate-pulse'
                                                            }`}>
                                                                {isCheckedIn ? '✓ Đã Check-in' : isCancelled ? 'Đã Hủy' : 'Sẵn Sàng'}
                                                            </span>
                                                        </div>

                                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-1">
                                                            <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            <span>{b.booking_date}</span>
                                                            <span>•</span>
                                                            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            <span>{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</span>
                                                        </div>

                                                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                                                            🎯 {b.session_topic || 'Buổi tập cá nhân hóa'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Ticket Showcase on right */}
                                    <div className="lg:col-span-7">
                                        {selectedTicket ? (
                                            <div className="bg-white dark:bg-gradient-to-b dark:from-slate-800/90 dark:to-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                                                {/* Top Accent Ribbon */}
                                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

                                                <div className="flex items-center justify-between mb-4 mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">🎟️</span>
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            VÉ TẬP GYM 1-1 VIP PASS
                                                        </h3>
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                                                        <span>Fitness AI Center - VIP Zone</span>
                                                    </div>
                                                </div>

                                                {/* Holographic QR Code Box */}
                                                <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center max-w-[220px] mx-auto mb-4 shadow-xl border border-slate-200 dark:border-transparent">
                                                    <QRCodeSVG 
                                                        value={selectedTicket.checkin_code || `GYM-CHK-${selectedTicket.id}`}
                                                        size={170}
                                                        level="H"
                                                        includeMargin={true}
                                                    />
                                                    <div className="text-slate-900 font-mono text-xs font-bold mt-2 tracking-wider">
                                                        {selectedTicket.checkin_code || `GYM-CHK-${selectedTicket.id}`}
                                                    </div>
                                                </div>

                                                {/* Copy Code Bar */}
                                                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 mb-4">
                                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                                        Mã Check-in: <span className="font-mono text-cyan-600 dark:text-cyan-300 font-bold">{selectedTicket.checkin_code}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyCheckinCode(selectedTicket.checkin_code)}
                                                        className="text-xs flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
                                                    >
                                                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                        {copiedCode ? 'Đã chép' : 'Sao chép'}
                                                    </button>
                                                </div>

                                                {/* Details Grid */}
                                                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isPt ? 'Học viên:' : 'Huấn luyện viên:'}</span>
                                                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                                                            {isPt ? selectedTicket.client_name : selectedTicket.trainer_name}
                                                        </span>
                                                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                                            📞 {isPt ? selectedTicket.client_phone : selectedTicket.trainer_phone || '0901.888.999'}
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Thời gian buổi tập:</span>
                                                        <span className="font-bold text-cyan-600 dark:text-cyan-300 text-sm">
                                                            {selectedTicket.start_time?.slice(0, 5)} - {selectedTicket.end_time?.slice(0, 5)}
                                                        </span>
                                                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                                            📅 Ngày {selectedTicket.booking_date}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Mục tiêu &amp; Nội dung buổi tập:</span>
                                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                                            {selectedTicket.session_topic || 'Buổi tập phát triển thể chất cùng HLV'}
                                                        </span>
                                                        {selectedTicket.notes && (
                                                            <div className="text-slate-500 dark:text-slate-400 italic text-[11px] mt-1">
                                                                Ghi chú: "{selectedTicket.notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                                                    {selectedTicket.status === 'confirmed' && selectedTicket.checkin_status !== 'checked_in' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleCancelBooking(selectedTicket.id)}
                                                                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"
                                                            >
                                                                Hủy lịch tập này
                                                            </button>

                                                            {isPt && (
                                                                <button
                                                                    onClick={() => handleCheckInSubmit(selectedTicket.checkin_code)}
                                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    Xác nhận Check-in ca này
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="w-full flex items-center justify-between">
                                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                {selectedTicket.checked_in_at 
                                                                    ? `Đã check-in lúc ${new Date(selectedTicket.checked_in_at).toLocaleTimeString('vi-VN')}` 
                                                                    : 'Buổi tập đã hoàn tất'}
                                                            </span>

                                                            {/* Rating review for member */}
                                                            {!isPt && !selectedTicket.rating && (
                                                                <button
                                                                    onClick={() => setReviewingBookingId(selectedTicket.id)}
                                                                    className="text-xs px-3 py-1.5 bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20 rounded-lg font-medium flex items-center gap-1 transition"
                                                                >
                                                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                                    Đánh giá PT ⭐
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Review Box Inline */}
                                                {reviewingBookingId === selectedTicket.id && (
                                                    <div className="mt-3 p-3 bg-amber-50 dark:bg-slate-950/80 border border-yellow-500/30 rounded-2xl animate-fadeIn">
                                                        <div className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-2">Đánh giá chất lượng buổi tập cùng PT:</div>
                                                        <div className="flex items-center gap-1 mb-2">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => setReviewRating(s)}
                                                                    className="p-1 hover:scale-110 transition"
                                                                >
                                                                    <Star className={`w-5 h-5 ${s <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                                                </button>
                                                            ))}
                                                            <span className="text-xs text-yellow-700 dark:text-yellow-300 font-bold ml-2">({reviewRating}/5 Sao)</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Nhập cảm nhận của bạn (vd: HLV rất nhiệt tình, sửa form chuẩn...)"
                                                            value={reviewComment}
                                                            onChange={(e) => setReviewComment(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-yellow-400 mb-2"
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setReviewingBookingId(null)}
                                                                className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                                            >
                                                                Đóng
                                                            </button>
                                                            <button
                                                                onClick={() => handleSubmitReview(selectedTicket.id)}
                                                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-lg transition"
                                                            >
                                                                Gửi đánh giá
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center p-8 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 text-sm">
                                                Chọn một buổi tập ở danh sách bên trái để xem vé QR.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: BOOK A NEW SLOT */}
                    {activeTab === 'book' && (
                        <form onSubmit={handleCreateBooking} className="space-y-6 max-w-2xl mx-auto">
                            
                            {/* Step 1: Select PT */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    1. Chọn Huấn Luyện Viên (PT)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {trainers.map((t) => {
                                        const isSelected = (selectedTrainer?.trainer_id || selectedTrainer?.id) === (t.trainer_id || t.id);
                                        return (
                                            <div
                                                key={t.trainer_id || t.id}
                                                onClick={() => setSelectedTrainer(t)}
                                                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                                                    isSelected
                                                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                                                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                                                    {t.avatar_url ? (
                                                        <img src={t.avatar_url} alt={t.full_name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        t.full_name?.charAt(0) || 'PT'
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                                                        <span className="truncate">{t.full_name}</span>
                                                        <span className="text-yellow-500 dark:text-yellow-400 text-xs flex items-center gap-0.5">
                                                            ★ {t.rating || '5.0'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium truncate">
                                                        {t.specialization || 'Master Trainer Thể Hình'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                        👥 {t.active_clients_count || 0} học viên đang theo học
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2: Select Date & Available Time Slots */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        2. Chọn Ngày Tập
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        3. Khung Giờ Khả Dụng ({availableSlots.length} ca trống)
                                    </label>
                                    
                                    {slotLoading ? (
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                                            Đang kiểm tra lịch trống của PT...
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="p-3 bg-amber-50 dark:bg-slate-800/40 rounded-xl border border-amber-200 dark:border-slate-800 text-xs text-amber-700 dark:text-amber-400">
                                            Không còn khung giờ trống trong ngày này. Vui lòng chọn ngày khác!
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                            {availableSlots.map((slot, idx) => {
                                                const isSlotSelected = selectedSlot?.startTime === slot.startTime;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`p-2 rounded-xl text-xs font-semibold border transition ${
                                                            isSlotSelected
                                                                ? 'bg-cyan-500 text-white dark:text-slate-950 border-cyan-400 font-bold shadow-md'
                                                                : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        ⏰ {slot.startTime} - {slot.endTime}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Session Topic Focus */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    4. Mục Tiêu &amp; Nhóm Cơ Trọng Tâm
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                    {TOPIC_SUGGESTIONS.map((t, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSessionTopic(t.label)}
                                            className={`p-2.5 rounded-xl text-xs text-left border transition flex items-center gap-2 ${
                                                sessionTopic === t.label
                                                    ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 text-cyan-800 dark:text-cyan-300 font-semibold'
                                                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <span className="text-base">{t.icon}</span>
                                            <span className="truncate">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 4: Notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    5. Ghi chú thêm cho Huấn Luyện Viên (Tùy chọn)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Ví dụ: Em muốn tập trung sửa form Bench Press và tăng tạ..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !selectedSlot}
                                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {loading ? 'Đang xử lý đặt lịch...' : 'Xác Nhận Đặt Lịch & Nhận Vé QR'}
                            </button>
                        </form>
                    )}

                    {/* TAB 3: SCAN / CHECK-IN QR */}
                    {activeTab === 'scan' && (
                        <div className="max-w-xl mx-auto space-y-6 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/30">
                                <ScanLine className="w-8 h-8 text-white" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    Quét / Nhập Mã QR Check-in Phòng Tập
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                    Dành cho Huấn luyện viên hoặc Học viên check-in tại quầy trước khi bắt đầu buổi tập.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 text-left shadow-sm">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Mã Check-in (Từ Vé QR Học Viên)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: GYM-CHK-1001-..."
                                        value={manualCodeInput}
                                        onChange={(e) => setManualCodeInput(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-600 dark:text-cyan-300 focus:outline-none focus:border-cyan-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCheckInSubmit()}
                                        disabled={loading || !manualCodeInput.trim()}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                                    >
                                        {loading ? 'Đang kiểm tra...' : 'Xác Nhận'}
                                    </button>
                                </div>
                            </div>

                            {/* Check-in result banner */}
                            {checkInResult && (
                                <div className="p-5 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/60 dark:to-slate-900 border border-emerald-500/50 rounded-2xl text-left animate-fadeIn shadow-xl">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base mb-2">
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                        <span>{checkInResult.message}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 block">Học viên:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{checkInResult.booking?.client_name || 'Học viên'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 block">Huấn luyện viên:</span>
                                            <span className="font-bold text-cyan-600 dark:text-cyan-300">{checkInResult.booking?.trainer_name || 'HLV Cá Nhân'}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-slate-500 dark:text-slate-400 block">Số buổi còn lại trong gói:</span>
                                            <span className="font-bold text-amber-600 dark:text-yellow-400 text-sm">
                                                {checkInResult.booking?.remaining_sessions !== undefined 
                                                    ? `${checkInResult.booking.remaining_sessions} Buổi` 
                                                    : 'Gói tập tự do'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Hệ thống Check-in thời gian thực kết nối bảo mật với Fitness Database</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-xl transition cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
}
