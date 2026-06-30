'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { uiToast } from '@/lib/ui';

interface Ad { id: string; title: string; imageUrl?: string | null; link?: string | null; advertiser?: string | null; createdAt: string }

export default function AdViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ad, setAd] = useState<Ad | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ ad: Ad }>(`/ads/${params.id}`).then((r) => setAd(r.ad)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [params.id]);

  const visit = () => {
    if (!ad?.link) return;
    try { fetch(`/api/ads/${ad.id}/event`, { method: 'POST', body: JSON.stringify({ type: 'CLICK' }), keepalive: true }); } catch {}
    if (ad.link.startsWith('http')) window.open(ad.link, '_blank', 'noopener');
    else router.push(ad.link);
  };
  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) await (navigator as any).share({ title: ad?.title, url });
      else { await navigator.clipboard.writeText(url); uiToast('تم نسخ الرابط', 'success'); }
    } catch {}
  };

  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error || !ad) return <div className="card p-8 text-center"><p className="text-5xl">📭</p><p className="mt-3 font-bold">{error || 'الإعلان غير موجود'}</p>
    <button className="btn-primary mt-4" onClick={() => router.push('/')}>الرئيسية</button></div>;

  return (
    <div className="animate-fadeup mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-engrave">📣 إعلان مموّل</h1>
        <button onClick={() => router.back()} className="text-sm font-bold text-brand">← رجوع</button>
      </div>

      <div className="card overflow-hidden">
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt={ad.title} className="max-h-[60vh] w-full object-contain bg-sand-50" />
        ) : (
          <div className="flex h-48 items-center justify-center text-6xl">📣</div>
        )}
        <div className="p-4">
          <h2 className="text-2xl font-extrabold text-engrave">{ad.title}</h2>
          {ad.advertiser && <p className="mt-1 text-gray-500">{ad.advertiser}</p>}

          <div className="mt-4 flex gap-2">
            {ad.link ? (
              <button onClick={visit} className="btn-primary flex-1">🔗 زيارة الإعلان</button>
            ) : (
              <div className="flex-1 rounded-2xl bg-sand-50 p-3 text-center text-sm text-gray-400">لا يوجد رابط لهذا الإعلان</div>
            )}
            <button onClick={share} className="btn-outline !px-4">📤</button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">هذا محتوى إعلاني مموّل عبر منصة مزاد.</p>
    </div>
  );
}
