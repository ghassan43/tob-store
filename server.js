const express = require('express');
const cors = require('cors');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// مفتاحك السري الثابت
const mySecretKey = "YSLHT6J25FPQQEPB6EPGTYWZIOEDDBNS";

// بيانات الحساب الثابتة
const accountDetails = {
    email: "xbgxbg1234+JI90@gmail.com",
    password: "6OB123123@123"
};

// إنشاء أو الاتصال بقاعدة بيانات SQLite محلية
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
    } else {
        console.log('تم الاتصال بقاعدة بيانات SQLite بنجاح.');
        initDatabase();
    }
});

// إنشاء الجدول وتوليد الروابط الـ 20 العشوائية الآمنة لأول مرة فقط
function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        token TEXT PRIMARY KEY,
        email TEXT,
        password TEXT,
        secret TEXT,
        remaining_attempts INTEGER
    )`, (err) => {
        if (!err) {
            db.get(`SELECT COUNT(*) as count FROM orders`, (err, row) => {
                if (row.count === 0) {
                    console.log("=== روابط متجر طوب ستور الآمنة والمحفوظة في قاعدة البيانات ===");
                    for (let i = 0; i < 20; i++) {
                        const token = crypto.randomBytes(8).toString('hex');
                        db.run(`INSERT INTO orders (token, email, password, secret, remaining_attempts) VALUES (?, ?, ?, ?, ?)`,
                            [token, accountDetails.email, accountDetails.password, mySecretKey, 3]
                        );
                        console.log(`رابط ${i + 1}: https://tob-store.onrender.com/?order=${token}`);
                    }
                } else {
                    console.log("روابط قاعدة البيانات موجودة ومحفوظة مسبقاً.");
                }
            });
        }
    });
}

// 1. جلب معلومات الحساب عند فتح الرابط العشوائي
app.post('/api/get-order-info', (req, res) => {
    const { orderId } = req.body;

    db.get(`SELECT * FROM orders WHERE token = ?`, [orderId], (err, order) => {
        if (err || !order) {
            return res.status(404).json({ success: false, message: 'رابط الطلب غير صحيح أو غير موجود.' });
        }

        if (order.remaining_attempts <= 0) {
            return res.status(400).json({ success: false, message: 'عذراً، لقد تم استنفاد المحاولات الثلاث لهذا الرابط مسبقاً.' });
        }

        res.json({
            success: true,
            account: {
                email: order.email,
                password: order.password
            },
            remainingAttempts: order.remaining_attempts
        });
    });
});

// 2. توليد الرمز المؤقت عند ضغط العميل (مع خصم محاولة وتحديثها في قاعدة البيانات)
app.post('/api/reveal-code', (req, res) => {
    const { orderId } = req.body;

    db.get(`SELECT * FROM orders WHERE token = ?`, [orderId], (err, order) => {
        if (err || !order) {
            return res.status(404).json({ success: false, message: 'رابط الطلب غير صحيح.' });
        }

        if (order.remaining_attempts <= 0) {
            return res.status(400).json({ success: false, message: 'عذراً، لقد استنفذت الحد الأقصى (3 محاولات) لهذا الرابط.' });
        }

        const newAttempts = order.remaining_attempts - 1;

        db.run(`UPDATE orders SET remaining_attempts = ? WHERE token = ?`, [newAttempts, orderId], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ success: false, message: 'حدث خطأ في تحديث المحاولات.' });
            }

            const currentOtpCode = speakeasy.totp({
                secret: order.secret,
                encoding: 'base32',
                step: 30
            });

            res.json({
                success: true,
                code: currentOtpCode,
                remainingAttempts: newAttempts
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});