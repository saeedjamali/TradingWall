# 🔧 رفع مشکل شبکه npm install

مشکل: `ECONNRESET` - خطای اتصال به registry.npmjs.org

---

## راه حل‌های پیشنهادی (به ترتیب اولویت)

### راه حل 1: استفاده از فیلترشکن ⭐ (بهترین)

1. فیلترشکن را روشن کنید
2. مطمئن شوید که System Proxy فعال است
3. سپس دوباره اجرا کنید:

```bash
npm cache clean --force
npm install --legacy-peer-deps
```

---

### راه حل 2: استفاده از Yarn (سریع)

```bash
# نصب Yarn
npm install -g yarn

# نصب با Yarn
yarn install
```

---

### راه حل 3: تغییر Registry به Mirror چینی

```bash
npm config set registry https://registry.npmmirror.com
npm cache clean --force
npm install --legacy-peer-deps
```

**برگشت به registry اصلی:**
```bash
npm config set registry https://registry.npmjs.org
```

---

### راه حل 4: نصب دستی بسته‌های اصلی

```bash
npm install next@15.0.3 react@18.3.1 react-dom@18.3.1 --legacy-peer-deps
npm install mongoose axios date-fns --legacy-peer-deps
npm install tailwindcss postcss autoprefixer --save-dev --legacy-peer-deps
npm install xlsx recharts react-hot-toast --legacy-peer-deps
```

---

### راه حل 5: پاک کردن کامل و شروع مجدد

```powershell
# پاک کردن همه چیز
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force

# افزایش timeout
npm config set fetch-timeout 60000
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# نصب مجدد
npm install --legacy-peer-deps
```

---

### راه حل 6: استفاده از .npmrc

فایل `.npmrc` در ریشه پروژه بسازید:

```
registry=https://registry.npmmirror.com
fetch-timeout=60000
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
legacy-peer-deps=true
```

سپس:
```bash
npm install
```

---

### راه حل 7: دانلود node_modules از منبع دیگر

اگر هیچ راهی کار نکرد:

1. از یک سرور خارج یا دوست node_modules را بگیرید
2. یا از GitHub Release پروژه‌های مشابه دانلود کنید
3. یا از Google Drive / Telegram منبع بگیرید

---

## تشخیص مشکل

### چک کردن اتصال به npm:
```bash
curl https://registry.npmjs.org
```

### چک کردن DNS:
```bash
nslookup registry.npmjs.org
```

### چک کردن proxy:
```bash
npm config get proxy
npm config get https-proxy
```

---

## بعد از حل مشکل

وقتی npm install موفق شد:

```bash
npm run dev
```

و به http://localhost:3000 بروید!

---

**نکته:** معمولاً فیلترشکن + npm cache clean راه حل مشکل است.
