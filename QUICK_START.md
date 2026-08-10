# 🚀 شروع سریع - Trading Wall

راهنمای 5 دقیقه‌ای برای اجرای پروژه

---

## گام 1: نصب بسته‌ها (2 دقیقه)

```bash
npm install --legacy-peer-deps
```

⏳ **صبر کنید تا نصب تمام شود...**

---

## گام 2: MongoDB (1 دقیقه)

### ساده‌ترین راه: MongoDB Atlas (رایگان)

1. به https://www.mongodb.com/cloud/atlas بروید
2. "Try Free" را کلیک کنید
3. ثبت نام کنید
4. یک Cluster رایگان بسازید (M0 Free)
5. در بخش Database → Connect → Drivers
6. Connection String را کپی کنید

**مثال:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trading-wall
```

---

## گام 3: فایل .env.local (1 دقیقه)

در ریشه پروژه فایل `.env.local` بسازید:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trading-wall
NEXTAUTH_SECRET=my-super-secret-key-with-minimum-32-characters-length
NEXTAUTH_URL=http://localhost:3000
SMS_IR_API_KEY=your-api-key-from-sms-ir
SMS_IR_LINE_NUMBER=your-line-number
NODE_ENV=development
```

**نکته:** اگر SMS.ir ندارید، فعلاً مقدار دلخواه بنویسید (بعداً تنظیم می‌کنیم)

---

## گام 4: اجرا! (30 ثانیه)

```bash
npm run dev
```

✅ **پروژه روی http://localhost:3000 اجرا شد!**

---

## گام 5: تست سریع (1 دقیقه)

1. مرورگر را باز کنید: http://localhost:3000
2. صفحه اصلی را مشاهده کنید
3. روی "ورود" کلیک کنید
4. شماره موبایل وارد کنید (مثلاً 09123456789)

**نکته:** برای تست، کد OTP را از Console مرورگر یا لاگ terminal ببینید (اگر SMS.ir تنظیم نکردید)

---

## 🔧 رفع سریع مشکلات

### خطا: Cannot connect to MongoDB
✅ **راه حل:** مطمئن شوید MONGODB_URI در .env.local درست است

### خطا: npm install failed
✅ **راه حل:** حتماً از `--legacy-peer-deps` استفاده کنید

### خطا: Port 3000 is already in use
✅ **راه حل:** 
```bash
# پورت دیگری استفاده کنید
npm run dev -- -p 3001
```

---

## 📚 بعد از اجرا

### ایجاد کاربر مدیر

1. MongoDB Atlas → Browse Collections
2. Database: trading-wall → Collection: users
3. پیدا کردن کاربری که ساختید
4. کلیک روی Edit Document
5. تغییر `role` از `"user"` به `"admin"`
6. تغییر `verified` به `true`
7. ذخیره

حالا می‌توانید به پنل مدیر بروید: http://localhost:3000/admin

---

## 📖 مستندات کامل

- **SETUP_GUIDE.md** - راهنمای کامل نصب
- **README.md** - اطلاعات عمومی پروژه
- **PROJECT_STRUCTURE.md** - ساختار کامل پروژه
- **COMPLETION_SUMMARY.md** - خلاصه و وضعیت پروژه

---

## 🎉 تبریک!

پروژه Trading Wall شما آماده است! 

**صفحات موجود:**
- 🏠 صفحه اصلی: http://localhost:3000
- 🔐 ورود: http://localhost:3000/auth/login  
- 📊 داشبورد: http://localhost:3000/dashboard
- 👤 پروفایل: http://localhost:3000/profile
- ⚙️ پنل مدیر: http://localhost:3000/admin

موفق باشید! 🚀
