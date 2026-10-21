// src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, authGoogle, sendPhoneOtp, verifyPhoneOtp } from '../services/api';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }) {
    const navigate = useNavigate();
    const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
    const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
    
    // Email Form State
    const [emailForm, setEmailForm] = useState({ email: '', password: '', fullName: '' });
    
    // Phone OTP Form State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [devOtpHint, setDevOtpHint] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [phoneFullName, setPhoneFullName] = useState('');

    // Common State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Đếm ngược gửi lại OTP
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    if (!isOpen) return null;

    const handleSaveAuthSuccess = (res) => {
        if (res.token) {
            localStorage.setItem('fitness_token', res.token);
            localStorage.setItem('fitness_user_id', res.userId);
            localStorage.setItem('fitness_role', res.role || 'member');
            if (onSuccess) onSuccess(res);
            onClose();

            // Tự động chuyển hướng ngay lập tức theo vai trò
            if (res.role === 'pt') {
                navigate('/pt');
            } else if (res.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    };


    // 1. Xử lý Email (Login / Register)
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const currentUserId = localStorage.getItem('fitness_user_id');

        try {
            if (isRegisterMode) {
                const res = await registerUser({
                    userId: currentUserId,
                    email: emailForm.email,
                    password: emailForm.password,
                    fullName: emailForm.fullName
                });
                handleSaveAuthSuccess(res);
            } else {
                const res = await loginUser({
                    email: emailForm.email,
                    password: emailForm.password
                });
                handleSaveAuthSuccess(res);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Thao tác thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Xử lý Gửi OTP Số điện thoại
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!phone || phone.trim().length < 9) {
            setError('Vui lòng nhập số điện thoại hợp lệ (10 số).');
            return;
        }

        setLoading(true);
        try {
            const res = await sendPhoneOtp({ phone: phone.trim() });
            setOtpSent(true);
            setCountdown(60);
            if (res.devOtp) {
                setDevOtpHint(res.devOtp);
            }
            setSuccessMsg(res.message || 'Đã gửi mã OTP đến số điện thoại.');
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi mã OTP.');
        } finally {
            setLoading(false);
        }
    };

    // 3. Xử lý Xác thực OTP Số điện thoại
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!otp || otp.trim().length < 4) {
            setError('Vui lòng nhập mã OTP đầy đủ.');
            return;
        }

        setLoading(true);
        const currentUserId = localStorage.getItem('fitness_user_id');
        try {
            const res = await verifyPhoneOtp({
                phone: phone.trim(),
                otp: otp.trim(),
                userId: currentUserId,
                fullName: phoneFullName.trim()
            });
            handleSaveAuthSuccess(res);
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    // 4. Xử lý Đăng nhập Google (OAuth 2.0 Direct Mock & Integration)
    const handleGoogleAuth = async () => {
        setError('');
        setLoading(true);
        const currentUserId = localStorage.getItem('fitness_user_id');

        try {
            // Hỗ trợ mô phỏng Google popup hoặc tích hợp Identity token
            const mockGoogleData = {
                googleId: 'google_' + Math.floor(100000000 + Math.random() * 900000000),
                email: `user.gym${Math.floor(Math.random() * 900)}@gmail.com`,
                fullName: 'Google Fitness Member',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                userId: currentUserId
            };

            const res = await authGoogle(mockGoogleData);
            handleSaveAuthSuccess(res);
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập Google thất bại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg font-bold w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="text-center space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isRegisterMode ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        {isRegisterMode 
                            ? 'Lưu giữ lộ trình thể hình và đồng bộ dữ liệu tập luyện' 
                            : 'Truy cập vào kế hoạch tập và dinh dưỡng cá nhân'}
                    </p>
                </div>

                {/* Google Auth Button */}
                <div>
                    <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs hover:shadow transition cursor-pointer disabled:opacity-60"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Tiếp tục với Google</span>
                    </button>

                    <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
                        <span className="px-3 text-[11px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">hoặc</span>
                        <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
                    </div>
                </div>

                {/* Tabs: Email vs Phone */}
                <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                    <button
                        type="button"
                        onClick={() => { setAuthMethod('email'); setError(''); }}
                        className={`w-1/2 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            authMethod === 'email' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                        }`}
                    >
                        📧 Email
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMethod('phone'); setError(''); }}
                        className={`w-1/2 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            authMethod === 'phone' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                        }`}
                    >
                        📱 Số điện thoại (OTP)
                    </button>
                </div>

                {/* Thông báo lỗi / thành công */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300 text-xs font-semibold rounded-xl animate-shake">
                        ⚠️ {error}
                    </div>
                )}
                {successMsg && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl">
                        ✓ {successMsg}
                    </div>
                )}

                {/* METHOD 1: EMAIL / PASSWORD */}
                {authMethod === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                        {isRegisterMode && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Họ và tên</label>
                                <input
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    required={isRegisterMode}
                                    value={emailForm.fullName}
                                    onChange={(e) => setEmailForm({ ...emailForm, fullName: e.target.value })}
                                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Email</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={emailForm.email}
                                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={emailForm.password}
                                onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                                className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:bg-gray-400 cursor-pointer"
                        >
                            {loading ? 'Đang xử lý...' : (isRegisterMode ? 'Hoàn Tất Đăng Ký 🚀' : 'Đăng Nhập Vào Ngay ⚡')}
                        </button>
                    </form>
                )}

                {/* METHOD 2: PHONE OTP */}
                {authMethod === 'phone' && (
                    <div className="space-y-3.5">
                        {!otpSent ? (
                            <form onSubmit={handleSendOtp} className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Số điện thoại</label>
                                    <div className="flex gap-2">
                                        <span className="p-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center">
                                            🇻🇳 +84
                                        </span>
                                        <input
                                            type="tel"
                                            placeholder="0912345678"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Hệ thống sẽ gửi mã OTP 6 số qua tin nhắn để xác minh.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:bg-gray-400 cursor-pointer"
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi Mã Xác Thực OTP 📲'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                        Nhập mã OTP (gửi tới {phone})
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="123456"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-center text-lg font-black tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    {devOtpHint && (
                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                                            💡 Mã OTP thử nghiệm: <span className="underline font-bold">{devOtpHint}</span>
                                        </p>
                                    )}
                                </div>

                                {isRegisterMode && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Họ tên (tùy chọn)</label>
                                        <input
                                            type="text"
                                            placeholder="Họ tên của bạn"
                                            value={phoneFullName}
                                            onChange={(e) => setPhoneFullName(e.target.value)}
                                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOtpSent(false)}
                                        className="w-1/3 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
                                    >
                                        Đổi số
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:bg-gray-400 cursor-pointer"
                                    >
                                        {loading ? 'Đang xác thực...' : 'Xác Thực & Vào Ngay ✓'}
                                    </button>
                                </div>

                                <div className="text-center pt-1">
                                    {countdown > 0 ? (
                                        <span className="text-xs text-gray-400 dark:text-slate-500">Gửi lại mã sau {countdown}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold underline cursor-pointer"
                                        >
                                            Gửi lại mã OTP
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Footer Switch Login / Register */}
                <div className="pt-2 text-center border-t border-gray-100 dark:border-slate-800">
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegisterMode(!isRegisterMode);
                                setError('');
                                setSuccessMsg('');
                            }}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer ml-1 underline"
                        >
                            {isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
}
