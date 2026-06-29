# صورة Docker لتطبيق الويب (Next.js + مسارات API + Prisma)
# السياق (build context) هو جذر المستودع لأن المشروع pnpm monorepo.
FROM node:20-slim

# Prisma يحتاج openssl
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

# نسخ ملفات الحزم لكل مساحات العمل (مطلوبة لحل pnpm workspace)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/mobile/package.json apps/mobile/package.json

# تثبيت تبعيات الويب فقط (مع devDeps لـ ts-node و prisma)
RUN pnpm install --filter @mazad/web... --frozen-lockfile

# نسخ كود الويب
COPY apps/web ./apps/web
WORKDIR /app/apps/web

# توليد عميل Prisma والبناء (لا يحتاج قاعدة بيانات في هذه المرحلة)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm exec prisma generate && pnpm exec next build

EXPOSE 3000

# عند الإقلاع: إنشاء الجداول + بذر البيانات (آمن متكرر) ثم تشغيل الخادم
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec ts-node prisma/seed.ts; pnpm exec next start -p 3000 -H 0.0.0.0"]
