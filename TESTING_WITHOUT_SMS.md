# 🧪 تست بدون SMS (قبل از تایید Template)

تا زمانی که Template در SMS.ir تایید نشود، می‌توانید با این روش تست کنید:

---

## روش 1: مشاهده کد از Console Terminal

### گام 1: سرور را اجرا کنید
```bash
npm run dev
```

### گام 2: به صفحه ورود بروید
http://localhost:3000/auth/login

### گام 3: شماره موبایل را وارد کنید
مثلاً: `09123456789`

### گام 4: کد را از Terminal بخوانید
در Terminal جایی که `npm run dev` را اجرا کرده‌اید، کد OTP نمایش داده می‌شود:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 OTP Code for Testing:
Phone: 09123456789
Code: 12345
Expires: 2026-08-09T10:15:00.000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### گام 5: کد را در صفحه Verify وارد کنید
کد 5 رقمی را وارد کنید و تایید کنید!

---

## روش 2: مشاهده کد از MongoDB

### با MongoDB Compass:

1. MongoDB Compass را باز کنید
2. به `localhost:27017` متصل شوید
3. Database: `trading-wall` → Collection: `otps`
4. آخرین رکورد را باز کنید
5. فیلد `code` را مشاهده کنید

### با MongoDB Shell:

```bash
mongosh
use trading-wall
db.otps.find().sort({createdAt: -1}).limit(1).pretty()
```

---

## روش 3: استفاده از Postman/Insomnia

### 1. ارسال OTP
```http
POST http://localhost:3000/api/auth/send-otp
Content-Type: application/json

{
  "phone": "09123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "کد تایید در Console نمایش داده شد",
  "devMode": true
}
```

### 2. کد را از Console بگیرید

### 3. تایید OTP
```http
POST http://localhost:3000/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "09123456789",
  "code": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "ورود موفقیت‌آمیز",
  "user": {
    "id": "...",
    "phone": "09123456789",
    "publicName": "کاربر جدید",
    "role": "user"
  }
}
```

---

## ⚠️ نکات مهم

1. **فقط در Development:** این قابلیت فقط وقتی `NODE_ENV=development` است کار می‌کند

2. **امنیت:** در Production حتماً باید SMS واقعی ارسال شود

3. **انقضا:** کد OTP بعد از 10 دقیقه منقضی می‌شود

4. **Rate Limit:** هر 2 دقیقه یک بار می‌توانید کد جدید بگیرید

---

## 🚀 بعد از تایید Template

وقتی Template در SMS.ir تایید شد:

1. Template ID را در `utils/smsir.js` قرار دهید
2. سرور را Restart کنید
3. پیامک واقعی دریافت خواهید کرد!

---

**موفق باشید!** 🎉
