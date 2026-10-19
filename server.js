const express = require('express');
const cors = require('cors');
const speakeasy = require('speakeasy');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// قاعدة بيانات الطلبات الـ 20 الخاصة بقسم الذكاء الاصطناعي (AI)
const ordersDatabase = {
    "1001": { username: "عميل_AI_1", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1002": { username: "عميل_AI_2", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1003": { username: "عميل_AI_3", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1004": { username: "عميل_AI_4", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1005": { username: "عميل_AI_5", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1006": { username: "عميل_AI_6", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1007": { username: "عميل_AI_7", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1008": { username: "عميل_AI_8", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1009": { username: "عميل_AI_9", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1010": { username: "عميل_AI_10", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1011": { username: "عميل_AI_11", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1012": { username: "عميل_AI_12", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1013": { username: "عميل_AI_13", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1014": { username: "عميل_AI_14", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1015": { username: "عميل_AI_15", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1016": { username: "عميل_AI_16", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1017": { username: "عميل_AI_17", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1018": { username: "عميل_AI_18", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1019": { username: "عميل_AI_19", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 },
    "1020": { username: "عميل_AI_20", secret: "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS", remainingAttempts: 3 }
};

// 1. مسار جلب معلومات الطلب عند فتح الرابط (بدون خصم محاولات)
app.post('/api/get-order-info', (req, res) => {
    const { orderId } = req.body;
    const order = ordersDatabase[orderId];

    if (!order) {
        return res.status(404).json({ success: false, message: 'رقم الطلب غير صحيح أو غير موجود.' });
    }

    res.json({
        success: true,
        username: order.username,
        remainingAttempts: order.remainingAttempts
    });
});

// 2. مسار إعطاء كود التحقق المؤقت عند ضغط العميل على زر الاستلام
app.post('/api/reveal-code', (req, res) => {
    const { orderId } = req.body;
    const order = ordersDatabase[orderId];

    if (!order) {
        return res.status(404).json({ success: false, message: 'رقم الطلب غير صحيح.' });
    }

    if (order.remainingAttempts <= 0) {
        return res.status(400).json({ success: false, message: 'لقد استنفذت الحد الأقصى للمحاولات المسموحة لهذا الكود.' });
    }

    // خصم محاولة واحدة
    order.remainingAttempts -= 1;

    // توليد رمز التحقق المؤقت (OTP) بناءً على مفتاحك السري الحقيقي
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