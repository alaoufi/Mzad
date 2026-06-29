'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Ad {
  id: string;
  title: string;
  imageUrl?: string | null;
  link?: string | null;
  advertiser?: string | null;
}

export function AdBanner({ placement = 'HOME_TOP' }: { placement?: string; onClick?: () => void }) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    api<{ ad: Ad | null }>(`/ads?placement=${placement}`).then((r) => setAd(r.ad)).catch(() => {});
  }, [placement]);

  // لا نعرض شيئاً إلا إعلاناً حقيقياً من الإدارة (لا إعلانات افتراضية تزاحم المحتوى)
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
      <div className="flex-1">
        <div className="font-extrabold">{ad.title}</div>
        {ad.advertiser && <div className="text-xs text-white/85">{ad.advertiser}</div>}
      </div>
      <span className="rounded-xl bg-white/25 px-3 py-1.5 text-sm font-bold">عرض ←</span>
    </>
  );
  if (ad.link?.startsWith('http')) {
    return <a href={ad.link} target="_blank" rel="noopener noreferrer" className={wrapClass} style={style}>{content}</a>;
  }
  return <Link href={ad.link || '/'} className={wrapClass} style={style}>{content}</Link>;
}
