# Trading Wall - دیوار معاملاتی

پلتفرم حرفه‌ای تحلیل و مدیریت معاملات برای معامله‌گران بازارهای مالی جهانی

## ویژگی‌ها

### 🎯 فاز 1 - ویژگی‌های اصلی
- ✅ بارگذاری و پارس فایل متاتریدر
- ✅ تحلیل جامع معاملات (Win Rate, P&L, آمار)
- ✅ احراز هویت با OTP (SMS.ir)
- ✅ تقویم معاملاتی (روزانه، هفتگی، ماهانه)
- ✅ ژورنال و پلن معاملاتی
- ✅ لیدربورد معامله‌گران برتر
- ✅ پروفایل عمومی با تنظیمات Privacy
- ✅ سیستم دستاوردها و فعالیت‌ها
- ✅ پنل مدیریت
- ✅ چندزبانه (فارسی/انگلیسی)

## تکنولوژی‌ها

- **Framework**: Next.js 15 (App Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB + Mongoose
- **Authentication**: NextAuth.js + OTP
- **SMS Service**: SMS.ir
- **File Parsing**: xlsx
- **Charts**: Recharts
- **i18n**: next-intl

## نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- MongoDB 6+
- حساب کاربری SMS.ir

### مراحل نصب

1. کلون کردن پروژه:
\`\`\`bash
git clone <repository-url>
cd TradingWall
\`\`\`

2. نصب وابستگی‌ها:
\`\`\`bash
npm install
\`\`\`

3. تنظیم متغیرهای محیطی:
\`\`\`bash
cp .env.example .env.local
\`\`\`

سپس فایل `.env.local` را ویرایش کنید:
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/trading-wall
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
SMS_IR_API_KEY=your-sms-ir-api-key
SMS_IR_LINE_NUMBER=your-line-number
\`\`\`

4. اجرای پروژه:
\`\`\`bash
npm run dev
\`\`\`

5. باز کردن در مرورگر:
\`\`\`
http://localhost:3000
\`\`\`

## ساختار پروژه

\`\`\`
TradingWall/
├── app/                    # Next.js App Router
│   ├── page.js            # صفحه اصلی
│   ├── layout.js          # Layout اصلی
│   ├── globals.css        # استایل‌های عمومی
│   ├── auth/              # صفحات احراز هویت
│   ├── dashboard/         # داشبورد کاربر
│   ├── profile/           # پروفایل کاربر
│   ├── admin/             # پنل مدیر
│   └── api/               # API Routes
├── components/            # کامپوننت‌های React
├── models/                # مدل‌های MongoDB
│   ├── User.js
│   ├── Trade.js
│   ├── Plan.js
│   ├── Setup.js
│   ├── Activity.js
│   ├── Achievement.js
│   └── OTP.js
├── lib/                   # کتابخانه‌ها و تنظیمات
│   └── mongodb.js
├── utils/                 # توابع کمکی
│   ├── smsir.js
│   ├── generateOTP.js
│   ├── tradeAnalysis.js
│   └── parseMetaTrader.js
├── middleware/            # Middleware
├── public/                # فایل‌های استاتیک
└── package.json
\`\`\`

## مدل‌های دیتابیس

### User
- اطلاعات کاربر (شماره تلفن، نام عمومی، عکس، نقش)
- تنظیمات Privacy
- تیک تایید (Blue Check)

### Trade
- جزئیات معامله از متاتریدر
- سود/زیان، حجم، نماد، زمان
- لینک به Setup

### Plan
- پلن معاملاتی (روزانه/هفتگی/ماهانه)
- حد ضرر، هدف سود، تعداد معامله
- حالت روحی، یادداشت‌ها

### Setup
- ستاپ‌های استاندارد (مدیر)
- ستاپ‌های شخصی (کاربر)

### Activity
- فعالیت‌های آموزشی کاربر
- کتاب، ویدیو، دوره، مقاله

### Achievement
- رتبه‌های کسب شده در لیدربوردها
- دسته‌بندی بر اساس دوره زمانی

### OTP
- کدهای یکبار مصرف برای احراز هویت

## API Routes

### Authentication
- `POST /api/auth/send-otp` - ارسال کد OTP
- `POST /api/auth/verify-otp` - تایید کد OTP
- `POST /api/auth/login` - ورود با رمز عبور

### Trades
- `POST /api/trades/upload` - بارگذاری فایل معاملات
- `GET /api/trades` - دریافت لیست معاملات
- `POST /api/trades` - افزودن معامله جدید
- `PUT /api/trades/:id` - ویرایش معامله
- `DELETE /api/trades/:id` - حذف معامله

### Plans
- `GET /api/plans` - دریافت پلن‌ها
- `POST /api/plans` - ایجاد پلن جدید
- `PUT /api/plans/:id` - ویرایش پلن

### Leaderboards
- `GET /api/leaderboards/:type` - دریافت لیدربورد

### Profile
- `GET /api/profile/:userId` - دریافت پروفایل عمومی
- `PUT /api/profile` - به‌روزرسانی پروفایل
- `PUT /api/profile/privacy` - تنظیمات Privacy

## راهنمای توسعه

### اضافه کردن ستاپ استاندارد جدید
1. به پنل مدیر بروید
2. بخش "ستاپ‌های استاندارد" را باز کنید
3. "افزودن ستاپ جدید" را کلیک کنید

### محاسبه لیدربوردها
لیدربوردها به صورت خودکار در پایان هر هفته/ماه/سال محاسبه و ذخیره می‌شوند.
برای اجرای دستی:
\`\`\`bash
npm run calculate-leaderboards
\`\`\`

## SMS.ir راه‌اندازی

1. ثبت‌نام در [sms.ir](https://sms.ir)
2. دریافت API Key
3. ساخت قالب پیامک با متغیر `Code`
4. افزودن Template ID به کد

## مشارکت

لطفاً قبل از ارسال Pull Request، موارد زیر را بررسی کنید:
- کد تمیز و خوانا باشد
- کامنت‌های لازم اضافه شده باشد
- تست‌های مربوطه پاس شوند

## مجوز

این پروژه تحت مجوز MIT منتشر شده است.

## تماس با ما

- Website: [tradingwall.ir](https://tradingwall.ir)
- Email: info@tradingwall.ir
- Telegram: @tradingwall

---

ساخته شده با ❤️ برای معامله‌گران ایرانی
