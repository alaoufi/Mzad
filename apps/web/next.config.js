/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // معرّف البناء يُضمَّن في حزمة العميل لمقارنته بالخادم وكشف النسخ القديمة المخزّنة
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'dev',
  },
  // صفحات HTML بلا تخزين إطلاقاً (الملفات الثابتة _next تبقى مخزّنة بمعرّف فريد) — يضمن تحميل أحدث كود
  // دائماً ويكسر مشكلة النسخ القديمة العالقة في المتصفّح/الشبكة البطيئة.
  async headers() {
    return [
      {
        source: '/((?!_next/|icons/|api/).*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
    ];
  },
};

module.exports = nextConfig;
