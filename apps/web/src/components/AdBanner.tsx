'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { storedRegion } from '@/lib/geo';
import { PromoStrip } from './PromoStrip';

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
  const [loaded, setLoaded] = useState(false);
  const seen = useRef<Set<string>>(new Set());
  const cats = (categoryIds || []).filter(Boolean).join(',');

  useEffect(() => {
    const region = storedRegion();
    const qs = `${cats ? `&cats=${encodeURIComponent(cats)}` : ''}${region ? `&region=${encodeURIComponent(region)}` : ''}`;
    setLoaded(false);
    api<{ ads: Ad[] }>(`/ads?placement=${placement}${qs}`)
      .then((r) => { setAds(r.ads || []); setI(0); })
      .catch(() => setAds([]))
      .finally(() => setLoaded(true));
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

  // لا إعلان مدفوع → بطاقة ترويجية (مزادات نشطة + عروض مميّزة). لا نعرض شيئاً قبل اكتمال الجلب لمنع الوميض.
  if (!ad) return loaded ? <PromoStrip categoryIds={categoryIds} /> : null;

  // النقر على الإعلان: يفتح الرابط إن وُجد، وإلا يعرض الإعلان
  const openMain = () => {
    track(ad.id, 'CLICK');
    if (ad.link?.startsWith('http')) window.open(ad.link, '_blank', 'noopener');
    else if (ad.link) router.push(ad.link);
    else router.push(`/ads/${ad.id}`);
  };
  // زر «عرض الإعلان»: يعرض معلومات الإعلان دائماً
  const openInfo = (e: { stopPropagation: () => void }) => { e.stopPropagation(); router.push(`/ads/${ad.id}`); };

  return (
      <div onClick={openMain} role="button" tabIndex={0}
        className="relative my-4 w-full cursor-pointer overflow-hidden rounded-2xl bg-white text-right shadow-md ring-1 ring-black/[0.05] transition active:scale-[0.99]">
        {/* شريط علوي رفيع يميّزه كإعلان مموّل */}
        <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--th-from, #0e5a6b), var(--th-to, #28a0a8))' }}>
          <span className="flex items-center gap-1">📣 إعلان مموّل</span>
          {ads.length > 1 && (
            <span className="flex gap-1">
              {ads.map((_, k) => <span key={k} className={`h-1.5 w-1.5 rounded-full ${k === i ? 'bg-white' : 'bg-white/40'}`} />)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 p-3">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-3xl">📣</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-extrabold text-engrave">{ad.title}</div>
            {ad.advertiser && <div className="mt-0.5 truncate text-xs text-gray-500">{ad.advertiser}</div>}
            <button onClick={openInfo}
              className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
              style={{ backgroundImage: 'linear-gradient(135deg, var(--th-from, #0e5a6b), var(--th-to, #28a0a8))' }}>
              عرض الإعلان ←
            </button>
          </div>
        </div>
      </div>
  );
}
