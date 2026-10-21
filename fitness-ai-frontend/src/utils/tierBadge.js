// src/utils/tierBadge.js
/**
 * Utility to calculate Member Tier Badges based on active packages and total sessions
 */
export function getMemberTierInfo(user = {}, userPackage = null) {
    const totalSessions = userPackage?.total_sessions || user?.total_sessions || 0;
    const clientTier = user?.client_tier || '';

    if (totalSessions >= 36 || clientTier === 'vip_gold') {
        return {
            tierName: 'VIP Gold Toàn Diện',
            tierShort: 'VIP Gold',
            icon: '👑',
            sessionBadge: '36 Buổi VIP',
            gradient: 'from-amber-400 via-yellow-500 to-amber-600',
            badgeClass: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 shadow-xs shadow-amber-500/10',
            cardGlow: 'border-amber-500/50 shadow-amber-950/40'
        };
    }

    if (totalSessions >= 24 || clientTier === 'silver_pro') {
        return {
            tierName: 'Hội Viên Tiến Bộ Silver',
            tierShort: 'Silver Pro',
            icon: '🥈',
            sessionBadge: '24 Buổi Pro',
            gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
            badgeClass: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs shadow-cyan-500/10',
            cardGlow: 'border-cyan-500/50 shadow-cyan-950/40'
        };
    }

    if (totalSessions >= 12 || clientTier === 'bronze_12' || clientTier === 'pt_1_1') {
        return {
            tierName: 'Hội Viên Khởi Động Bronze',
            tierShort: 'Bronze 1-1',
            icon: '🥉',
            sessionBadge: '12 Buổi 1-1',
            gradient: 'from-orange-500 via-amber-600 to-orange-700',
            badgeClass: 'bg-gradient-to-r from-orange-500/20 to-amber-600/20 text-orange-300 border border-orange-500/40 shadow-xs shadow-orange-500/10',
            cardGlow: 'border-orange-500/50 shadow-orange-950/40'
        };
    }

    if (clientTier === 'calisthenics_home') {
        return {
            tierName: 'Calisthenics & Home Pro',
            tierShort: 'Home Pro',
            icon: '🏠',
            sessionBadge: 'Tập Tại Nhà',
            gradient: 'from-emerald-400 to-teal-500',
            badgeClass: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40',
            cardGlow: 'border-emerald-500/50 shadow-emerald-950/40'
        };
    }

    return {
        tierName: 'Học Viên Trải Nghiệm AI',
        tierShort: 'Miễn Phí',
        icon: '✨',
        sessionBadge: 'Trải Nghiệm',
        gradient: 'from-slate-400 to-slate-500',
        badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
        cardGlow: 'border-slate-700'
    };
}
