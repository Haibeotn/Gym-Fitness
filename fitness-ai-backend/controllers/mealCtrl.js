// controllers/mealCtrl.js
const pool = require('../config/db');

// Thư viện các món ăn thể hình, cơm nhà & rau củ luộc đa dạng
const FOOD_DATABASE = [
    { name: 'Bánh mì xíu mại', calories: 460, protein: 21.0, carbs: 52.0, fat: 18.0, serving_size: '1 ổ' },
    { name: 'Bánh mì pate trứng', calories: 440, protein: 17.5, carbs: 48.0, fat: 19.5, serving_size: '1 ổ' },
    { name: 'Bánh mì thịt chả', calories: 480, protein: 21.5, carbs: 50.0, fat: 21.0, serving_size: '1 ổ' },
    { name: 'Bánh mì thịt nướng', calories: 465, protein: 24.0, carbs: 52.0, fat: 16.0, serving_size: '1 ổ' },
    { name: 'Bánh mì heo quay', calories: 520, protein: 24.0, carbs: 48.0, fat: 25.0, serving_size: '1 ổ' },
    { name: 'Bánh mì chảo', calories: 620, protein: 35.0, carbs: 55.0, fat: 28.0, serving_size: '1 phần' },
    { name: 'Rau muống luộc (200g)', calories: 38, protein: 4.2, carbs: 5.0, fat: 0.4, serving_size: '1 dĩa (200g)' },
    { name: 'Súp lơ xanh luộc (200g)', calories: 68, protein: 5.6, carbs: 13.0, fat: 0.8, serving_size: '1 dĩa (200g)' },
    { name: 'Bắp cải luộc (200g)', calories: 50, protein: 2.5, carbs: 11.0, fat: 0.2, serving_size: '1 dĩa (200g)' },
    { name: 'Cà rốt luộc (150g)', calories: 52, protein: 1.2, carbs: 12.0, fat: 0.3, serving_size: '1 củ (150g)' },
    { name: 'Bí đỏ luộc / hấp (200g)', calories: 52, protein: 2.0, carbs: 12.0, fat: 0.2, serving_size: '1 dĩa (200g)' },
    { name: 'Bí đao luộc (200g)', calories: 28, protein: 1.0, carbs: 6.0, fat: 0.2, serving_size: '1 dĩa (200g)' },
    { name: 'Rau củ luộc thập cẩm (250g)', calories: 75, protein: 3.5, carbs: 15.0, fat: 0.5, serving_size: '1 dĩa (250g)' },
    { name: 'Đậu que luộc (150g)', calories: 46, protein: 2.8, carbs: 10.0, fat: 0.3, serving_size: '1 dĩa (150g)' },
    { name: 'Ngọn su su luộc (200g)', calories: 40, protein: 3.0, carbs: 7.0, fat: 0.3, serving_size: '1 dĩa (200g)' },
    { name: 'Rau mồng tơi luộc (200g)', calories: 36, protein: 3.0, carbs: 6.5, fat: 0.4, serving_size: '1 dĩa (200g)' },
    { name: 'Cải thìa luộc (200g)', calories: 32, protein: 3.0, carbs: 5.5, fat: 0.4, serving_size: '1 dĩa (200g)' },
    { name: 'Khổ qua luộc (150g)', calories: 30, protein: 1.5, carbs: 6.0, fat: 0.2, serving_size: '1 dĩa (150g)' },
    { name: 'Mướp hương luộc (200g)', calories: 34, protein: 1.8, carbs: 7.0, fat: 0.2, serving_size: '1 dĩa (200g)' },
    { name: 'Rau lang luộc (200g)', calories: 44, protein: 4.0, carbs: 7.0, fat: 0.5, serving_size: '1 dĩa (200g)' },
    { name: 'Khoai lang luộc / hấp (200g)', calories: 172, protein: 3.2, carbs: 40.0, fat: 0.2, serving_size: '1 củ (200g)' },
    { name: 'Bắp ngọt luộc (1 trái)', calories: 120, protein: 4.0, carbs: 26.0, fat: 1.5, serving_size: '1 trái (150g)' },
    { name: 'Phở bò tái', calories: 480, protein: 32.0, carbs: 60.0, fat: 12.0, serving_size: '1 tô' },
    { name: 'Phở gà', calories: 450, protein: 34.0, carbs: 56.0, fat: 10.0, serving_size: '1 tô' },
    { name: 'Bún bò Huế', calories: 550, protein: 33.0, carbs: 62.0, fat: 18.0, serving_size: '1 tô' },
    { name: 'Bún riêu cua', calories: 450, protein: 25.0, carbs: 56.0, fat: 13.0, serving_size: '1 tô' },
    { name: 'Hủ tiếu Nam Vang', calories: 500, protein: 29.0, carbs: 62.0, fat: 14.0, serving_size: '1 tô' },
    { name: 'Bánh canh cua', calories: 510, protein: 28.0, carbs: 64.0, fat: 14.0, serving_size: '1 tô' },
    { name: 'Miến gà', calories: 400, protein: 29.0, carbs: 52.0, fat: 8.5, serving_size: '1 tô' },
    { name: 'Cháo sườn', calories: 390, protein: 18.0, carbs: 54.0, fat: 12.0, serving_size: '1 tô' },
    { name: 'Xôi mặn', calories: 540, protein: 20.0, carbs: 72.0, fat: 19.0, serving_size: '1 gói' },
    { name: 'Xôi xéo', calories: 490, protein: 14.0, carbs: 78.0, fat: 13.5, serving_size: '1 gói' },
    { name: 'Xôi gà', calories: 510, protein: 28.0, carbs: 68.0, fat: 14.0, serving_size: '1 hộp' },
    { name: 'Bánh cuốn', calories: 420, protein: 18.0, carbs: 58.0, fat: 12.5, serving_size: '1 đĩa' },
    { name: 'Bánh giò', calories: 380, protein: 15.0, carbs: 44.0, fat: 15.0, serving_size: '1 cái' },
    { name: 'Bánh bao thịt', calories: 360, protein: 15.0, carbs: 50.0, fat: 11.0, serving_size: '1 cái' },
    { name: 'Cơm tấm sườn ốp la', calories: 650, protein: 33.0, carbs: 75.0, fat: 23.0, serving_size: '1 đĩa' },
    { name: 'Cơm tấm sườn bì chả', calories: 780, protein: 40.0, carbs: 82.0, fat: 30.0, serving_size: '1 đĩa' },
    { name: 'Bún thịt nướng', calories: 530, protein: 25.0, carbs: 68.0, fat: 17.0, serving_size: '1 tô' },
    { name: 'Cơm trắng (1 chén)', calories: 195, protein: 4.1, carbs: 43.0, fat: 0.4, serving_size: '1 chén (150g)' },
    { name: 'Cơm gạo lứt (1 chén)', calories: 165, protein: 3.8, carbs: 35.0, fat: 1.4, serving_size: '1 chén (150g)' },
    { name: 'Trứng gà luộc (2 quả)', calories: 156, protein: 12.6, carbs: 1.2, fat: 10.6, serving_size: '2 quả (100g)' },
    { name: 'Trứng ốp la (2 quả)', calories: 185, protein: 12.6, carbs: 1.2, fat: 14.5, serving_size: '2 quả' },
    { name: 'Thịt heo luộc (150g)', calories: 285, protein: 37.0, carbs: 0.0, fat: 14.0, serving_size: '150g' },
    { name: 'Thịt bò xào (150g)', calories: 310, protein: 38.0, carbs: 1.5, fat: 16.0, serving_size: '150g' },
    { name: 'Đậu hũ luộc (150g)', calories: 110, protein: 12.0, carbs: 3.0, fat: 6.0, serving_size: '1 miếng (150g)' },
    { name: 'Ức gà áp chảo (150g)', calories: 245, protein: 47.0, carbs: 1.0, fat: 5.0, serving_size: '150g' },
    { name: 'Cá hồi áp chảo (150g)', calories: 315, protein: 34.0, carbs: 0.0, fat: 19.0, serving_size: '150g' },
    { name: 'Cà phê sữa đá', calories: 195, protein: 3.5, carbs: 32.0, fat: 6.0, serving_size: '1 ly (250ml)' },
    { name: 'Bạc xỉu', calories: 220, protein: 4.5, carbs: 36.0, fat: 6.5, serving_size: '1 ly (300ml)' },
    { name: 'Cà phê đen đá', calories: 35, protein: 0.5, carbs: 8.0, fat: 0.1, serving_size: '1 ly' },
    { name: 'Sữa đậu nành', calories: 110, protein: 7.0, carbs: 12.0, fat: 4.0, serving_size: '1 ly (300ml)' },
    { name: 'Nước mía', calories: 150, protein: 0.2, carbs: 38.0, fat: 0.1, serving_size: '1 ly (400ml)' }
];

/**
 * 1. Lấy danh sách gợi ý món ăn (Tìm kiếm từ PostgreSQL Foods Table + Tags)
 * GET /api/meals/suggestions?search=banh+mi&category=Bánh+mì
 */
exports.getFoodSuggestions = async (req, res) => {
    try {
        const { search, category } = req.query;

        let query = `
            SELECT id, name, category, calories, protein, carbs, fat, serving_size, tags, description
            FROM foods
            WHERE 1=1
        `;
        const params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            query += ` AND (
                LOWER(name) LIKE $${params.length} 
                OR LOWER(category) LIKE $${params.length}
                OR EXISTS (
                    SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $${params.length}
                )
            )`;
        }

        if (category && category.trim()) {
            params.push(category.trim());
            query += ` AND category = $${params.length}`;
        }

        query += ` ORDER BY id ASC LIMIT 50;`;

        const dbRes = await pool.query(query, params);

        if (dbRes.rows.length > 0) {
            return res.json({
                success: true,
                count: dbRes.rows.length,
                foods: dbRes.rows
            });
        }

        // Fallback sang memory database nếu bảng rỗng
        let fallback = FOOD_DATABASE;
        if (search && search.trim()) {
            const keyword = search.toLowerCase().trim();
            fallback = fallback.filter(f => f.name.toLowerCase().includes(keyword));
        }
        return res.json({ success: true, count: fallback.length, foods: fallback });
    } catch (error) {
        console.error('Lỗi lấy gợi ý món ăn từ database:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tra cứu thực đơn.' });
    }
};

/**
 * 2. Lấy danh sách bữa ăn trong ngày của user
 * GET /api/meals/daily?date=YYYY-MM-DD
 */
exports.getDailyMeals = async (req, res) => {
    try {
        const userId = req.user.id;
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];

        const mealRows = await pool.query(`
            SELECT id, user_id, log_date, meal_type, food_name, calories, protein, carbs, fat, serving_size, notes, created_at
            FROM meal_logs
            WHERE user_id = $1 AND log_date = $2
            ORDER BY created_at ASC;
        `, [userId, targetDate]);

        // Gom theo từng bữa (breakfast, lunch, dinner, snack)
        const mealsByType = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
        };

        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        mealRows.rows.forEach(item => {
            const cal = parseFloat(item.calories) || 0;
            const pro = parseFloat(item.protein) || 0;
            const carb = parseFloat(item.carbs) || 0;
            const f = parseFloat(item.fat) || 0;

            totalCalories += cal;
            totalProtein += pro;
            totalCarbs += carb;
            totalFat += f;

            const type = item.meal_type || 'snack';
            if (mealsByType[type]) {
                mealsByType[type].push(item);
            } else {
                mealsByType.snack.push(item);
            }
        });

        return res.json({
            success: true,
            date: targetDate,
            meals: mealsByType,
            rawList: mealRows.rows,
            totals: {
                calories: Math.round(totalCalories),
                protein: Math.round(totalProtein * 10) / 10,
                carbs: Math.round(totalCarbs * 10) / 10,
                fat: Math.round(totalFat * 10) / 10
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách bữa ăn hàng ngày:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy nhật ký dinh dưỡng.' });
    }
};

/**
 * 3. Ghi nhận món ăn vào bữa
 * POST /api/meals/logs
 */
exports.addMealLog = async (req, res) => {
    try {
        const userId = req.user.id;
        const { logDate, mealType, foodName, calories, protein, carbs, fat, servingSize, notes } = req.body;

        if (!foodName || !foodName.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên món ăn.' });
        }

        const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        const type = validTypes.includes(mealType) ? mealType : 'snack';
        const date = logDate || new Date().toISOString().split('T')[0];

        const insertRes = await pool.query(`
            INSERT INTO meal_logs (user_id, log_date, meal_type, food_name, calories, protein, carbs, fat, serving_size, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `, [
            userId,
            date,
            type,
            foodName.trim(),
            parseFloat(calories) || 0,
            parseFloat(protein) || 0,
            parseFloat(carbs) || 0,
            parseFloat(fat) || 0,
            servingSize || '1 khẩu phần',
            notes || ''
        ]);

        return res.status(201).json({
            success: true,
            message: 'Đã thêm món ăn vào nhật ký!',
            meal: insertRes.rows[0]
        });
    } catch (error) {
        console.error('Lỗi thêm món ăn:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi thêm món ăn.' });
    }
};

/**
 * 4. Xóa món ăn khỏi nhật ký
 * DELETE /api/meals/logs/:id
 */
exports.deleteMealLog = async (req, res) => {
    try {
        const userId = req.user.id;
        const mealId = req.params.id;

        const delRes = await pool.query(`
            DELETE FROM meal_logs
            WHERE id = $1 AND user_id = $2
            RETURNING id;
        `, [mealId, userId]);

        if (delRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn hoặc bạn không có quyền xóa.' });
        }

        return res.json({ success: true, message: 'Đã xóa món ăn thành công!' });
    } catch (error) {
        console.error('Lỗi xóa món ăn:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa món ăn.' });
    }
};

/**
 * 5. Lấy lịch sử calo 7 ngày gần nhất
 * GET /api/meals/history
 */
exports.getMealHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const days = parseInt(req.query.days, 10) || 7;

        const historyRes = await pool.query(`
            SELECT 
                log_date,
                SUM(calories) as total_calories,
                SUM(protein) as total_protein,
                SUM(carbs) as total_carbs,
                SUM(fat) as total_fat,
                COUNT(*) as items_count
            FROM meal_logs
            WHERE user_id = $1 AND log_date >= CURRENT_DATE - ($2 || ' days')::INTERVAL
            GROUP BY log_date
            ORDER BY log_date ASC;
        `, [userId, days]);

        return res.json({
            success: true,
            history: historyRes.rows
        });
    } catch (error) {
        console.error('Lỗi lấy lịch sử dinh dưỡng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử.' });
    }
};
