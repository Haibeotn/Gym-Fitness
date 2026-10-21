// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { fetchMe } from '../services/api';
import AuthModal from './AuthModal';

export default function ProtectedRoute({ children, allowedRoles = [], allowGuest = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('checking'); // 'checking' | 'authorized' | 'unauthorized' | 'wrong_role'
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('fitness_token');
            const storedRole = localStorage.getItem('fitness_role');

            if (!token) {
                if (allowGuest) {
                    setStatus('authorized');
                    return;
                }
                setStatus('unauthorized');
                setShowAuthModal(true);
                return;
            }

            try {
                const res = await fetchMe();
                if (res?.user) {
                    setUser(res.user);
                    const currentRole = res.user.role || storedRole || 'member';
                    localStorage.setItem('fitness_role', currentRole);

                    if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
                        setStatus('wrong_role');
                    } else {
                        setStatus('authorized');
                    }
                } else {
                    if (allowGuest) {
                        setStatus('authorized');
                        return;
                    }
                    localStorage.removeItem('fitness_token');
                    localStorage.removeItem('fitness_role');
                    setStatus('unauthorized');
                    setShowAuthModal(true);
                }
            } catch (err) {
                console.warn("Token không hợp lệ hoặc đã hết hạn:", err);
                if (allowGuest) {
                    setStatus('authorized');
                    return;
                }
                localStorage.removeItem('fitness_token');
                localStorage.removeItem('fitness_role');
                setStatus('unauthorized');
                setShowAuthModal(true);
            }
        };

        verifyAuth();
    }, [location.pathname, allowGuest]);


    if (status === 'checking') {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Đang xác thực bảo mật & quyền truy cập...
                </p>
            </div>
        );
    }

    // Nếu chưa đăng nhập -> Hiển thị màn hình khóa yêu cầu đăng nhập
    if (status === 'unauthorized') {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-md w-full space-y-5">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xs border border-indigo-100 dark:border-transparent">
                        🔒
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Khu Vực Yêu Cầu Đăng Nhập</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Trang này yêu cầu xác thực tài khoản. Vui lòng đăng nhập để hệ thống nhận diện đúng vai trò của bạn.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer"
                    >
                        ⚡ Đăng Nhập Ngay
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold cursor-pointer underline"
                    >
                        ← Quay về trang chủ
                    </button>
                </div>

                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={(authData) => {
                        setShowAuthModal(false);
                        const role = authData.role || 'member';
                        if (role === 'admin') navigate('/admin');
                        else if (role === 'pt') navigate('/pt');
                        else navigate('/dashboard');
                    }}
                />
            </div>
        );
    }

    // Nếu đã đăng nhập nhưng sai vai trò (Ví dụ PT cố vào Admin hoặc Member cố vào PT)
    if (status === 'wrong_role') {
        const userRole = user?.role || localStorage.getItem('fitness_role');
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/40 max-w-md w-full space-y-4">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-red-100 dark:border-transparent">
                        🚫
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Không Có Quyền Truy Cập</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tài khoản của bạn có vai trò <span className="font-bold uppercase text-red-600 dark:text-red-400">{userRole}</span>, không có thẩm quyền truy cập vào trang này.
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                        <button
                            onClick={() => {
                                if (userRole === 'admin') navigate('/admin');
                                else if (userRole === 'pt') navigate('/pt');
                                else navigate('/dashboard');
                            }}
                            className="w-full py-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                            Về Trang Phù Hợp Với Quyền Của Tôi ➔
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('fitness_token');
                                localStorage.removeItem('fitness_user_id');
                                localStorage.removeItem('fitness_role');
                                setStatus('unauthorized');
                                setShowAuthModal(true);
                            }}
                            className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-500/40 transition cursor-pointer"
                        >
                            🚪 Đăng Xuất &amp; Đăng Nhập Tài Khoản Khác
                        </button>
                    </div>
                </div>

                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={(authData) => {
                        setShowAuthModal(false);
                        const role = authData.role || 'member';
                        if (role === 'admin') navigate('/admin');
                        else if (role === 'pt') navigate('/pt');
                        else navigate('/dashboard');
                    }}
                />
            </div>
        );
    }

    return children;
}

