# ساختار پروژه Trading Wall

## نمای کلی معماری

این پروژه با Next.js 15 (App Router) و MongoDB ساخته شده است.

## ساختار صفحات

### صفحات عمومی
- `/` - صفحه اصلی (لندینگ)
  - بارگذاری فایل معاملات
  - لیدربوردهای برتر
  - معرفی ویژگی‌ها

### احراز هویت
- `/auth/login` - ورود با OTP یا رمز
- `/auth/register` - ثبت نام با شماره موبایل
- `/auth/verify` - تایید کد OTP

### داشبورد کاربر
- `/dashboard` - داشبورد اصلی
  - Trading Wall (تقویم معاملاتی)
  - آمار کلی
  - نمودارها
  
- `/dashboard/trades` - لیست معاملات
  - فیلتر و جستجو
  - CRUD معاملات
  - آپلود فایل جدید
  
- `/dashboard/plans` - پلن‌ها و ژورنال
  - پلن روزانه/هفتگی/ماهانه
  - یادداشت‌ها
  - حالت روحی

- `/dashboard/setups` - مدیریت ستاپ‌ها
  - ستاپ‌های استاندارد (فقط خواندنی)
  - ستاپ‌های شخصی (CRUD)

### پروفایل
- `/profile` - پروفایل شخصی
  - ویرایش اطلاعات
  - تنظیمات Privacy
  - تنظیم رمز عبور
  
- `/profile/achievements` - دستاوردها
  - رتبه‌های کسب شده
  - تاریخچه لیدربوردها
  
- `/profile/activities` - فعالیت‌ها
  - لیست فعالیت‌های آموزشی
  - افزودن/ویرایش/حذف

- `/profile/@[username]` - پروفایل عمومی
  - نمایش بر اساس تنظیمات Privacy
  - Trading Wall (اگر عمومی باشد)
  - دستاوردها (اگر عمومی باشد)
  - فعالیت‌ها (اگر عمومی باشد)

### لیدربوردها
- `/leaderboards` - صفحه اصلی لیدربوردها
- `/leaderboards/winrate-year` - وین‌ریت سالانه
- `/leaderboards/winrate-month` - وین‌ریت ماهانه
- `/leaderboards/winrate-week` - وین‌ریت هفتگی
- `/leaderboards/profit-year` - سود سالانه
- `/leaderboards/profit-month` - سود ماهانه
- `/leaderboards/profit-week` - سود هفتگی

### پنل مدیر
- `/admin` - داشبورد مدیر
  - آمار کلی
  - نمودارها
  
- `/admin/users` - مدیریت کاربران
  - لیست کاربران
  - تایید/رد کاربران (تیک آبی)
  - مشاهده معاملات کاربر
  
- `/admin/trades` - مدیریت معاملات
  - مشاهده همه معاملات
  - فیلتر پیشرفته
  
- `/admin/setups` - مدیریت ستاپ‌های استاندارد
  - افزودن/ویرایش/حذف
  
- `/admin/leaderboards` - مدیریت لیدربوردها
  - محاسبه دستی
  - مشاهده آرشیو
  
- `/admin/settings` - تنظیمات سیستم

## API Routes

### Authentication (`/api/auth/`)
- `POST /api/auth/send-otp` - ارسال کد OTP
- `POST /api/auth/verify-otp` - تایید کد OTP
- `POST /api/auth/login` - ورود با رمز
- `POST /api/auth/register` - ثبت نام
- `POST /api/auth/set-password` - تنظیم رمز عبور

### Trades (`/api/trades/`)
- `GET /api/trades` - دریافت لیست معاملات (با فیلتر)
- `POST /api/trades` - افزودن معامله جدید
- `PUT /api/trades/[id]` - ویرایش معامله
- `DELETE /api/trades/[id]` - حذف معامله
- `POST /api/trades/upload` - بارگذاری فایل Excel
- `GET /api/trades/stats` - آمار معاملات
- `GET /api/trades/download-template` - دانلود فایل الگو

### Plans (`/api/plans/`)
- `GET /api/plans` - دریافت پلن‌ها
- `POST /api/plans` - ایجاد پلن
- `PUT /api/plans/[id]` - ویرایش پلن
- `DELETE /api/plans/[id]` - حذف پلن
- `GET /api/plans/[date]/[period]` - دریافت پلن خاص

### Setups (`/api/setups/`)
- `GET /api/setups` - دریافت همه ستاپ‌ها
- `GET /api/setups/standard` - ستاپ‌های استاندارد
- `GET /api/setups/custom` - ستاپ‌های شخصی
- `POST /api/setups` - افزودن ستاپ شخصی
- `PUT /api/setups/[id]` - ویرایش ستاپ شخصی
- `DELETE /api/setups/[id]` - حذف ستاپ شخصی

### Profile (`/api/profile/`)
- `GET /api/profile` - پروفایل خود
- `GET /api/profile/[userId]` - پروفایل عمومی کاربر
- `PUT /api/profile` - به‌روزرسانی پروفایل
- `PUT /api/profile/privacy` - تنظیمات Privacy
- `POST /api/profile/upload-image` - آپلود عکس پروفایل

### Activities (`/api/activities/`)
- `GET /api/activities` - دریافت فعالیت‌ها
- `POST /api/activities` - افزودن فعالیت
- `PUT /api/activities/[id]` - ویرایش فعالیت
- `DELETE /api/activities/[id]` - حذف فعالیت

### Achievements (`/api/achievements/`)
- `GET /api/achievements` - دریافت دستاوردهای کاربر
- `GET /api/achievements/[userId]` - دستاوردهای کاربر خاص

### Leaderboards (`/api/leaderboards/`)
- `GET /api/leaderboards/[type]` - دریافت لیدربورد خاص
  - Types: `winrate-year`, `winrate-month`, `winrate-week`, `profit-year`, `profit-month`, `profit-week`
- `POST /api/leaderboards/calculate` - محاسبه لیدربوردها (Admin only)

### Admin (`/api/admin/`)
- `GET /api/admin/users` - لیست کاربران
- `PUT /api/admin/users/[id]/verify` - تایید کاربر (تیک آبی)
- `GET /api/admin/stats` - آمار کلی سیستم
- `POST /api/admin/setups` - افزودن ستاپ استاندارد
- `PUT /api/admin/setups/[id]` - ویرایش ستاپ استاندارد
- `DELETE /api/admin/setups/[id]` - حذف ستاپ استاندارد

## کامپوننت‌های اصلی

### Layout Components
- `Header` - هدر سایت
- `Sidebar` - منوی کناری داشبورد
- `Footer` - فوتر سایت

### Trading Components
- `TradeCard` - کارت نمایش یک معامله
- `TradesList` - لیست معاملات
- `TradingCalendar` - تقویم معاملاتی
- `CalendarDay` - یک روز از تقویم
- `UploadTrades` - کامپوننت آپلود فایل

### Chart Components
- `ProfitChart` - نمودار سود/زیان
- `WinRateChart` - نمودار وین‌ریت
- `PerformanceChart` - نمودار عملکرد کلی

### Profile Components
- `ProfileCard` - کارت پروفایل
- `AchievementCard` - کارت دستاورد
- `ActivityCard` - کارت فعالیت
- `PrivacySettings` - تنظیمات Privacy

### Leaderboard Components
- `LeaderboardCard` - کارت لیدربورد
- `LeaderboardRow` - یک ردیف از لیدربورد
- `RankBadge` - نشان رتبه

### Common Components
- `Button` - دکمه
- `Input` - فیلد ورودی
- `Select` - منوی انتخاب
- `Modal` - پنجره مودال
- `Toast` - پیام نوتیفیکیشن
- `Loading` - لودینگ
- `EmptyState` - حالت خالی
- `ErrorBoundary` - مدیریت خطا

## فلوی کاری

### ثبت نام و ورود
1. کاربر شماره موبایل را وارد می‌کند
2. کد OTP ارسال می‌شود
3. کاربر کد را وارد می‌کند
4. در صورت موفقیت، وارد داشبورد می‌شود

### بارگذاری معاملات
1. کاربر فایل Excel را انتخاب می‌کند
2. فایل پارس می‌شود
3. معاملات در دیتابیس ذخیره می‌شوند
4. آمار به‌روز می‌شود
5. کاربر به داشبورد هدایت می‌شود

### محاسبه لیدربوردها
1. در پایان هر دوره (هفته/ماه/سال)
2. تمام کاربران واجد شرایط فیلتر می‌شوند
3. براساس معیار مورد نظر مرتب می‌شوند
4. ۱۰ نفر برتر ذخیره می‌شوند
5. دستاوردها به پروفایل کاربران اضافه می‌شوند

## امنیت

### Authentication
- استفاده از NextAuth.js
- هش کردن رمز عبور با bcrypt
- محدودیت تعداد درخواست OTP
- انقضای کد OTP بعد از ۱۰ دقیقه

### Authorization
- Middleware برای محافظت از روت‌های خصوصی
- بررسی نقش کاربر (User/Admin)
- محدودیت دسترسی به API‌ها

### Data Validation
- اعتبارسنجی ورودی‌ها در سمت کلاینت و سرور
- Sanitize کردن داده‌ها قبل از ذخیره
- محدودیت حجم فایل آپلود

## بهینه‌سازی

### Performance
- استفاده از Next.js Image برای بهینه‌سازی تصاویر
- Lazy loading برای کامپوننت‌های سنگین
- Caching استراتژی برای API‌ها
- Index‌های مناسب در MongoDB

### SEO
- متا تگ‌های مناسب
- Sitemap
- Structured Data
- Open Graph برای شبکه‌های اجتماعی

## تست

### Unit Tests
- تست توابع یوتیلیتی
- تست محاسبات آماری

### Integration Tests
- تست API Routes
- تست فلوی احراز هویت

### E2E Tests
- تست کامل فرآیند ثبت نام
- تست بارگذاری معاملات
- تست ایجاد پلن

## دیپلوی

### پیش‌نیازها
- Node.js 18+
- MongoDB 6+
- حساب SMS.ir

### Environment Variables
همه متغیرهای محیطی را در `.env.local` تنظیم کنید.

### Build
\`\`\`bash
npm run build
\`\`\`

### Start Production
\`\`\`bash
npm start
\`\`\`

## نگهداری

### Backup
- بک‌آپ روزانه از دیتابیس MongoDB
- بک‌آپ فایل‌های آپلود شده

### Monitoring
- نظارت بر خطاها
- نظارت بر عملکرد API‌ها
- نظارت بر استفاده از منابع

### Updates
- به‌روزرسانی منظم وابستگی‌ها
- پچ امنیتی
- بهبود عملکرد

---

این مستند در حال توسعه است و با پیشرفت پروژه به‌روز می‌شود.
