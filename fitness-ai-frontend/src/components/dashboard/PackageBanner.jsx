// src/components/dashboard/PackageBanner.jsx
import React from 'react';
import { Calendar, CheckCircle2, Clock, Star, Phone, Sparkles } from 'lucide-react';

export default function PackageBanner({
  userPackage,
  isPendingPtApproval,
  myBookings,
  onOpenBooking,
  onOpenReview,
  onCancelBooking,
  onOpenPackageModal,
  isRegistered,
  onOpenAuth,
}) {
  if (userPackage) {
    const totalSessions = userPackage.total_sessions || 1;
    const remainingSessions = userPackage.remaining_sessions || 0;
    const completedSessions = Math.max(0, totalSessions - remainingSessions);
    const progressPercent = Math.min(100, Math.round((completedSessions / totalSessions) * 100));

    return (
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-xs">
                {userPackage.package_name || 'Gói PT 1-1'}
              </span>
              {isPendingPtApproval ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-300 animate-spin" /> Đang chờ PT thẩm định giáo án
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Giáo án đã được PT phê duyệt
                </span>
              )}
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Huấn Luyện Viên: {userPackage.trainer_name || 'Chuyên gia thể hình'}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mt-1.5 leading-relaxed flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Chuyên môn: <strong className="text-amber-300">{userPackage.specialization || 'Tăng cơ & Giảm mỡ nâng cao'}</strong></span>
                <span>• Đánh giá: <span className="inline-flex items-center text-amber-400 font-bold"><Star className="w-3.5 h-3.5 fill-current mr-1" />{userPackage.trainer_rating || '5.0'}</span></span>
                <span>• Liên hệ: <span className="text-slate-200">{userPackage.trainer_phone || 'Tại phòng gym'}</span></span>
              </p>
            </div>
          </div>

          {/* Số buổi còn lại & Button Đặt Lịch */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3.5 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center w-full sm:w-auto min-w-[200px]">
              <p className="text-xs text-slate-300 uppercase tracking-wider font-bold">Buổi tập khả dụng</p>
              <p className="text-4xl sm:text-5xl font-black text-amber-300 mt-1">
                {remainingSessions} <span className="text-sm sm:text-base text-slate-300 font-normal">/ {totalSessions} buổi</span>
              </p>
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium mt-2 pt-2 border-t border-white/10">
                <span>Đã tập: <strong className="text-white font-bold">{completedSessions}</strong> buổi</span>
                <span>Còn: <strong className="text-emerald-400 font-bold">{remainingSessions}</strong></span>
              </div>
              <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {remainingSessions > 0 ? (
              <button
                type="button"
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm sm:text-base rounded-2xl transition shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Calendar className="w-5 h-5" /> Đặt Lịch Tập Buổi Tiếp Theo
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenReview}
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Star className="w-5 h-5 fill-current" /> Đánh Giá & Gia Hạn Gói Mới
              </button>
            )}
          </div>
        </div>

        {/* Danh sách các buổi tập đã đặt sắp tới */}
        {myBookings?.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10 space-y-3.5">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-300" /> Lịch tập sắp tới cùng PT:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {myBookings.slice(0, 3).map((b) => (
                <div key={b.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center text-sm hover:bg-white/10 transition">
                  <div>
                    <p className="font-bold text-white text-base">
                      {new Date(b.booking_date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                    </p>
                    {b.notes && <p className="text-xs text-amber-200 mt-1 italic">"{b.notes}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      b.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/20' :
                      b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/20' : 'bg-rose-500/20 text-rose-300 border border-rose-400/20'
                    }`}>
                      {b.status === 'confirmed' ? 'Đã xác nhận' : b.status === 'completed' ? 'Đã tập' : 'Đã hủy'}
                    </span>
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => onCancelBooking(b.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                      >
                        Hủy lịch
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Gợi ý nâng cấp gói kèm PT 1-1
  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="space-y-2.5 max-w-2xl">
        <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-widest rounded-full">
          Mô Hình Đột Phá: PT &gt; AI
        </span>
        <h3 className="text-2xl sm:text-3xl font-black">
          Bạn Muốn Có Huấn Luyện Viên Kèm 1-1 & Sửa Form Tận Nơi?
        </h3>
        <p className="text-sm sm:text-base text-amber-100 leading-relaxed">
          AI đã lập phác đồ hoàn hảo. Đăng ký ngay gói tập (12, 24, 36 buổi) để Huấn Luyện Viên trực tiếp hướng dẫn kỹ thuật, phòng ngừa chấn thương và bảo đảm kết quả.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!isRegistered) {
            onOpenAuth();
          } else {
            onOpenPackageModal();
          }
        }}
        className="whitespace-nowrap px-7 py-4 bg-slate-950 hover:bg-black text-white font-black text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl transition cursor-pointer flex items-center gap-2 active:scale-95"
      >
        <Sparkles className="w-5 h-5 text-amber-400" /> Xem Các Gói PT 1-1
      </button>
    </div>
  );
}
