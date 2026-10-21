// scripts/seedEnrichedData.js
const pool = require('../config/db');

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🔄 Đang cập nhật cấu trúc bảng exercises và tạo bảng foods...');

        // 1. Cập nhật schema cho exercises
        await client.query(`
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_sets INT DEFAULT 3;
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_reps VARCHAR(50) DEFAULT '10-12';
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_rpe INT DEFAULT 8;
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions TEXT;
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tags TEXT[];
            CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name_uniq ON exercises(name);
        `);

        // 2. Tạo bảng foods cho thư viện dinh dưỡng chuẩn Việt
        await client.query(`
            CREATE TABLE IF NOT EXISTS foods (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                category VARCHAR(100) NOT NULL,
                calories NUMERIC(8,2) NOT NULL,
                protein NUMERIC(8,2) NOT NULL,
                carbs NUMERIC(8,2) NOT NULL,
                fat NUMERIC(8,2) NOT NULL,
                serving_size VARCHAR(100) NOT NULL,
                tags TEXT[] DEFAULT '{}',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
            CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
        `);

        console.log('🍳 Đang nạp danh sách món ăn thường ngày & rau củ luộc đa dạng...');

        // Xóa sạch bảng foods để làm mới tên món ăn ngắn gọn, chuẩn xác
        await client.query(`TRUNCATE TABLE foods RESTART IDENTITY CASCADE;`);

        // Danh sách 50+ món ăn Việt Nam quen thuộc, tên gọi ngắn gọn, dễ nhớ
        const vietnameseFoods = [
            // --- BÁNH MÌ QUEN THUỘC ---
            {
                name: 'Bánh mì xíu mại',
                category: 'Bánh mì',
                calories: 460,
                protein: 21.0,
                carbs: 52.0,
                fat: 18.0,
                serving_size: '1 ổ',
                tags: ['bánh mì', 'xíu mại', 'bữa sáng', 'bình dân'],
                description: 'Bánh mì kẹp viên xíu mại thịt băm mềm ngọt, chan nước sốt ấm nóng ăn kèm dưa leo rau ngò.'
            },
            {
                name: 'Bánh mì pate trứng',
                category: 'Bánh mì',
                calories: 440,
                protein: 17.5,
                carbs: 48.0,
                fat: 19.5,
                serving_size: '1 ổ',
                tags: ['bánh mì', 'trứng ốp la', 'pate', 'bữa sáng'],
                description: 'Bánh mì nóng giòn kẹp trứng ốp la, pate gan béo ngậy, dưa leo và rau thơm.'
            },
            {
                name: 'Bánh mì thịt chả',
                category: 'Bánh mì',
                calories: 480,
                protein: 21.5,
                carbs: 50.0,
                fat: 21.0,
                serving_size: '1 ổ',
                tags: ['bánh mì', 'thịt nguội', 'chả lụa', 'pate'],
                description: 'Ổ bánh mì truyền thống với chả lụa, thịt nguội, bơ trứng và pate gan.'
            },
            {
                name: 'Bánh mì thịt nướng',
                category: 'Bánh mì',
                calories: 465,
                protein: 24.0,
                carbs: 52.0,
                fat: 16.0,
                serving_size: '1 ổ',
                tags: ['bánh mì', 'thịt nướng', 'bữa sáng'],
                description: 'Thịt nướng than hoa thơm lừng kẹp bánh mì kèm đồ chua và nước sốt.'
            },
            {
                name: 'Bánh mì heo quay',
                category: 'Bánh mì',
                calories: 520,
                protein: 24.0,
                carbs: 48.0,
                fat: 25.0,
                serving_size: '1 ổ',
                tags: ['bánh mì', 'heo quay', 'giòn da'],
                description: 'Thịt heo quay da giòn rụm kẹp dưa leo, chan nước sốt đậm đà.'
            },
            {
                name: 'Bánh mì chảo',
                category: 'Bánh mì',
                calories: 620,
                protein: 35.0,
                carbs: 55.0,
                fat: 28.0,
                serving_size: '1 phần',
                tags: ['bánh mì chảo', 'bò né', 'trứng', 'pate'],
                description: 'Chảo gang nóng gồm thịt bò, trứng ốp la, pate béo ngậy và xúc xích.'
            },
            {
                name: 'Bánh mì cá mòi',
                category: 'Bánh mì',
                calories: 420,
                protein: 20.0,
                carbs: 46.0,
                fat: 15.0,
                serving_size: '1 ổ',
                tags: ['bánh mì', 'cá mòi', 'sốt cà'],
                description: 'Bánh mì giòn kẹp cá mòi sốt cà đậm vị và dưa leo.'
            },

            // --- RAU CỦ LUỘC & HẤP (EAT CLEAN & FIT) ---
            {
                name: 'Rau muống luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 38,
                protein: 4.2,
                carbs: 5.0,
                fat: 0.4,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'rau muống', 'chất xơ', 'eat clean', 'ít calo'],
                description: 'Rau muống luộc xanh giòn thanh mát, giàu chất xơ, vitamin và khoáng chất.'
            },
            {
                name: 'Súp lơ xanh luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 68,
                protein: 5.6,
                carbs: 13.0,
                fat: 0.8,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'bông cải xanh', 'súp lơ', 'eat clean', 'giảm mỡ'],
                description: 'Bông cải xanh luộc giữ nguyên dưỡng chất, giàu chất chống oxy hóa và chất xơ hòa tan.'
            },
            {
                name: 'Bắp cải luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 50,
                protein: 2.5,
                carbs: 11.0,
                fat: 0.2,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'bắp cải', 'chất xơ', 'eat clean'],
                description: 'Bắp cải luộc ngọt nước, hỗ trợ tiêu hóa và giảm cảm giác thèm ăn.'
            },
            {
                name: 'Cà rốt luộc (150g)',
                category: 'Rau củ luộc & Hấp',
                calories: 52,
                protein: 1.2,
                carbs: 12.0,
                fat: 0.3,
                serving_size: '1 củ (150g)',
                tags: ['rau củ luộc', 'cà rốt', 'vitamin A', 'eat clean'],
                description: 'Cà rốt luộc mềm ngọt tự nhiên, giàu beta-carotene tốt cho mắt và làn da.'
            },
            {
                name: 'Bí đỏ luộc / hấp (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 52,
                protein: 2.0,
                carbs: 12.0,
                fat: 0.2,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'bí đỏ', 'carb tốt', 'eat clean'],
                description: 'Bí đỏ hấp dẻo ngọt bùi, cung cấp carbohydrate phức hợp và vitamin A.'
            },
            {
                name: 'Bí đao luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 28,
                protein: 1.0,
                carbs: 6.0,
                fat: 0.2,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'bí đao', 'thanh nhiệt', 'giảm cân'],
                description: 'Bí đao luộc thanh nhiệt, tiêu độc, lượng calo cực thấp phù hợp siết mỡ.'
            },
            {
                name: 'Rau củ luộc thập cẩm (250g)',
                category: 'Rau củ luộc & Hấp',
                calories: 75,
                protein: 3.5,
                carbs: 15.0,
                fat: 0.5,
                serving_size: '1 dĩa (250g)',
                tags: ['rau củ luộc', 'thập cẩm', 'kho quẹt', 'chất xơ', 'healthy'],
                description: 'Dĩa rau củ thập cẩm gồm khổ qua, cà rốt, su su, đậu que và bông cải luộc giòn ngọt.'
            },
            {
                name: 'Đậu que luộc (150g)',
                category: 'Rau củ luộc & Hấp',
                calories: 46,
                protein: 2.8,
                carbs: 10.0,
                fat: 0.3,
                serving_size: '1 dĩa (150g)',
                tags: ['rau củ luộc', 'đậu que', 'đậu cô ve', 'eat clean'],
                description: 'Đậu que luộc giòn ngọt mọng nước, giàu chất xơ và vitamin C.'
            },
            {
                name: 'Ngọn su su luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 40,
                protein: 3.0,
                carbs: 7.0,
                fat: 0.3,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'ngọn su su', 'rau rừng', 'thanh đạm'],
                description: 'Ngọn su su luộc giòn sần sật, ngọt thanh, ăn kèm nước tương tỏi ớt.'
            },
            {
                name: 'Rau mồng tơi luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 36,
                protein: 3.0,
                carbs: 6.5,
                fat: 0.4,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'mồng tơi', 'nhuận tràng', 'mát gan'],
                description: 'Rau mồng tơi luộc mềm mướt, tính mát, hỗ trợ hệ tiêu hóa hoạt động êm ái.'
            },
            {
                name: 'Cải thìa luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 32,
                protein: 3.0,
                carbs: 5.5,
                fat: 0.4,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'cải thìa', 'eat clean', 'fitness'],
                description: 'Cải thìa luộc ngọt dịu, giàu canxi và vitamin K tốt cho xương khớp.'
            },
            {
                name: 'Khổ qua luộc (150g)',
                category: 'Rau củ luộc & Hấp',
                calories: 30,
                protein: 1.5,
                carbs: 6.0,
                fat: 0.2,
                serving_size: '1 dĩa (150g)',
                tags: ['rau củ luộc', 'mướp đắng', 'khổ qua', 'hạ đường huyết'],
                description: 'Khổ qua luộc giòn đắng dịu, hỗ trợ kiểm soát đường huyết và đốt mỡ.'
            },
            {
                name: 'Mướp hương luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 34,
                protein: 1.8,
                carbs: 7.0,
                fat: 0.2,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'mướp hương', 'thơm mát', 'ít calo'],
                description: 'Mướp hương luộc thơm nức mũi, mềm ngọt tự nhiên rất dễ ăn.'
            },
            {
                name: 'Rau lang luộc (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 44,
                protein: 4.0,
                carbs: 7.0,
                fat: 0.5,
                serving_size: '1 dĩa (200g)',
                tags: ['rau củ luộc', 'rau lang', 'chất xơ', 'dân dã'],
                description: 'Đọt rau lang luộc ngọt đậm đà, cung cấp nhiều diệp lục và chất xơ thô.'
            },
            {
                name: 'Khoai lang luộc / hấp (200g)',
                category: 'Rau củ luộc & Hấp',
                calories: 172,
                protein: 3.2,
                carbs: 40.0,
                fat: 0.2,
                serving_size: '1 củ (200g)',
                tags: ['khoai lang', 'carb chậm', 'eat clean', 'pre workout'],
                description: 'Khoai lang luộc ngọt bùi, nguồn tinh bột hấp thu chậm lý tưởng trước và sau tập.'
            },
            {
                name: 'Bắp ngọt luộc (1 trái)',
                category: 'Rau củ luộc & Hấp',
                calories: 120,
                protein: 4.0,
                carbs: 26.0,
                fat: 1.5,
                serving_size: '1 trái (150g)',
                tags: ['bắp ngô', 'bắp luộc', 'ngọt bùi', 'năng lượng'],
                description: 'Bắp ngô ngọt luộc thơm phức, cung cấp năng lượng sạch và chất xơ.'
            },

            // --- CÁC MÓN NƯỚC BÌNH DÂN ---
            {
                name: 'Phở bò tái',
                category: 'Món nước',
                calories: 480,
                protein: 32.0,
                carbs: 60.0,
                fat: 12.0,
                serving_size: '1 tô',
                tags: ['phở bò', 'món nước', 'bữa sáng', 'nhiều đạm'],
                description: 'Tô phở bò nước dùng trong thơm thảo mộc, thịt bò tái mềm ngọt nước.'
            },
            {
                name: 'Phở gà',
                category: 'Món nước',
                calories: 450,
                protein: 34.0,
                carbs: 56.0,
                fat: 10.0,
                serving_size: '1 tô',
                tags: ['phở gà', 'món nước', 'thịt nạc', 'healthy'],
                description: 'Phở gà thịt ngọt dai thơm lá chanh, nước dùng thanh ngọt.'
            },
            {
                name: 'Bún bò Huế',
                category: 'Món nước',
                calories: 550,
                protein: 33.0,
                carbs: 62.0,
                fat: 18.0,
                serving_size: '1 tô',
                tags: ['bún bò huế', 'món nước', 'đậm đà'],
                description: 'Tô bún bò Huế thơm mùi sả ruốc, thịt bắp bò mềm và chả cua thơm lừng.'
            },
            {
                name: 'Bún riêu cua',
                category: 'Món nước',
                calories: 450,
                protein: 25.0,
                carbs: 56.0,
                fat: 13.0,
                serving_size: '1 tô',
                tags: ['bún riêu', 'cua đồng', 'đậu hũ', 'chua thanh'],
                description: 'Bún riêu cua đồng thanh mát, đậu hũ rán và cà chua.'
            },
            {
                name: 'Hủ tiếu Nam Vang',
                category: 'Món nước',
                calories: 500,
                protein: 29.0,
                carbs: 62.0,
                fat: 14.0,
                serving_size: '1 tô',
                tags: ['hủ tiếu', 'nam vang', 'tôm thịt'],
                description: 'Hủ tiếu dai ngọt nước hầm xương, tôm tươi, thịt nạc và trứng cút.'
            },
            {
                name: 'Bánh canh cua',
                category: 'Món nước',
                calories: 510,
                protein: 28.0,
                carbs: 64.0,
                fat: 14.0,
                serving_size: '1 tô',
                tags: ['bánh canh', 'thịt cua', 'chả cá'],
                description: 'Bánh canh bột lọc nước dùng sánh ngọt vị thịt cua và chả cá.'
            },
            {
                name: 'Miến gà',
                category: 'Món nước',
                calories: 400,
                protein: 29.0,
                carbs: 52.0,
                fat: 8.5,
                serving_size: '1 tô',
                tags: ['miến gà', 'thanh đạm', 'ít béo'],
                description: 'Miến dong dai mềm nấu thịt gà xé nạc và nấm hương.'
            },
            {
                name: 'Cháo sườn',
                category: 'Món nước',
                calories: 390,
                protein: 18.0,
                carbs: 54.0,
                fat: 12.0,
                serving_size: '1 tô',
                tags: ['cháo sườn', 'ấm bụng', 'bữa sáng'],
                description: 'Cháo sườn sánh mịn ninh cùng sườn sụn thơm lừng.'
            },

            // --- XÔI & BÁNH TRUYỀN THỐNG ---
            {
                name: 'Xôi mặn',
                category: 'Xôi & Bánh',
                calories: 540,
                protein: 20.0,
                carbs: 72.0,
                fat: 19.0,
                serving_size: '1 gói',
                tags: ['xôi mặn', 'lạp xưởng', 'chà bông', 'no lâu'],
                description: 'Xôi nếp dẻo thơm ăn kèm chà bông, lạp xưởng và mỡ hành.'
            },
            {
                name: 'Xôi xéo',
                category: 'Xôi & Bánh',
                calories: 490,
                protein: 14.0,
                carbs: 78.0,
                fat: 13.5,
                serving_size: '1 gói',
                tags: ['xôi xéo', 'đậu xanh', 'hành phi', 'hà nội'],
                description: 'Xôi nếp vàng óng đậu xanh béo ngậy rưới mỡ hành phi giòn tan.'
            },
            {
                name: 'Xôi gà',
                category: 'Xôi & Bánh',
                calories: 510,
                protein: 28.0,
                carbs: 68.0,
                fat: 14.0,
                serving_size: '1 hộp',
                tags: ['xôi gà', 'thịt gà', 'đạm cao'],
                description: 'Xôi nếp dẻo ăn cùng thịt gà xé đậm vị.'
            },
            {
                name: 'Bánh cuốn',
                category: 'Xôi & Bánh',
                calories: 420,
                protein: 18.0,
                carbs: 58.0,
                fat: 12.5,
                serving_size: '1 đĩa',
                tags: ['bánh cuốn', 'chả lụa', 'thanh nhẹ'],
                description: 'Bánh cuốn nóng nhân thịt nấm mộc nhĩ kèm chả lụa chả quế.'
            },
            {
                name: 'Bánh giò',
                category: 'Xôi & Bánh',
                calories: 380,
                protein: 15.0,
                carbs: 44.0,
                fat: 15.0,
                serving_size: '1 cái',
                tags: ['bánh giò', 'thịt nạc', 'tiện lợi'],
                description: 'Bánh giò mềm mịn nhân thịt nạc mộc nhĩ tiêu đen.'
            },
            {
                name: 'Bánh bao thịt',
                category: 'Xôi & Bánh',
                calories: 360,
                protein: 15.0,
                carbs: 50.0,
                fat: 11.0,
                serving_size: '1 cái',
                tags: ['bánh bao', 'trứng cút', 'bữa sáng'],
                description: 'Bánh bao xốp mềm nhân thịt băm, nấm hương và trứng cút.'
            },

            // --- CƠM & ĐỒ ĂN HÀNG NGÀY ---
            {
                name: 'Cơm tấm sườn ốp la',
                category: 'Cơm & Món chính',
                calories: 650,
                protein: 33.0,
                carbs: 75.0,
                fat: 23.0,
                serving_size: '1 đĩa',
                tags: ['cơm tấm', 'sườn nướng', 'trứng ốp la'],
                description: 'Cơm tấm sườn nướng than hoa vàng óng và trứng ốp la lòng đào.'
            },
            {
                name: 'Cơm tấm sườn bì chả',
                category: 'Cơm & Món chính',
                calories: 780,
                protein: 40.0,
                carbs: 82.0,
                fat: 30.0,
                serving_size: '1 đĩa',
                tags: ['cơm tấm', 'sườn bì chả', 'đầy đủ'],
                description: 'Cơm tấm đầy đủ gồm sườn nướng, bì heo, chả trứng hấp.'
            },
            {
                name: 'Bún thịt nướng',
                category: 'Cơm & Món chính',
                calories: 530,
                protein: 25.0,
                carbs: 68.0,
                fat: 17.0,
                serving_size: '1 tô',
                tags: ['bún thịt nướng', 'chả giò', 'chua ngọt'],
                description: 'Bún tươi mềm, thịt nướng thơm lừng ăn cùng rau sống và nước mắm chua ngọt.'
            },
            {
                name: 'Cơm trắng (1 chén)',
                category: 'Cơm & Món chính',
                calories: 195,
                protein: 4.1,
                carbs: 43.0,
                fat: 0.4,
                serving_size: '1 chén (150g)',
                tags: ['cơm trắng', 'tinh bột', 'cơm nhà'],
                description: 'Chén cơm trắng thơm dẻo cung cấp tinh bột sạch cho bữa ăn chính.'
            },
            {
                name: 'Cơm gạo lứt (1 chén)',
                category: 'Cơm & Món chính',
                calories: 165,
                protein: 3.8,
                carbs: 35.0,
                fat: 1.4,
                serving_size: '1 chén (150g)',
                tags: ['cơm gạo lứt', 'carb chậm', 'eat clean', 'giảm cân'],
                description: 'Gạo lứt giàu chất xơ, vitamin nhóm B giúp no lâu và ổn định đường huyết.'
            },
            {
                name: 'Trứng gà luộc (2 quả)',
                category: 'Cơm & Món chính',
                calories: 156,
                protein: 12.6,
                carbs: 1.2,
                fat: 10.6,
                serving_size: '2 quả (100g)',
                tags: ['trứng gà', 'luộc', 'đạm tốt', 'eat clean', 'fitness'],
                description: 'Trứng gà luộc cung cấp nguồn protein hoàn hảo và choline tự nhiên.'
            },
            {
                name: 'Trứng ốp la (2 quả)',
                category: 'Cơm & Món chính',
                calories: 185,
                protein: 12.6,
                carbs: 1.2,
                fat: 14.5,
                serving_size: '2 quả',
                tags: ['trứng ốp la', 'bữa sáng', 'protein'],
                description: 'Trứng ốp la chiên lòng đào thơm béo.'
            },
            {
                name: 'Thịt heo luộc (150g)',
                category: 'Cơm & Món chính',
                calories: 285,
                protein: 37.0,
                carbs: 0.0,
                fat: 14.0,
                serving_size: '150g',
                tags: ['thịt heo luộc', 'thịt nạc', 'đạm cao', 'cơm nhà'],
                description: 'Thịt nạc heo luộc chấm nước mắm hoặc mắm tôm cà pháo.'
            },
            {
                name: 'Thịt bò xào (150g)',
                category: 'Cơm & Món chính',
                calories: 310,
                protein: 38.0,
                carbs: 1.5,
                fat: 16.0,
                serving_size: '150g',
                tags: ['thịt bò', 'xào', 'nhiều đạm', 'sức mạnh'],
                description: 'Thịt bò xào thơm mềm, giàu sắt và protein tăng cơ bắp.'
            },
            {
                name: 'Đậu hũ luộc (150g)',
                category: 'Cơm & Món chính',
                calories: 110,
                protein: 12.0,
                carbs: 3.0,
                fat: 6.0,
                serving_size: '1 miếng (150g)',
                tags: ['đậu hũ', 'luộc', 'đạm thực vật', 'thanh đạm'],
                description: 'Đậu hũ trắng luộc mềm béo, thanh mát dễ tiêu.'
            },
            {
                name: 'Ức gà áp chảo (150g)',
                category: 'Fitness & Eat Clean',
                calories: 245,
                protein: 47.0,
                carbs: 1.0,
                fat: 5.0,
                serving_size: '150g',
                tags: ['ức gà', 'eat clean', 'đạm cao', 'tăng cơ giảm mỡ'],
                description: 'Ức gà phi lê áp chảo muối tiêu mềm mọng, đạm tinh khiết cho gymer.'
            },
            {
                name: 'Cá hồi áp chảo (150g)',
                category: 'Fitness & Eat Clean',
                calories: 315,
                protein: 34.0,
                carbs: 0.0,
                fat: 19.0,
                serving_size: '150g',
                tags: ['cá hồi', 'omega 3', 'chất béo tốt', 'eat clean'],
                description: 'Phi lê cá hồi áp chảo dồi dào Omega-3 và protein cao cấp.'
            },

            // --- ĐỒ UỐNG THÔNG DỤNG ---
            {
                name: 'Cà phê sữa đá',
                category: 'Đồ uống',
                calories: 195,
                protein: 3.5,
                carbs: 32.0,
                fat: 6.0,
                serving_size: '1 ly (250ml)',
                tags: ['cà phê sữa', 'đồ uống', 'tỉnh táo'],
                description: 'Cà phê phin truyền thống hòa quyện cùng sữa đặc và đá.'
            },
            {
                name: 'Bạc xỉu',
                category: 'Đồ uống',
                calories: 220,
                protein: 4.5,
                carbs: 36.0,
                fat: 6.5,
                serving_size: '1 ly (300ml)',
                tags: ['bạc xỉu', 'sữa tươi', 'ngọt béo'],
                description: 'Sữa tươi thanh trùng, sữa đặc ngậy pha chút cà phê phin thơm lừng.'
            },
            {
                name: 'Cà phê đen đá',
                category: 'Đồ uống',
                calories: 35,
                protein: 0.5,
                carbs: 8.0,
                fat: 0.1,
                serving_size: '1 ly',
                tags: ['cà phê đen', 'ít calo', 'pre workout', 'đốt mỡ'],
                description: 'Cà phê đen rang xay nguyên chất giúp tỉnh táo và tăng trao đổi chất.'
            },
            {
                name: 'Sữa đậu nành',
                category: 'Đồ uống',
                calories: 110,
                protein: 7.0,
                carbs: 12.0,
                fat: 4.0,
                serving_size: '1 ly (300ml)',
                tags: ['sữa đậu nành', 'thực vật', 'thơm mát'],
                description: 'Sữa đậu nành nguyên chất nấu lá dứa thơm mát.'
            },
            {
                name: 'Nước mía',
                category: 'Đồ uống',
                calories: 150,
                protein: 0.2,
                carbs: 38.0,
                fat: 0.1,
                serving_size: '1 ly (400ml)',
                tags: ['nước mía', 'nạp năng lượng', 'giải khát'],
                description: 'Nước mía tươi ép tắc ngọt lịm giải nhiệt nhanh chóng.'
            }
        ];

        for (const food of vietnameseFoods) {
            await client.query(`
                INSERT INTO foods (name, category, calories, protein, carbs, fat, serving_size, tags, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (name) DO UPDATE SET
                    category = EXCLUDED.category,
                    calories = EXCLUDED.calories,
                    protein = EXCLUDED.protein,
                    carbs = EXCLUDED.carbs,
                    fat = EXCLUDED.fat,
                    serving_size = EXCLUDED.serving_size,
                    tags = EXCLUDED.tags,
                    description = EXCLUDED.description;
            `, [
                food.name,
                food.category,
                food.calories,
                food.protein,
                food.carbs,
                food.fat,
                food.serving_size,
                food.tags,
                food.description
            ]);
        }
        console.log(`✅ Đã nạp thành công ${vietnameseFoods.length} món ăn vào bảng foods!`);

        console.log('💪 Đang đa dạng hóa thư viện bài tập & các tags chuyên sâu...');

        // Danh sách 35+ bài tập thể hình chi tiết bao quát toàn bộ nhóm cơ
        const diverseExercises = [
            // --- NGỰC (CHEST) ---
            {
                name: 'Barbell Flat Bench Press (Đẩy tạ đòn ghế phẳng)',
                description: 'Bài tập compound nền tảng xây dựng sức mạnh và độ dày toàn diện cho cơ ngực giữa.',
                mechanic: 'Compound',
                primary_muscle: 'Chest',
                secondary_muscles: ['Triceps', 'Front Deltoids', 'Core'],
                equipment_required: ['Barbell', 'Flat Bench', 'Weight Plates'],
                contraindications: ['Đau khớp vai nặng', 'Rách chóp xoay vai'],
                target_sets: 4,
                target_reps: '8-10',
                target_rpe: 8,
                instructions: 'Hạ thanh đòn chạm nhẹ phần ức dưới ngực, giữ khuỷu tay góc 45 độ, thở ra khi đẩy tạ lên.',
                tags: ['Ngực giữa', 'Compound', 'Push', 'Barbell', 'Sức mạnh', 'Hypertrophy']
            },
            {
                name: 'Incline Dumbbell Press (Đẩy tạ đơn ghế dốc lên)',
                description: 'Tập trung phát triển cơ ngực trên, tạo độ đầy đặn cho khuôn ngực áo sơ mi.',
                mechanic: 'Compound',
                primary_muscle: 'Chest',
                secondary_muscles: ['Front Deltoids', 'Triceps'],
                equipment_required: ['Dumbbell', 'Incline Bench'],
                contraindications: ['Viêm gân cơ nhị đầu vai'],
                target_sets: 4,
                target_reps: '10-12',
                target_rpe: 8,
                instructions: 'Ghế dốc 30-45 độ, hạ tạ kiểm soát mở rộng lồng ngực, đẩy tạ hội tụ ở đỉnh chuyển động.',
                tags: ['Ngực trên', 'Compound', 'Push', 'Dumbbell', 'Cô lập 2 bên', 'Hypertrophy']
            },
            {
                name: 'Decline Chest Press / Dips (Chống xà kép tập ngực dưới)',
                description: 'Cắt nét viền ngực dưới và tạo vệt phân tách ngực dưới rõ nét.',
                mechanic: 'Compound',
                primary_muscle: 'Chest',
                secondary_muscles: ['Triceps', 'Front Deltoids'],
                equipment_required: ['Dip Station / Parallel Bars'],
                contraindications: ['Đau khớp vai', 'Trật khớp ức đòn'],
                target_sets: 3,
                target_reps: '10-15',
                target_rpe: 8,
                instructions: 'Nghiêng thân người về phía trước khoảng 30 độ, hạ người đến khi cánh tay song song sàn rồi đẩy lên.',
                tags: ['Ngực dưới', 'Compound', 'Push', 'Bodyweight / Dips', 'Cắt nét']
            },
            {
                name: 'Cable Crossover / Chest Fly (Ép ngực dây cáp)',
                description: 'Bài tập isolation mang lại độ căng liên tục và co thắt ngực cực đại.',
                mechanic: 'Isolation',
                primary_muscle: 'Chest',
                secondary_muscles: ['Front Deltoids'],
                equipment_required: ['Cable Machine', 'Dual Cable Cross'],
                contraindications: ['Rách cơ ngực'],
                target_sets: 3,
                target_reps: '12-15',
                target_rpe: 9,
                instructions: 'Giữ khuỷu tay hơi cong cố định, ép 2 tay vào nhau như đang ôm một thân cây lớn, siết chặt cơ ngực 1 giây ở đỉnh.',
                tags: ['Ngực', 'Isolation', 'Cable', 'Pump cơ', 'Mind-Muscle Connection']
            },

            // --- LƯNG & XÔ (BACK / LATS) ---
            {
                name: 'Conventional Barbell Deadlift (Kéo tạ đòn từ sàn)',
                description: 'Vua của các bài tập chuỗi sau (Posterior Chain), phát triển toàn bộ cơ lưng, mông và đùi sau.',
                mechanic: 'Compound',
                primary_muscle: 'Back',
                secondary_muscles: ['Glutes', 'Hamstrings', 'Traps', 'Forearms', 'Core'],
                equipment_required: ['Barbell', 'Weight Plates'],
                contraindications: ['Thoát vị đĩa đệm cột sống', 'Đau lưng dưới cấp tính'],
                target_sets: 4,
                target_reps: '5-6',
                target_rpe: 8,
                instructions: 'Giữ thẳng lưng, ngực ưỡn, đạp mạnh chân xuống sàn đẩy hông về phía trước khóa khớp nhẹ nhàng.',
                tags: ['Lưng', 'Compound', 'Pull', 'Barbell', 'Sức mạnh toàn thân', 'Deadlift']
            },
            {
                name: 'Wide-Grip Pull-Up (Hít xà đơn tay rộng)',
                description: 'Bài tập xà đơn kinh điển tạo dáng lưng chữ V (V-taper) sắc nét.',
                mechanic: 'Compound',
                primary_muscle: 'Lats',
                secondary_muscles: ['Biceps', 'Rhomboids', 'Rear Delts', 'Core'],
                equipment_required: ['Pull-Up Bar'],
                contraindications: ['Chấn thương cổ tay nặng'],
                target_sets: 4,
                target_reps: '8-10',
                target_rpe: 8,
                instructions: 'Nắm xà rộng hơn vai, kéo cằm vượt quá thanh xà đồng thời ép chặt bả vai ra sau.',
                tags: ['Lưng xô', 'Compound', 'Pull', 'Bodyweight', 'V-Taper', 'Lưng chữ V']
            },
            {
                name: 'Bent-Over Barbell Row (Kéo tạ đòn gập người)',
                description: 'Xây dựng độ dày lưng giữa và độ nổi khối của cơ lưng xô.',
                mechanic: 'Compound',
                primary_muscle: 'Back',
                secondary_muscles: ['Biceps', 'Rhomboids', 'Erector Spinae'],
                equipment_required: ['Barbell', 'Weight Plates'],
                contraindications: ['Đau thắt lưng dưới'],
                target_sets: 4,
                target_reps: '8-10',
                target_rpe: 8,
                instructions: 'Gập hông 45 độ, kéo thanh đòn về phía rốn, ép bả vai vào nhau ở đỉnh chuyển động.',
                tags: ['Lưng giữa', 'Compound', 'Pull', 'Barbell', 'Độ dày cơ lưng']
            },
            {
                name: 'Seated Cable Row (Kéo cáp ngồi lưng giữa)',
                description: 'Cô lập cơ lưng giữa và xô an toàn, giảm áp lực lên cột sống thắt lưng.',
                mechanic: 'Compound',
                primary_muscle: 'Back',
                secondary_muscles: ['Biceps', 'Rhomboids', 'Traps'],
                equipment_required: ['Cable Machine', 'V-Bar Handle'],
                contraindications: [],
                target_sets: 3,
                target_reps: '10-12',
                target_rpe: 8,
                instructions: 'Ngồi thẳng lưng, kéo tay cầm về phía bụng dưới, căng xô khi nhả tạ từ từ.',
                tags: ['Lưng xô', 'Compound', 'Cable', 'Thân thiện với lưng', 'Hypertrophy']
            },

            // --- VAI (SHOULDERS) ---
            {
                name: 'Overhead Barbell Military Press (Đẩy tạ đòn qua đầu đứng)',
                description: 'Xây dựng khối cơ vai rộng, dày và cải thiện sức mạnh ổn định toàn thân.',
                mechanic: 'Compound',
                primary_muscle: 'Shoulders',
                secondary_muscles: ['Triceps', 'Upper Chest', 'Core'],
                equipment_required: ['Barbell', 'Weight Plates'],
                contraindications: ['Đau vai chèn ép gân', 'Thoát vị đĩa đệm'],
                target_sets: 4,
                target_reps: '8-10',
                target_rpe: 8,
                instructions: 'Đứng vững, siết mông và bụng, đẩy tạ thẳng lên trên đầu không ưỡn lưng quá mức.',
                tags: ['Vai trước', 'Compound', 'Push', 'Barbell', 'Sức mạnh qua đầu']
            },
            {
                name: 'Dumbbell Lateral Raise (Dang tạ đơn sang 2 bên)',
                description: 'Bài tập đỉnh cao giúp mở rộng cầu vai, tạo bờ vai tròn như quả dưa hấu (3D Shoulders).',
                mechanic: 'Isolation',
                primary_muscle: 'Shoulders',
                secondary_muscles: ['Traps'],
                equipment_required: ['Dumbbell'],
                contraindications: ['Viêm khớp cùng vai đòn'],
                target_sets: 4,
                target_reps: '12-15',
                target_rpe: 9,
                instructions: 'Nâng tạ sang 2 bên sao cho khuỷu tay ngang vai, không dùng đà lắc người.',
                tags: ['Vai giữa', 'Isolation', 'Dumbbell', 'Vai 3D', 'Mở rộng bờ vai']
            },
            {
                name: 'Face Pull with Rope (Kéo cáp dây thừng mặt)',
                description: 'Bảo vệ khớp vai, tăng cường cơ vai sau và cơ xoay ngoài (Rotator Cuff).',
                mechanic: 'Isolation',
                primary_muscle: 'Shoulders',
                secondary_muscles: ['Rear Delts', 'Rhomboids', 'Rotator Cuff'],
                equipment_required: ['Cable Machine', 'Rope Attachment'],
                contraindications: [],
                target_sets: 3,
                target_reps: '15-20',
                target_rpe: 8,
                instructions: 'Kéo dây thừng về phía trán, tách 2 đầu ngón tay cái ra phía sau đầu, mở rộng bả vai.',
                tags: ['Vai sau', 'Isolation', 'Cable', 'Chống gù lưng', 'Phục hồi khớp vai']
            },

            // --- TAY TRƯỚC & TAY SAU (ARMS) ---
            {
                name: 'Barbell Biceps Curl (Cuốn tạ đòn tay trước)',
                description: 'Kích thích tối đa khối lượng cơ bắp tay trước (Biceps).',
                mechanic: 'Isolation',
                primary_muscle: 'Biceps',
                secondary_muscles: ['Forearms'],
                equipment_required: ['Barbell / EZ Bar', 'Weight Plates'],
                contraindications: ['Viêm gân cổ tay'],
                target_sets: 3,
                target_reps: '10-12',
                target_rpe: 8,
                instructions: 'Giữ khuỷu tay cố định sát hông, cuốn tạ lên siết bắp tay 1 giây ở điểm cao nhất.',
                tags: ['Tay trước', 'Biceps', 'Isolation', 'Barbell', 'Độ dày bắp tay']
            },
            {
                name: 'Incline Dumbbell Curl (Cuốn tạ đơn ghế dốc nằm)',
                description: 'Tạo độ dài và đỉnh cơ bắp tay trước (Biceps Peak) nhờ kéo dãn tối đa đầu dài.',
                mechanic: 'Isolation',
                primary_muscle: 'Biceps',
                secondary_muscles: ['Brachialis'],
                equipment_required: ['Dumbbell', 'Incline Bench'],
                contraindications: [],
                target_sets: 3,
                target_reps: '12-15',
                target_rpe: 8,
                instructions: 'Nằm ngả lưng trên ghế dốc 45 độ, thả lỏng tay buông thõng kéo dãn cơ trước khi cuốn lên.',
                tags: ['Tay trước', 'Biceps Peak', 'Isolation', 'Dumbbell', 'Kéo dãn cơ']
            },
            {
                name: 'Triceps Cable Pushdown (Nhấn cáp tay sau dây thừng)',
                description: 'Cắt nét và bơm máu cực đại cho cơ bắp tay sau (Triceps).',
                mechanic: 'Isolation',
                primary_muscle: 'Triceps',
                secondary_muscles: [],
                equipment_required: ['Cable Machine', 'Rope Attachment'],
                contraindications: ['Đau khớp khuỷu tay cấp tính'],
                target_sets: 4,
                target_reps: '12-15',
                target_rpe: 9,
                instructions: 'Ghim chặt 2 khuỷu tay vào mạn sườn, đạp tạ xuống hết cỡ và bẻ nhẹ 2 đầu dây thừng sang 2 bên.',
                tags: ['Tay sau', 'Triceps', 'Isolation', 'Cable', 'Cắt nét tay sau']
            },
            {
                name: 'Skull Crusher / Lying Triceps Extension (Nằm đẩy tạ sau đầu)',
                description: 'Phát triển đầu dài cơ tay sau, tăng kích thước vòng tay tổng thể.',
                mechanic: 'Isolation',
                primary_muscle: 'Triceps',
                secondary_muscles: ['Forearms'],
                equipment_required: ['EZ Bar / Barbell', 'Flat Bench'],
                contraindications: ['Viêm gân cơ tam đầu'],
                target_sets: 3,
                target_reps: '10-12',
                target_rpe: 8,
                instructions: 'Nằm trên ghế phẳng, hạ thanh EZ Bar về phía trán hoặc đỉnh đầu rồi duỗi thẳng tay lên.',
                tags: ['Tay sau', 'Triceps', 'Isolation', 'EZ Bar', 'Tăng size bắp tay']
            },

            // --- CHÂN & ĐÙI (LEGS) ---
            {
                name: 'Barbell Back Squat (Gánh tạ đòn ngồi xổm)',
                description: 'Vua của các bài tập thân dưới, phát triển đùi trước, mông và sức mạnh bùng nổ.',
                mechanic: 'Compound',
                primary_muscle: 'Quadriceps',
                secondary_muscles: ['Glutes', 'Hamstrings', 'Calves', 'Core'],
                equipment_required: ['Barbell', 'Squat Rack', 'Weight Plates'],
                contraindications: ['Chấn thương dây chằng đầu gối', 'Thoát vị đĩa đệm nặng'],
                target_sets: 4,
                target_reps: '8-10',
                target_rpe: 8,
                instructions: 'Đứng chân rộng bằng vai, hạ hông xuống sâu ngang hoặc dưới gối, đạp mạnh gót chân đứng dậy.',
                tags: ['Đùi trước', 'Chân', 'Compound', 'Barbell', 'Vua bài tập chân', 'Squat']
            },
            {
                name: 'Romanian Deadlift (RDL - Kéo tạ đùi sau & mông)',
                description: 'Bài tập vàng xây dựng cơ đùi sau săn chắc và vòng 3 căng tròn quyến rũ.',
                mechanic: 'Compound',
                primary_muscle: 'Hamstrings',
                secondary_muscles: ['Glutes', 'Lower Back', 'Core'],
                equipment_required: ['Barbell / Dumbbell'],
                contraindications: ['Đau lưng dưới cấp tính'],
                target_sets: 4,
                target_reps: '10-12',
                target_rpe: 8,
                instructions: 'Đầu gối hơi chùng nhẹ cố định, đẩy hông ra phía sau tối đa cho đến khi đùi sau căng hết cỡ rồi kéo lên.',
                tags: ['Đùi sau', 'Mông', 'Compound', 'RDL', 'Tăng size vòng 3', 'Hamstrings']
            },
            {
                name: 'Bulgarian Split Squat (Squat 1 chân kê ghế)',
                description: 'Khắc phục lệch cơ 2 bên đùi và đốt cháy mỡ thừa vùng đùi mông.',
                mechanic: 'Compound',
                primary_muscle: 'Quadriceps',
                secondary_muscles: ['Glutes', 'Hamstrings', 'Adductors'],
                equipment_required: ['Dumbbell', 'Flat Bench'],
                contraindications: ['Đau khớp gối'],
                target_sets: 3,
                target_reps: '10-12 mỗi chân',
                target_rpe: 8,
                instructions: 'Kê mu bàn chân sau lên ghế, hạ người thẳng đứng xuống đến khi đùi trước song song sàn.',
                tags: ['Đùi mông', 'Compound', 'Dumbbell', 'Đơn phương 1 chân', 'Cân bằng cơ thể']
            },
            {
                name: 'Leg Press (Đạp đùi trên máy nghiêng)',
                description: 'Cho phép tập đùi với mức tạ lớn an toàn mà không gây áp lực lên cột sống thắt lưng.',
                mechanic: 'Compound',
                primary_muscle: 'Quadriceps',
                secondary_muscles: ['Glutes', 'Hamstrings'],
                equipment_required: ['Leg Press Machine'],
                contraindications: [],
                target_sets: 4,
                target_reps: '10-12',
                target_rpe: 8,
                instructions: 'Đặt chân giữa bàn đạp, hạ bàn đạp có kiểm soát không để nhấc mông khỏi đệm ghế.',
                tags: ['Đùi trước', 'Compound', 'Machine', 'An toàn cho lưng', 'Tải trọng cao']
            },
            {
                name: 'Lying Leg Curl (Nằm móc đùi sau máy)',
                description: 'Cô lập hoàn toàn nhóm cơ đùi sau giúp bắp chân thon gọn và khỏe khoắn.',
                mechanic: 'Isolation',
                primary_muscle: 'Hamstrings',
                secondary_muscles: ['Calves'],
                equipment_required: ['Leg Curl Machine'],
                contraindications: [],
                target_sets: 3,
                target_reps: '12-15',
                target_rpe: 8,
                instructions: 'Nằm úp trên máy, móc tạ về sát mông, giữ 1 giây siết cơ đùi sau rồi hạ chậm.',
                tags: ['Đùi sau', 'Isolation', 'Machine', 'Hamstrings', 'Hypertrophy']
            },
            {
                name: 'Standing Calf Raise (Nhón bắp chuối đứng)',
                description: 'Tạo độ nổi khối và sức bật cho cơ bắp chuối (Bắp chân).',
                mechanic: 'Isolation',
                primary_muscle: 'Calves',
                secondary_muscles: [],
                equipment_required: ['Calf Machine / Dumbbell'],
                contraindications: ['Viêm gân Achilles'],
                target_sets: 4,
                target_reps: '15-20',
                target_rpe: 9,
                instructions: 'Đứng trên mũi chân nhón lên đỉnh cao nhất, giữ căng 1 giây rồi hạ gót chân sâu xuống.',
                tags: ['Bắp chuối', 'Calves', 'Isolation', 'Nhẹ nhàng dẻo dai']
            },

            // --- CƠ BỤNG & CORE (ABS & CORE) ---
            {
                name: 'Hanging Leg Raise (Treo xà nhấc chân tập bụng dưới)',
                description: 'Bài tập số 1 tiêu diệt mỡ bụng dưới và hình thành rãnh múi bụng số 11.',
                mechanic: 'Isolation',
                primary_muscle: 'Core',
                secondary_muscles: ['Hip Flexors', 'Forearms'],
                equipment_required: ['Pull-Up Bar / Dip Station'],
                contraindications: ['Thoát vị rốn'],
                target_sets: 3,
                target_reps: '12-15',
                target_rpe: 8,
                instructions: 'Treo người trên xà, dùng cơ bụng cuộn xương chậu nâng gối hoặc chân lên cao ngang ngực.',
                tags: ['Bụng dưới', 'Core', 'Bodyweight', 'Rãnh 6 múi', 'Tập bụng']
            },
            {
                name: 'Cable Woodchopper (Kéo cáp chém xiên cơ liên sườn)',
                description: 'Tạo rãnh cơ liên sườn hình chữ V (V-Cut) và tăng sức mạnh xoay thân người.',
                mechanic: 'Isolation',
                primary_muscle: 'Core',
                secondary_muscles: ['Obliques', 'Shoulders'],
                equipment_required: ['Cable Machine'],
                contraindications: [],
                target_sets: 3,
                target_reps: '15 mỗi bên',
                target_rpe: 8,
                instructions: 'Kéo dây cáp chéo từ trên xuống dưới hoặc từ dưới lên trên, xoay eo siết chặt cơ liên sườn.',
                tags: ['Cơ liên sườn', 'Obliques', 'Core', 'Cable', 'Siết eo thon']
            },
            {
                name: 'Ab Roller Wheel (Lăn bánh xe tập cơ bụng toàn diện)',
                description: 'Kích hoạt toàn bộ nhóm cơ bụng và lưng dưới tạo sức mạnh lõi thép.',
                mechanic: 'Compound',
                primary_muscle: 'Core',
                secondary_muscles: ['Lats', 'Shoulders', 'Lower Back'],
                equipment_required: ['Ab Roller Wheel / Barbell'],
                contraindications: ['Đau thắt lưng dưới nặng'],
                target_sets: 3,
                target_reps: '10-12',
                target_rpe: 9,
                instructions: 'Quỳ trên thảm, lăn bánh xe về phía trước xa nhất có thể trong khi vẫn giữ gù lưng siết cơ bụng, sau đó kéo về.',
                tags: ['Bụng toàn diện', 'Core', 'Lõi thép', 'Săn chắc vòng 2']
            }
        ];

        for (const ex of diverseExercises) {
            await client.query(`
                INSERT INTO exercises (name, description, mechanic, primary_muscle, secondary_muscles, equipment_required, contraindications, target_sets, target_reps, target_rpe, instructions, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (name) DO UPDATE SET
                    description = EXCLUDED.description,
                    mechanic = EXCLUDED.mechanic,
                    primary_muscle = EXCLUDED.primary_muscle,
                    secondary_muscles = EXCLUDED.secondary_muscles,
                    equipment_required = EXCLUDED.equipment_required,
                    contraindications = EXCLUDED.contraindications,
                    target_sets = EXCLUDED.target_sets,
                    target_reps = EXCLUDED.target_reps,
                    target_rpe = EXCLUDED.target_rpe,
                    instructions = EXCLUDED.instructions,
                    tags = EXCLUDED.tags;
            `, [
                ex.name,
                ex.description,
                ex.mechanic,
                ex.primary_muscle,
                ex.secondary_muscles,
                ex.equipment_required,
                ex.contraindications,
                ex.target_sets,
                ex.target_reps,
                ex.target_rpe,
                ex.instructions,
                ex.tags
            ]);
        }
        console.log(`✅ Đã nạp thành công ${diverseExercises.length} bài tập chi tiết và tags liên quan!`);

        await client.query('COMMIT');
        console.log('🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ VÀO POSTGRESQL THÀNH CÔNG!');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi khi nạp dữ liệu:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seed();
