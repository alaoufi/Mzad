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

const DEMO = {
  title: 'سوق المستلزمات',
  sub: 'أعلاف · صيدليات بيطرية · أدوات — كل ما يحتاجه حلالك',
  emoji: '🌾',
  from: '#0e5a6b',
  to: '#28a0a8',
};

export function AdBanner({ placement = 'HOME_TOP', onClick }: { placement?: string; onClick?: () => void }) {
  const [ad, setAd] = useState<Ad | null>(null);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<{ ad: Ad | null }>(`/ads?placement=${placement}`).then((r) => setAd(r.ad)).catch(() => {}).finally(() => setLoaded(true));
  }, [placement]);

  // المواضع غير الرئيسية لا تعرض إلا إعلاناً حقيقياً (لا نموذج)
  if (loaded && !ad && placement !== 'HOME_TOP') return null;

  const wrapClass =
    'relative mb-4 flex w-full items-center gap-4 overflow-hidden rounded-3xl p-4 text-right text-white shadow-lg transition active:scale-[0.99]';
  const style = {
    backgroundImage: `linear-gradient(135deg, ${DEMO.from}, ${DEMO.to})`,
    boxShadow: `0 18px 36px -18px ${DEMO.from}99`,
  };

  // إعلان حقيقي من قاعدة البيانات
  if (ad) {
    const content = (
      <>
        <span className="absolute left-3 top-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold">إعلان</span>
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
        ) : (
          <span className="text-4xl drop-shadow">📣</span>
        )}
        <div className="flex-1">
          <div className="text-lg font-extrabold">{ad.title}</div>
          {ad.advertiser && <div className="text-sm text-white/85">{ad.advertiser}</div>}
        </div>
        <span className="rounded-xl bg-white/25 px-3 py-2 text-sm font-bold">عرض ←</span>
      </>
    );
    if (ad.link?.startsWith('http')) {
      return <a href={ad.link} target="_blank" rel="noopener noreferrer" className={wrapClass} style={style}>{content}</a>;
    }
    return <Link href={ad.link || '/'} className={wrapClass} style={style}>{content}</Link>;
  }

  // إعلان داخلي افتراضي (House Ad)
  const demoInner = (
    <>
      <span className="absolute left-3 top-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold">إعلان</span>
      <span className="text-4xl drop-shadow">{DEMO.emoji}</span>
      <div className="flex-1">
        <div className="text-lg font-extrabold">{DEMO.title}</div>
        <div className="text-sm text-white/85">{DEMO.sub}</div>
      </div>
      <span className="rounded-xl bg-white/25 px-3 py-2 text-sm font-bold">تصفّح ←</span>
    </>
  );
  if (onClick) return <button type="button" onClick={onClick} className={wrapClass} style={style}>{demoInner}</button>;
  return <Link href="/" className={wrapClass} style={style}>{demoInner}</Link>;
}
