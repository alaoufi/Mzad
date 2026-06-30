import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// معرّف النشر الحالي على الخادم — يُقارَن بحزمة العميل لكشف النسخ القديمة المخزّنة في المتصفّح
export async function GET() {
  const id = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'dev';
  return new NextResponse(JSON.stringify({ build: id }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store, max-age=0' },
  });
}
