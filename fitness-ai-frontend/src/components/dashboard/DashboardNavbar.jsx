// src/components/dashboard/DashboardNavbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Award, FileText, QrCode, Sparkles, BookOpen, Utensils, TrendingUp, LogOut, User, Compass, Wrench, Shield } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { getMemberTierInfo } from '../../utils/tierBadge';

export default function DashboardNavbar({
  currentUser,
  userRole,
  isRegistered,
  userPackage,
  searchQuery,
  setSearchQuery,
  searchCategory,
  setSearchCategory,
  onSearchSubmit,
  openModal,
  onLogout,
}) {
  const navigate = useNavigate();
  const [openNavDropdown, setOpenNavDropdown] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:px-6 sm:py-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative z-30">
      {/* Left: Brand Logo & Navigation Dropdowns */}
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 cursor-pointer group select-none"
        >
          <span className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white font-serif group-hover:opacity-90 transition">
            Thế Tài Fit<span className="text-[#ea4c89] text-3xl font-sans not-italic">.</span>
          </span>
        </div>

        {/* Navigation items / Dropdowns */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
          {/* Khám phá Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenNavDropdown(openNavDropdown === 'explore' ? null : 'explore')}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Khám phá</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {openNavDropdown === 'explore' && (
              <div 
                onMouseLeave={() => setOpenNavDropdown(null)}
                className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-fadeIn"
              >
                <button
                  onClick={() => { openModal('library'); setOpenNavDropdown(null); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>Thư viện bài tập</span>
                </button>
                <button
                  onClick={() => { openModal('mealTracker'); setOpenNavDropdown(null); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  <span>Theo dõi bữa ăn & Calo</span>
                </button>
                <button
                  onClick={() => { openModal('progress'); setOpenNavDropdown(null); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Phân tích tiến độ</span>
                </button>
              </div>
            )}
          </div>

          {/* Tiện ích Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenNavDropdown(openNavDropdown === 'tools' ? null : 'tools')}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>Tiện ích</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {openNavDropdown === 'tools' && (
              <div 
                onMouseLeave={() => setOpenNavDropdown(null)}
                className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-fadeIn"
              >
                <button
                  onClick={() => { openModal('leaderboard'); setOpenNavDropdown(null); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Bảng Vàng & Streaks</span>
                </button>
                <button
                  onClick={() => {
                    if (!isRegistered) { openModal('auth', 'register'); }
                    else { openModal('report'); }
                    setOpenNavDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Xuất Báo Cáo / PDF</span>
                </button>
                <button
                  onClick={() => {
                    if (!isRegistered) { openModal('auth', 'register'); }
                    else { openModal('booking'); }
                    setOpenNavDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-indigo-500" />
                  <span>Đặt Lịch & Vé QR</span>
                </button>
              </div>
            )}
          </div>

          {/* Mua Gói */}
          <button
            onClick={() => {
              if (!isRegistered) { openModal('auth', 'register'); }
              else { openModal('package'); }
            }}
            className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Gói tập</span>
          </button>

          {/* PT Workspace if role */}
          {(userRole === 'pt' || userRole === 'admin') && (
            <button
              onClick={() => navigate('/pt')}
              className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>PT Workspace</span>
            </button>
          )}
        </nav>
      </div>

      {/* Center: Dribbble-style Pill Search Bar */}
      <form onSubmit={onSearchSubmit} className="w-full md:max-w-md lg:max-w-lg flex items-center bg-slate-100/90 dark:bg-slate-800/80 rounded-full px-2 sm:px-3 py-1.5 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-[#ea4c89] focus-within:ring-2 focus-within:ring-[#ea4c89]/20 transition shadow-inner">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm bài tập, thực đơn, PT..."
          className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="bg-transparent text-slate-500 dark:text-slate-400 text-xs font-semibold focus:outline-none cursor-pointer pr-1 border-r border-slate-300 dark:border-slate-600"
          >
            <option value="all">Tất cả</option>
            <option value="exercise">Bài tập</option>
            <option value="meal">Dinh dưỡng</option>
            <option value="pt">HLV</option>
          </select>

          <button
            type="submit"
            title="Tìm kiếm"
            className="w-8 h-8 rounded-full bg-[#ea4c89] hover:bg-[#d83a78] text-white flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Right: Auth / Profile dropdown & Theme Toggle */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <ThemeToggle variant="navbar" />

        {!isRegistered ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openModal('auth', 'login')}
              className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 cursor-pointer transition"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => openModal('auth', 'register')}
              className="bg-[#0d0c22] hover:bg-black text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>✦</span>
              <span>Đăng ký</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* User pill trigger */}
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/80 dark:border-slate-700 cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs ring-2 ring-white dark:ring-slate-900">
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[110px]">
                  {currentUser?.full_name || 'Học viên'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {userRole}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div 
                onMouseLeave={() => setShowUserDropdown(false)}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1.5 animate-fadeIn"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {currentUser?.full_name || currentUser?.email || 'Học viên'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const tier = getMemberTierInfo(currentUser, userPackage);
                      return (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${tier.badgeClass}`}>
                          {tier.icon} {tier.tierName}
                        </span>
                      );
                    })()}
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      • {userPackage ? `${userPackage.remaining_sessions || 0} buổi` : 'Chưa có gói'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    openModal('profile');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>Hồ sơ cá nhân</span>
                  </span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                    Xem/Sửa
                  </span>
                </button>

                <button
                  onClick={() => {
                    openModal('leaderboard');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Bảng Vàng & Streaks</span>
                </button>

                <button
                  onClick={() => {
                    openModal('package');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Nâng cấp gói tập</span>
                </button>

                <hr className="border-slate-100 dark:border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
