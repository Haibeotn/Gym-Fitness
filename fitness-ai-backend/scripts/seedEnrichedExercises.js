// scripts/seedEnrichedExercises.js
const pool = require('../config/db');

const enrichedExercises = [
    // ==================== NGỰC (CHEST) ====================
    {
        name: 'Barbell Flat Bench Press (Đẩy ngực tạ đòn ghế ngang)',
        description: 'Vua của các bài tập phát triển toàn bộ cơ ngực, tăng sức mạnh thân trên.',
        mechanic: 'Compound',
        primary_muscle: 'Chest',
        secondary_muscles: ['Triceps', 'Shoulders (Anterior)'],
        equipment_required: ['Barbell', 'Flat Bench', 'Weight Plates'],
        contraindications: ['Chấn thương khớp vai', 'Đau cổ tay nặng'],
        target_sets: 4,
        target_reps: '8-10',
        target_rpe: 8,
        instructions: 'Hạ thanh đòn chạm ngực giữa có kiểm soát, ưỡn ngực ép 2 xương bả vai, đẩy bùng nổ không khóa khớp khuỷu tay.',
        tags: ['Ngực giữa', 'Compound', 'Push', 'Gym', 'Sức mạnh', 'Hypertrophy']
    },
    {
        name: 'Incline Dumbbell Press (Đẩy ngực tạ đơn ghế dốc lên)',
        description: 'Tập trung tối đa vào phần ngực trên (Clavicular Head) và cân bằng độ đều 2 bên.',
        mechanic: 'Compound',
        primary_muscle: 'Chest',
        secondary_muscles: ['Triceps', 'Shoulders (Anterior)'],
        equipment_required: ['Dumbbell', 'Incline Bench'],
        contraindications: ['Đau khớp vai trước'],
        target_sets: 3,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Ghế dốc 30-45 độ. Hạ tạ sang 2 bên ngực trên đến khi cảm nhận độ căng sâu, ép ngực khi đẩy lên.',
        tags: ['Ngực trên', 'Compound', 'Push', 'Gym', 'Home', 'Dumbbell']
    },
    {
        name: 'Standard Push-Up (Hít đất tiêu chuẩn)',
        description: 'Bài tập thể trọng kinh điển phát triển ngực, vai và độ ổn định toàn thân.',
        mechanic: 'Compound',
        primary_muscle: 'Chest',
        secondary_muscles: ['Triceps', 'Core', 'Shoulders'],
        equipment_required: [],
        contraindications: ['Chấn thương cổ tay'],
        target_sets: 4,
        target_reps: '15-20',
        target_rpe: 8,
        instructions: 'Giữ thân người thẳng như tấm ván, siết chặt cơ bụng và mông, hạ ngực gần sát sàn rồi đẩy thẳng.',
        tags: ['Ngực', 'Bodyweight', 'Home', 'Calisthenics', 'Outdoor', 'Full Body']
    },
    {
        name: 'Chest Dips (Chống xà kép tập ngực dưới)',
        description: 'Xây dựng khối cơ ngực dưới dày dặn và độ sắc nét đường viền ngực.',
        mechanic: 'Compound',
        primary_muscle: 'Chest',
        secondary_muscles: ['Triceps', 'Shoulders (Anterior)'],
        equipment_required: ['Dip Station / Parallel Bars'],
        contraindications: ['Khớp vai lỏng lẻo', 'Viêm gân vai'],
        target_sets: 3,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Hơi đổ người về phía trước 30 độ, cùi chỏ mở rộng sang 2 bên, hạ sâu đến góc 90 độ rồi đẩy lên.',
        tags: ['Ngực dưới', 'Compound', 'Calisthenics', 'Gym', 'Outdoor', 'Bodyweight']
    },
    {
        name: 'Resistance Band Chest Fly (Ép ngực với dây kháng lực)',
        description: 'Kích hoạt cơ ngực cô lập hoàn hảo tại nhà hoặc khi đi du lịch.',
        mechanic: 'Isolation',
        primary_muscle: 'Chest',
        secondary_muscles: ['Shoulders (Anterior)'],
        equipment_required: ['Resistance Bands'],
        contraindications: [],
        target_sets: 3,
        target_reps: '15-20',
        target_rpe: 7,
        instructions: 'Cố định dây phía sau, 2 tay dang rộng hình cánh cung rồi ép lại phía trước ngực, giữ 1 giây ở điểm co cơ đỉnh.',
        tags: ['Ngực', 'Isolation', 'Home', 'Resistance Band', 'Pump cơ']
    },
    {
        name: 'Cable Crossover (Kéo cáp ép ngực)',
        description: 'Duy trì lực căng liên tục suốt toàn bộ biên độ chuyển động để bơm máu tối đa.',
        mechanic: 'Isolation',
        primary_muscle: 'Chest',
        secondary_muscles: ['Shoulders'],
        equipment_required: ['Cable Machine'],
        contraindications: [],
        target_sets: 3,
        target_reps: '12-15',
        target_rpe: 8,
        instructions: 'Bước 1 chân lên trước giữ thăng bằng, kéo 2 tay cáp chéo nhau phía trước ngực, cảm nhận cơ ngực thắt chặt.',
        tags: ['Ngực', 'Isolation', 'Cable', 'Gym', 'Pump cơ']
    },

    // ==================== LƯNG & XÔ (BACK & LATS) ====================
    {
        name: 'Wide-Grip Pull-Up (Hít xà đơn tay rộng)',
        description: 'Bài tập số 1 xây dựng độ rộng lưng xô hình chữ V (V-Taper).',
        mechanic: 'Compound',
        primary_muscle: 'Lats',
        secondary_muscles: ['Biceps', 'Upper Back', 'Forearms'],
        equipment_required: ['Pull-Up Bar'],
        contraindications: ['Đau khớp khuỷu tay'],
        target_sets: 4,
        target_reps: '8-12',
        target_rpe: 8,
        instructions: 'Cầm xà rộng hơn vai, kéo ngực hướng lên thanh xà, tập trung dùng cơ xô kéo cùi chỏ xuống sườn.',
        tags: ['Lưng xô', 'V-Taper', 'Compound', 'Pull', 'Calisthenics', 'Gym', 'Home', 'Outdoor']
    },
    {
        name: 'Bent-Over Barbell Row (Kéo tạ đòn gập người)',
        description: 'Xây dựng độ dày ấn tượng cho toàn bộ phần lưng trên và lưng giữa.',
        mechanic: 'Compound',
        primary_muscle: 'Back',
        secondary_muscles: ['Lats', 'Biceps', 'Lower Back', 'Hamstrings'],
        equipment_required: ['Barbell', 'Weight Plates'],
        contraindications: ['Thoát vị đĩa đệm', 'Đau lưng dưới cấp'],
        target_sets: 4,
        target_reps: '8-10',
        target_rpe: 8,
        instructions: 'Gập hông 45 độ, lưng giữ thẳng tự nhiên, kéo thanh đòn chạm bụng dưới và siết 2 bả vai lại.',
        tags: ['Lưng giữa', 'Độ dày cơ lưng', 'Compound', 'Pull', 'Gym', 'Barbell']
    },
    {
        name: 'Single-Arm Dumbbell Row (Kéo tạ đơn 1 tay tựa ghế)',
        description: 'Khắc phục lệch cơ lưng, kéo sâu biên độ và an toàn cho cột sống.',
        mechanic: 'Compound',
        primary_muscle: 'Back',
        secondary_muscles: ['Lats', 'Biceps'],
        equipment_required: ['Dumbbell', 'Flat Bench'],
        contraindications: [],
        target_sets: 3,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Một tay chống ghế, lưng phẳng song song mặt sàn. Kéo tạ đơn hướng về phía hông, ép xô tối đa.',
        tags: ['Lưng xô', 'Compound', 'Pull', 'Gym', 'Home', 'Dumbbell']
    },
    {
        name: 'Lat Pulldown (Kéo cáp xô xuôi mặt)',
        description: 'Lựa chọn thay thế xà đơn tuyệt vời để cô lập và kiểm soát kích hoạt cơ xô.',
        mechanic: 'Compound',
        primary_muscle: 'Lats',
        secondary_muscles: ['Biceps', 'Rear Delts'],
        equipment_required: ['Cable Machine', 'Lat Pulldown Bar'],
        contraindications: [],
        target_sets: 4,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Hơi ngả người 15 độ, kéo thanh xà về phía xương quai xanh, ép chặt cùi chỏ xuống dưới.',
        tags: ['Lưng xô', 'Compound', 'Cable', 'Gym', 'Hypertrophy']
    },
    {
        name: 'Inverted Row / Australian Pull-Up (Kéo xà nghiêng tại nhà/công viên)',
        description: 'Bài kéo lưng thể trọng an toàn, phù hợp từ người mới đến nâng cao.',
        mechanic: 'Compound',
        primary_muscle: 'Back',
        secondary_muscles: ['Biceps', 'Core'],
        equipment_required: ['Pull-Up Bar'],
        contraindications: [],
        target_sets: 3,
        target_reps: '12-15',
        target_rpe: 7,
        instructions: 'Nằm dưới thanh xà ngang ngang ngực, gót chân chạm đất, kéo ngực chạm thanh xà.',
        tags: ['Lưng', 'Calisthenics', 'Home', 'Outdoor', 'Bodyweight']
    },
    {
        name: 'Doorframe / Towel Row (Kéo lưng bằng khăn hoặc khung cửa tại nhà)',
        description: 'Bài tập lưng siêu tiện lợi không cần bất kỳ dụng cụ tạ nào khi ở nhà.',
        mechanic: 'Compound',
        primary_muscle: 'Back',
        secondary_muscles: ['Biceps'],
        equipment_required: [],
        contraindications: [],
        target_sets: 4,
        target_reps: '15-20',
        target_rpe: 7,
        instructions: 'Vắt khăn qua tay nắm cửa hoặc ôm khung cửa, ngả người ra sau và dùng sức kéo lưng để kéo người lại gần.',
        tags: ['Lưng', 'Home', 'Bodyweight', 'No Equipment']
    },

    // ==================== VAI (SHOULDERS) ====================
    {
        name: 'Overhead Barbell Military Press (Đẩy tạ đòn qua đầu đứng)',
        description: 'Tạo nền tảng sức mạnh đẩy qua đầu và bờ vai vạm vỡ.',
        mechanic: 'Compound',
        primary_muscle: 'Shoulders',
        secondary_muscles: ['Triceps', 'Upper Chest', 'Core'],
        equipment_required: ['Barbell', 'Weight Plates'],
        contraindications: ['Đau cổ vai gáy', 'Đau lưng dưới nặng'],
        target_sets: 4,
        target_reps: '6-8',
        target_rpe: 8,
        instructions: 'Đứng vững, siết bụng và cơ mông, đẩy tạ thẳng qua đầu đến khi khóa tay tự nhiên trên đỉnh đầu.',
        tags: ['Vai trước', 'Compound', 'Push', 'Gym', 'Sức mạnh']
    },
    {
        name: 'Dumbbell Lateral Raise (Dang tạ đơn sang 2 bên - Vai 3D)',
        description: 'Chìa khóa mở rộng bề ngang bờ vai tạo hiệu ứng eo thon vai rộng.',
        mechanic: 'Isolation',
        primary_muscle: 'Shoulders',
        secondary_muscles: ['Traps'],
        equipment_required: ['Dumbbell'],
        contraindications: ['Kẹt khớp vai (Impingement)'],
        target_sets: 4,
        target_reps: '12-15',
        target_rpe: 8,
        instructions: 'Khuỷu tay hơi cong nhẹ, nâng tạ sang ngang đến song song mặt sàn, dẫn động bằng cùi chỏ.',
        tags: ['Vai giữa', 'Vai 3D', 'Isolation', 'Gym', 'Home', 'Dumbbell']
    },
    {
        name: 'Pike Push-Up (Hít đất góc nhọn tập vai)',
        description: 'Bài tập vai thể trọng tốt nhất tại nhà để chuẩn bị cho Handstand Push-up.',
        mechanic: 'Compound',
        primary_muscle: 'Shoulders',
        secondary_muscles: ['Triceps', 'Core'],
        equipment_required: [],
        contraindications: ['Chấn thương cổ tay'],
        target_sets: 3,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Đẩy hông lên cao tạo hình chữ V ngược, hạ đầu hướng về phía trước giữa 2 bàn tay rồi đẩy lên.',
        tags: ['Vai', 'Bodyweight', 'Home', 'Calisthenics', 'Outdoor']
    },
    {
        name: 'Face Pull with Cable / Band (Kéo dây cáp mặt - Vai sau & Chỉnh tư thế)',
        description: 'Bài tập vàng phòng ngừa gù lưng, mở rộng lồng ngực và phát triển cơ vai sau.',
        mechanic: 'Isolation',
        primary_muscle: 'Shoulders',
        secondary_muscles: ['Upper Back', 'Rotator Cuff'],
        equipment_required: ['Cable Machine', 'Rope Attachment'],
        contraindications: [],
        target_sets: 3,
        target_reps: '15-20',
        target_rpe: 7,
        instructions: 'Kéo dây thừng về phía trán, xoay ngoài cổ tay sao cho cùi chỏ cao hơn bàn tay ở cuối động tác.',
        tags: ['Vai sau', 'Phục hồi tư thế', 'Isolation', 'Gym', 'Cable']
    },
    {
        name: 'Resistance Band Lateral Raise (Dang vai dây kháng lực)',
        description: 'Tạo áp lực căng liên tục lên bó cơ vai giữa tại nhà.',
        mechanic: 'Isolation',
        primary_muscle: 'Shoulders',
        secondary_muscles: [],
        equipment_required: ['Resistance Bands'],
        contraindications: [],
        target_sets: 3,
        target_reps: '15-20',
        target_rpe: 8,
        instructions: 'Dẫm chân lên dây, 2 tay cầm 2 đầu dây dang sang ngang với nhịp độ kiểm soát chậm rãi.',
        tags: ['Vai giữa', 'Home', 'Resistance Band', 'Isolation']
    },

    // ==================== TAY TRƯỚC & TAY SAU (ARMS) ====================
    {
        name: 'Standing Barbell Bicep Curl (Cuốn tạ đòn tay trước)',
        description: 'Xây dựng khối lượng và độ dày cơ tay trước (Biceps).',
        mechanic: 'Isolation',
        primary_muscle: 'Biceps',
        secondary_muscles: ['Forearms'],
        equipment_required: ['Barbell', 'EZ-Bar'],
        contraindications: ['Viêm gân cổ tay'],
        target_sets: 3,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Khóa chặt cùi chỏ sát sườn, cuộn tạ lên siết bắp tay 1 giây ở đỉnh, hạ từ từ trong 3 giây.',
        tags: ['Tay trước', 'Biceps', 'Isolation', 'Gym', 'Barbell']
    },
    {
        name: 'Incline Dumbbell Curl (Cuốn tạ đơn ghế dốc nằm)',
        description: 'Kéo căng dài đầu dài cơ nhị đầu (Long Head) tạo đỉnh bắp tay cao vút.',
        mechanic: 'Isolation',
        primary_muscle: 'Biceps',
        secondary_muscles: ['Forearms'],
        equipment_required: ['Dumbbell', 'Incline Bench'],
        contraindications: [],
        target_sets: 3,
        target_reps: '12-15',
        target_rpe: 8,
        instructions: 'Ngồi tựa lưng ghế dốc 45-60 độ, buông lỏng cánh tay thẳng đứng và cuộn tạ xoay ngửa cổ tay.',
        tags: ['Tay trước', 'Đỉnh bắp tay', 'Isolation', 'Gym', 'Dumbbell']
    },
    {
        name: 'Tricep Rope Cable Pushdown (Kéo cáp dây thừng tay sau)',
        description: 'Tách biệt rõ rệt 3 đầu cơ tay sau tạo hình móng ngựa (Horseshoe Triceps).',
        mechanic: 'Isolation',
        primary_muscle: 'Triceps',
        secondary_muscles: [],
        equipment_required: ['Cable Machine', 'Rope Attachment'],
        contraindications: ['Đau khuỷu tay'],
        target_sets: 4,
        target_reps: '12-15',
        target_rpe: 8,
        instructions: 'Giữ cố định cùi chỏ bên sườn, duỗi thẳng tay xuống dưới và tách 2 đầu dây thừng sang 2 bên.',
        tags: ['Tay sau', 'Triceps', 'Isolation', 'Gym', 'Cable']
    },
    {
        name: 'Diamond Push-Up (Hít đất kim cương tay sau tại nhà)',
        description: 'Bài tập thể trọng cực nặng ép toàn bộ lực vào đầu trong cơ tay sau.',
        mechanic: 'Compound',
        primary_muscle: 'Triceps',
        secondary_muscles: ['Chest (Inner)', 'Shoulders'],
        equipment_required: [],
        contraindications: ['Đau cổ tay'],
        target_sets: 3,
        target_reps: '12-15',
        target_rpe: 8,
        instructions: 'Đặt 2 bàn tay chụm lại hình thoi (kim cương) dưới ngực, hạ thân người chậm rồi đẩy thẳng tay.',
        tags: ['Tay sau', 'Bodyweight', 'Home', 'Calisthenics', 'Outdoor']
    },
    {
        name: 'Bench Dips (Nhún tay sau trên ghế tại nhà / gym)',
        description: 'Dễ thực hiện ở bất kỳ đâu với ghế sofa, bậc thang hoặc ghế tập.',
        mechanic: 'Compound',
        primary_muscle: 'Triceps',
        secondary_muscles: ['Shoulders (Anterior)'],
        equipment_required: ['Flat Bench'],
        contraindications: ['Chấn thương khớp vai'],
        target_sets: 3,
        target_reps: '15-20',
        target_rpe: 7,
        instructions: 'Chống 2 tay lên mép ghế phía sau, hạ hông vuông góc 90 độ cùi chỏ rồi đẩy người lên.',
        tags: ['Tay sau', 'Home', 'Gym', 'Bench', 'Bodyweight']
    },

    // ==================== CHÂN & ĐÙI (LEGS & GLUTES) ====================
    {
        name: 'Barbell Back Squat (Gánh tạ đòn ngồi xổm)',
        description: 'Vua của các bài tập hạ thân, kích hoạt tối đa đùi trước, mông và sức mạnh bùng nổ.',
        mechanic: 'Compound',
        primary_muscle: 'Quadriceps',
        secondary_muscles: ['Glutes', 'Hamstrings', 'Core', 'Lower Back'],
        equipment_required: ['Barbell', 'Squat Rack', 'Weight Plates'],
        contraindications: ['Đau khớp gối nặng', 'Thoát vị đĩa đệm'],
        target_sets: 4,
        target_reps: '8-10',
        target_rpe: 8,
        instructions: 'Chân rộng bằng vai, mũi chân mở nhẹ. Hít sâu gồng core, đẩy hông ra sau và hạ đùi song song mặt sàn.',
        tags: ['Đùi trước', 'Chân mông', 'Compound', 'Gym', 'Barbell', 'Sức mạnh']
    },
    {
        name: 'Dumbbell Bulgarian Split Squat (Squat 1 chân gác ghế)',
        description: 'Bài tập cô lập 1 chân tuyệt đỉnh giúp săn chắc đùi trước, nâng cao cơ mông và sửa lệch chân.',
        mechanic: 'Compound',
        primary_muscle: 'Quadriceps',
        secondary_muscles: ['Glutes', 'Hamstrings', 'Calves'],
        equipment_required: ['Dumbbell', 'Flat Bench'],
        contraindications: ['Đau bánh chè gối'],
        target_sets: 3,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Gác 1 mu bàn chân lên ghế phía sau, hạ gối sau chạm gần sát sàn với thân người hơi đổ về trước.',
        tags: ['Đùi trước', 'Mông', 'Compound', 'Gym', 'Home', 'Dumbbell']
    },
    {
        name: 'Romanian Deadlift (RDL - Kéo tạ đùi sau & Mông)',
        description: 'Kéo dãn và phát triển sợi cơ đùi sau (Hamstrings) cùng mông tròn đầy đặn.',
        mechanic: 'Compound',
        primary_muscle: 'Hamstrings',
        secondary_muscles: ['Glutes', 'Lower Back'],
        equipment_required: ['Barbell', 'Dumbbell', 'Weight Plates'],
        contraindications: ['Đau lưng dưới cấp tính'],
        target_sets: 4,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Gối hơi chùng nhẹ cố định, đẩy hông ra sau tối đa như muốn chạm tường, hạ tạ qua gối rồi siết mông đứng lên.',
        tags: ['Đùi sau', 'Mông', 'Compound', 'Gym', 'Home', 'Deadlift']
    },
    {
        name: 'Bodyweight Air Squat (Squat tự do không tạ)',
        description: 'Luyện tập form chân căn bản, đốt calo và an toàn cho người mới bắt đầu tại nhà.',
        mechanic: 'Compound',
        primary_muscle: 'Quadriceps',
        secondary_muscles: ['Glutes', 'Calves'],
        equipment_required: [],
        contraindications: [],
        target_sets: 4,
        target_reps: '20-25',
        target_rpe: 7,
        instructions: 'Đứng thẳng, 2 tay chắp trước ngực, hạ hông có kiểm soát và giữ lưng thẳng.',
        tags: ['Đùi trước', 'Chân', 'Bodyweight', 'Home', 'Outdoor', 'No Equipment']
    },
    {
        name: 'Leg Press 45 Độ (Đạp đùi máy khối)',
        description: 'Tập chân với khối lượng nặng mà không tạo áp lực nén lên cột sống.',
        mechanic: 'Compound',
        primary_muscle: 'Quadriceps',
        secondary_muscles: ['Glutes', 'Hamstrings'],
        equipment_required: ['Leg Press Machine'],
        contraindications: [],
        target_sets: 4,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Đặt chân giữa bàn đạp, hạ máy chậm rãi đến khi gối gập 90 độ, đạp lên không khóa cứng khớp gối.',
        tags: ['Đùi trước', 'Machine', 'Gym', 'Thân thiện với lưng']
    },
    {
        name: 'Standing Calf Raise (Nhón bắp chân đứng)',
        description: 'Tạo độ săn chắc và đường nét khỏe khoắn cho bắp chân (Gastrocnemius).',
        mechanic: 'Isolation',
        primary_muscle: 'Calves',
        secondary_muscles: [],
        equipment_required: ['Dumbbell'],
        contraindications: ['Viêm gân gót Achilles'],
        target_sets: 4,
        target_reps: '15-20',
        target_rpe: 8,
        instructions: 'Đứng trên mép bục hoặc sàn phẳng, nhón hết cỡ giữ 1 giây trên đỉnh rồi hạ gót chân xuống sâu.',
        tags: ['Bắp chân', 'Calves', 'Isolation', 'Gym', 'Home', 'Outdoor']
    },

    // ==================== MÔNG (GLUTES) ====================
    {
        name: 'Barbell Hip Thrust (Đẩy hông tạ đòn tựa ghế - Vua bài Mông)',
        description: 'Bài tập kích hoạt sợi cơ mông lớn mạnh nhất, xây dựng cơ mông căng tròn không to đùi.',
        mechanic: 'Compound',
        primary_muscle: 'Glutes',
        secondary_muscles: ['Hamstrings', 'Core'],
        equipment_required: ['Barbell', 'Flat Bench', 'Hip Thrust Pad'],
        contraindications: [],
        target_sets: 4,
        target_reps: '10-12',
        target_rpe: 8,
        instructions: 'Tựa lưng trên vào mép ghế, thanh đòn đặt ngang hông có đệm. Đẩy hông lên cao ngang bằng thân người, siết mông 2 giây.',
        tags: ['Mông', 'Glutes', 'Compound', 'Gym', 'Barbell', 'Booty Builder']
    },
    {
        name: 'Glute Bridge with Band (Cầu mông với dây mini band tại nhà)',
        description: 'Kích hoạt toàn bộ cơ mông lớn và mông nhỡ tại nhà cực kỳ êm ái.',
        mechanic: 'Isolation',
        primary_muscle: 'Glutes',
        secondary_muscles: ['Hamstrings'],
        equipment_required: ['Resistance Bands', 'Yoga Mat'],
        contraindications: [],
        target_sets: 4,
        target_reps: '15-20',
        target_rpe: 7,
        instructions: 'Nằm ngửa đeo dây trên gối, mở gối sang 2 bên và nâng hông siết chặt cơ mông trên đỉnh.',
        tags: ['Mông', 'Home', 'Resistance Band', 'Bodyweight', 'Isolation']
    },

    // ==================== BỤNG & CORE (ABS & CORE) ====================
    {
        name: 'Hanging Leg Raise (Treo người co gối / nâng chân trên xà)',
        description: 'Đánh tan mỡ bụng dưới và xây dựng múi bụng sắc nét, khỏe khoắn.',
        mechanic: 'Isolation',
        primary_muscle: 'Core',
        secondary_muscles: ['Hip Flexors', 'Forearms'],
        equipment_required: ['Pull-Up Bar'],
        contraindications: ['Đau lưng dưới'],
        target_sets: 4,
        target_reps: '12-15',
        target_rpe: 8,
        instructions: 'Treo người trên xà, cuộn xương chậu nâng chân hoặc đầu gối lên sát ngực, không đung đưa theo đà.',
        tags: ['Bụng dưới', 'Core', 'Six Pack', 'Calisthenics', 'Gym', 'Outdoor', 'Pull-Up Bar']
    },
    {
        name: 'Elbow Plank (Plank khuỷu tay gồng cơ trọng tâm)',
        description: 'Gia cố sức mạnh đai cơ core bảo vệ cột sống và phẳng lì vòng eo.',
        mechanic: 'Isometric',
        primary_muscle: 'Core',
        secondary_muscles: ['Glutes', 'Shoulders'],
        equipment_required: ['Yoga Mat'],
        contraindications: [],
        target_sets: 3,
        target_reps: '45-60 giây',
        target_rpe: 8,
        instructions: 'Chống khuỷu tay vuông góc, rút rốn vào trong, siết chặt cơ mông và đùi tạo thành đường thẳng tắp.',
        tags: ['Bụng & Core', 'Isometric', 'Home', 'Calisthenics', 'No Equipment', 'Six Pack']
    },
    {
        name: 'Cable Woodchopper (Kéo cáp chéo chặt cây - Cơ liên sườn)',
        description: 'Tạo rãnh cơ bụng số 11 và sức mạnh xoay thân thể thao.',
        mechanic: 'Isolation',
        primary_muscle: 'Core',
        secondary_muscles: ['Obliques', 'Shoulders'],
        equipment_required: ['Cable Machine'],
        contraindications: [],
        target_sets: 3,
        target_reps: '15 mỗi bên',
        target_rpe: 7,
        instructions: 'Kéo dây cáp từ góc cao chéo xuống hông đối diện, xoay thân người và siết chặt cơ liên sườn.',
        tags: ['Cơ liên sườn', 'Bụng', 'Cable', 'Gym', 'Eo thon']
    },
    {
        name: 'Bicycle Crunch (Gập bụng đạp xe đốt mỡ múi bụng)',
        description: 'Bài tập bụng trên thảm tại nhà tác động toàn diện bụng trên, dưới và liên sườn.',
        mechanic: 'Isolation',
        primary_muscle: 'Core',
        secondary_muscles: ['Obliques'],
        equipment_required: [],
        contraindications: [],
        target_sets: 3,
        target_reps: '20-25',
        target_rpe: 8,
        instructions: 'Nằm ngửa, lần lượt đưa cùi chỏ chạm vào đầu gối chân đối diện theo chuyển động đạp xe nhịp nhàng.',
        tags: ['Bụng', 'Home', 'Bodyweight', 'No Equipment', 'Six Pack']
    },

    // ==================== TOÀN THÂN / CARDIO / HIIT ====================
    {
        name: 'Burpees (Nhảy bật cóc hít đất toàn thân)',
        description: 'Đốt cháy calo điên cuồng, kích hoạt tim mạch và tăng sức bền không giới hạn.',
        mechanic: 'Compound',
        primary_muscle: 'Full Body',
        secondary_muscles: ['Chest', 'Quadriceps', 'Core', 'Cardio'],
        equipment_required: [],
        contraindications: ['Bệnh tim mạch nặng', 'Đau khớp gối'],
        target_sets: 4,
        target_reps: '15-20',
        target_rpe: 9,
        instructions: 'Từ tư thế đứng, hạ tay xuống sàn bật chân về sau thành hít đất, bật chân lại và nhảy cao vỗ tay.',
        tags: ['Full Body', 'HIIT', 'Cardio đốt mỡ', 'Home', 'Outdoor', 'Calisthenics']
    },
    {
        name: 'Kettlebell Swing (Vung tạ ấm chuông đẩy hông)',
        description: 'Xây dựng sức mạnh bùng nổ chuỗi cơ sau và đốt mỡ thừa tốc độ cao.',
        mechanic: 'Compound',
        primary_muscle: 'Full Body',
        secondary_muscles: ['Glutes', 'Hamstrings', 'Core', 'Shoulders'],
        equipment_required: ['Kettlebell', 'Dumbbell'],
        contraindications: ['Đau lưng dưới'],
        target_sets: 4,
        target_reps: '15-20',
        target_rpe: 8,
        instructions: 'Dùng lực bung hông mạnh mẽ để đẩy tạ ấm bay lên ngang ngực, không dùng tay nâng tạ.',
        tags: ['Full Body', 'HIIT', 'Power', 'Gym', 'Home', 'Kettlebell']
    },
    {
        name: 'Mountain Climbers (Leo núi tại chỗ)',
        description: 'Tăng nhịp tim, săn chắc cơ bụng dưới và đốt năng lượng hiệu quả.',
        mechanic: 'Compound',
        primary_muscle: 'Core',
        secondary_muscles: ['Shoulders', 'Cardio'],
        equipment_required: [],
        contraindications: [],
        target_sets: 3,
        target_reps: '30-45 giây',
        target_rpe: 8,
        instructions: 'Ở tư thế chống đẩy cao tay, lần lượt kéo nhanh gối về phía ngực như đang chạy leo dốc.',
        tags: ['Bụng', 'Cardio', 'HIIT', 'Home', 'Outdoor', 'No Equipment']
    }
];

async function seedExercises() {
    try {
        console.log('🔄 Đang làm giàu kho bài tập AI (Ngực, Lưng, Vai, Tay, Chân, Mông, Bụng, Full Body, Gym, Home, Calisthenics)...');

        // Thêm cột tags và instructions nếu chưa có
        await pool.query(`
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_sets INT DEFAULT 3;
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_reps VARCHAR(50) DEFAULT '10-12';
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_rpe INT DEFAULT 8;
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions TEXT;
            ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tags TEXT[];
        `);

        for (const ex of enrichedExercises) {
            // Kiểm tra xem bài tập đã tồn tại chưa theo tên
            const check = await pool.query('SELECT id FROM exercises WHERE name ILIKE $1', [ex.name]);
            if (check.rows.length === 0) {
                await pool.query(`
                    INSERT INTO exercises (
                        name, description, mechanic, primary_muscle, secondary_muscles,
                        equipment_required, contraindications, target_sets, target_reps,
                        target_rpe, instructions, tags
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    ex.name, ex.description, ex.mechanic, ex.primary_muscle, ex.secondary_muscles,
                    ex.equipment_required, ex.contraindications, ex.target_sets, ex.target_reps,
                    ex.target_rpe, ex.instructions, ex.tags
                ]);
            } else {
                // Cập nhật thông tin chi tiết và tags
                await pool.query(`
                    UPDATE exercises SET
                        description = $2,
                        mechanic = $3,
                        primary_muscle = $4,
                        secondary_muscles = $5,
                        equipment_required = $6,
                        contraindications = $7,
                        target_sets = $8,
                        target_reps = $9,
                        target_rpe = $10,
                        instructions = $11,
                        tags = $12
                    WHERE id = $1
                `, [
                    check.rows[0].id,
                    ex.description, ex.mechanic, ex.primary_muscle, ex.secondary_muscles,
                    ex.equipment_required, ex.contraindications, ex.target_sets, ex.target_reps,
                    ex.target_rpe, ex.instructions, ex.tags
                ]);
            }
        }

        const totalRes = await pool.query('SELECT count(*) FROM exercises');
        console.log(`✅ Hoàn tất làm giàu kho bài tập! Tổng số bài tập hiện tại trong DB: ${totalRes.rows[0].count}`);
    } catch (err) {
        console.error('❌ Lỗi seed kho bài tập:', err);
    } finally {
        pool.end();
    }
}

seedExercises();
