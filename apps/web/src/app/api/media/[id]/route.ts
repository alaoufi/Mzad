import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// يقدّم الصورة المخزّنة (Data URL) كملفّ ثنائي قابل للتخزين المؤقّت (cache) —
// فتخرج الصور من حمولة JSON الثقيلة، ويحمّلها المتصفّح بتكاسل ويخزّنها، فيسرع الفتح كثيراً.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const m = await prisma.media.findUnique({ where: { id: params.id }, select: { url: true } });
  if (!m?.url) return new Response('Not found', { status: 404 });

  const match = /^data:([^;]+);base64,(.*)$/s.exec(m.url);
  if (!match) {
    // ليست Data URL (رابط خارجي) — أعِد توجيهاً
    return Response.redirect(m.url, 302);
  }
  const mime = match[1] || 'image/jpeg';
  const buf = Buffer.from(match[2], 'base64');
  return new Response(buf, {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(buf.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
