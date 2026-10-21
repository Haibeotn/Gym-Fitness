// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fetchAdminStats, fetchAdminTrainers, createAdminTrainer, toggleAdminTrainerStatus,
    fetchAdminExercises, createAdminExercise, deleteAdminExercise, fetchAdminPayments,
    fetchAdminMemberships, fetchAdminPurchaseHistory, verifyPaymentOrder,
    fetchMyBookings, checkInBooking, loginUser
} from '../services/api';
import {
    CreditCard, X, Landmark, Copy, Check, Users, Dumbbell, Calendar, ShieldCheck,
    Search, ScanLine, LayoutDashboard, UserCheck, ChevronRight, TrendingUp, Award, Zap,
    ArrowLeft, LogOut, Plus, Package, History
} from 'lucide-react';
import BookingModal from '../components/BookingModal';
import PackageModal from '../components/PackageModal';
import ThemeToggle from '../components/ThemeToggle';

const NAV_ITEMS = [
    { id: 'overview',    label: 'Tổng Quan',            icon: LayoutDashboard, color: 'indigo'  },
    { id: 'payments',    label: 'Giao Dịch VietQR',     icon: CreditCard,      color: 'amber'   },
    { id: 'bookings',    label: 'Lịch Tập & Check-in',  icon: Calendar,        color: 'cyan'    },
    { id: 'memberships', label: 'Gói Thành Viên',       icon: Package,         color: 'emerald' },
    { id: 'history',     label: 'Lịch Sử Mua',          icon: History,         color: 'purple'  },
    { id: 'trainers',    label: 'Huấn Luyện Viên',      icon: UserCheck,       color: 'rose'    },
    { id: 'exercises',   label: 'Thư Viện Bài Tập',     icon: Dumbbell,        color: 'orange'  },
];

const COLOR_MAP = {
    indigo:  { text: 'text-indigo-400',  activeBg: 'bg-indigo-600'  },
    amber:   { text: 'text-amber-400',   activeBg: 'bg-amber-600'   },
    cyan:    { text: 'text-cyan-400',    activeBg: 'bg-cyan-600'    },
    emerald: { text: 'text-emerald-400', activeBg: 'bg-emerald-600' },
    purple:  { text: 'text-purple-400',  activeBg: 'bg-purple-600'  },
    rose:    { text: 'text-rose-400',    activeBg: 'bg-rose-600'    },
    orange:  { text: 'text-orange-400',  activeBg: 'bg-orange-600'  },
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [statsData, setStatsData] = useState(null);
    const [trainers, setTrainers] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [payments, setPayments] = useState([]);
    const [paymentStats, setPaymentStats] = useState(null);
    const [allBookings, setAllBookings] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [membershipSummary, setMembershipSummary] = useState(null);
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [purchaseStats, setPurchaseStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(localStorage.getItem('fitness_role') || 'guest');
    const [toastMessage, setToastMessage] = useState('');
    const [copiedField, setCopiedField] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
    const [trainerForm, setTrainerForm] = useState({ fullName: '', email: '', password: '', phone: '', specialization: '', bio: '' });
    const [trainerLoading, setTrainerLoading] = useState(false);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [exerciseForm, setExerciseForm] = useState({ name: '', primaryMuscle: 'Ngực', mechanic: 'Compound', description: '', equipmentRequired: 'Tạ đòn', contraindications: 'Chấn thương vai' });
    const [exerciseLoading, setExerciseLoading] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [exerciseFilterMechanic, setExerciseFilterMechanic] = useState('');
    const [paymentFilterStatus, setPaymentFilterStatus] = useState('all');
    const [membershipFilter, setMembershipFilter] = useState('all');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showPackageModal, setShowPackageModal] = useState(false);

    const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, trainersRes, exercisesRes, paymentsRes, bookingsRes, membershipsRes, historyRes] = await Promise.allSettled([
                fetchAdminStats(), fetchAdminTrainers(),
                fetchAdminExercises({ search: exerciseSearch, mechanic: exerciseFilterMechanic }),
                fetchAdminPayments(), fetchMyBookings(), fetchAdminMemberships(), fetchAdminPurchaseHistory(),
            ]);
            if (statsRes.status === 'fulfilled') setStatsData(statsRes.value);
            if (trainersRes.status === 'fulfilled') setTrainers(trainersRes.value?.trainers || []);
            if (exercisesRes.status === 'fulfilled') setExercises(exercisesRes.value?.exercises || []);
            if (paymentsRes.status === 'fulfilled') { setPayments(paymentsRes.value?.payments || []); setPaymentStats(paymentsRes.value?.stats || null); }
            if (bookingsRes.status === 'fulfilled') setAllBookings(bookingsRes.value?.bookings || []);
            if (membershipsRes.status === 'fulfilled') { setMemberships(membershipsRes.value?.memberships || []); setMembershipSummary(membershipsRes.value?.summary || null); }
            if (historyRes.status === 'fulfilled') { setPurchaseHistory(historyRes.value?.orders || []); setPurchaseStats(historyRes.value?.stats || null); }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [exerciseSearch, exerciseFilterMechanic]);

    const handleLoginDemoAdmin = async () => {
        setLoading(true);
        try {
            const res = await loginUser({ email: 'admin@gym.com', password: '123456' });
            if (res.token) {
                localStorage.setItem('fitness_token', res.token);
                localStorage.setItem('fitness_user_id', res.userId);
                localStorage.setItem('fitness_role', 'admin');
                setUserRole('admin'); loadData();
                showToast('Đã đăng nhập Admin!');
            }
        } catch (err) { showToast('Lỗi: ' + (err.response?.data?.message || err.message)); }
        finally { setLoading(false); }
    };

    const handleVerifyPayment = async (txCode) => {
        try { const res = await verifyPaymentOrder(txCode); showToast(res.message || 'Đã duyệt!'); loadData(); }
        catch (err) { showToast(err.response?.data?.message || 'Không thể duyệt.'); }
    };

    const handleCheckInBooking = async (code) => {
        try { const res = await checkInBooking({ checkinCode: code }); showToast(res.message || 'Check-in thành công!'); loadData(); }
        catch (err) { showToast(err.response?.data?.message || 'Không thể check-in.'); }
    };

    const handleCreateTrainer = async (e) => {
        e.preventDefault(); setTrainerLoading(true);
        try { await createAdminTrainer(trainerForm); showToast('Tạo HLV thành công!'); setShowAddTrainerModal(false); setTrainerForm({ fullName: '', email: '', password: '', phone: '', specialization: '', bio: '' }); loadData(); }
        catch (err) { alert(err.response?.data?.message || 'Không thể tạo HLV.'); }
        finally { setTrainerLoading(false); }
    };

    const handleToggleTrainer = async (id) => {
        try { await toggleAdminTrainerStatus(id); showToast('Cập nhật trạng thái HLV!'); loadData(); }
        catch (err) { alert(err.response?.data?.message || 'Không thể cập nhật.'); }
    };

    const handleCreateExercise = async (e) => {
        e.preventDefault(); setExerciseLoading(true);
        try {
            const payload = { ...exerciseForm, equipmentRequired: exerciseForm.equipmentRequired.split(',').map(s => s.trim()), contraindications: exerciseForm.contraindications.split(',').map(s => s.trim()) };
            await createAdminExercise(payload); showToast('Đã thêm bài tập!'); setShowAddExerciseModal(false);
            setExerciseForm({ name: '', primaryMuscle: 'Ngực', mechanic: 'Compound', description: '', equipmentRequired: 'Tạ đòn', contraindications: 'Chấn thương vai' }); loadData();
        } catch (err) { alert(err.response?.data?.message || 'Không thể thêm.'); }
        finally { setExerciseLoading(false); }
    };

    const handleDeleteExercise = async (id) => {
        if (!window.confirm('Xác nhận xóa bài tập này?')) return;
        try { await deleteAdminExercise(id); showToast('Đã xóa!'); loadData(); }
        catch (err) { alert(err.response?.data?.message || 'Không thể xóa.'); }
    };

    const copyToClipboard = (text, field) => { navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); };
    const handleLogout = () => { localStorage.removeItem('fitness_token'); localStorage.removeItem('fitness_user_id'); localStorage.removeItem('fitness_role'); navigate('/'); };

    const stats = statsData?.stats || {};
    const packageBreakdown = statsData?.packageBreakdown || [];
    const filteredPayments = payments.filter(p => paymentFilterStatus === 'all' ? true : p.status === paymentFilterStatus);
    const filteredMemberships = memberships.filter(m => membershipFilter === 'all' ? true : m.status === membershipFilter);

    const inp = 'w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';
    const lbl = 'block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5';

    const SectionHeader = ({ title, subtitle }) => (
        <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-base text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
    );

    const StatusBadge = ({ status, map }) => {
        const cfg = map[status] || { label: status, cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' };
        return <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${cfg.cls}`}>{cfg.label}</span>;
    };

    const paymentStatusMap = {
        completed: { label: '✓ Đã Thanh Toán', cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' },
        pending:   { label: '⏳ Chờ CK',         cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' },
    };

    const memberStatusMap = {
        active:    { label: '● Hoạt động',  cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' },
        pending:   { label: '⏳ Chờ duyệt', cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400' },
        completed: { label: '○ Hoàn thành', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">

            {toastMessage && (
                <div className="fixed top-6 right-6 z-[100] bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-400 text-base font-bold animate-fadeIn flex items-center gap-3">
                    🛡️ {toastMessage}
                </div>
            )}

            <div className="flex min-h-screen">
                {/* SIDEBAR */}
                <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} flex-shrink-0 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 sticky top-0 h-screen overflow-y-auto z-30`}>
                    <div className="p-5 border-b border-slate-800 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        {sidebarOpen && <div><div className="text-lg font-black text-white">FitAdmin</div><div className="text-xs text-slate-400">Quản trị hệ thống</div></div>}
                    </div>

                    {sidebarOpen && (
                        <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                            <span className="text-sm text-slate-400">Hệ thống hoạt động</span>
                        </div>
                    )}

                    <nav className="flex-1 p-3 space-y-1 mt-2">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const c = COLOR_MAP[item.color];
                            const isActive = activeTab === item.id;
                            return (
                                <button key={item.id} onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${isActive ? `${c.activeBg} text-white shadow-lg` : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : c.text}`} />
                                    {sidebarOpen && <><span className="text-base font-semibold flex-1 text-left">{item.label}</span>{isActive && <ChevronRight className="w-4 h-4 opacity-70" />}</>}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-3 border-t border-slate-800 space-y-1">
                        <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
                            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span className="text-base font-medium">Về Học Viên</span>}
                        </button>
                        <button onClick={() => navigate('/pt')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
                            <Dumbbell className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span className="text-base font-medium">PT Workspace</span>}
                        </button>
                        {userRole === 'admin' && (
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer">
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="text-base font-medium">Đăng Xuất</span>}
                            </button>
                        )}
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 min-w-0 flex flex-col">
                    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(v => !v)} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Quản trị hệ thống Fitness AI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowPackageModal(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition shadow flex items-center gap-2 cursor-pointer">
                                <CreditCard className="w-4 h-4" /> VietQR Mua Gói
                            </button>
                            <button onClick={() => setShowBookingModal(true)} className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition shadow flex items-center gap-2 cursor-pointer">
                                <ScanLine className="w-4 h-4" /> Quét QR Check-in
                            </button>
                            <ThemeToggle variant="navbar" />
                            {userRole !== 'admin' && (
                                <button onClick={handleLoginDemoAdmin} className="px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl transition shadow cursor-pointer">⚡ Đăng nhập Admin</button>
                            )}
                        </div>
                    </header>

                    <div className="flex-1 p-6 lg:p-8 space-y-8">

                        {/* KPI CARDS - always visible */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { title: 'Doanh Thu', icon: TrendingUp, iconColor: 'text-indigo-500', value: `${Number(paymentStats?.total_revenue || stats.totalRevenue || 0).toLocaleString('vi-VN')} đ`, sub: `${paymentStats?.completed_count || stats.totalPackagesSold || 0} đơn hoàn tất`, valCls: 'text-2xl font-black text-slate-900 dark:text-white' },
                                { title: 'Học Viên', icon: Users, iconColor: 'text-emerald-500', value: stats.totalMembers || 0, sub: 'Đang hoạt động', valCls: 'text-3xl font-black text-emerald-600 dark:text-emerald-400' },
                                { title: 'Huấn Luyện Viên', icon: Award, iconColor: 'text-amber-500', value: `${trainers.filter(t => t.is_active).length}/${trainers.length}`, sub: '⭐ 4.9 điểm TB', valCls: 'text-3xl font-black text-amber-600 dark:text-amber-400' },
                                { title: 'Check-in Buổi Tập', icon: Zap, iconColor: 'text-cyan-500', value: stats.completedSessions || allBookings.filter(b => b.checkin_status === 'checked_in').length, sub: 'Đã quét QR', valCls: 'text-3xl font-black text-cyan-600 dark:text-cyan-400' },
                            ].map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div key={card.title} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.title}</span>
                                            <Icon className={`w-6 h-6 ${card.iconColor}`} />
                                        </div>
                                        <p className={card.valCls}>{card.value}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{card.sub}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* BANK BANNER */}
                        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center gap-5 text-white">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2"><Landmark className="w-5 h-5 text-cyan-400" /><span className="text-sm font-bold uppercase tracking-wider text-cyan-300">Tài Khoản Thụ Hưởng MBBank Chính Thức</span></div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-4xl font-mono font-black text-amber-400">62405082006</span>
                                    <button onClick={() => copyToClipboard('62405082006', 'bankSTK')} className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer">
                                        {copiedField === 'bankSTK' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        {copiedField === 'bankSTK' ? 'Đã chép' : 'Sao chép'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400">Ngân Hàng TMCP Quân Đội (MBBank) • Chủ TK: <strong className="text-slate-200">FITNESS AI GYM VIETNAM</strong></p>
                            </div>
                        </div>

                        {/* TAB: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="animate-fadeIn space-y-6">
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <SectionHeader title="Doanh Thu Theo Gói Tập" subtitle="Phân tích doanh thu theo từng loại gói tập đang bán" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {packageBreakdown.length === 0 && <div className="col-span-3 text-center py-12 text-slate-400 text-lg">Chưa có dữ liệu.</div>}
                                        {packageBreakdown.map((pkg) => (
                                            <div key={pkg.id} className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{pkg.name}</p>
                                                    <span className="px-3 py-1 rounded-xl text-sm font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">{pkg.session_count} buổi</span>
                                                </div>
                                                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{Number(pkg.subtotal).toLocaleString('vi-VN')} <span className="text-base">đ</span></p>
                                                <p className="text-base text-slate-500 dark:text-slate-400">Đã bán: <strong className="text-slate-800 dark:text-slate-200">{pkg.sold_count}</strong> gói</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {statsData?.recentOrders?.length > 0 && (
                                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <SectionHeader title="Đơn Mua Gần Đây" />
                                        <div className="space-y-0">
                                            {statsData.recentOrders.map((order) => (
                                                <div key={order.id} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                    <div><p className="text-base font-bold text-slate-900 dark:text-white">{order.client_name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{order.package_name} • {order.trainer_name || 'Chưa phân công PT'}</p></div>
                                                    <div className="text-right"><p className="text-lg font-black text-amber-600 dark:text-amber-400">{Number(order.price).toLocaleString('vi-VN')} đ</p><p className="text-sm text-slate-500 dark:text-slate-400">{new Date(order.purchased_at).toLocaleDateString('vi-VN')}</p></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: PAYMENTS */}
                        {activeTab === 'payments' && (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <SectionHeader title="Danh Sách Giao Dịch VietQR & MoMo" subtitle="Đối soát và phê duyệt chuyển khoản tới STK MBBank 62405082006" />
                                    <div className="flex gap-2 flex-shrink-0">
                                        {[['all', `Tất cả (${payments.length})`], ['pending', `Chờ CK (${payments.filter(p => p.status === 'pending').length})`], ['completed', `Đã TT (${payments.filter(p => p.status === 'completed').length})`]].map(([s, l]) => (
                                            <button key={s} onClick={() => setPaymentFilterStatus(s)} className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition ${paymentFilterStatus === s ? (s === 'pending' ? 'bg-amber-600 text-white' : s === 'completed' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-sm">
                                            {['Mã Đơn / Nội Dung','Khách Hàng','Gói Tập','Số Tiền','Thời Gian','Trạng Thái','Hành Động'].map(h => <th key={h} className="pb-4 pr-4">{h}</th>)}
                                        </tr></thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredPayments.length === 0 ? <tr><td colSpan="7" className="py-12 text-center text-slate-400 text-lg">Chưa có giao dịch nào.</td></tr>
                                            : filteredPayments.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                    <td className="py-4 pr-4"><div className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-base">{p.transaction_code}</div><div className="text-sm text-slate-500 dark:text-slate-400">CK: <strong>{p.transfer_content}</strong></div></td>
                                                    <td className="py-4 pr-4"><div className="font-bold text-base">{p.user_name || 'Khách hàng'}</div><div className="text-sm text-slate-500 dark:text-slate-400">{p.user_phone || p.user_email}</div></td>
                                                    <td className="py-4 pr-4 font-medium text-base">{p.package_name}</td>
                                                    <td className="py-4 pr-4 font-mono font-black text-amber-600 dark:text-amber-400 text-lg">{Number(p.amount).toLocaleString('vi-VN')} đ</td>
                                                    <td className="py-4 pr-4 text-sm text-slate-500 dark:text-slate-400">{new Date(p.created_at).toLocaleString('vi-VN')}</td>
                                                    <td className="py-4 pr-4"><StatusBadge status={p.status} map={paymentStatusMap} /></td>
                                                    <td className="py-4 text-right">{p.status !== 'completed' && <button onClick={() => handleVerifyPayment(p.transaction_code)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition cursor-pointer">Duyệt Ngay</button>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB: BOOKINGS */}
                        {activeTab === 'bookings' && (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <SectionHeader title="Quản Lý Lịch Tập & Check-in Phòng Gym" subtitle="Danh sách các ca tập 1-1 và mã QR check-in học viên" />
                                    <button onClick={() => setShowBookingModal(true)} className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-base rounded-xl transition flex items-center gap-2 shadow cursor-pointer flex-shrink-0"><ScanLine className="w-5 h-5" /> Quét Mã Check-in</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-sm">
                                            {['Mã Check-in','Học Viên','Huấn Luyện Viên','Thời Gian','Nội Dung','Trạng Thái','Điểm Danh'].map(h => <th key={h} className="pb-4 pr-4">{h}</th>)}
                                        </tr></thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {allBookings.length === 0 ? <tr><td colSpan="7" className="py-12 text-center text-slate-400 text-lg">Chưa có ca tập nào.</td></tr>
                                            : allBookings.map(b => {
                                                const done = b.checkin_status === 'checked_in' || b.status === 'completed';
                                                return (
                                                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <td className="py-4 pr-4 font-mono font-bold text-cyan-700 dark:text-cyan-300 text-base">{b.checkin_code || `GYM-CHK-${b.id}`}</td>
                                                        <td className="py-4 pr-4"><div className="font-bold text-base">{b.client_name || 'Học viên'}</div><div className="text-sm text-slate-500 dark:text-slate-400">{b.client_phone}</div></td>
                                                        <td className="py-4 pr-4 font-bold text-amber-600 dark:text-amber-300 text-base">{b.trainer_name || 'HLV Cá Nhân'}</td>
                                                        <td className="py-4 pr-4"><div className="text-base font-medium">{b.booking_date}</div><div className="text-sm text-slate-500 dark:text-slate-400">{b.start_time?.slice(0,5)} - {b.end_time?.slice(0,5)}</div></td>
                                                        <td className="py-4 pr-4 text-slate-600 dark:text-slate-300 truncate max-w-[180px] text-base">{b.session_topic || 'Buổi tập 1-1'}</td>
                                                        <td className="py-4 pr-4"><span className={`px-3 py-1.5 rounded-full text-sm font-bold ${done ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300'}`}>{done ? '✓ Đã Check-in' : '⏳ Sẵn sàng'}</span></td>
                                                        <td className="py-4 text-right">{!done && <button onClick={() => handleCheckInBooking(b.checkin_code)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition cursor-pointer">Check-in</button>}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB: MEMBERSHIPS */}
                        {activeTab === 'memberships' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[['Tổng Gói', membershipSummary?.total_count||0, 'text-slate-900 dark:text-white'],['Đang Hoạt Động', membershipSummary?.active_count||0, 'text-emerald-600 dark:text-emerald-400'],['Đang Chờ', membershipSummary?.pending_count||0, 'text-amber-600 dark:text-amber-400'],['Hoàn Thành', membershipSummary?.completed_count||0, 'text-slate-500 dark:text-slate-400']].map(([l,v,c]) => (
                                        <div key={l} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{l}</p>
                                            <p className={`text-4xl font-black ${c}`}>{v}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <SectionHeader title="Gói Thành Viên Học Viên" subtitle="Tất cả gói tập đang được phân bổ trong hệ thống" />
                                        <div className="flex gap-2 flex-wrap flex-shrink-0">
                                            {[['all','Tất cả','bg-indigo-600'],['active','Hoạt động','bg-emerald-600'],['pending','Chờ duyệt','bg-amber-600'],['completed','Hoàn thành','bg-slate-600']].map(([s,l,ac]) => (
                                                <button key={s} onClick={() => setMembershipFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition ${membershipFilter === s ? `${ac} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{l}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead><tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-sm">
                                                {['Học Viên','Gói Tập','Huấn Luyện Viên','Tiến Độ','Ngày Mua','Trạng Thái'].map(h => <th key={h} className="pb-4 pr-4">{h}</th>)}
                                            </tr></thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredMemberships.length === 0 ? <tr><td colSpan="6" className="py-12 text-center text-slate-400 text-lg">Không có dữ liệu.</td></tr>
                                                : filteredMemberships.map(m => {
                                                    const used = m.total_sessions - m.remaining_sessions;
                                                    const pct = m.total_sessions > 0 ? Math.round((used/m.total_sessions)*100) : 0;
                                                    return (
                                                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                            <td className="py-4 pr-4"><div className="font-bold text-base">{m.member_name}</div><div className="text-sm text-slate-500 dark:text-slate-400">{m.member_email||m.member_phone}</div></td>
                                                            <td className="py-4 pr-4"><div className="font-bold text-base">{m.package_name}</div><div className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">{Number(m.package_price).toLocaleString('vi-VN')} đ</div></td>
                                                            <td className="py-4 pr-4 text-base font-medium text-amber-600 dark:text-amber-400">{m.trainer_name||'Chưa phân công'}</td>
                                                            <td className="py-4 pr-4">
                                                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">{used}/{m.total_sessions} buổi ({pct}%)</div>
                                                                <div className="w-36 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct>80?'bg-rose-500':pct>50?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${pct}%`}} /></div>
                                                            </td>
                                                            <td className="py-4 pr-4 text-sm text-slate-500 dark:text-slate-400">{new Date(m.purchased_at).toLocaleDateString('vi-VN')}</td>
                                                            <td className="py-4"><StatusBadge status={m.status} map={memberStatusMap} /></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: HISTORY */}
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[['Tổng Đơn', purchaseStats?.total_orders||0, 'text-slate-900 dark:text-white', false],['Đơn Hoàn Tất', purchaseStats?.completed_orders||0, 'text-emerald-600 dark:text-emerald-400', false],['Đang Chờ', purchaseStats?.pending_orders||0, 'text-amber-600 dark:text-amber-400', false],['Tổng Doanh Thu', `${Number(purchaseStats?.total_revenue||0).toLocaleString('vi-VN')} đ`, 'text-indigo-600 dark:text-indigo-400', true]].map(([l,v,c,sm]) => (
                                        <div key={l} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{l}</p>
                                            <p className={`font-black ${sm?'text-2xl':'text-4xl'} ${c}`}>{v}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                    <SectionHeader title="Lịch Sử Toàn Bộ Giao Dịch Mua Gói" subtitle="Tất cả lịch sử mua hàng của học viên trong hệ thống" />
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead><tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-sm">
                                                {['Mã Giao Dịch','Khách Hàng','Gói Tập','Số Tiền','Ngày Mua','Duyệt Lúc','Trạng Thái'].map(h => <th key={h} className="pb-4 pr-4">{h}</th>)}
                                            </tr></thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {purchaseHistory.length === 0 ? <tr><td colSpan="7" className="py-12 text-center text-slate-400 text-lg">Chưa có lịch sử nào.</td></tr>
                                                : purchaseHistory.map(order => (
                                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <td className="py-4 pr-4"><div className="font-mono font-bold text-purple-600 dark:text-purple-400 text-base">{order.transaction_code}</div><div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{order.transfer_content}</div></td>
                                                        <td className="py-4 pr-4"><div className="font-bold text-base">{order.user_name}</div><div className="text-sm text-slate-500 dark:text-slate-400">{order.user_phone||order.user_email}</div></td>
                                                        <td className="py-4 pr-4"><div className="font-medium text-base">{order.package_name}</div><div className="text-sm text-slate-500 dark:text-slate-400">{order.session_count} buổi</div></td>
                                                        <td className="py-4 pr-4 font-mono font-black text-amber-600 dark:text-amber-400 text-lg">{Number(order.amount).toLocaleString('vi-VN')} đ</td>
                                                        <td className="py-4 pr-4 text-sm text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                                                        <td className="py-4 pr-4 text-sm text-slate-500 dark:text-slate-400">{order.verified_at ? new Date(order.verified_at).toLocaleString('vi-VN') : '—'}</td>
                                                        <td className="py-4"><StatusBadge status={order.status} map={paymentStatusMap} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: TRAINERS */}
                        {activeTab === 'trainers' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <SectionHeader title="Danh Sách Huấn Luyện Viên" subtitle={`${trainers.filter(t=>t.is_active).length} PT đang hoạt động / ${trainers.length} PT tổng`} />
                                    <button onClick={() => setShowAddTrainerModal(true)} className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-base rounded-xl transition shadow flex items-center gap-2 cursor-pointer"><Plus className="w-5 h-5" /> Thêm PT Mới</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {trainers.map(t => {
                                        const trId = t.trainer_id || t.id;
                                        return (
                                            <div key={trId} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div><p className="text-xl font-black text-slate-900 dark:text-white">{t.full_name}</p><p className="text-base text-cyan-600 dark:text-cyan-400 mt-0.5 font-medium">{t.specialization}</p></div>
                                                    <span className="text-amber-500 font-black text-lg">★ {t.rating||'5.0'}</span>
                                                </div>
                                                <div className="space-y-1.5 text-base text-slate-500 dark:text-slate-400">
                                                    <p>📧 {t.email||'Chưa cập nhật'}</p>
                                                    <p>📞 {t.phone||'Chưa cập nhật'}</p>
                                                    <p>👥 <strong className="text-slate-800 dark:text-slate-200">{t.active_clients_count||0}</strong> học viên đang tập</p>
                                                </div>
                                                <div className="pt-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
                                                    <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${t.is_active ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'}`}>{t.is_active ? '● Đang hoạt động' : '○ Tạm dừng'}</span>
                                                    <button onClick={() => handleToggleTrainer(trId)} className="text-base text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer font-medium">{t.is_active ? 'Khóa' : 'Kích hoạt'}</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB: EXERCISES */}
                        {activeTab === 'exercises' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <SectionHeader title="Thư Viện Bài Tập Thể Hình" subtitle={`${exercises.length} bài tập trong thư viện`} />
                                    <button onClick={() => setShowAddExerciseModal(true)} className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-base rounded-xl transition shadow flex items-center gap-2 cursor-pointer"><Plus className="w-5 h-5" /> Thêm Bài Tập</button>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} placeholder="Tìm bài tập hoặc nhóm cơ..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
                                    <select value={exerciseFilterMechanic} onChange={e => setExerciseFilterMechanic(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"><option value="">Tất cả loại</option><option value="Compound">Compound</option><option value="Isolation">Isolation</option></select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {exercises.slice(0,24).map(ex => (
                                        <div key={ex.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-2">
                                            <div className="flex justify-between items-start"><p className="text-lg font-bold text-slate-900 dark:text-white">{ex.name}</p><button onClick={() => handleDeleteExercise(ex.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition cursor-pointer"><X className="w-4 h-4" /></button></div>
                                            <p className="text-base text-cyan-600 dark:text-cyan-400 font-semibold">{ex.primary_muscle} • {ex.mechanic}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{ex.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* MODAL: Add Trainer */}
            {showAddTrainerModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-slate-900 dark:text-white">Thêm PT Mới</h3><button onClick={() => setShowAddTrainerModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"><X className="w-5 h-5" /></button></div>
                        <form onSubmit={handleCreateTrainer} className="space-y-4">
                            {[{label:'Họ & Tên',key:'fullName',type:'text',ph:'Nguyễn Văn A'},{label:'Email',key:'email',type:'email',ph:'pt@gym.com'},{label:'Mật Khẩu',key:'password',type:'password',ph:'••••••'},{label:'Số Điện Thoại',key:'phone',type:'text',ph:'0901234567'},{label:'Chuyên Môn',key:'specialization',type:'text',ph:'Giảm cân, Tăng cơ'}].map(f => (
                                <div key={f.key}><label className={lbl}>{f.label}</label><input type={f.type} placeholder={f.ph} value={trainerForm[f.key]} onChange={e => setTrainerForm(prev => ({...prev,[f.key]:e.target.value}))} className={inp} required={['fullName','email','password'].includes(f.key)} /></div>
                            ))}
                            <div><label className={lbl}>Giới thiệu</label><textarea rows={3} placeholder="Mô tả kinh nghiệm..." value={trainerForm.bio} onChange={e => setTrainerForm(prev => ({...prev,bio:e.target.value}))} className={inp} /></div>
                            <button type="submit" disabled={trainerLoading} className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-base rounded-2xl transition cursor-pointer">{trainerLoading ? 'Đang tạo...' : '🎉 Tạo Tài Khoản PT'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Add Exercise */}
            {showAddExerciseModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-slate-900 dark:text-white">Thêm Bài Tập Mới</h3><button onClick={() => setShowAddExerciseModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"><X className="w-5 h-5" /></button></div>
                        <form onSubmit={handleCreateExercise} className="space-y-4">
                            <div><label className={lbl}>Tên Bài Tập</label><input required value={exerciseForm.name} onChange={e => setExerciseForm(p => ({...p,name:e.target.value}))} placeholder="Bench Press, Squat..." className={inp} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Nhóm Cơ Chính</label><select value={exerciseForm.primaryMuscle} onChange={e => setExerciseForm(p => ({...p,primaryMuscle:e.target.value}))} className={inp}>{['Ngực','Lưng','Vai','Tay trước','Tay sau','Chân','Bụng','Mông'].map(m => <option key={m}>{m}</option>)}</select></div>
                                <div><label className={lbl}>Cơ Chế</label><select value={exerciseForm.mechanic} onChange={e => setExerciseForm(p => ({...p,mechanic:e.target.value}))} className={inp}><option>Compound</option><option>Isolation</option></select></div>
                            </div>
                            <div><label className={lbl}>Mô Tả</label><textarea rows={3} value={exerciseForm.description} onChange={e => setExerciseForm(p => ({...p,description:e.target.value}))} placeholder="Hướng dẫn thực hiện..." className={inp} /></div>
                            <div><label className={lbl}>Dụng Cụ (cách nhau dấu phẩy)</label><input value={exerciseForm.equipmentRequired} onChange={e => setExerciseForm(p => ({...p,equipmentRequired:e.target.value}))} placeholder="Tạ đòn, Ghế tập" className={inp} /></div>
                            <div><label className={lbl}>Chống Chỉ Định</label><input value={exerciseForm.contraindications} onChange={e => setExerciseForm(p => ({...p,contraindications:e.target.value}))} placeholder="Chấn thương vai, Đau lưng" className={inp} /></div>
                            <button type="submit" disabled={exerciseLoading} className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-base rounded-2xl transition cursor-pointer">{exerciseLoading ? 'Đang thêm...' : '+ Thêm Vào Thư Viện'}</button>
                        </form>
                    </div>
                </div>
            )}

            <BookingModal isOpen={showBookingModal} onClose={() => { setShowBookingModal(false); loadData(); }} user={{ role: 'admin' }} />
            <PackageModal isOpen={showPackageModal} onClose={() => { setShowPackageModal(false); loadData(); }} />
        </div>
    );
}
