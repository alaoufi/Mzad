import { NextRequest } from 'next/server';
import { json } from '@/lib/server-auth';
import { countryName, REGIONS } from '@/lib/ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// موقع الزائر المكتشف من ترويسات الـIP (Vercel) — للتشخيص والشفافية
export async function GET(req: NextRequest) {
  const country = (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const city = req.headers.get('x-vercel-ip-city') || '';
  const rawRegion = req.headers.get('x-vercel-ip-country-region') || '';
  const rc = rawRegion.toUpperCase().replace(/^SA-?/, '').trim();
  const c = city.toLowerCase();

  // المنطقة المعروفة عندنا (إن طابقت)
  const matched = REGIONS.find((r) => (r.code && rc && rc === r.code) || r.aliases.some((al) => c.includes(al)));

  return json({
    detected: !!(country || city || rawRegion),
    country: country || null,
    countryName: country ? countryName(country) : null,
    city: city ? decodeURIComponent(city) : null,
    regionCode: rawRegion || null,
    regionKey: matched?.key ?? null,
    regionName: matched?.name ?? null,
  });
}
