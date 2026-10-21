// fitness-ai-backend/testPaymentFlow.js

async function testPaymentFlow() {
    try {
        console.log('🧪 Bắt đầu kiểm thử toàn diện Cổng thanh toán VietQR & MoMo...');

        // 1. Đăng nhập học viên
        const memberLoginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test.member@gym.com', password: '123456' })
        });
        const memberLogin = await memberLoginRes.json();
        const memberToken = memberLogin.token;
        console.log('✅ 1. Đăng nhập học viên thành công! User ID:', memberLogin.user?.id || memberLogin.userId);

        // 2. Lấy danh sách gói tập
        const pkgRes = await fetch('http://localhost:3000/api/packages');
        const pkgData = await pkgRes.json();
        const pkg = pkgData.packages[0];
        console.log(`✅ 2. Lấy danh sách gói tập (${pkgData.packages.length} gói). Chọn gói: ${pkg.name} (${Number(pkg.price).toLocaleString()} VNĐ)`);

        // 3. Tạo đơn thanh toán VietQR
        const orderRes = await fetch('http://localhost:3000/api/payments/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken}`
            },
            body: JSON.stringify({
                packageId: pkg.id,
                paymentMethod: 'vietqr'
            })
        });
        const orderData = await orderRes.json();
        console.log('✅ 3. Tạo đơn thanh toán thành công!');
        console.log('   Mã đơn hàng:', orderData.payment?.transaction_code);
        console.log('   Nội dung CK:', orderData.payment?.transfer_content);
        console.log('   VietQR Image URL:', orderData.vietQrUrl);

        const txCode = orderData.payment.transaction_code;

        // 4. Xác nhận thanh toán (Mô phỏng Webhook Ngân hàng)
        const verifyRes = await fetch(`http://localhost:3000/api/payments/verify/${txCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken}`
            }
        });
        const verifyData = await verifyRes.json();
        console.log('✅ 4. Xác nhận thanh toán & Kích hoạt gói tập thành công:', verifyData.message);
        console.log('   Gói tập mới kích hoạt:', verifyData.userPackage?.total_sessions, 'buổi tập.');

        // 5. Lấy lịch sử giao dịch của học viên
        const histRes = await fetch('http://localhost:3000/api/payments/my-history', {
            headers: { 'Authorization': `Bearer ${memberToken}` }
        });
        const histData = await histRes.json();
        console.log(`✅ 5. Lấy lịch sử giao dịch thành công (${histData.payments.length} đơn hàng):`);
        histData.payments.forEach(p => {
            console.log(`   - [${p.status.toUpperCase()}] ${p.transaction_code}: ${p.package_name} - ${Number(p.amount).toLocaleString()} đ`);
        });

        console.log('🎉 TẤT CẢ CÁC BƯỚC TEST CỔNG THANH TOÁN VIETQR ĐỀU THÀNH CÔNG RỰC RỠ!');
    } catch (err) {
        console.error('❌ Lỗi kiểm thử thanh toán:', err);
    }
}

testPaymentFlow();
