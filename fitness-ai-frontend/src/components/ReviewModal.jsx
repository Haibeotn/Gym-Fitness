// src/components/ReviewModal.jsx
import React, { useState } from 'react';
import { submitExperienceReview } from '../services/api';

export default function ReviewModal({ isOpen, userPackage, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !userPackage) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await submitExperienceReview({
                packageId: userPackage.id,
                rating,
                feedback
            });

            if (res.success) {
                if (onSuccess) onSuccess(res);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-amber-100 dark:border-slate-800">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-2xl mx-auto shadow-xs border border-amber-200 dark:border-transparent">
                        🏆
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Chúc Mừng Bạn Đã Hoàn Thành Khóa Tập!</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Bạn đã hoàn thành <span className="font-bold text-slate-800 dark:text-slate-200">{userPackage.total_sessions} buổi</span> cùng HLV <span className="font-bold text-amber-600 dark:text-amber-400">{userPackage.trainer_name || 'PT'}</span>. Hãy chia sẻ cảm nhận của bạn để mở khóa gia hạn gói mới!
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating */}
                    <div className="space-y-1.5 text-center">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Mức độ hài lòng với Huấn Luyện Viên
                        </label>
                        <div className="flex items-center justify-center gap-2 pt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-transform hover:scale-125 cursor-pointer ${
                                        star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                                    }`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {rating === 5 ? 'Tuyệt vời, vượt mong đợi! 🔥' :
                             rating === 4 ? 'Rất hài lòng 👍' :
                             rating === 3 ? 'Bình thường 👌' :
                             rating === 2 ? 'Cần cải thiện 👎' : 'Không hài lòng ⚠️'}
                        </p>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Cảm nhận và góp ý về quá trình huấn luyện
                        </label>
                        <textarea
                            rows="4"
                            required
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Chia sẻ về sự nhiệt tình của HLV, tiến độ thay đổi cơ thể, hoặc đề xuất cải thiện..."
                            className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá & Mở Khóa Đăng Ký Gói Mới 🚀'}
                    </button>
                </form>
            </div>
        </div>
    );
}
