'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Ad { id: string; title: string; imageUrl?: string | null; link?: string | null; advertiser?: string | null }

// تسجيل حدث (ظهور/نقرة) دون تعطيل التنقّل
function track(id: string, type: 'IMPRESSION' | 'CLICK') {
  try {
    const body = JSON.stringify({ type });
    if (navigator.sendBeacon) navigator.sendBeacon(`/api/ads/${id}/event`, new Blob([body], { type: 'application/json' }));
    else fetch(`/api/ads/${id}/event`, { method: 'POST', body, keepalive: true });
  } catch {}
}

export function AdBanner({ placement = 'HOME_TOP', categoryIds }: { placement?: string; categoryIds?: string[] }) {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [i, setI] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const cats = (categoryIds || []).filter(Boolean).join(',');

  useEffect(() => {
    const qs = cats ? `&cats=${encodeURIComponent(cats)}` : '';
    api<{ ads: Ad[] }>(`/ads?placement=${placement}${qs}`).then((r) => { setAds(r.ads || []); setI(0); }).catch(() => {});
  }, [placement, cats]);

  // تبادل الإعلانات كل 7 ثوانٍ
  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  const ad = ads[i];
  useEffect(() => {
    if (ad && !seen.current.has(ad.id)) { seen.current.add(ad.id); track(ad.id, 'IMPRESSION'); }
  }, [ad]);

  if (!ad) return null;

  // النقر يعرض الإعلان نفسه (صفحة عرض الإعلان)
  const open = () => { track(ad.id, 'CLICK'); router.push(`/ads/${ad.id}`); };

  return (
      <button onClick={open}
        className="relative mb-4 flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 text-right text-white shadow-md transition active:scale-[0.99]"
        style={{ backgroundImage: 'linear-gradient(135deg, var(--th-from, #0e5a6b), var(--th-to, #28a0a8))' }}>
        <span className="absolute left-3 top-1.5 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold">إعلان</span>
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/30" />
        ) : (
          <span className="text-3xl drop-shadow">📣</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold">{ad.title}</div>
          {ad.advertiser && <div className="truncate text-xs text-white/85">{ad.advertiser}</div>}
        </div>
        {ads.length > 1 && (
          <span className="absolute bottom-1.5 left-3 flex gap-1">
            {ads.map((_, k) => <span key={k} className={`h-1 w-1 rounded-full ${k === i ? 'bg-white' : 'bg-white/40'}`} />)}
          </span>
        )}
        <span className="shrink-0 rounded-xl bg-white/25 px-3 py-1.5 text-sm font-bold">عرض ←</span>
      </button>
  );
}
