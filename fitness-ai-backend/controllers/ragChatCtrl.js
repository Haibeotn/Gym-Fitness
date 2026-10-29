const pool = require('../config/db');

// Bộ nhớ đệm (In-Memory Cache) để lấy bài tập & món ăn trong 0.5ms
let cachedExercises = null;
let lastCacheTime = 0;

const NUTRITION_FAST_TRUTH = [
  { keys: ['ức gà', 'uc ga', 'gà'], text: 'Ức gà (100g): 165 kcal | 31g P | 0g C | 3.6g F' },
  { keys: ['cơm', 'com trang'], text: 'Cơm trắng (1 chén 150g): 195 kcal | 4g P | 42g C | 0.5g F' },
  { keys: ['phở', 'pho bo'], text: 'Phở bò (1 tô): 450 kcal | 26g P | 58g C | 12g F' },
  { keys: ['trứng', 'trung'], text: 'Trứng luộc (1 quả): 78 kcal | 6.3g P | 0.6g C | 5.3g F' },
  { keys: ['bò', 'thịt bò'], text: 'Thăn bò nạc (100g): 215 kcal | 28g P | 0g C | 11g F' },
  { keys: ['khoai lang'], text: 'Khoai lang (100g): 86 kcal | 1.6g P | 20g C | 0.1g F' },
  { keys: ['yến mạch'], text: 'Yến mạch (100g): 389 kcal | 16.9g P | 66g C | 6.9g F' },
  { keys: ['cơm tấm', 'sườn'], text: 'Cơm tấm sườn (1 đĩa): 680 kcal | 32g P | 75g C | 26g F' },
];

// Kho bài tập Cơ Sinh Học An Toàn Chấn Thương (Biomechanical Injury-Safe Catalog)
const BIOMECHANICAL_SAFE_EXERCISES = [
  // NGỰC (CHEST)
  {
    name: 'Neutral-Grip Incline Dumbbell Press - Đẩy ngực trên tạ đơn cầm trung tính',
    primary_muscle: 'Chest',
    mechanic: 'Compound',
    phase_title: 'Pha 1: Compound Bảo Vệ Khớp',
    target_sets: 4,
    target_reps: '10-12',
    target_rpe: 7.5,
    rest_seconds: 75,
    tempo: '3-1-1-0',
    instructions: 'Đặt ghế dốc 30 độ, lòng bàn tay hướng vào nhau (Neutral Grip) giúp mở rộng khoang dưới mỏm cùng vai, giảm 80% áp lực chèn ép gân cơ chóp xoay.',
    coaching_tip: 'Hạ tạ có kiểm soát 3 giây, giữ bả vai ép chặt vào ghế.',
    equipment_required: ['Tạ đơn (Dumbbell)', 'Ghế dốc 30°'],
    avoid_if: 'Không hạ khuỷu tay sâu quá mặt phẳng lưng ghế',
    safe_for: ['shoulder', 'back', 'knee'],
    unsafe_for: ['wrist_severe'],
  },
  {
    name: 'Dumbbell Floor Press - Đẩy ngực tạ đơn trên sàn (Giới hạn biên độ an toàn)',
    primary_muscle: 'Chest',
    mechanic: 'Compound',
    phase_title: 'Pha 2: Kiểm Soát Biên Độ',
    target_sets: 3,
    target_reps: '10-12',
    target_rpe: 8,
    rest_seconds: 75,
    tempo: '2-1-1-0',
    instructions: 'Nằm trên sàn phẳng, bắp tay chạm sàn sẽ tự động khóa biên độ hạ tạ, bảo vệ tuyệt đối bao khớp vai trước và cột sống lưng.',
    coaching_tip: 'Chạm nhẹ bắp tay xuống sàn 1 giây để triệt tiêu quán tính rồi phát lực đẩy lên.',
    equipment_required: ['Tạ đơn (Dumbbell)'],
    avoid_if: 'Đau cổ tay cấp tính',
    safe_for: ['shoulder', 'back', 'knee'],
    unsafe_for: [],
  },
  {
    name: 'Standing Cable Chest Fly - Ép ngực với cáp ngang',
    primary_muscle: 'Chest',
    mechanic: 'Isolation',
    phase_title: 'Pha 3: Cô Lập Cơ Ngực',
    target_sets: 3,
    target_reps: '12-15',
    target_rpe: 8,
    rest_seconds: 60,
    tempo: '2-1-2-1',
    instructions: 'Bước 1 chân lên trước giữ vững trọng tâm, hơi trùng khuỷu tay cố định, ép hai tay về trước ngực và siết cơ ngực 1 giây.',
    coaching_tip: 'Không đưa khuỷu tay ra sau thân người quá sâu để tránh căng khớp vai.',
    equipment_required: ['Máy kéo cáp (Cable)'],
    avoid_if: 'Rách cơ ngực',
    safe_for: ['shoulder', 'back', 'knee', 'wrist'],
    unsafe_for: [],
  },

  // LƯNG & XÔ (BACK)
  {
    name: 'Chest-Supported Dumbbell Row - Kéo tạ đơn có ghế đỡ ngực (Chống nén cột sống)',
    primary_muscle: 'Back',
    mechanic: 'Compound',
    phase_title: 'Pha 1: Compound Giảm Tải Lưng Dưới',
    target_sets: 4,
    target_reps: '10-12',
    target_rpe: 8,
    rest_seconds: 75,
    tempo: '2-1-2-0',
    instructions: 'Nằm úp ngực lên ghế dốc 45 độ, thả lỏng hoàn toàn vùng thắt lưng, kéo tạ đơn về phía hông bằng lực cơ xô và lưng giữa.',
    coaching_tip: 'Bài tập số 1 cho người đau lưng dưới vì loại bỏ 100% lực cắt (Shear Force) lên đĩa đệm L4-L5.',
    equipment_required: ['Tạ đơn (Dumbbell)', 'Ghế dốc'],
    avoid_if: 'Không dùng đà giật cổ',
    safe_for: ['back', 'knee', 'shoulder'],
    unsafe_for: [],
  },
  {
    name: 'Neutral-Grip Lat Pulldown - Kéo xô tay cầm chữ V (Hẹp trung tính)',
    primary_muscle: 'Back',
    mechanic: 'Compound',
    phase_title: 'Pha 2: Phát Triển Cơ Xô',
    target_sets: 4,
    target_reps: '10-12',
    target_rpe: 8,
    rest_seconds: 75,
    tempo: '2-1-2-0',
    instructions: 'Ngồi thẳng lưng, hơi ngả người 10 độ, kéo tay cầm chữ V về phía ngực trên đồng thời hạ bả vai xuống (Scapular Depression).',
    coaching_tip: 'Tay cầm trung tính giúp khớp vai và cổ tay ở góc sinh học tự nhiên nhất.',
    equipment_required: ['Máy kéo xô (Lat Pulldown)'],
    avoid_if: 'Không kéo ra sau gáy',
    safe_for: ['back', 'shoulder', 'knee'],
    unsafe_for: [],
  },
  {
    name: 'Seated Cable Row - Ngồi kéo cáp lưng giữa',
    primary_muscle: 'Back',
    mechanic: 'Compound',
    phase_title: 'Pha 3: Dày Lưng & Cân Bằng Tư Thế',
    target_sets: 3,
    target_reps: '12-15',
    target_rpe: 8,
    rest_seconds: 60,
    tempo: '2-1-2-0',
    instructions: 'Ngồi thẳng cột sống trung tính, gồng nhẹ cơ bụng (Core Bracing), kéo cáp về sát rốn và ép hai xương bả vai lại gần nhau.',
    coaching_tip: 'Giữ lưng cố định, không gập rướn thắt lưng theo tạ.',
    equipment_required: ['Máy kéo cáp ngồi'],
    avoid_if: 'Thoát vị đĩa đệm cấp tính chưa ổn định',
    safe_for: ['knee', 'shoulder', 'back'],
    unsafe_for: [],
  },

  // CHÂN & MÔNG (QUADRICEPS / GLUTES)
  {
    name: 'Barbell / Dumbbell Hip Thrust - Đẩy hông tăng cơ mông & đùi sau (An toàn khớp gối)',
    primary_muscle: 'Quadriceps',
    mechanic: 'Compound',
    phase_title: 'Pha 1: Compound Chuỗi Sau An Toàn Gối & Lưng',
    target_sets: 4,
    target_reps: '10-12',
    target_rpe: 8,
    rest_seconds: 75,
    tempo: '2-2-1-0',
    instructions: 'Tựa lưng trên vào ghế băng, đặt tạ lên hông, đạp gót chân đẩy hông lên cao sao cho cẳng chân vuông góc với sàn ở đỉnh động tác.',
    coaching_tip: 'Giữ cằm thu nhẹ về ngực, siết chặt cơ mông 2 giây ở đỉnh, không ưỡn võng lưng dưới.',
    equipment_required: ['Tạ đơn / Tạ đòn', 'Ghế băng'],
    avoid_if: 'Đau khớp háng cấp tính',
    safe_for: ['knee', 'back', 'shoulder'],
    unsafe_for: [],
  },
  {
    name: 'High-Box Goblet Squat - Squat tạ đơn chạm ghế cao (Kiểm soát góc gối)',
    primary_muscle: 'Quadriceps',
    mechanic: 'Compound',
    phase_title: 'Pha 2: Tăng Sức Mạnh Đùi Trước',
    target_sets: 3,
    target_reps: '10-12',
    target_rpe: 7.5,
    rest_seconds: 75,
    tempo: '3-1-1-0',
    instructions: 'Ôm 1 quả tạ đơn trước ngực, đẩy hông ra sau và hạ người chậm 3 giây chạm nhẹ mông vào ghế hộp (góc gối dừng ở 90 độ), sau đó đạp gót đứng lên.',
    coaching_tip: 'Ghế hộp giúp giới hạn biên độ gập gối an toàn và giữ cột sống thẳng tự nhiên.',
    equipment_required: ['Tạ đơn (Dumbbell)', 'Ghế Box'],
    avoid_if: 'Tràn dịch khớp gối cấp',
    safe_for: ['shoulder', 'back'],
    unsafe_for: [],
  },
  {
    name: 'Seated / Lying Leg Curl - Cuốn đùi sau với máy (Ổn định khớp gối)',
    primary_muscle: 'Quadriceps',
    mechanic: 'Isolation',
    phase_title: 'Pha 3: Bảo Vệ Dây Chằng Chéo (ACL)',
    target_sets: 3,
    target_reps: '12-15',
    target_rpe: 8,
    rest_seconds: 60,
    tempo: '2-1-2-0',
    instructions: 'Điều chỉnh đệm máy vừa cổ chân, cuộn cẳng chân xuống hết biên độ để kích hoạt cơ đùi sau (Hamstrings) giúp neo giữ và bảo vệ khớp gối.',
    coaching_tip: 'Cơ đùi sau khỏe là lớp giáp tự nhiên giảm tải cho dây chằng khớp gối.',
    equipment_required: ['Máy Leg Curl'],
    avoid_if: 'Rách cơ đùi sau',
    safe_for: ['knee', 'back', 'shoulder'],
    unsafe_for: [],
  },

  // VAI (SHOULDERS)
  {
    name: 'Rope Face Pull - Kéo dây thừng về mặt (Phục hồi chóp xoay vai & vai sau)',
    primary_muscle: 'Shoulders',
    mechanic: 'Isolation',
    phase_title: 'Pha 1: Ổn Định Khớp Vai & Chóp Xoay',
    target_sets: 4,
    target_reps: '15',
    target_rpe: 7.5,
    rest_seconds: 60,
    tempo: '2-2-2-0',
    instructions: 'Đặt ròng rọc ngang tầm mắt, kéo dây thừng về phía trán đồng thời xoay ngoài khớp vai (External Rotation) tạo hình chữ W.',
    coaching_tip: 'Bài tập vàng giúp trị liệu mỏi vai, gù lưng và bảo vệ khớp vai lâu dài.',
    equipment_required: ['Máy cáp', 'Dây thừng (Rope)'],
    avoid_if: 'Không dùng tạ quá nặng gây giật lưng',
    safe_for: ['shoulder', 'back', 'knee'],
    unsafe_for: [],
  },
  {
    name: 'Scapular Plane Lateral Raise - Giang vai tạ đơn góc 30 độ về trước',
    primary_muscle: 'Shoulders',
    mechanic: 'Isolation',
    phase_title: 'Pha 2: Phát Triển Vai Giữa An Toàn',
    target_sets: 3,
    target_reps: '12-15',
    target_rpe: 8,
    rest_seconds: 60,
    tempo: '2-1-2-0',
    instructions: 'Nâng tạ đơn sang ngang nhưng chếch về phía trước mặt một góc 30 độ (mặt phẳng xương bả vai - Scapular Plane) để không cọ xát gân cơ trên gai.',
    coaching_tip: 'Chỉ nâng ngang tầm vai, ngón cái hơi hướng nhẹ lên trên.',
    equipment_required: ['Tạ đơn nhẹ (Dumbbell)'],
    avoid_if: 'Viêm gân chóp xoay cấp tính',
    safe_for: ['shoulder', 'back', 'knee'],
    unsafe_for: [],
  },

  // TAY (BICEPS / TRICEPS)
  {
    name: 'Rope Triceps Pushdown - Kéo cáp dây thừng tập tay sau',
    primary_muscle: 'Biceps',
    mechanic: 'Isolation',
    phase_title: 'Pha 3: Cô Lập Tay Sau An Toàn Khuỷu Tay',
    target_sets: 3,
    target_reps: '12-15',
    target_rpe: 8,
    rest_seconds: 60,
    tempo: '2-1-2-0',
    instructions: 'Khóa cố định khuỷu tay sát sườn, duỗi thẳng cẳng tay xuống và tách nhẹ hai đầu dây thừng ở điểm cuối.',
    coaching_tip: 'Giữ vai hạ thấp, chỉ chuyển động khớp khuỷu tay.',
    equipment_required: ['Máy cáp', 'Dây thừng'],
    avoid_if: 'Viêm mỏm trên lồi cầu khuỷu tay nặng',
    safe_for: ['shoulder', 'back', 'knee', 'wrist'],
    unsafe_for: [],
  },
  {
    name: 'Dumbbell Hammer Curl - Cuốn tạ đơn cầm dọc (Bảo vệ cổ tay)',
    primary_muscle: 'Biceps',
    mechanic: 'Isolation',
    phase_title: 'Pha 3: Phát Triển Tay Trước & Cẳng Tay',
    target_sets: 3,
    target_reps: '10-12',
    target_rpe: 8,
    rest_seconds: 60,
    tempo: '2-1-2-0',
    instructions: 'Cầm hai quả tạ đơn hướng lòng bàn tay vào nhau, cuốn tạ lên ngang vai mà không đung đưa thân người.',
    coaching_tip: 'Tư thế cầm dọc giảm tối đa áp lực xoắn lên khớp cổ tay và khuỷu tay.',
    equipment_required: ['Tạ đơn (Dumbbell)'],
    avoid_if: 'Không ngả lưng lấy đà',
    safe_for: ['shoulder', 'back', 'knee', 'wrist'],
    unsafe_for: [],
  },

  // CORE & CỘT SỐNG (CORE)
  {
    name: 'Dead Bug & McGill Bird-Dog - Ổn định cột sống lõi (Core Stability)',
    primary_muscle: 'Core',
    mechanic: 'Isolation',
    phase_title: 'Pha 4: Gia Cố Đai Cơ Lưng - Bụng',
    target_sets: 3,
    target_reps: '12 mỗi bên',
    target_rpe: 7,
    rest_seconds: 45,
    tempo: '3-2-1-0',
    instructions: 'Nằm ngửa ép chặt lưng dưới xuống sàn (Dead Bug), duỗi chậm tay và chân đối diện ra xa trong khi giữ hơi thở đều và cơ bụng gồng cứng.',
    coaching_tip: 'Bài tập chuẩn y học thể thao của GS. Stuart McGill giúp bảo vệ cột sống thắt lưng.',
    equipment_required: ['Thảm tập (Bodyweight)'],
    avoid_if: 'Không để lưng dưới bị kênh khỏi mặt sàn',
    safe_for: ['back', 'knee', 'shoulder', 'wrist'],
    unsafe_for: [],
  },
];

async function getExercisesFast() {
  const now = Date.now();
  if (cachedExercises && now - lastCacheTime < 10 * 60 * 1000) {
    return cachedExercises;
  }
  try {
    const res = await pool.query(
      'SELECT name, muscle_group, primary_muscle, mechanic, target_sets, target_reps, target_rpe, instructions, equipment FROM exercises ORDER BY id ASC LIMIT 80'
    );
    cachedExercises = res.rows || [];
    lastCacheTime = now;
    return cachedExercises;
  } catch (_) {
    return [];
  }
}

// Bóc tách chấn thương và nhóm cơ từ văn bản chat + hồ sơ học viên
function analyzeInjuryAndMuscleIntent(text = '', userProfile = {}) {
  const lower = text.toLowerCase();
  const profileInjuries = Array.isArray(userProfile?.injuries)
    ? userProfile.injuries.join(' ').toLowerCase()
    : String(userProfile?.injuries || '').toLowerCase();
  const combined = `${lower} ${profileInjuries}`;

  const detectedInjuries = [];
  const injuryCodes = [];

  if (/vai|shoulder|rotator|chóp xoay|khớp vai/.test(combined) && /đau|mỏi|chấn thương|viêm|tránh|bị|yếu/.test(combined)) {
    detectedInjuries.push('Đau / Mỏi khớp vai');
    injuryCodes.push('shoulder');
  }
  if (/lưng|thắt lưng|cột sống|thoát vị|đĩa đệm|lower back|back pain/.test(combined)) {
    detectedInjuries.push('Đau lưng dưới / Cột sống');
    injuryCodes.push('back');
  }
  if (/gối|đầu gối|dây chằng|khớp gối|knee|acl|meniscus/.test(combined)) {
    detectedInjuries.push('Đau khớp gối');
    injuryCodes.push('knee');
  }
  if (/cổ tay|khuỷu tay|wrist|elbow/.test(combined)) {
    detectedInjuries.push('Đau cổ tay / Khuỷu tay');
    injuryCodes.push('wrist');
  }

  // Phát hiện nhóm cơ mục tiêu mà người dùng muốn tập
  const targetMuscles = [];
  if (/ngực|chest|bench|đẩy ngực/.test(lower)) targetMuscles.push('Chest');
  if (/lưng|xô|back|pull|kéo xô/.test(lower)) targetMuscles.push('Back');
  if (/chân|đùi|mông|leg|squat|glute|lower body|thân dưới/.test(lower)) targetMuscles.push('Quadriceps');
  if (/vai|shoulder/.test(lower) && !injuryCodes.includes('shoulder')) targetMuscles.push('Shoulders');
  if (/tay|bắp tay|tay sau|tay trước|arm|bicep|tricep/.test(lower)) targetMuscles.push('Biceps');
  if (/bụng|core|abs/.test(lower)) targetMuscles.push('Core');
  if (/upper|thân trên/.test(lower)) targetMuscles.push('Chest', 'Back', 'Shoulders', 'Biceps');

  return {
    detectedInjuries,
    injuryCodes,
    targetMuscles: [...new Set(targetMuscles)],
    isTiredOrRecovery: /mệt|mỏi|nhẹ|phục hồi|deload|đau nhiều|mới tập/.test(lower),
  };
}

// Xây dựng danh sách bài tập chuẩn hóa theo thể trạng & chấn thương
function buildTailoredWorkoutPlan(message = '', aiReply = '', userProfile = {}) {
  const combinedText = `${message}\n${aiReply}`;
  const { detectedInjuries, injuryCodes, targetMuscles, isTiredOrRecovery } =
    analyzeInjuryAndMuscleIntent(combinedText, userProfile);

  const goal = String(userProfile?.goal || '').toLowerCase();
  const isCutting = goal.includes('giảm') || goal.includes('cut');

  // Lọc các bài tập từ kho Biomechanical Safe Catalog
  let selected = [];

  if (targetMuscles.length > 0) {
    selected = BIOMECHANICAL_SAFE_EXERCISES.filter((ex) =>
      targetMuscles.includes(ex.primary_muscle)
    );
  }

  // Nếu người dùng bị chấn thương vai nhưng đang hỏi tập ngực - tay sau hoặc vai, thêm bài phục hồi vai (Face Pull)
  if (injuryCodes.includes('shoulder') && !selected.some((e) => e.name.includes('Face Pull'))) {
    const facePull = BIOMECHANICAL_SAFE_EXERCISES.find((e) => e.name.includes('Face Pull'));
    if (facePull) selected.push(facePull);
  }

  // Nếu người dùng bị đau lưng dưới, luôn thêm bài ổn định Core McGill
  if (injuryCodes.includes('back') && !selected.some((e) => e.primary_muscle === 'Core')) {
    const coreEx = BIOMECHANICAL_SAFE_EXERCISES.find((e) => e.primary_muscle === 'Core');
    if (coreEx) selected.push(coreEx);
  }

  // Nếu chưa khớp nhóm cơ cụ thể, chọn bộ Full Body An Toàn theo chấn thương
  if (selected.length < 3) {
    const poolSafe = BIOMECHANICAL_SAFE_EXERCISES.filter((ex) => {
      if (injuryCodes.length === 0) return true;
      return injuryCodes.every((code) => ex.safe_for.includes(code));
    });
    for (const item of poolSafe) {
      if (!selected.some((s) => s.name === item.name)) {
        selected.push(item);
      }
      if (selected.length >= 5) break;
    }
  }

  // Điều chỉnh Sets / Reps / RPE dựa trên thể trạng thực tế của học viên
  const tailoredExercises = selected.slice(0, 6).map((ex, idx) => {
    const sets = isTiredOrRecovery ? Math.max(2, ex.target_sets - 1) : ex.target_sets;
    const reps = isCutting && ex.mechanic === 'Isolation' ? '12-15' : ex.target_reps;
    const rpe = isTiredOrRecovery ? 7 : ex.target_rpe;
    const injuryNote =
      detectedInjuries.length > 0
        ? `Đã tinh chỉnh giảm tải cho: ${detectedInjuries.join(', ')}. ${ex.coaching_tip}`
        : ex.coaching_tip;

    return {
      ...ex,
      phase_title: ex.phase_title || `Bài ${idx + 1}: ${ex.mechanic}`,
      target_sets: sets,
      target_reps: reps,
      target_rpe: rpe,
      coaching_tip: injuryNote,
    };
  });

  const summaryReason =
    detectedInjuries.length > 0
      ? `Giáo án AI đã tự động loại bỏ các bài gây nén khớp (${detectedInjuries.join(', ')}) và điều chỉnh RPE ${isTiredOrRecovery ? '7.0 (Phục hồi)' : '7.5-8.0'} phù hợp thể trạng ${userProfile?.weight || 70}kg.`
      : `Giáo án cá nhân hóa tối ưu cho thể trạng ${userProfile?.weight || 70}kg, chiều cao ${userProfile?.height || 172}cm (Mục tiêu: ${userProfile?.goal || 'Tăng cơ giảm mỡ'}).`;

  return {
    exercises: tailoredExercises,
    detectedInjuries,
    summaryReason,
  };
}

exports.ragContextHandler = async (req, res) => {
  const start = Date.now();
  try {
    const { message = '', userProfile = {} } = req.body;
    const q = message.toLowerCase();

    const allEx = await getExercisesFast();
    const matchedEx = allEx
      .filter((e) => {
        const mg = (e.muscle_group || e.primary_muscle || '').toLowerCase();
        const nm = (e.name || '').toLowerCase();
        return (
          (q.includes('ngực') && (mg.includes('ngực') || mg.includes('chest'))) ||
          (q.includes('lưng') && (mg.includes('lưng') || mg.includes('back'))) ||
          (q.includes('xô') && (mg.includes('xô') || mg.includes('back'))) ||
          (q.includes('chân') && (mg.includes('chân') || mg.includes('đùi') || mg.includes('leg') || mg.includes('quad'))) ||
          (q.includes('vai') && (mg.includes('vai') || mg.includes('shoulder'))) ||
          (q.includes('tay') && (mg.includes('tay') || mg.includes('arm') || mg.includes('bicep'))) ||
          (q.includes('bụng') && (mg.includes('bụng') || mg.includes('core'))) ||
          q.includes(nm)
        );
      })
      .slice(0, 5);

    const finalEx = matchedEx.length > 0 ? matchedEx : allEx.slice(0, 5);
    const matchedFoods = NUTRITION_FAST_TRUTH.filter((f) =>
      f.keys.some((k) => q.includes(k))
    ).map((f) => f.text);

    // Tính toán BMR/TDEE tức thì nếu có số cân nặng
    let mathFact = '';
    const wMatch = message.match(/(\d{2,3})\s*kg/i);
    const w = wMatch ? parseFloat(wMatch[1]) : Number(userProfile?.weight) || 0;
    if (w > 30) {
      const h = Number(userProfile?.height) || 172;
      const age = Number(userProfile?.age) || 24;
      const bmr = Math.round(10 * w + 6.25 * h - 5 * age + 5);
      const tdee = Math.round(bmr * 1.45);
      mathFact = `BMR=${bmr}kcal, TDEE=${tdee}kcal, Giảm mỡ=${tdee - 450}kcal, Tăng cơ=${tdee + 350}kcal, Protein=${Math.round(w * 2.2)}g`;
    }

    const { detectedInjuries } = analyzeInjuryAndMuscleIntent(message, userProfile);
    const injuryRule =
      detectedInjuries.length > 0
        ? `[CẢNH BÁO CHẤN THƯƠNG BẮT BUỘC TUÂN THỦ]: Học viên đang có (${detectedInjuries.join(', ')}). TUYỆT ĐỐI loại bỏ các bài tập gây chèn ép khớp đó và chỉ kê các bài thay thế an toàn cơ sinh học!`
        : '';

    const compactRagPrompt = [
      injuryRule,
      finalEx.length > 0
        ? `[DB Bài tập chuẩn]: ${finalEx.map((e) => `${e.name} (${e.muscle_group || e.primary_muscle || 'Gym'})`).join('; ')}`
        : '',
      matchedFoods.length > 0 ? `[DB Dinh dưỡng]: ${matchedFoods.join(' | ')}` : '',
      mathFact ? `[Toán học Mifflin-St Jeor bắt buộc dùng]: ${mathFact}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return res.json({
      success: true,
      compactRagPrompt,
      meta: {
        latencyMs: Date.now() - start,
        dbExercisesCount: finalEx.length,
        dbExercisesSample: finalEx.slice(0, 3).map((e) => e.name),
        mathVerified: Boolean(mathFact),
        detectedInjuries,
      },
    });
  } catch (err) {
    return res.json({ success: false, compactRagPrompt: '', meta: { latencyMs: 0 } });
  }
};

// Endpoint tự động tạo / điều chỉnh danh sách bài tập từ cuộc hội thoại Chat dựa trên thể trạng & chấn thương
exports.ragAdjustWorkoutHandler = async (req, res) => {
  try {
    const { message = '', aiReply = '', userProfile = {} } = req.body;
    const plan = buildTailoredWorkoutPlan(message, aiReply, userProfile);

    return res.json({
      success: true,
      exercises: plan.exercises,
      detectedInjuries: plan.detectedInjuries,
      summaryReason: plan.summaryReason,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi điều chỉnh lịch tập từ AI Chat: ' + err.message,
    });
  }
};

exports.ragChatHandler = exports.ragContextHandler;
