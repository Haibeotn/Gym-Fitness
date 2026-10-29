// services/aiService.js
const pool = require('../config/db');

/**
 * TỪ KHÓA CHẤN THƯƠNG & QUY TẮC SINH HỌC LOẠI TRỪ (BIOMECHANICAL CONTRAINDICATIONS)
 */
const INJURY_RULES = {
    knee: {
        keywords: ['gối', 'khớp gối', 'dây chằng', 'sụn chêm', 'knee', 'patella'],
        avoidTagsOrNames: ['back squat', 'jump', 'walking lunge', 'lunge sâu', 'deep squat'],
        preferredTagsOrNames: ['box squat', 'leg press', 'leg curl', 'glute bridge', 'hip thrust', 'romanian deadlift']
    },
    back: {
        keywords: ['lưng', 'cột sống', 'thắt lưng', 'thoát vị', 'lower back', 'spine', 'herniated'],
        avoidTagsOrNames: ['deadlift nặng', 'bent-over row', 'good morning', 't-bar row tự do', 'standing overhead'],
        preferredTagsOrNames: ['chest-supported', 'lat pulldown', 'seated cable row', 'hip thrust', 'goblet squat']
    },
    shoulder: {
        keywords: ['vai', 'khớp vai', 'chóp xoay', 'rotator cuff', 'shoulder', 'viêm gân vai'],
        avoidTagsOrNames: ['behind neck', 'upright row', 'deep dip', 'barbell overhead press', 'military press'],
        preferredTagsOrNames: ['neutral grip', 'incline dumbbell', 'face pull', 'floor press', 'dumbbell press']
    },
    wrist_elbow: {
        keywords: ['cổ tay', 'khuỷu tay', 'cùi chỏ', 'wrist', 'elbow', 'tennis elbow'],
        avoidTagsOrNames: ['straight bar', 'skull crusher', 'barbell curl'],
        preferredTagsOrNames: ['hammer curl', 'rope pushdown', 'neutral grip']
    }
};

/**
 * BẢNG ÁNH XẠ ĐỒNG NGHĨA NHÓM CƠ SONG NGỮ ANH - VIỆT (BILINGUAL MUSCLE TAXONOMY)
 */
const MUSCLE_SYNONYMS = {
    'chest': ['Chest', 'Ngực', 'Pectorals', 'Upper Chest', 'Inner Chest'],
    'ngực': ['Chest', 'Ngực', 'Pectorals'],
    'back': ['Back', 'Lats', 'Upper Back', 'Lower Back', 'Lưng', 'Xô', 'Rhomboids', 'Traps'],
    'lats': ['Lats', 'Back', 'Xô', 'Lưng xô'],
    'lưng': ['Back', 'Lats', 'Upper Back', 'Lưng', 'Xô'],
    'xô': ['Lats', 'Back', 'Xô', 'Lưng xô'],
    'shoulders': ['Shoulders', 'Deltoids', 'Front Deltoids', 'Rear Delts', 'Vai'],
    'vai': ['Shoulders', 'Deltoids', 'Front Deltoids', 'Rear Delts', 'Vai'],
    'biceps': ['Biceps', 'Tay trước', 'Brachialis', 'Forearms'],
    'tay trước': ['Biceps', 'Tay trước', 'Forearms'],
    'triceps': ['Triceps', 'Tay sau'],
    'tay sau': ['Triceps', 'Tay sau'],
    'arms': ['Biceps', 'Triceps', 'Forearms', 'Tay trước', 'Tay sau'],
    'tay': ['Biceps', 'Triceps', 'Forearms', 'Tay trước', 'Tay sau'],
    'legs': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Chân', 'Đùi trước', 'Đùi sau'],
    'quadriceps': ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves', 'Đùi trước', 'Chân'],
    'hamstrings': ['Hamstrings', 'Glutes', 'Quadriceps', 'Đùi sau'],
    'chân': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Chân'],
    'đùi': ['Quadriceps', 'Hamstrings', 'Glutes'],
    'glutes': ['Glutes', 'Hamstrings', 'Quadriceps', 'Mông'],
    'mông': ['Glutes', 'Hamstrings', 'Mông'],
    'core': ['Core', 'Abs', 'Obliques', 'Bụng', 'Lower Back'],
    'bụng': ['Core', 'Abs', 'Obliques', 'Bụng'],
    'full body': ['Full Body', 'Chest', 'Back', 'Quadriceps', 'Shoulders', 'Core'],
    'toàn thân': ['Full Body', 'Chest', 'Back', 'Quadriceps', 'Shoulders', 'Core']
};

function expandTargetMuscles(rawMuscles = []) {
    const expanded = new Set();
    rawMuscles.forEach(m => {
        if (!m) return;
        const clean = m.trim();
        expanded.add(clean);
        const lower = clean.toLowerCase();
        for (const [key, synList] of Object.entries(MUSCLE_SYNONYMS)) {
            if (lower === key || lower.includes(key)) {
                synList.forEach(s => expanded.add(s));
            }
        }
    });
    return Array.from(expanded);
}

/**
 * MỞ RỘNG DANH MỤC THIẾT BỊ ĐỒNG NGHĨA (EQUIPMENT SYNONYMS)
 */
function expandEquipment(equipmentList = []) {
    const set = new Set();
    equipmentList.forEach(eq => {
        set.add(eq);
        const l = eq.toLowerCase();
        if (l.includes('barbell') || l.includes('tạ đòn')) {
            set.add('Barbell');
            set.add('Weight Plates');
            set.add('Squat Rack');
        }
        if (l.includes('bench') || l.includes('ghế')) {
            set.add('Flat Bench');
            set.add('Incline Bench');
        }
        if (l.includes('dumbbell') || l.includes('tạ đơn')) {
            set.add('Dumbbell');
            set.add('Dumbbells');
        }
        if (l.includes('cable') || l.includes('cáp')) {
            set.add('Cable Machine');
            set.add('Dual Cable Cross');
        }
        if (l.includes('pull-up') || l.includes('xà')) {
            set.add('Pull-Up Bar');
            set.add('Dip Station / Parallel Bars');
        }
    });
    return Array.from(set);
}

/**
 * Hàm sinh danh sách bài tập thông minh với RÀNG BUỘC KHOA HỌC CHUẨN MỰC:
 * - Tối đa 4 - 6 bài tập / buổi (ngăn chặn Junk Volume & kiệt sức thần kinh CNS).
 * - Cấu trúc 4 pha: 1 Primary Compound -> 1-2 Secondary Assistance -> 2 Isolation/Finisher -> 1 Core/Cool-down.
 * - Phù hợp chấn thương, dụng cụ và môi trường tập luyện (Gym / Home / Calisthenics).
 */
const generateSafeExercises = async (targetMuscles, userInjuries = [], availableEquipment = [], environment = 'all', limit = 6) => {
    try {
        // 1. Chuẩn hóa & mở rộng danh sách nhóm cơ song ngữ Anh - Việt
        let rawMuscleList = [];
        if (Array.isArray(targetMuscles)) {
            rawMuscleList = targetMuscles.filter(m => m && m !== 'All' && m !== 'Tất cả');
        } else if (typeof targetMuscles === 'string' && targetMuscles.trim() && targetMuscles !== 'All' && targetMuscles !== 'Tất cả') {
            rawMuscleList = [targetMuscles.trim()];
        }
        const muscleList = expandTargetMuscles(rawMuscleList);

        const safeInjuries = Array.isArray(userInjuries) ? userInjuries : (userInjuries ? [userInjuries] : []);
        let safeEquipment = expandEquipment(Array.isArray(availableEquipment) ? availableEquipment : []);

        // 2. Nhận diện các nhóm chấn thương theo quy tắc sinh học
        const activeInjuryTypes = [];
        const injuryString = safeInjuries.join(' ').toLowerCase();

        for (const [key, rule] of Object.entries(INJURY_RULES)) {
            if (rule.keywords.some(kw => injuryString.includes(kw))) {
                activeInjuryTypes.push(rule);
            }
        }

        // 3. Xây dựng truy vấn cơ sở dữ liệu lấy toàn bộ ứng viên bài tập an toàn
        let baseQuery = `
            SELECT id, name, description, mechanic, primary_muscle, secondary_muscles, 
                   equipment_required, contraindications, target_sets, target_reps, 
                   target_rpe, instructions, tags
            FROM exercises
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        // Lọc nhóm cơ (nếu có chọn): Khớp primary_muscle, secondary_muscles hoặc tags
        if (muscleList.length > 0) {
            baseQuery += ` AND (
                primary_muscle = ANY($${paramIndex}) 
                OR primary_muscle ILIKE ANY(SELECT '%' || unnest($${paramIndex}::text[]) || '%')
                OR secondary_muscles && $${paramIndex}::text[]
                OR tags && $${paramIndex}::text[]
            )`;
            queryParams.push(muscleList);
            paramIndex++;
        }

        // Loại bỏ bài tập có chống chỉ định trực tiếp
        if (safeInjuries.length > 0) {
            baseQuery += ` AND NOT (contraindications && $${paramIndex}::text[])`;
            queryParams.push(safeInjuries);
            paramIndex++;
        }

        // Lọc theo dụng cụ & môi trường
        const isGymFull = safeEquipment.some(eq => 
            eq.toLowerCase().includes('gym') || 
            eq.toLowerCase().includes('đầy đủ') || 
            eq.toLowerCase().includes('all')
        );

        if (!isGymFull && safeEquipment.length > 0) {
            baseQuery += ` AND (
                equipment_required <@ $${paramIndex}::text[] 
                OR equipment_required = '{}'
                OR equipment_required IS NULL
            )`;
            queryParams.push(safeEquipment);
            paramIndex++;
        }

        if (environment === 'home') {
            baseQuery += ` AND ('Home' = ANY(tags) OR equipment_required = '{}' OR equipment_required <@ ARRAY['Dumbbell', 'Resistance Bands', 'Yoga Mat', 'Flat Bench']::text[])`;
        } else if (environment === 'calisthenics') {
            baseQuery += ` AND ('Calisthenics' = ANY(tags) OR 'Bodyweight' = ANY(tags) OR equipment_required = '{}' OR equipment_required <@ ARRAY['Pull-Up Bar', 'Dip Station / Parallel Bars']::text[])`;
        }

        const { rows: candidateExercises } = await pool.query(baseQuery, queryParams);

        // Fallback an toàn nếu bộ lọc quá hẹp
        let availablePool = candidateExercises;
        if (!availablePool || availablePool.length === 0) {
            const fallbackQuery = `
                SELECT id, name, description, mechanic, primary_muscle, secondary_muscles, 
                       equipment_required, contraindications, target_sets, target_reps, 
                       target_rpe, instructions, tags
                FROM exercises
                WHERE equipment_required = '{}' OR 'Bodyweight' = ANY(tags) OR 'Compound' = mechanic
                LIMIT 12
            `;
            const fallbackRes = await pool.query(fallbackQuery);
            availablePool = fallbackRes.rows;
        }

        // 4. Lọc bổ sung theo quy tắc sinh học chấn thương (Biomechanical Avoidance Filter)
        let filteredPool = availablePool.filter(ex => {
            const exNameLower = ex.name.toLowerCase();
            const exTagsLower = (ex.tags || []).join(' ').toLowerCase();

            for (const rule of activeInjuryTypes) {
                // Nếu bài tập chứa các từ khóa cấm của chấn thương này thì loại bỏ
                const hasAvoid = rule.avoidTagsOrNames.some(avoidKw => 
                    exNameLower.includes(avoidKw) || exTagsLower.includes(avoidKw)
                );
                if (hasAvoid) return false;
            }
            return true;
        });

        // Nếu lọc xong mà còn ít hơn 4 bài, nới lỏng giữ lại pool cũ để tránh thiếu bài
        if (filteredPool.length < 4) {
            filteredPool = availablePool;
        }

        // 5. CẤU TRÚC 4 PHA CHUẨN KHOA HỌC (SESSION ARCHITECTURE ASSEMBLY)
        const primaryCompounds = [];
        const secondaryAssistance = [];
        const isolations = [];
        const coreExercises = [];

        // Ưu tiên đẩy các bài tập có primary_muscle khớp trực tiếp với nhóm cơ mục tiêu lên đầu danh sách
        const sortedPool = [...filteredPool].sort((a, b) => {
            const aPrimaryMatch = muscleList.some(m => (a.primary_muscle || '').toLowerCase() === m.toLowerCase()) ? 1 : 0;
            const bPrimaryMatch = muscleList.some(m => (b.primary_muscle || '').toLowerCase() === m.toLowerCase()) ? 1 : 0;
            return bPrimaryMatch - aPrimaryMatch;
        });

        sortedPool.forEach(ex => {
            const isCompound = ex.mechanic === 'Compound';
            const isCore = (ex.primary_muscle || '').toLowerCase().includes('core') || 
                           (ex.primary_muscle || '').toLowerCase().includes('abs') ||
                           (ex.tags || []).some(t => t.toLowerCase().includes('core') || t.toLowerCase().includes('bụng'));

            if (isCore) {
                coreExercises.push(ex);
            } else if (isCompound) {
                // Nhận diện bài trục chính nặng (Barbell, heavy compound)
                const isHeavyPrimary = (ex.equipment_required || []).some(eq => eq.toLowerCase().includes('barbell')) ||
                                       (ex.tags || []).some(t => t.toLowerCase().includes('ngực giữa') || t.toLowerCase().includes('sức mạnh') || t.toLowerCase().includes('squat'));
                if (isHeavyPrimary) {
                    primaryCompounds.push(ex);
                } else {
                    secondaryAssistance.push(ex);
                }
            } else {
                isolations.push(ex);
            }
        });

        const selectedSessionExercises = [];
        const usedExerciseIds = new Set();
        const usedExerciseBaseNames = new Set();

        const pickUnique = (sourceArray) => {
            // Ưu tiên 1: Chưa trùng ID và chưa trùng tên cơ bản (tránh 2 bài cùng là Bench Press)
            for (const ex of sourceArray) {
                const baseName = ex.name.split('(')[0].trim().toLowerCase();
                if (!usedExerciseIds.has(ex.id) && !usedExerciseBaseNames.has(baseName)) {
                    usedExerciseIds.add(ex.id);
                    usedExerciseBaseNames.add(baseName);
                    return ex;
                }
            }
            // Ưu tiên 2: Nếu thiếu bài, chấp nhận bài khác ID
            for (const ex of sourceArray) {
                if (!usedExerciseIds.has(ex.id)) {
                    usedExerciseIds.add(ex.id);
                    return ex;
                }
            }
            return null;
        };

        // --- PHA 1: 1 BÀI TRỤC CHÍNH (PRIMARY COMPOUND) ---
        let mainLift = pickUnique(primaryCompounds) || pickUnique(secondaryAssistance) || pickUnique(filteredPool);
        if (mainLift) {
            selectedSessionExercises.push({
                ...mainLift,
                phase: 1,
                phase_title: '1. Trục Chính (Primary Compound)',
                target_sets: 4,
                target_reps: '6-8 reps',
                target_rpe: 8,
                rest_seconds: 150,
                tempo: '3-0-1-0',
                coaching_tip: 'Tập trung phát lực tối đa, gồng chắc cơ lõi (Core Bracing), không nảy tạ.'
            });
        }

        // --- PHA 2: 1 - 2 BÀI ĐA KHỚP BỔ TRỢ (SECONDARY ASSISTANCE) ---
        let assist1 = pickUnique(secondaryAssistance) || pickUnique(primaryCompounds);
        if (assist1) {
            selectedSessionExercises.push({
                ...assist1,
                phase: 2,
                phase_title: '2. Đa Khớp Bổ Trợ (Assistance Lift)',
                target_sets: 3,
                target_reps: '8-10 reps',
                target_rpe: 8,
                rest_seconds: 90,
                tempo: '3-0-1-0',
                coaching_tip: 'Kiểm soát nhịp độ hạ chậm 3 giây để tối ưu lực căng cơ học (Mechanical Tension).'
            });
        }

        let assist2 = pickUnique(secondaryAssistance);
        if (assist2 && selectedSessionExercises.length < 3) {
            selectedSessionExercises.push({
                ...assist2,
                phase: 2,
                phase_title: '2. Đa Khớp Bổ Trợ 2 (Assistance Lift)',
                target_sets: 3,
                target_reps: '10-12 reps',
                target_rpe: 8,
                rest_seconds: 90,
                tempo: '2-0-1-0',
                coaching_tip: 'Tập trung biên độ co duỗi cơ bắp toàn diện (Full ROM).'
            });
        }

        // --- PHA 3: 2 BÀI CÔ LẬP & BƠM MÁU (ISOLATION / HYPERTROPHY) ---
        let iso1 = pickUnique(isolations) || pickUnique(filteredPool);
        if (iso1) {
            selectedSessionExercises.push({
                ...iso1,
                phase: 3,
                phase_title: '3. Cô Lập & Bơm Máu (Isolation / Pump)',
                target_sets: 3,
                target_reps: '12-15 reps',
                target_rpe: 8.5,
                rest_seconds: 60,
                tempo: '2-1-1-0',
                coaching_tip: 'Siết chặt cơ ở đỉnh chuyển động 1 giây để tối ưu áp lực chuyển hóa (Metabolic Stress).'
            });
        }

        let iso2 = pickUnique(isolations) || pickUnique(filteredPool);
        if (iso2 && selectedSessionExercises.length < 5) {
            selectedSessionExercises.push({
                ...iso2,
                phase: 3,
                phase_title: '3. Cô Lập & Bơm Máu 2 (Isolation / Pump)',
                target_sets: 3,
                target_reps: '12-15 reps',
                target_rpe: 9,
                rest_seconds: 60,
                tempo: '2-0-1-0',
                coaching_tip: 'Thực hiện liên tục nhịp nhàng, tiệm cận ngưỡng thất bại (Near failure).'
            });
        }

        // --- PHA 4: 1 BÀI CƠ LÕI HOẶC FINISHER NẾU CÒN CHỖ (TỐI ĐA 5-6 BÀI) ---
        if (selectedSessionExercises.length < 6) {
            let coreOrFinisher = pickUnique(coreExercises) || pickUnique(isolations) || pickUnique(filteredPool);
            if (coreOrFinisher) {
                selectedSessionExercises.push({
                    ...coreOrFinisher,
                    phase: 4,
                    phase_title: '4. Cơ Lõi & Hạ Nhiệt (Core / Finisher)',
                    target_sets: 3,
                    target_reps: '15-20 reps hoặc 45s',
                    target_rpe: 7.5,
                    rest_seconds: 45,
                    tempo: 'Kiểm soát',
                    coaching_tip: 'Ổn định khung xương chậu và cột sống, thở đều liên tục.'
                });
            }
        }

        // 6. RÀNG BUỘC TUYỆT ĐỐI: CẮT GỌT VỀ TỐI ĐA 5 - 6 BÀI TẬP (KHÔNG BAO GIỜ VƯỢT QUÁ 6)
        const finalSession = selectedSessionExercises.slice(0, Math.min(limit, 6));

        return finalSession;

    } catch (error) {
        console.error('❌ Lỗi thuật toán sinh bài tập chuẩn cấu trúc:', error);
        throw new Error('Không thể sinh lịch tập lúc này.');
    }
};

module.exports = { generateSafeExercises };