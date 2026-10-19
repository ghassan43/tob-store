const express = require('express');
const speakeasy = require('speakeasy');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname));
// قاعدة بيانات تجريبية (مؤقتة للتجربة)
let database = {
    "orders": {
        "1001": { 
            orderId: "1001",
            username: "player_steam1",
            secret: "JBSWY3DPEHPK3PXP", // المفتاح السري الخاص بالـ Authenticator للحساب
            usedCount: 0,
            maxLimit: 3
        }
    }
};

// نقطة النهاية (API) لاستلام الكود
app.post('/api/get-auth-code', (req, res) => {
    const { orderId, username } = req.body;

    if (!orderId || !username) {
        return res.status(400).json({ 
            success: false, 
            message: "الرجاء إدخال رقم الطلب واسم المستخدم." 
        });
    }

    const order = database.orders[orderId];

    // التحقق من صحة الطلب واسم المستخدم
    if (!order || order.username !== username) {
        return res.status(404).json({ 
            success: false, 
            message: "رقم الطلب أو اسم المستخدم غير صحيح." 
        });
    }

    // التحقق من شرط الحد الأقصى (3 أكواد)
    if (order.usedCount >= order.maxLimit) {
        return res.status(400).json({ 
            success: false, 
            message: "عذراً، لقد استنفدت الحد الأقصى المسموح به (3 أكواد). تواصل مع الدعم الفني للمساعدة." 
        });
    }

    // زيادة عداد الاستخدام بواقع 1
    order.usedCount += 1;

    // توليد كود التحقق (TOTP) الحالي المتوافق مع Authenticator
    const token = speakeasy.totp({
        secret: order.secret,
        encoding: 'base32'
    });

    const remainingAttempts = order.maxLimit - order.usedCount;

    res.json({
        success: true,
        code: token,
        remainingAttempts: remainingAttempts,
        message: `تم توليد الكود بنجاح. المحاولات المتبقية: ${remainingAttempts}`
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});