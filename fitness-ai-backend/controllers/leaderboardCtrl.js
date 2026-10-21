// controllers/leaderboardCtrl.js
const pool = require('../config/db');

/**
 * Lấy Bảng Xếp Hạng & Danh Hiệu Phòng Gym
 * GET /api/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
    try {
        // 1. Top học viên theo tổng khối lượng tạ tích lũy (Volume Load kg)
        const volumeRes = await pool.query(`
            SELECT 
                u.id, 
                u.full_name, 
                u.email, 
                u.avatar_url,
                COUNT(wl.id) as total_workouts,
                COALESCE(SUM(wl.total_volume_kg), 0) as total_volume,
                MAX(wl.ended_at) as last_workout
            FROM users u
            JOIN workout_logs wl ON wl.user_id = u.id
            WHERE u.role = 'member'
            GROUP BY u.id, u.full_name, u.email, u.avatar_url
            ORDER BY total_volume DESC
            LIMIT 10;
        `);

        // 2. Thống kê cá nhân của người gọi API (nếu đã đăng nhập)
        let myRank = null;
        if (req.user && req.user.id) {
            const myRes = await pool.query(`
                SELECT 
                    COUNT(wl.id) as total_workouts,
                    COALESCE(SUM(wl.total_volume_kg), 0) as total_volume
                FROM workout_logs wl
                WHERE wl.user_id = $1;
            `, [req.user.id]);

            // Tính chuỗi ngày tập liên tiếp (Streaks)
            const streakRes = await pool.query(`
                SELECT DISTINCT DATE(started_at) as workout_date
                FROM workout_logs
                WHERE user_id = $1
                ORDER BY workout_date DESC
                LIMIT 30;
            `, [req.user.id]);

            let currentStreak = 0;
            if (streakRes.rows.length > 0) {
                const dates = streakRes.rows.map(r => new Date(r.workout_date).toDateString());
                let checkDate = new Date();
                
                // Nếu hôm nay chưa tập thì kiểm tra từ hôm qua
                if (!dates.includes(checkDate.toDateString())) {
                    checkDate.setDate(checkDate.getDate() - 1);
                }

                while (dates.includes(checkDate.toDateString())) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            }

            const totalVol = parseFloat(myRes.rows[0].total_volume) || 0;
            const totalWorkouts = parseInt(myRes.rows[0].total_workouts, 10) || 0;

            // Huy hiệu đạt được
            const badges = [];
            if (totalWorkouts >= 1) badges.push({ name: '🌱 Tân Binh Khởi Động', desc: 'Hoàn thành buổi tập đầu tiên' });
            if (totalWorkouts >= 5) badges.push({ name: '🔥 Chiến Binh Bền Bỉ', desc: 'Vượt mốc 5 buổi tập' });
            if (totalVol >= 5000) badges.push({ name: '🏋️ Siêu Nhân Nâng Tạ (5 Tấn)', desc: 'Tổng khối lượng nâng vượt 5,000kg' });
            if (totalVol >= 15000) badges.push({ name: '⚡ Quái Vật Thể Hình (15 Tấn)', desc: 'Tổng khối lượng nâng vượt 15,000kg' });
            if (currentStreak >= 3) badges.push({ name: '🔥 Chuỗi Lửa 3 Ngày', desc: 'Duy trì tập luyện liên tiếp 3 ngày' });

            myRank = {
                totalWorkouts,
                totalVolume: totalVol,
                streakDays: currentStreak,
                badges
            };
        }

        return res.json({
            success: true,
            leaderboard: volumeRes.rows.map((row, index) => ({
                rank: index + 1,
                userId: row.id,
                name: row.full_name || row.email.split('@')[0],
                email: row.email,
                totalWorkouts: parseInt(row.total_workouts, 10),
                totalVolumeKg: parseFloat(row.total_volume),
                lastWorkout: row.last_workout
            })),
            myStats: myRank
        });
    } catch (error) {
        console.error('Lỗi lấy bảng xếp hạng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy bảng xếp hạng.' });
    }
};
