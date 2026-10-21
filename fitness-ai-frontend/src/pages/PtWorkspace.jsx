// src/pages/PtWorkspace.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Dumbbell, Calendar, MessageSquare, CheckCircle2, 
    AlertCircle, Search, Clock, Award, ShieldCheck, Flame, 
    ChevronRight, Plus, Trash2, Edit3, Save, LogOut, Home, 
    Phone, Mail, Activity, Sparkles, QrCode, TrendingUp, Scale, Zap
} from 'lucide-react';
import { 
    fetchPtClients, fetchPtClientPlan, approvePtClientPlan, 
    deductPtClientSession, expelPtClient, loginUser, fetchMyBookings, 
    updateBookingStatus, checkInBooking, fetchUnreadCount 
} from '../services/api';
import ChatModal from '../components/ChatModal';
import BookingModal from '../components/BookingModal';
import ProgressReportModal from '../components/ProgressReportModal';
import { getMemberTierInfo } from '../utils/tierBadge';
import ThemeToggle from '../components/ThemeToggle';

export default function PtWorkspace() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(localStorage.getItem('fitness_role') || 'member');
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // Selected client for Master-Detail view
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'pending' | 'pt_1_1' | 'calisthenics'

    // Client Detail Sub-tabs
    const [detailTab, setDetailTab] = useState('workout'); // 'workout' | 'nutrition' | 'bookings' | 'history'

    // PT Override Plan Editor State
    const [clientPlanData, setClientPlanData] = useState(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [editorWorkout, setEditorWorkout] = useState([]);
    const [editorNutrition, setEditorNutrition] = useState({});
    const [editorAdvice, setEditorAdvice] = useState('');
    const [savingPlan, setSavingPlan] = useState(false);

    // Modals
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatInitialMode, setChatInitialMode] = useState('pt');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showExpelConfirmModal, setShowExpelConfirmModal] = useState(false);
    const [expelLoading, setExpelLoading] = useState(false);
    
    // Session Deduction State
    const [deductModalClient, setDeductModalClient] = useState(null);
    const [deductNotes, setDeductNotes] = useState('');
    const [deductRpe, setDeductRpe] = useState(8);
    const [deductLoading, setDeductLoading] = useState(false);

    // Toast feedback
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [clientRes, bookRes, unreadRes] = await Promise.allSettled([
                fetchPtClients(),
                fetchMyBookings(),
                fetchUnreadCount()
            ]);

            let loadedClients = [];
            if (clientRes.status === 'fulfilled' && clientRes.value?.clients) {
                loadedClients = clientRes.value.clients;
                setClients(loadedClients);
                
                // Auto-select the first client if none is selected
                if (loadedClients.length > 0) {
                    setSelectedClient(prev => {
                        if (!prev) return loadedClients[0];
                        const found = loadedClients.find(c => c.client_id === prev.client_id);
                        return found || loadedClients[0];
                    });
                }
            }

            if (bookRes.status === 'fulfilled' && bookRes.value?.bookings) {
                setBookings(bookRes.value.bookings);
            }
            if (unreadRes.status === 'fulfilled' && unreadRes.value?.unreadCount !== undefined) {
                setUnreadChatCount(unreadRes.value.unreadCount);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu PT:", error);
        } finally {
            setLoading(false);
        }
    };

    // Load Plan whenever selectedClient changes
    useEffect(() => {
        if (selectedClient?.client_id) {
            loadClientPlan(selectedClient.client_id);
        }
    }, [selectedClient?.client_id]);

    const loadClientPlan = async (clientId) => {
        setPlanLoading(true);
        try {
            const res = await fetchPtClientPlan(clientId);
            setClientPlanData(res);

            const rawWorkout = res.latestPlan?.workout_data;
            const parsedWorkout = typeof rawWorkout === 'string' ? JSON.parse(rawWorkout) : (rawWorkout || []);
            setEditorWorkout(Array.isArray(parsedWorkout) ? parsedWorkout : (parsedWorkout.data || []));

            const rawNutrition = res.latestPlan?.nutrition_data;
            const parsedNutrition = typeof rawNutrition === 'string' ? JSON.parse(rawNutrition) : (rawNutrition || {});
            setEditorNutrition(parsedNutrition);

            setEditorAdvice(res.latestPlan?.ai_advice || '');
        } catch (err) {
            console.error("Lỗi khi lấy chi tiết plan:", err);
        } finally {
            setPlanLoading(false);
        }
    };

    const handleApprovePlan = async () => {
        if (!selectedClient) return;
        setSavingPlan(true);
        try {
            await approvePtClientPlan(selectedClient.client_id, {
                workoutData: editorWorkout,
                nutritionData: editorNutrition,
                ptAdvice: editorAdvice
            });

            showToast("🎉 Đã duyệt và cập nhật giáo án học viên thành công!");
            loadAllData();
            loadClientPlan(selectedClient.client_id);
        } catch (err) {
            showToast("⚠️ Lỗi khi duyệt giáo án: " + (err.response?.data?.message || err.message));
        } finally {
            setSavingPlan(false);
        }
    };

    const handleUpdateExercise = (index, field, value) => {
        const updated = [...editorWorkout];
        updated[index] = { ...updated[index], [field]: value };
        setEditorWorkout(updated);
    };

    const handleRemoveExercise = (index) => {
        const updated = editorWorkout.filter((_, i) => i !== index);
        setEditorWorkout(updated);
    };

    const handleAddExercise = () => {
        const newEx = {
            name: 'Bài tập bổ sung',
            mechanic: 'Compound',
            target_sets: 3,
            target_reps: '10-12',
            target_rpe: 8,
            instructions: 'Thực hiện động tác chuẩn form theo hướng dẫn của PT.'
        };
        setEditorWorkout([...editorWorkout, newEx]);
    };

    const handleCheckInBooking = async (code) => {
        try {
            const res = await checkInBooking({ checkinCode: code });
            showToast(res.message || "🎉 Check-in thành công và đã trừ 1 buổi tập!");
            loadAllData();
        } catch (err) {
            showToast("⚠️ " + (err.response?.data?.message || "Không thể Check-in."));
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này?")) return;
        try {
            await updateBookingStatus(bookingId, { status: 'cancelled', cancelReason: 'HLV bận đột xuất' });
            showToast("Đã hủy lịch tập.");
            loadAllData();
        } catch (err) {
            showToast("⚠️ " + (err.response?.data?.message || "Không thể hủy lịch."));
        }
    };

    const handleDeductSessionSubmit = async (e) => {
        e.preventDefault();
        if (!deductModalClient) return;

        setDeductLoading(true);
        try {
            const res = await deductPtClientSession(deductModalClient.client_id, {
                sessionNotes: deductNotes,
                sessionRpe: deductRpe
            });

            showToast(res.message || "Điểm danh trừ buổi thành công!");
            setDeductModalClient(null);
            setDeductNotes('');
            loadAllData();
        } catch (err) {
            showToast("⚠️ " + (err.response?.data?.message || "Không thể điểm danh."));
        } finally {
            setDeductLoading(false);
        }
    };

    const handleExpelClient = async () => {
        if (!selectedClient) return;
        setExpelLoading(true);
        try {
            const res = await expelPtClient(selectedClient.client_id);
            showToast(res.message || `Đã đuổi học viên ${selectedClient.full_name} khỏi hệ thống!`);
            setShowExpelConfirmModal(false);
            setSelectedClient(null);
            await loadAllData();
        } catch (err) {
            showToast("⚠️ " + (err.response?.data?.message || err.message || "Không thể xóa học viên."));
        } finally {
            setExpelLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('fitness_token');
        localStorage.removeItem('fitness_user_id');
        localStorage.removeItem('fitness_role');
        navigate('/');
    };

    // Filter clients logic
    const filteredClients = clients.filter(c => {
        const matchSearch = (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.phone || '').includes(searchQuery);
        if (!matchSearch) return false;

        if (filterCategory === 'pending') return c.plan_status === 'pending_pt_approval';
        if (filterCategory === 'pt_1_1') return c.client_tier === 'pt_1_1' || c.client_tier === 'bronze_12' || c.client_tier === 'silver_pro' || c.client_tier === 'vip_gold';
        if (filterCategory === 'calisthenics') return c.client_tier === 'calisthenics_home';
        return true;
    });

    const pendingApprovalCount = clients.filter(c => c.plan_status === 'pending_pt_approval').length;
    const clientBookings = bookings.filter(b => b.client_id === selectedClient?.client_id);
    const selectedTier = selectedClient ? getMemberTierInfo(selectedClient, { total_sessions: selectedClient.total_sessions, remaining_sessions: selectedClient.remaining_sessions }) : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
            
            {/* TOAST FEEDBACK */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
                    <span>✨</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* TOP HEADER COMMAND BAR */}
            <header className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-950/20">
                        🏋️
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            PT COACH COMMAND CENTER
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-mono">
                                Boutique Gym 1-1
                            </span>
                        </h1>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Quản lý học viên, duyệt giáo án ghi đè AI &amp; Check-in ca tập</p>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setChatInitialMode('ai');
                            setShowChatModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
                        title="Hỏi đáp cùng Trợ lý Cố vấn AI Chuyên Môn PT"
                    >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="hidden sm:inline">Hỏi Đáp AI PT</span>
                    </button>

                    <button
                        onClick={() => {
                            setChatInitialMode('pt');
                            setShowChatModal(true);
                        }}
                        className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                        title="Chat với từng học viên riêng biệt"
                    >
                        <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden sm:inline">Tin Nhắn Học Viên</span>
                        {unreadChatCount > 0 && (
                            <span className="w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                                {unreadChatCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setShowBookingModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                        <QrCode className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="hidden sm:inline">Quét Check-in QR</span>
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                        <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden sm:inline">Trang Chủ Học Viên</span>
                    </button>

                    <ThemeToggle variant="navbar" />

                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition cursor-pointer ml-1"
                        title="Đăng xuất"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* MASTER-DETAIL WORKSPACE CONTAINER */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* ==================== LEFT SIDEBAR: VERTICAL CLIENT TABS ==================== */}
                <aside className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 flex flex-col max-h-[45vh] lg:max-h-[calc(100vh-65px)]">
                    
                    {/* Sidebar Header & Search */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                Danh Sách Học Viên ({clients.length})
                            </h2>
                            {pendingApprovalCount > 0 && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 animate-pulse">
                                    {pendingApprovalCount} Cần Duyệt
                                </span>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, email, SĐT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                            <button
                                onClick={() => setFilterCategory('all')}
                                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                                    filterCategory === 'all'
                                        ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white'
                                }`}
                            >
                                Tất Cả ({clients.length})
                            </button>
                            <button
                                onClick={() => setFilterCategory('pending')}
                                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                                    filterCategory === 'pending'
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white'
                                }`}
                            >
                                ⏳ Chờ Duyệt ({pendingApprovalCount})
                            </button>
                            <button
                                onClick={() => setFilterCategory('pt_1_1')}
                                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                                    filterCategory === 'pt_1_1'
                                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white'
                                }`}
                            >
                                🏋️ Kèm 1-1
                            </button>
                            <button
                                onClick={() => setFilterCategory('calisthenics')}
                                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                                    filterCategory === 'calisthenics'
                                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white'
                                }`}
                            >
                                🏠 Home Pro
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Client Cards List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p>Đang tải danh sách học viên...</p>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500">
                                Không tìm thấy học viên nào phù hợp.
                            </div>
                        ) : (
                            filteredClients.map((client) => {
                                const isSelected = selectedClient?.client_id === client.client_id;
                                const isPending = client.plan_status === 'pending_pt_approval';
                                const tier = getMemberTierInfo(client, { total_sessions: client.total_sessions, remaining_sessions: client.remaining_sessions });

                                return (
                                    <div
                                        key={client.client_id}
                                        onClick={() => setSelectedClient(client)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                            isSelected
                                                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 shadow-md'
                                                : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                                                    {client.full_name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                {isPending && (
                                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900 animate-ping"></span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                                    {client.full_name || 'Học viên'}
                                                </h4>
                                                
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${tier.badgeClass}`}>
                                                        {tier.icon} {tier.tierShort}
                                                    </span>
                                                    {client.total_sessions > 0 && (
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                            {client.remaining_sessions}/{client.total_sessions}b
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Tag */}
                                        <div className="text-right shrink-0">
                                            {isPending ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                                    ⏳ Duyệt
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                                    ✓ Đang tập
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* ==================== RIGHT MAIN PANE: SELECTED CLIENT FULL DETAILS ==================== */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-7 custom-scrollbar bg-slate-100/50 dark:bg-slate-950/70 space-y-6">
                    {!selectedClient ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 text-slate-400 dark:text-slate-500">
                            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                            <p className="text-sm font-semibold">Chọn một học viên ở danh sách tab dọc bên trái để bắt đầu xem hồ sơ &amp; duyệt giáo án.</p>
                        </div>
                    ) : (
                        <>
                            {/* 1. HERO PROFILE CARD */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden backdrop-blur">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                                    {/* Left: Avatar & Bio */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-cyan-950/30 shrink-0">
                                            {selectedClient.full_name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedClient.full_name || 'Học Viên'}</h2>
                                                {selectedTier && (
                                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${selectedTier.badgeClass} flex items-center gap-1`}>
                                                        <span>{selectedTier.icon}</span>
                                                        <span>{selectedTier.tierName}</span>
                                                    </span>
                                                )}
                                                {selectedClient.plan_status === 'pending_pt_approval' && (
                                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 animate-pulse">
                                                        ⏳ Chờ Huấn Luyện Viên Phê Duyệt
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedClient.email || 'Chưa liên kết email'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedClient.phone || '0988xxxxxx'}</span>
                                                <span>•</span>
                                                <span>Gói tập: <strong className="text-emerald-600 dark:text-emerald-400">{selectedClient.package_name || 'Gói tiêu chuẩn'}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Quick Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                                        <button
                                            onClick={() => {
                                                setDeductModalClient(selectedClient);
                                                setDeductNotes(`Buổi tập ngày ${new Date().toLocaleDateString('vi-VN')}`);
                                            }}
                                            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-sm hover:shadow transition cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>Điểm Danh / Trừ Buổi</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setChatInitialMode('pt');
                                                setShowChatModal(true);
                                            }}
                                            className="relative px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span>Chat 1-1 Học Viên</span>
                                            {unreadChatCount > 0 && (
                                                <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-black animate-bounce">
                                                    {unreadChatCount}
                                                </span>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setChatInitialMode('ai');
                                                setShowChatModal(true);
                                            }}
                                            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                                            title="Hỏi AI phân tích riêng cho học viên này"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>Hỏi Đáp AI PT</span>
                                        </button>

                                        <button
                                            onClick={() => setShowReportModal(true)}
                                            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
                                            title="Xuất báo cáo thành tích PDF / Ảnh 4K"
                                        >
                                            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Xuất Báo Cáo PDF</span>
                                        </button>

                                        <button
                                            onClick={() => setShowExpelConfirmModal(true)}
                                            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-100 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800/60 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                            title="Đuổi học viên và xóa toàn bộ dữ liệu khỏi Database"
                                        >
                                            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                            <span>Đuổi Học Viên</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Metrics Summary Strip */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 text-xs">
                                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">Mục tiêu chính</span>
                                        <p className="font-bold text-cyan-600 dark:text-cyan-400 text-sm mt-0.5 truncate">{selectedClient.goal || 'Tăng cơ giảm mỡ'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">Cân nặng &amp; Chiều cao</span>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedClient.weight || 70} kg • {selectedClient.height || 172} cm</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">Số buổi kèm còn lại</span>
                                        <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">
                                            {selectedClient.remaining_sessions || 0} / {selectedClient.total_sessions || 0} buổi
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">Chấn thương / Lưu ý</span>
                                        <p className="font-bold text-rose-600 dark:text-rose-300 text-sm mt-0.5 truncate">
                                            {selectedClient.injuries && selectedClient.injuries.length > 0 ? selectedClient.injuries.join(', ') : 'Không có chấn thương'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. DETAIL SUB-TABS NAVIGATION */}
                            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={() => setDetailTab('workout')}
                                    className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-2xl transition border-b-2 ${
                                        detailTab === 'workout'
                                            ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                                    }`}
                                >
                                    <Dumbbell className="w-4 h-4" />
                                    🏋️ Giáo Án &amp; Phê Duyệt Lộ Trình
                                </button>
                                <button
                                    onClick={() => setDetailTab('nutrition')}
                                    className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-2xl transition border-b-2 ${
                                        detailTab === 'nutrition'
                                            ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                                    }`}
                                >
                                    <Flame className="w-4 h-4" />
                                    🥗 Thực Đơn Dinh Dưỡng &amp; Macro
                                </button>
                                <button
                                    onClick={() => setDetailTab('bookings')}
                                    className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-2xl transition border-b-2 ${
                                        detailTab === 'bookings'
                                            ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    🎟️ Lịch Đặt Chỗ 1-1 ({clientBookings.length})
                                </button>
                            </div>

                            {/* 3. SUB-TAB CONTENT PANES */}
                            
                            {/* TAB 1: WORKOUT PLAN & OVERRIDE EDITOR */}
                            {detailTab === 'workout' && (
                                <div className="space-y-5 animate-fadeIn">
                                    {planLoading ? (
                                        <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            <p>Đang tải chi tiết giáo án học viên...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* AI Advice & Coach Personal Message Editor */}
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2 shadow-xs">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                                    Lời Khuyên Chuyên Môn &amp; Ghi Chú Của Huấn Luyện Viên PT
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={editorAdvice}
                                                    onChange={(e) => setEditorAdvice(e.target.value)}
                                                    placeholder="Nhập lưu ý chỉnh form, nhịp thở hoặc dặn dò riêng cho học viên này..."
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition leading-relaxed"
                                                />
                                            </div>

                                            {/* Exercise List & Form Editor */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                        <Dumbbell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                                        Danh Sách Bài Tập ({editorWorkout.length} bài)
                                                    </h3>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddExercise}
                                                        className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Thêm Bài Tập</span>
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {editorWorkout.map((ex, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                                                    <span className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-black flex items-center justify-center shrink-0">
                                                                        #{idx + 1}
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        value={ex.name || ''}
                                                                        onChange={(e) => handleUpdateExercise(idx, 'name', e.target.value)}
                                                                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white flex-1 focus:border-cyan-500 focus:outline-none"
                                                                        placeholder="Tên bài tập..."
                                                                    />
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={ex.mechanic || 'Compound'}
                                                                        onChange={(e) => handleUpdateExercise(idx, 'mechanic', e.target.value)}
                                                                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:border-cyan-500 focus:outline-none"
                                                                    >
                                                                        <option value="Compound">Compound</option>
                                                                        <option value="Isolation">Isolation</option>
                                                                        <option value="Bodyweight">Bodyweight</option>
                                                                    </select>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveExercise(idx)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                                                                        title="Xóa bài tập này"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Sets / Reps / RPE row */}
                                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                                <div>
                                                                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Số Hiệp (Sets)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={ex.target_sets || 3}
                                                                        onChange={(e) => handleUpdateExercise(idx, 'target_sets', parseInt(e.target.value, 10) || 3)}
                                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Số Lần (Reps)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={ex.target_reps || '10-12'}
                                                                        onChange={(e) => handleUpdateExercise(idx, 'target_reps', e.target.value)}
                                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Độ Cực (RPE)</label>
                                                                    <select
                                                                        value={ex.target_rpe || 8}
                                                                        onChange={(e) => handleUpdateExercise(idx, 'target_rpe', parseInt(e.target.value, 10) || 8)}
                                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                                                                    >
                                                                        <option value={7}>RPE 7 (Vừa)</option>
                                                                        <option value={8}>RPE 8 (Chuẩn)</option>
                                                                        <option value={9}>RPE 9 (Nặng)</option>
                                                                        <option value={10}>RPE 10 (Max)</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Instructions */}
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    value={ex.instructions || ''}
                                                                    onChange={(e) => handleUpdateExercise(idx, 'instructions', e.target.value)}
                                                                    placeholder="Lưu ý kỹ thuật form bài tập..."
                                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action Save / Approve Bar */}
                                            <div className="pt-4 flex justify-end gap-3 sticky bottom-4 z-10">
                                                <button
                                                    type="button"
                                                    onClick={handleApprovePlan}
                                                    disabled={savingPlan}
                                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>{savingPlan ? 'Đang lưu...' : '✓ Phê Duyệt & Ghi Đè Giáo Án (Quyền PT > AI)'}</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: NUTRITION PLAN */}
                            {detailTab === 'nutrition' && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-xs">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Calories Mục Tiêu</span>
                                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{editorNutrition.targetCalories || editorNutrition.daily_targets?.targetCalories || 2200} kcal</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-xs">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Protein (Đạm)</span>
                                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{editorNutrition.macros?.protein || 150}g</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-xs">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Carbs (Tinh Bột)</span>
                                            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">{editorNutrition.macros?.carb || editorNutrition.macros?.carbs || 220}g</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-xs">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Fat (Chất Béo)</span>
                                            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{editorNutrition.macros?.fat || 60}g</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xs">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Chiến Lược Dinh Dưỡng Khuyến Nghị</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Học viên được thiết lập mức thâm hụt / thặng dư phù hợp với mục tiêu <strong className="text-slate-900 dark:text-white">{selectedClient.goal}</strong>. Khuyến khích nạp đủ 2.2g Protein/kg thể trọng và ưu tiên nguồn thực phẩm tươi nguyên cá, ức gà, trứng, rau xanh và cơm gạo lứt.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: BOOKINGS FOR THIS CLIENT */}
                            {detailTab === 'bookings' && (
                                <div className="space-y-4 animate-fadeIn">
                                    {clientBookings.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                                            Học viên này chưa có lịch hẹn nào.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {clientBookings.map((b) => {
                                                const isConfirmed = b.status === 'confirmed';
                                                const isCheckedIn = b.checkin_status === 'checked_in' || b.status === 'completed';
                                                return (
                                                    <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-xs">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-black text-amber-600 dark:text-amber-300">
                                                                📅 {new Date(b.booking_date).toLocaleDateString('vi-VN')}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                isCheckedIn ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
                                                                isConfirmed ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'
                                                            }`}>
                                                                {isCheckedIn ? '✓ Đã Check-in' : isConfirmed ? '⏳ Sắp diễn ra' : 'Đã hủy'}
                                                            </span>
                                                        </div>

                                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                                             {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)} (60 phút)
                                                        </p>

                                                        {b.checkin_code && (
                                                            <div className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 flex justify-between">
                                                                <span>Mã QR: {b.checkin_code}</span>
                                                            </div>
                                                        )}

                                                        {isConfirmed && !isCheckedIn && (
                                                            <div className="pt-2 flex gap-2">
                                                                <button
                                                                    onClick={() => handleCheckInBooking(b.checkin_code)}
                                                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                                                                >
                                                                    Quét Check-in Ngay
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelBooking(b.id)}
                                                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xs rounded-xl cursor-pointer"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                        </>
                    )}
                </main>

            </div>

            {/* MODAL 1: SESSION DEDUCTION MODAL */}
            {deductModalClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Điểm Danh Buổi Tập 1-1
                            </h3>
                            <button onClick={() => setDeductModalClient(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleDeductSessionSubmit} className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                                <p className="text-slate-600 dark:text-slate-400">Học viên: <strong className="text-slate-900 dark:text-white">{deductModalClient.full_name}</strong></p>
                                <p className="text-slate-600 dark:text-slate-400 mt-1">Số buổi hiện có: <strong className="text-amber-600 dark:text-amber-400 font-mono">{deductModalClient.remaining_sessions}/{deductModalClient.total_sessions} buổi</strong></p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nội Dung / Ghi Chú Buổi Tập</label>
                                <input
                                    type="text"
                                    value={deductNotes}
                                    onChange={(e) => setDeductNotes(e.target.value)}
                                    placeholder="VD: Tập Chân Mông, hoàn thành Squat 80kg..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Đánh Giá Độ Cực (RPE {deductRpe}/10)</label>
                                <input
                                    type="range"
                                    min="6"
                                    max="10"
                                    value={deductRpe}
                                    onChange={(e) => setDeductRpe(parseInt(e.target.value, 10))}
                                    className="w-full accent-cyan-500"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeductModalClient(null)}
                                    className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={deductLoading}
                                    className="w-1/2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                                >
                                    {deductLoading ? 'Đang trừ...' : 'Xác Nhận Trừ 1 Buổi ✓'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: DIRECT CHAT WITH CLIENT OR PT AI */}
            <ChatModal
                isOpen={showChatModal}
                onClose={() => {
                    setShowChatModal(false);
                    loadAllData();
                }}
                defaultPartnerId={selectedClient?.client_id}
                defaultPartnerName={selectedClient?.full_name || 'Học Viên'}
                initialMode={chatInitialMode}
                clientsList={clients}
                selectedClientContext={selectedClient}
            />

            {/* MODAL 3: BOOKINGS & QR SCANNER */}
            <BookingModal
                isOpen={showBookingModal}
                onClose={() => {
                    setShowBookingModal(false);
                    loadAllData();
                }}
                user={{ role: 'pt' }}
            />

            {/* MODAL 4: PROGRESS REPORT & CERTIFICATE MODAL */}
            <ProgressReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                userId={selectedClient?.client_id}
                userName={selectedClient?.full_name}
            />

            {/* MODAL 5: CONFIRM EXPEL CLIENT (DELETE FROM DATABASE) */}
            {showExpelConfirmModal && selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-600/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Ambient Red Glow */}
                        <div className="absolute -top-16 -left-16 w-32 h-32 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                            🚫
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Xác Nhận Đuổi Học Viên?</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Bạn sắp đuổi và xóa hoàn toàn học viên <strong className="text-rose-600 dark:text-rose-400 font-bold">{selectedClient.full_name}</strong> (<span className="text-slate-500 dark:text-slate-400">{selectedClient.email}</span>) khỏi cơ sở dữ liệu.
                            </p>
                            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 p-3.5 rounded-2xl text-left text-[11px] text-rose-800 dark:text-rose-300/90 space-y-1.5">
                                <p className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    Hành động này sẽ xóa sạch vĩnh viễn:
                                </p>
                                <p className="text-slate-700 dark:text-slate-300">• Hồ sơ tài khoản học viên trong Database</p>
                                <p className="text-slate-700 dark:text-slate-300">• Toàn bộ giáo án tập luyện &amp; chế độ dinh dưỡng AI</p>
                                <p className="text-slate-700 dark:text-slate-300">• Lịch sử check-in, số buổi tập và lịch đặt PT 1-1</p>
                                <p className="text-slate-700 dark:text-slate-300">• Toàn bộ tin nhắn trao đổi 1-1</p>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowExpelConfirmModal(false)}
                                disabled={expelLoading}
                                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleExpelClient}
                                disabled={expelLoading}
                                className="w-1/2 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-950/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                {expelLoading ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang xóa...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Đuổi Học Viên Ngay</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
