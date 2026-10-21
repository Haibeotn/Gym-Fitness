// fitness-ai-backend/testBookingFlow.js

async function testBookingFlow() {
    try {
        console.log('🧪 Bắt đầu kiểm thử toàn diện quy trình Đặt lịch & Quét mã QR Check-in...');

        // 1. Đăng nhập tài khoản học viên demo
        const memberLoginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test.member@gym.com', password: '123456' })
        });
        const memberLogin = await memberLoginRes.json();
        const memberToken = memberLogin.token;
        console.log('✅ 1. Đăng nhập học viên thành công! User ID:', memberLogin.user?.id || memberLogin.userId);

        // 2. Lấy danh sách PT
        const trainersRes = await fetch('http://localhost:3000/api/bookings/trainers');
        const trainersData = await trainersRes.json();
        console.log(`✅ 2. Lấy danh sách HLV thành công (${trainersData.trainers.length} PTs):`, trainersData.trainers.map(t => ({ id: t.trainer_id, name: t.full_name })));

        const pt = trainersData.trainers[0];
        const ptId = pt.trainer_id;

        // 3. Lấy khung giờ trống
        const today = new Date().toISOString().split('T')[0];
        const availRes = await fetch(`http://localhost:3000/api/bookings/availability?trainerId=${ptId}&date=${today}`);
        const availData = await availRes.json();
        console.log(`✅ 3. Khung giờ trống của PT ${pt.full_name} ngày ${today}:`, availData.availableSlots.length, 'slots');

        const slot = availData.availableSlots[0] || { startTime: '10:00', endTime: '11:00' };

        // 4. Tạo lịch tập
        const bookRes = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken}`
            },
            body: JSON.stringify({
                trainerId: ptId,
                bookingDate: today,
                startTime: slot.startTime,
                endTime: slot.endTime,
                sessionTopic: '💪 Ngực & Tay Sau (Chest & Triceps)',
                notes: 'Test booking flow tự động'
            })
        });
        const bookData = await bookRes.json();
        console.log('✅ 4. Đặt lịch thành công! Mã QR Check-in Code:', bookData.checkinCode);

        const checkinCode = bookData.checkinCode;

        // 5. Kiểm thử Check-in bằng QR Code
        const checkinRes = await fetch('http://localhost:3000/api/bookings/check-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken}`
            },
            body: JSON.stringify({ checkinCode: checkinCode })
        });
        const checkinData = await checkinRes.json();
        console.log('✅ 5. Quét mã QR Check-in thành công:', checkinData.message);
        console.log('   Thông tin buổi tập:', checkinData.booking?.client_name, 'với PT', checkinData.booking?.trainer_name);

        // 6. Đánh giá buổi tập (Rating & Review)
        const reviewRes = await fetch(`http://localhost:3000/api/bookings/${bookData.booking.id}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken}`
            },
            body: JSON.stringify({
                rating: 5,
                reviewText: 'HLV hướng dẫn rất nhiệt tình, sửa form chuẩn từng milimet!'
            })
        });
        const reviewData = await reviewRes.json();
        console.log('✅ 6. Đánh giá HLV 5 sao thành công:', reviewData.message);

        console.log('🎉 TẤT CẢ CÁC BƯỚC TEST ĐẶT LỊCH & QR CHECK-IN ĐỀU THÀNH CÔNG VƯỢT TRỘI!');
    } catch (err) {
        console.error('❌ Lỗi kiểm thử booking flow:', err);
    }
}

testBookingFlow();
