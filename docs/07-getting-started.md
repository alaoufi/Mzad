# دليل التشغيل التفصيلي

## المتطلبات
- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker + Docker Compose (لقاعدة البيانات و Redis)

## 1) تثبيت الحزم
```bash
pnpm install
```

## 2) إعداد المتغيّرات
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

## 3) تشغيل قاعدة البيانات
```bash
docker compose up -d        # PostgreSQL على 5432 و Redis على 6379
```

> لا يوجد Docker؟ شغّل PostgreSQL محلياً وحدّث `DATABASE_URL`. الـ API يعمل بدون Redis (يسقط تلقائياً لقفل داخلي).

## 4) تجهيز قاعدة البيانات
```bash
pnpm --filter @mazad/api prisma:generate
pnpm --filter @mazad/api prisma:migrate     # ينشئ الجداول
pnpm --filter @mazad/api prisma:seed        # بيانات تجريبية
```

## 5) التشغيل
```bash
pnpm dev          # يشغّل الـ API (4000) والويب (3000) معاً
```
أو كلٌّ على حدة:
```bash
pnpm --filter @mazad/api dev
pnpm --filter @mazad/web dev
```

## الروابط
| الخدمة | الرابط |
|--------|--------|
| الويب | http://localhost:3000 |
| الـ API | http://localhost:4000/api |
| توثيق Swagger | http://localhost:4000/docs |

## حسابات تجريبية (بعد seed)
| الدور | الجوال | ملاحظة |
|------|--------|--------|
| بائع موثّق | `0500000001` | لديه إعلانات ومزاد |
| دلال | `0500000002` | — |
| مشتري | `0500000003` | — |

رمز OTP يُطبع في سجل الـ API (وضع التطوير) ويظهر أيضاً في شاشة الدخول.

## تجربة المزاد اللحظي
1. افتح الإعلان الذي نوعه "مزاد" من الصفحة الرئيسية.
2. سجّل الدخول بحساب المشتري في نافذة، والدلال في نافذة أخرى.
3. زايِد من النافذتين وراقب التحديث الفوري وميزة تمديد الوقت (Anti-sniping).

## تطبيق الجوال
```bash
pnpm --filter @mazad/mobile start
```
