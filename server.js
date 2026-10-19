const express = require('express');
const cors = require('cors');
const speakeasy = require('speakeasy');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// مفتاحك السري الثابت
const mySecretKey = "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS";

// بيانات الحساب الثابتة التي ستظهر لجميع العملاء فوق زر الاستلام
const accountDetails = {
    email: "xbgxbg1234+JI90@gmail.com",
    password: "6OB123123@123"
};

// إنشـاء الـ 20 رابطاً (من 1001 إلى 1020) ولكل رابط 3 محاولات خاصة به
const ordersDatabase = {};
for (let i = 1001; i <= 1020; i++) {
    ordersDatabase[i.toString()] = {
        account: accountDetails,
        secret: mySecretKey,
        remainingAttempts: 3
    };
}

// 1. جلب معلومات الحساب عند فتح الرابط
app.post('/api/get-order-info', (req, res) => {
    const { orderId } = req.body;
    const order = ordersDatabase[orderId];

    if (!order) {
        return res.status(404).json({ success: false, message: 'رقم الطلب غير صحيح أو غير موجود.' });
    }

    if (order.remainingAttempts <= 0) {
        return res.status(400).json({ success: false, message: 'عذراً، لقد تم استنفاد المحاولات الثلاث لهذا الرابط مسبقاً.' });
    }

    res.json({
        success: true,
        account: order.account,
        remainingAttempts: order.remainingAttempts
    });
});

// 2. توليد الرمز المؤقت عند ضغط العميل على زر الاستلام (مع خصم محاولة)
app.post('/api/reveal-code', (req, res) => {
    const { orderId } = req.body;
    const order = ordersDatabase[orderId];

    if (!order) {
        return res.status(404).json({ success: false, message: 'رقم الطلب غير صحيح.' });
    }

    if (order.remainingAttempts <= 0) {
        return res.status(400).json({ success: false, message: 'عذراً، لقد استنفذت الحد الأقصى (3 محاولات) لهذا الرابط.' });
    }

    // خصم محاولة واحدة
    order.remainingAttempts -= 1;

    // توليد رمز التحقق المؤقت (OTP)
    const currentOtpCode = speakeasy.totp({
        secret: order.secret,
        encoding: 'base32',
        step: 30
    });

    res.json({
        success: true,
        code: currentOtpCode,
        remainingAttempts: order.remainingAttempts
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});