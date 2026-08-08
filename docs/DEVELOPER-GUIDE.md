# دليل المطوّر الشامل — منصة «مزاد» 🐪

> نسخة مفصّلة لبناء المشروع وتشغيله ونشره من الصفر. تُقرأ مع `README.md` وبقية ملفات `docs/`.

آخر تحديث: يعكس الحالة الحالية للفرع `claude/new-app-development-fmrpdh`.

---

## 1) نظرة عامة

«مزاد» منصّة عربية (RTL) لبيع وشراء ومزادات المواشي (إبل، غنم، ماعز، بقر، خيل) ومستلزماتها،
مصمّمة ليستخدمها كبار السن ومحدودو الخبرة التقنية بسهولة، بتصميم مريح للعين وأداء عالٍ.

**التطبيق المُشغّل فعليًا في الإنتاج هو `apps/web` فقط** (Next.js App Router كامل: واجهة + مسارات API + قاعدة بيانات عبر Prisma).
مجلدا `apps/api` (NestJS) و`apps/mobile` (Expo) موجودان كأساس/مرجع ولا يُنشران مع الويب.

### المكدّس التقني (Stack)
| الطبقة | التقنية |
|--------|---------|
| الإطار | Next.js 14 (App Router, `'use client'`) |
| اللغة | TypeScript + React 18 |
| التنسيق | Tailwind CSS (RTL/عربي) |
| قاعدة البيانات | PostgreSQL (Neon) عبر Prisma ORM |
| المصادقة | JWT (`jsonwebtoken`) عبر مسارات API داخلية |
| الوسائط | تُخزَّن كـ base64 في قاعدة البيانات وتُقدَّم عبر `/api/media/[id]` |
| النشر | Vercel (الويب) + Neon (القاعدة) |
| إدارة الحزم | pnpm (workspaces) |

---

## 2) المتطلبات المسبقة

- **Node.js 18+** و **pnpm 8+** (`npm i -g pnpm`)
- قاعدة **PostgreSQL** — يُنصح بـ [Neon](https://neon.tech) (مجاني، Serverless)
- حساب [Vercel](https://vercel.com) للنشر
- Git

---

## 3) هيكل المشروع

```
Mzad/
├── apps/
│   ├── web/                 ← التطبيق الرئيسي (Next.js) — هذا ما يُنشر
│   │   ├── src/
│   │   │   ├── app/         ← الصفحات ومسارات API (App Router)
│   │   │   │   ├── api/     ← 62 مسار خلفي (route.ts)
│   │   │   │   ├── account/ admin/ listings/ sell/ messages/ disputes/ …
│   │   │   ├── components/  ← مكوّنات الواجهة (Header, BottomNav, admin/*, …)
│   │   │   └── lib/         ← منطق مشترك (api, auth, permissions, themes, media-link, …)
│   │   ├── prisma/
│   │   │   ├── schema.prisma      ← مصدر الحقيقة لنموذج البيانات (21 جدولًا)
│   │   │   ├── migrations/        ← هجرات Prisma التاريخية
│   │   │   └── seed.ts            ← بذور التصنيفات والبيانات الأولية
│   │   ├── package.json
│   │   └── next.config.js
│   ├── api/                 ← NestJS (مرجع، غير منشور)
│   └── mobile/              ← Expo (مرجع، غير منشور)
├── docs/                    ← الوثائق (بما فيها هذا الملف و DB-SETUP.sql)
├── deploy/
├── pnpm-workspace.yaml
└── package.json
```

### مجلد `lib/` — الوحدات المهمة
| الملف | الوظيفة |
|-------|---------|
| `lib/api.ts` | غلاف `fetch` موحّد لمناداة مسارات `/api` + الأنواع |
| `lib/auth.tsx` | سياق المصادقة (`useAuth`) وتخزين الـ JWT |
| `lib/permissions.ts` | مصفوفة الصلاحيات: أقسام × إجراءات حسب نوع الحساب — `can()`, `canAny()` |
| `lib/roles.ts` | تعريف أنواع الحسابات (شارات، تسميات، الدور الأساسي) |
| `lib/media-link.ts` | تحويل روابط الوسائط في JSON إلى `/api/media/…` للأداء |
| `lib/themes.ts` + `lib/theme-context.tsx` | ثيمات كل نوع ماشية (زخارف السدو/النخيل/النجوم) |
| `lib/saudi-regions.ts` | مناطق ومدن السعودية للـ RegionCityPicker |
| `lib/disputes.ts` | فئات النزاع، طرق الدفع، الحالات، ودوال مساعدة |

---

## 4) الإعداد المحلّي خطوة بخطوة

```bash
# 1) استنساخ وتثبيت الاعتماديات (من جذر المستودع)
git clone https://github.com/alaoufi/Mzad.git
cd Mzad
pnpm install

# 2) ملف البيئة لتطبيق الويب
cd apps/web
cp .env.example .env.local
#   ثم حرّر .env.local وأضف اتصال القاعدة (انظر القسم 5)

# 3) توليد عميل Prisma
npx prisma generate

# 4) بناء القاعدة (اختر إحدى الطرق في القسم 6)
npx prisma db push        # الأسهل: يبني القاعدة مطابقةً للمخطط

# 5) البذور الأولية (تصنيفات المواشي) — اختياري
npx ts-node prisma/seed.ts

# 6) التشغيل
npm run dev               # http://localhost:3000
```

---

## 5) متغيّرات البيئة (Environment Variables)

توضع في `apps/web/.env.local` محليًا، وفي إعدادات Vercel للإنتاج.

| المتغيّر | مطلوب | الوصف |
|---------|:----:|-------|
| `DATABASE_URL` | ✅ | اتصال Postgres (عبر الـ pooler في Neon) — يستخدمه Prisma للاستعلامات |
| `DIRECT_URL` | ✅ | اتصال مباشر (بلا pooler) — يستخدمه Prisma للهجرات/`db push` |
| `JWT_SECRET` | ✅ | مفتاح توقيع رموز الدخول (سلسلة عشوائية طويلة) |
| `ADMIN_PHONES` | ⭕ | أرقام هواتف تُمنح دور المشرف تلقائيًا (مفصولة بفواصل) |
| `NEXT_PUBLIC_API_URL` | ⭕ | عنوان الـ API (افتراضيًا نفس النطاق) |
| `NEXT_PUBLIC_WS_URL` | ⭕ | عنوان WebSocket للرسائل اللحظية (إن استُخدم) |

مثال `.env.local`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="ضع-هنا-سلسلة-عشوائية-طويلة-جدًا"
ADMIN_PHONES="0500000000"
```

> في Neon: رابط الـ **Pooled** → `DATABASE_URL`، ورابط الـ **Direct** → `DIRECT_URL`.

---

## 6) بناء قاعدة البيانات — ثلاث طرق

`apps/web/prisma/schema.prisma` هو **مصدر الحقيقة** (21 جدولًا). اختر ما يناسبك:

### الطريقة أ — `prisma db push` (الأسهل، موصى بها للتطوير)
يقرأ المخطط ويبني/يحدّث القاعدة لتطابقه مباشرةً، بلا ملفات هجرة:
```bash
cd apps/web
npx prisma db push
```

### الطريقة ب — السكربت الجاهز `docs/DB-SETUP.sql` (بناء من الصفر بلا Prisma)
سكربت DDL كامل مولّد من المخطط الحالي — الصقه في Neon SQL Editor أو:
```bash
psql "$DIRECT_URL" -f docs/DB-SETUP.sql
```

### الطريقة ج — الهجرات (`prisma migrate deploy`)
تُطبّق ملفات الهجرة في `prisma/migrations/`:
```bash
cd apps/web
npx prisma migrate deploy
```
> ⚠️ ملاحظة: بعض حقول نموذج `Dispute` أُضيفت لاحقًا خارج ملفات الهجرة. لذا إن استخدمت
> الطريقة (ج) فشغّل بعدها زر **«تهيئة قاعدة البيانات»** في لوحة الإدارة (⚙️ تجهيزات الموقع)
> أو نفّذ نقطة النهاية `POST /api/admin/db-setup` (للمشرف) — فهي تنفّذ
> `ALTER TABLE … ADD COLUMN IF NOT EXISTS` بشكل غير مدمّر لسدّ أي فروقات. أو ببساطة استخدم الطريقة (أ) أو (ب).

### البذور (Seed)
`prisma/seed.ts` يزرع شجرة التصنيفات (نوع ← لون/صنف ← سلالة) لكل المواشي:
```bash
cd apps/web && npx ts-node prisma/seed.ts
```

---

## 7) التشغيل والبناء

```bash
# التطوير
cd apps/web && npm run dev          # http://localhost:3000

# البناء الإنتاجي محليًا (كما يفعل Vercel)
cd apps/web && npm run build        # يشغّل: prisma generate && migrate deploy && seed && next build
cd apps/web && npm start            # تشغيل النسخة المبنية
```

سكربت `build` في `apps/web/package.json`:
```
prisma generate
  && (prisma migrate deploy || echo '⚠️ migrate skipped')
  && (ts-node prisma/seed.ts   || echo '⚠️ seed skipped')
  && next build
```
> ⚠️ **درس مهم:** `prisma generate` غير محمي بـ `|| echo`. فإذا كان `schema.prisma`
> يحتوي خطأ (مثل حقل مكرّر)، يفشل هذا الأمر ويتوقّف **بناء Vercel بالكامل**، فيبقى الإنتاج
> على نسخة قديمة. لذا **تحقّق دائمًا من صحة المخطط قبل الدفع**:
> ```bash
> cd apps/web && npx prisma validate
> ```

---

## 8) النشر (Vercel + Neon)

1. أنشئ قاعدة على **Neon** واحصل على رابطي Pooled/Direct.
2. في **Vercel** → New Project → اربط مستودع GitHub.
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js (يُكتشف تلقائيًا)
   - **Install Command:** `pnpm install`
   - **Build Command:** الافتراضي (يستخدم سكربت `build` أعلاه)
3. أضف متغيّرات البيئة (القسم 5) في Vercel.
4. الفرع المرتبط بالإنتاج هنا: `claude/new-app-development-fmrpdh`.
   كل دفع (push) إلى هذا الفرع يُطلق بناءً ونشرًا تلقائيًا.
5. للتحقق من نجاح النشر: راقب صفحة Deployments في Vercel، أو:
   ```bash
   curl -sI https://<your-app>.vercel.app/ | grep -i age   # age صغير = نشر حديث
   ```

---

## 9) أنظمة رئيسية داخل التطبيق

- **الصلاحيات (`lib/permissions.ts`):** أقسام `profile/site/listings/market` × إجراءات
  `view/add/edit/delete` حسب نوع الحساب. لوحة الإدارة `/admin` صفحة واحدة بأربعة تبويبات
  ثلاثية الأبعاد تظهر حسب الصلاحية.
- **الوسائط والأداء:** الصور تُخزَّن base64 في القاعدة وتُقدَّم عبر `/api/media/[id]`
  (فكّ ترميز data URI + `Cache-Control: immutable`). `mediaLink()` في `lib/media-link.ts`
  يعيد كتابة روابط JSON. هذا خفّض حمولات كبيرة (246KB → 9.8KB).
- **الثيمات:** لكل نوع ماشية هوية بصرية (زخارف سدو/نخيل/نجوم) عبر `lib/themes.ts`.
- **النزاعات (`Dispute`):** نظام شكاوى ثنائي الأطراف مع أدلة منفصلة لكل طرف وتصدير للجهات
  المختصة — مسارات `/disputes`, `/api/disputes/*`, ولوحة `/admin/disputes/[id]`.
- **البيانات البنكية في المحادثة:** رسائل تبدأ بعلامة `[[BANK]]` تُعرض كبطاقة بنكية مع
  إخلاء مسؤولية حماية (بلا تعديل مخطط).
- **المناطق/المدن:** `RegionCityPicker` معتمد على `lib/saudi-regions.ts` (13 منطقة).

---

## 10) استكشاف الأخطاء (Troubleshooting)

| العرض | السبب/الحل |
|------|-----------|
| النشر لا يظهر رغم الدفع | غالبًا فشل بناء Vercel. تحقّق: `npx prisma validate` ثم `npm run build` محليًا. `age` كبير في ترويسة الاستجابة = لم يحدث نشر جديد. |
| `Field X is already defined` | حقل مكرّر في `schema.prisma` — يفشل `prisma generate` ويوقف البناء. احذف التكرار. |
| `Environment variable not found: DIRECT_URL` | أضف `DIRECT_URL` إلى `.env.local`/Vercel. |
| نسخة قديمة عالقة في المتصفّح | صفحات HTML مضبوطة على `no-store`، لا يوجد service worker. حدّث الصفحة؛ إن استمرّت فالمشكلة في النشر لا المتصفّح. |
| فشل الهجرات عبر الـ pooler | استخدم `DIRECT_URL` (اتصال مباشر) للهجرات، أو `prisma db push`. |
| الصور بطيئة | تأكّد أنها تُقدَّم عبر `/api/media/[id]` لا كـ base64 مضمّن في JSON. |

### أوامر مرجعية سريعة
```bash
pnpm install                          # تثبيت كل الحزم
cd apps/web
npx prisma validate                   # التحقق من صحة المخطط (افعلها قبل كل دفع)
npx prisma generate                   # توليد العميل
npx prisma db push                    # بناء/تحديث القاعدة من المخطط
npx prisma studio                     # واجهة رسومية لتصفّح القاعدة
npx ts-node prisma/seed.ts            # البذور
npm run dev                           # تطوير
npm run build                         # بناء إنتاجي
```

---

## 11) الأمان — تذكيرات

- لا تُودِع أسرارًا في المستودع؛ استخدم `.env.local` (مُتجاهَل في git) وإعدادات Vercel.
- دوّر `JWT_SECRET` وكلمة مرور قاعدة Neon قبل الإطلاق العام.
- مسارات الإدارة تتحقق من الدور خادميًا؛ لا تعتمد على إخفاء الأزرار في الواجهة فقط.

---

_بُني هذا الدليل ليكون كافيًا لمطوّر جديد كي يشغّل المشروع محليًا ويبنيه وينشره دون معرفة مسبقة._
