# راهنمای نصب و راه‌اندازی Trading Wall

## مرحله 1: نصب وابستگی‌ها

```bash
npm install --legacy-peer-deps
```

**نکته:** از فلگ `--legacy-peer-deps` استفاده کنید تا مشکل تعارض نسخه React حل شود.

## مرحله 2: تنظیم MongoDB

### گزینه 1: MongoDB Local
```bash
# نصب MongoDB
# ویندوز: https://www.mongodb.com/try/download/community
# بعد از نصب، MongoDB روی پورت 27017 اجرا می‌شود
```

### گزینه 2: MongoDB Atlas (Cloud)
1. به [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) بروید
2. یک Cluster رایگان بسازید
3. Connection String را کپی کنید

## مرحله 3: تنظیم متغیرهای محیطی

فایل `.env.local` را در ریشه پروژه بسازید:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/trading-wall
# یا برای Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/trading-wall

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-min-32-characters
NEXTAUTH_URL=http://localhost:3000

# SMS.ir
SMS_IR_API_KEY=your-sms-ir-api-key
SMS_IR_LINE_NUMBER=your-line-number

# Environment
NODE_ENV=development
```

### نحوه دریافت API Key از SMS.ir:

1. به [sms.ir](https://sms.ir) بروید
2. ثبت نام کنید
3. از پنل خود API Key دریافت کنید
4. یک Template برای OTP بسازید با متغیر `Code`
5. Template ID را یادداشت کنید

## مرحله 4: اجرای پروژه

```bash
npm run dev
```

پروژه روی [http://localhost:3000](http://localhost:3000) اجرا می‌شود.

## مرحله 5: ایجاد اولین ادمین

برای ایجاد کاربر مدیر، به MongoDB Compass یا mongosh متصل شوید و این کوئری را اجرا کنید:

```javascript
db.users.updateOne(
  { phone: "09123456789" }, // شماره موبایل خودتان
  { 
    $set: { 
      role: "admin",
      verified: true 
    } 
  }
)
```

## ساختار صفحات

### صفحات عمومی
- `/` - صفحه اصلی (Landing Page)
- `/auth/login` - ورود
- `/auth/verify` - تایید OTP

### صفحات کاربر
- `/dashboard` - داشبورد با تقویم معاملاتی
- `/dashboard/trades` - لیست معاملات
- `/profile` - پروفایل کاربر

### صفحات مدیر
- `/admin` - پنل مدیریت
- `/admin/users` - مدیریت کاربران
- `/admin/trades` - مدیریت معاملات
- `/admin/setups` - ستاپ‌های استاندارد

## API Endpoints

### احراز هویت
- `POST /api/auth/send-otp` - ارسال کد OTP
- `POST /api/auth/verify-otp` - تایید OTP

### معاملات
- `GET /api/trades` - لیست معاملات
- `POST /api/trades` - افزودن معامله
- `PUT /api/trades/[id]` - ویرایش معامله
- `DELETE /api/trades/[id]` - حذف معامله
- `POST /api/trades/upload` - آپلود فایل Excel
- `GET /api/trades/stats` - آمار معاملات

### پلن‌ها
- `GET /api/plans` - لیست پلن‌ها
- `POST /api/plans` - ایجاد پلن

### پروفایل
- `GET /api/profile` - دریافت پروفایل
- `PUT /api/profile` - به‌روزرسانی پروفایل

### مدیریت (Admin)
- `GET /api/admin/stats` - آمار کلی
- `GET /api/admin/users` - لیست کاربران
- `PUT /api/admin/users/[id]/verify` - تایید کاربر

## تست API ها با Postman/Insomnia

### مثال: ارسال OTP
```http
POST http://localhost:3000/api/auth/send-otp
Content-Type: application/json

{
  "phone": "09123456789"
}
```

### مثال: تایید OTP
```http
POST http://localhost:3000/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "09123456789",
  "code": "123456"
}
```

### مثال: دریافت معاملات
```http
GET http://localhost:3000/api/trades?userId=USER_ID_HERE
```

### مثال: آپلود فایل Excel
```http
POST http://localhost:3000/api/trades/upload
Content-Type: multipart/form-data

file: [Select Excel File]
userId: USER_ID_HERE
```

## رفع مشکلات رایج

### خطای اتصال به MongoDB
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**راه حل:** مطمئن شوید MongoDB در حال اجرا است.
- ویندوز: سرویس MongoDB را از Services چک کنید
- یا دستی اجرا کنید: `mongod --dbpath=C:\data\db`

### خطای SMS.ir
```
Error: Invalid API Key
```
**راه حل:** 
1. API Key را از پنل SMS.ir کپی کنید
2. در `.env.local` درست وارد کنید
3. سرور را restart کنید

### خطای CORS
```
Error: CORS policy blocked
```
**راه حل:** در حال حاضر CORS برای localhost تنظیم شده است. برای production باید در `next.config.js` تنظیم کنید.

## Build برای Production

```bash
# ایجاد build
npm run build

# اجرای production
npm start
```

## دیپلوی

### Vercel (پیشنهادی)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t trading-wall .
docker run -p 3000:3000 trading-wall
```

## نکات امنیتی

1. ✅ `NEXTAUTH_SECRET` را حتماً تغییر دهید
2. ✅ کلیدهای SMS.ir را خصوصی نگه دارید
3. ✅ از HTTPS برای production استفاده کنید
4. ✅ رمزهای عبور را hash کنید (در حال حاضر پیاده‌سازی شده)
5. ✅ Rate limiting برای OTP اعمال شده است

## پشتیبانی

اگر مشکلی داشتید:
1. لاگ‌های terminal را بررسی کنید
2. فایل `.env.local` را چک کنید
3. MongoDB را بررسی کنید
4. Issues در GitHub ایجاد کنید

---

موفق باشید! 🚀
