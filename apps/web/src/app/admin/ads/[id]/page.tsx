'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { placementLabel, packageByKey, countryName, riyals } from '@/lib/ads';

interface Ad {
  id: string; title: string; placement: string; status: string; advertiser?: string | null;
  targetCountries?: string | null; packageKey?: string | null; priceHalalas?: number | null;
  maxImpressions?: number | null; startAt?: string | null; endAt?: string | null; impressions: number; clicks: number;
}
interface Stat { day: string; impressions: number; clicks: number }

export default function AdStatsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<{ ad: Ad; stats: Stat[] }>(`/admin/ads/${params.id}`)
      .then((r) => { setAd(r.ad); setStats(r.stats); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">سجّل الدخول بحساب مشرف</p>;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error || !ad) return <div className="card p-8 text-center"><p className="text-5xl">🚫</p><p className="mt-3 font-bold">{error || 'غير موجود'}</p></div>;

  const pkg = packageByKey(ad.packageKey);
  const cap = ad.maxImpressions ?? 0;
  const ctr = ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0';
  const remaining = cap ? Math.max(0, cap - ad.impressions) : null;
  const dl = ad.endAt ? Math.ceil((new Date(ad.endAt).getTime() - Date.now()) / 86400000) : null;
  const countries = (ad.targetCountries || '').split(',').map((s) => s.trim()).filter(Boolean);
  const maxDay = Math.max(1, ...stats.map((s) => s.impressions));

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="truncate text-xl font-extrabold text-engrave">📊 {ad.title}</h1>
        <button onClick={() => router.push('/admin/ads')} className="shrink-0 text-sm font-bold text-brand">← الإعلانات</button>
      </div>

      <div className="card p-4 text-sm text-gray-600">
        <div>{placementLabel(ad.placement)}{ad.advertiser ? ` · ${ad.advertiser}` : ''}{pkg ? ` · ${pkg.label}` : ''}</div>
        <div className="mt-1">🌍 {countries.length ? countries.map(countryName).join('، ') : 'كل الدول'}{ad.priceHalalas != null && ` · 💰 ${riyals(ad.priceHalalas)} ﷼`}</div>
        {ad.endAt && <div className="mt-1">ينتهي: {new Date(ad.endAt).toLocaleDateString('ar-SA')}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Big n={ad.impressions.toLocaleString('ar-SA')} l="إجمالي المشاهدات" />
        <Big n={ad.clicks.toLocaleString('ar-SA')} l="إجمالي النقرات" />
        <Big n={`${ctr}%`} l="نسبة النقر (CTR)" />
        <Big n={remaining == null ? '∞' : remaining.toLocaleString('ar-SA')} l="مشاهدات متبقّية" />
      </div>
      {cap > 0 && (
        <div className="card p-4">
          <div className="mb-1 flex justify-between text-xs font-bold text-gray-500">
            <span>استهلاك الباقة</span><span>{Math.min(100, Math.round((ad.impressions / cap) * 100))}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-sand-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (ad.impressions / cap) * 100)}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-gray-400">{ad.impressions.toLocaleString('ar-SA')} / {cap.toLocaleString('ar-SA')} · المتبقّي بالأيام: {dl == null ? '∞' : dl < 0 ? 'انتهى' : dl}</div>
        </div>
      )}

      {/* الخط الزمني اليومي */}
      <div className="card p-4">
        <h2 className="mb-3 font-bold">المشاهدات اليومية</h2>
        {stats.length === 0 ? (
          <p className="py-6 text-center text-gray-400">لا توجد بيانات بعد</p>
        ) : (
          <div className="flex items-end gap-1.5 overflow-x-auto pb-2" style={{ minHeight: 140 }}>
            {stats.map((s) => (
              <div key={s.day} className="flex w-8 shrink-0 flex-col items-center gap-1">
                <span className="text-[9px] text-gray-400">{s.impressions}</span>
                <div className="flex w-full items-end" style={{ height: 100 }}>
                  <div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(4, (s.impressions / maxDay) * 100)}%` }} title={`${s.impressions} مشاهدة · ${s.clicks} نقرة`} />
                </div>
                <span className="text-[9px] text-gray-400">{s.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Big({ n, l }: { n: string; l: string }) {
  return <div className="card p-4 text-center"><div className="text-2xl font-extrabold text-brand-dark">{n}</div><div className="mt-0.5 text-xs text-gray-400">{l}</div></div>;
}
