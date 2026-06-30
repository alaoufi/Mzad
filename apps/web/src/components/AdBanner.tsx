'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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

export function AdBanner({ placement = 'HOME_TOP' }: { placement?: string }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [i, setI] = useState(0);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    api<{ ads: Ad[] }>(`/ads?placement=${placement}`).then((r) => { setAds(r.ads || []); setI(0); }).catch(() => {});
  }, [placement]);

  // تبادل الإعلانات كل 7 ثوانٍ
  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  const ad = ads[i];
  // تسجيل ظهور مرة واحدة لكل إعلان في هذه الجلسة
  useEffect(() => {
    if (ad && !seen.current.has(ad.id)) { seen.current.add(ad.id); track(ad.id, 'IMPRESSION'); }
  }, [ad]);

  if (!ad) return null;

  const wrapClass =
    'relative mb-4 flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 text-right text-white shadow-md transition active:scale-[0.99]';
  const style = { backgroundImage: 'linear-gradient(135deg, #0e5a6b, #28a0a8)' };

  const content = (
    <>
      <span className="absolute left-3 top-1.5 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold">إعلان</span>
      {ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
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
      <span className="rounded-xl bg-white/25 px-3 py-1.5 text-sm font-bold">عرض ←</span>
    </>
  );

  const onClick = () => track(ad.id, 'CLICK');
  if (ad.link?.startsWith('http')) {
    return <a href={ad.link} target="_blank" rel="noopener noreferrer" onClick={onClick} className={wrapClass} style={style}>{content}</a>;
  }
  return <Link href={ad.link || '/'} onClick={onClick} className={wrapClass} style={style}>{content}</Link>;
}
