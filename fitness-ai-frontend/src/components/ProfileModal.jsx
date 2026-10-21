import React, { useState, useEffect, useRef } from 'react';
import { fetchMyPersonalProfile, updateMyPersonalProfile, clearProfileField } from '../services/api';
import { getMemberTierInfo } from '../utils/tierBadge';

// ─── Icons ───────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d={d} />
    </svg>
);
const IconUser     = () => <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;
const IconPhone    = () => <Icon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />;
const IconMapPin   = () => <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />;
const IconCalendar = () => <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />;
const IconBriefcase= () => <Icon d="M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />;
const IconHeart    = () => <Icon d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />;
const IconEdit     = () => <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />;
const IconTrash    = () => <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />;
const IconSave     = () => <Icon d="M19 21H5a2 2 0 0 0-2-2V5a2 2 0 0 0 2-2h11l5 5v14zM17 21v-8H7v8M7 3v5h8" />;
const IconX        = () => <Icon d="M18 6 6 18M6 6l12 12" />;
const IconCheck    = () => <Icon d="M20 6 9 17l-5-5" />;

const GENDER_OPTIONS = [
    { value: 'male',   label: '👨 Nam' },
    { value: 'female', label: '👩 Nữ' },
    { value: 'other',  label: '🧑 Khác' },
];

export default function ProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'emergency' | 'bio'
    const [editField, setEditField] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            loadProfile();
        }
    }, [isOpen]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3200);
    };

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await fetchMyPersonalProfile();
            if (res?.profile) {
                setProfile(res.profile);
            }
        } catch (e) {
            showToast('error', 'Không thể tải hồ sơ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (fieldKey) => {
        setEditField(fieldKey);
        setEditValues({ [fieldKey]: profile?.[fieldKey] || '' });
    };

    const cancelEdit = () => {
        setEditField(null);
        setEditValues({});
    };

    const saveField = async (fieldKey) => {
        setSaving(true);
        try {
            const payload = { [fieldKey]: editValues[fieldKey] || null };
            const res = await updateMyPersonalProfile(payload);
            if (res?.profile) {
                setProfile(prev => ({ ...prev, ...res.profile }));
                onProfileUpdated?.(res.profile);
            } else {
                setProfile(prev => ({ ...prev, ...payload }));
            }
            showToast('success', 'Đã lưu thay đổi thành công! ✨');
            cancelEdit();
        } catch (e) {
            const errMsg = e?.response?.data?.message || 'Lỗi khi lưu dữ liệu.';
            showToast('error', errMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteField = async (fieldKey) => {
        setDeleteConfirm(null);
        setSaving(true);
        try {
            await clearProfileField(fieldKey);
            setProfile(prev => ({ ...prev, [fieldKey]: null }));
            showToast('success', 'Đã xóa trường thông tin.');
        } catch (e) {
            showToast('error', 'Không thể xóa thông tin. Thử lại sau.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const avatarInitial = profile?.full_name?.charAt(0)?.toUpperCase()
        || currentUser?.full_name?.charAt(0)?.toUpperCase()
        || 'U';

    const tierInfo = getMemberTierInfo(currentUser, null);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
            {/* Toast popup */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold text-white transition-all transform animate-bounce ${
                    toast.type === 'success'
                        ? 'bg-emerald-600 border-emerald-500'
                        : 'bg-rose-600 border-rose-500'
                }`}>
                    {toast.type === 'success' ? <IconCheck size={18} /> : <span>⚠️</span>}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto text-2xl">
                            🗑️
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Xác nhận xóa thông tin?</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dữ liệu của mục này sẽ bị xóa khỏi hồ sơ cá nhân của bạn.</p>
                        </div>
                        <div className="flex items-center gap-2.5 pt-2">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => handleDeleteField(deleteConfirm)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                            >
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Body Container */}
            <div
                ref={modalRef}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-all"
            >
                {/* Header Cover Banner */}
                <div className="relative bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 p-6 sm:p-7 text-white shrink-0">
                    <button
                        onClick={onClose}
                        title="Đóng"
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition cursor-pointer border border-white/20"
                    >
                        <IconX size={18} />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/40 flex items-center justify-center text-3xl font-black shadow-inner">
                                {avatarInitial}
                            </div>
                            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px]" title="Đang hoạt động">
                                ✓
                            </span>
                        </div>

                        {/* Name & Basic Meta */}
                        <div className="text-center sm:text-left space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <h3 className="text-xl sm:text-2xl font-black text-white">
                                    {profile?.full_name || currentUser?.full_name || 'Học viên'}
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/30 text-white`}>
                                    {profile?.role || currentUser?.role || 'Hội viên'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-indigo-100 flex items-center justify-center sm:justify-start gap-2">
                                <span>📧 {profile?.email || currentUser?.email || 'Chưa cập nhật email'}</span>
                            </p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 backdrop-blur-xs">
                                    <span>{tierInfo.icon}</span>
                                    <span>{tierInfo.tierName}</span>
                                </span>
                                {profile?.updated_at && (
                                    <span className="text-[11px] text-white/70">
                                        Cập nhật: {new Date(profile.updated_at).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subnav Pill Tabs (Dribbble style) */}
                <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'info'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span>📋</span>
                        <span>Thông tin cá nhân</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('emergency')}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'emergency'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span>🚨</span>
                        <span>Liên hệ khẩn cấp</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('bio')}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'bio'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span>✍️</span>
                        <span>Mục tiêu & Giới thiệu</span>
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="space-y-3 py-4">
                            {[1, 2, 3, 4].map(k => (
                                <div key={k} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                            {activeTab === 'info' && (
                                <div className="space-y-3">
                                    {/* Full name */}
                                    <FieldCard
                                        icon={<IconUser />}
                                        label="Họ và tên"
                                        fieldKey="full_name"
                                        value={profile?.full_name}
                                        isEditing={editField === 'full_name'}
                                        editValue={editValues.full_name}
                                        onEditChange={v => setEditValues(p => ({ ...p, full_name: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('full_name')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                        placeholder="Nhập họ và tên..."
                                    />

                                    {/* Phone */}
                                    <FieldCard
                                        icon={<IconPhone />}
                                        label="Số điện thoại"
                                        fieldKey="phone"
                                        value={profile?.phone}
                                        type="tel"
                                        isEditing={editField === 'phone'}
                                        editValue={editValues.phone}
                                        onEditChange={v => setEditValues(p => ({ ...p, phone: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('phone')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                        placeholder="0901234567"
                                    />

                                    {/* Gender */}
                                    <FieldCard
                                        icon={<span>{profile?.gender === 'female' ? '👩' : profile?.gender === 'other' ? '🧑' : '👨'}</span>}
                                        label="Giới tính"
                                        fieldKey="gender"
                                        type="select"
                                        selectOptions={GENDER_OPTIONS}
                                        value={GENDER_OPTIONS.find(g => g.value === profile?.gender)?.label || profile?.gender}
                                        rawValue={profile?.gender}
                                        isEditing={editField === 'gender'}
                                        editValue={editValues.gender}
                                        onEditChange={v => setEditValues(p => ({ ...p, gender: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('gender')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                    />

                                    {/* Date of birth */}
                                    <FieldCard
                                        icon={<IconCalendar />}
                                        label="Ngày sinh"
                                        fieldKey="date_of_birth"
                                        type="date"
                                        value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : null}
                                        rawValue={profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : ''}
                                        isEditing={editField === 'date_of_birth'}
                                        editValue={editValues.date_of_birth}
                                        onEditChange={v => setEditValues(p => ({ ...p, date_of_birth: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('date_of_birth')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                    />

                                    {/* Occupation */}
                                    <FieldCard
                                        icon={<IconBriefcase />}
                                        label="Nghề nghiệp"
                                        fieldKey="occupation"
                                        value={profile?.occupation}
                                        isEditing={editField === 'occupation'}
                                        editValue={editValues.occupation}
                                        onEditChange={v => setEditValues(p => ({ ...p, occupation: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('occupation')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                        placeholder="Ví dụ: Lập trình viên, Giáo viên, Kinh doanh..."
                                    />

                                    {/* Address */}
                                    <FieldCard
                                        icon={<IconMapPin />}
                                        label="Địa chỉ nơi ở"
                                        fieldKey="address"
                                        type="textarea"
                                        value={profile?.address}
                                        isEditing={editField === 'address'}
                                        editValue={editValues.address}
                                        onEditChange={v => setEditValues(p => ({ ...p, address: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('address')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                                    />
                                </div>
                            )}

                            {/* TAB 2: LIÊN HỆ KHẨN CẤP */}
                            {activeTab === 'emergency' && (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
                                        <span className="text-xl">⚠️</span>
                                        <div className="text-xs text-amber-900 dark:text-amber-300 space-y-1">
                                            <p className="font-bold">Thông tin an toàn phòng tập</p>
                                            <p>Cung cấp số điện thoại người thân để ban quản lý và Huấn Luyện Viên có thể liên hệ ngay trong các tình huống khẩn cấp hoặc hỗ trợ sức khỏe khi tập luyện.</p>
                                        </div>
                                    </div>

                                    {/* Emergency contact person */}
                                    <FieldCard
                                        icon={<IconHeart />}
                                        label="Họ tên người liên hệ khẩn cấp"
                                        fieldKey="emergency_contact"
                                        value={profile?.emergency_contact}
                                        isEditing={editField === 'emergency_contact'}
                                        editValue={editValues.emergency_contact}
                                        onEditChange={v => setEditValues(p => ({ ...p, emergency_contact: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('emergency_contact')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                        placeholder="Ví dụ: Bố, Mẹ, Vợ / Chồng..."
                                    />

                                    {/* Emergency phone */}
                                    <FieldCard
                                        icon={<IconPhone />}
                                        label="Số điện thoại khẩn cấp"
                                        fieldKey="emergency_phone"
                                        type="tel"
                                        value={profile?.emergency_phone}
                                        isEditing={editField === 'emergency_phone'}
                                        editValue={editValues.emergency_phone}
                                        onEditChange={v => setEditValues(p => ({ ...p, emergency_phone: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('emergency_phone')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                        placeholder="0912345678"
                                    />
                                </div>
                            )}

                            {/* TAB 3: MỤC TIÊU & GIỚI THIỆU */}
                            {activeTab === 'bio' && (
                                <div className="space-y-4">
                                    <FieldCard
                                        icon={<span>✍️</span>}
                                        label="Lời giới thiệu & Ghi chú cá nhân"
                                        fieldKey="bio"
                                        type="textarea"
                                        value={profile?.bio}
                                        isEditing={editField === 'bio'}
                                        editValue={editValues.bio}
                                        onEditChange={v => setEditValues(p => ({ ...p, bio: v }))}
                                        onStartEdit={startEdit}
                                        onSave={() => saveField('bio')}
                                        onCancel={cancelEdit}
                                        onDelete={f => setDeleteConfirm(f)}
                                        saving={saving}
                                        placeholder="Chia sẻ mục tiêu cá nhân, phương châm sống, thời gian rảnh rỗi thích tập luyện..."
                                    />

                                    {/* Subtle notice for biometrics */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex items-center gap-3.5">
                                        <span className="text-2xl">⚖️</span>
                                        <div className="text-xs text-slate-600 dark:text-slate-300">
                                            <p className="font-bold text-slate-800 dark:text-white">Chiều cao & Cân nặng ở đâu?</p>
                                            <p>Chỉ số cơ thể (chiều cao, cân nặng, BMI, mục tiêu tăng cơ/giảm mỡ) được cập nhật và phân tích tự động tại phần <strong>Khảo sát thể lực & Báo cáo tiến độ</strong>.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Modal Actions */}
                <div className="p-4 px-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
                    <span>Đồng bộ dữ liệu tài khoản an toàn 🔒</span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold transition shadow-xs cursor-pointer"
                    >
                        Hoàn tất
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-component: FieldCard ──────────────────────────────────────────
function FieldCard({
    icon,
    label,
    fieldKey,
    value,
    rawValue,
    type = 'text',
    selectOptions = [],
    isEditing,
    editValue,
    onEditChange,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
    saving,
    placeholder
}) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            e.preventDefault();
            onSave();
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    const isEmpty = !value || value === '';

    if (isEditing) {
        return (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        {icon}
                        <span>{label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Nhấn Enter để lưu, Esc để hủy</span>
                </div>

                {type === 'textarea' ? (
                    <textarea
                        ref={inputRef}
                        rows={3}
                        value={editValue || ''}
                        onChange={e => onEditChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                ) : type === 'select' ? (
                    <select
                        ref={inputRef}
                        value={editValue || ''}
                        onChange={e => onEditChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        <option value="">-- Chọn {label.toLowerCase()} --</option>
                        {selectOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        ref={inputRef}
                        type={type}
                        value={editValue || ''}
                        onChange={e => onEditChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                        {saving ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <IconSave size={14} />
                        )}
                        <span>Lưu thay đổi</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-all flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700/60 shadow-xs flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {label}
                    </p>
                    {isEmpty ? (
                        <p className="text-xs sm:text-sm text-slate-400 italic mt-0.5">Chưa cập nhật thông tin</p>
                    ) : (
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                            {value}
                        </p>
                    )}
                </div>
            </div>

            {/* Action buttons on hover / always visible on mobile */}
            <div className="flex items-center gap-1.5 shrink-0 opacity-90 sm:opacity-70 group-hover:opacity-100 transition">
                <button
                    onClick={() => onStartEdit(fieldKey)}
                    title="Chỉnh sửa"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 shadow-2xs flex items-center justify-center transition cursor-pointer"
                >
                    <IconEdit size={15} />
                </button>
                {!isEmpty && (
                    <button
                        onClick={() => onDelete(fieldKey)}
                        title="Xóa mục này"
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 shadow-2xs flex items-center justify-center transition cursor-pointer"
                    >
                        <IconTrash size={15} />
                    </button>
                )}
            </div>
        </div>
    );
}
