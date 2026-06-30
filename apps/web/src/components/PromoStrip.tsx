'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { storedRegion } from '@/lib/geo';
import { Countdown } from './Countdown';
import { isOpenEnd } from '@/lib/auction';
import { catImageIcon } from '@/lib/themes';

interface Promo {
  id: string; kind: 'AUCTION' | 'OFFER'; title: string; city: string;
  image: string | null; icon: string | null; categoryName: string | null;
  verified: boolean; endAt: string | null; price: number | null;
}

// شريط ترويجي متحرّك يملأ مكان الإعلان الفارغ: مزادات نشطة + عروض مميّزة مفلترة باهتمام الزائر
export function PromoStrip({ categoryIds }: { categoryIds?: string[] }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const cats = (categoryIds || []).filter(Boolean).join(',');

  useEffect(() => {
    const region = storedRegion();
    const qs = `${cats ? `&cats=${encodeURIComponent(cats)}` : ''}${region ? `&region=${encodeURIComponent(region)}` : ''}`;
    api<{ promos: Promo[] }>(`/promos?x=1${qs}`).then((r) => setPromos(r.promos || [])).catch(() => {});
  }, [cats]);

  if (promos.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl bg-white/70 p-2 ring-1 ring-black/[0.05]">
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <span className="rounded-full bg-gradient-to-l from-gold to-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">✦ ترويج</span>
        <span className="text-xs font-extrabold text-gray-600">مزادات نشطة وعروض مميّزة</span>
        <span className="mr-auto text-[10px] text-gray-400">اسحب ←</span>
      </div>
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex w-max gap-2">
          {promos.map((p, idx) => {
            const soon = p.kind === 'AUCTION' && p.endAt && !isOpenEnd(p.endAt) && (new Date(p.endAt).getTime() - Date.now()) < 3 * 3600 * 1000;
            const img = p.image || catImageIcon(p.categoryName);
            return (
              <Link key={`${p.id}-${idx}`} href={`/listings/${p.id}`}
                className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.05] transition active:scale-95">
                <div className="relative h-20 w-full bg-sand-100">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">{p.icon ?? '🐾'}</div>
                  )}
                  {p.kind === 'AUCTION' ? (
                    <span className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow ${soon ? 'animate-pulse bg-red-600' : 'bg-gradient-to-l from-gold to-amber-500'}`}>
                      {soon ? '⏰ ينتهي قريباً' : '🔨 مزاد'}
                    </span>
                  ) : p.verified ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold text-brand shadow">✔ موثّق</span>
                  ) : null}
                </div>
                <div className="p-1.5">
                  <div className="truncate text-xs font-extrabold text-gray-800">{p.title}</div>
                  <div className="mt-0.5 flex items-center justify-between gap-1">
                    <span className="truncate text-[11px] font-extrabold text-brand-dark">
                      {p.price ? `${p.price.toLocaleString('ar-SA')} ﷼` : (p.kind === 'AUCTION' ? 'مزاد' : 'على السوم')}
                    </span>
                    {p.kind === 'AUCTION' && p.endAt && !isOpenEnd(p.endAt) && (
                      <span className={`shrink-0 text-[9px] font-bold ${soon ? 'text-red-600' : 'text-gray-400'}`}>⏱ <Countdown endAt={p.endAt} /></span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
