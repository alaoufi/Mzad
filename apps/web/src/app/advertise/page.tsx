'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uiToast } from '@/lib/ui';
import { compressImage } from '@/lib/image';
import { AD_PLACEMENTS, AD_PACKAGES, COUNTRIES, REGIONS, placementLabel, packageByKey, countryName, regionName, riyals } from '@/lib/ads';
import { detectRegionViaGPS, storedRegion } from '@/lib/geo';

interface Ad {
  id: string; title: string; placement: string; status: string; packageKey?: string | null;
  maxImpressions?: number | null; impressions: number; clicks: number; endAt?: string | null; targetCountries?: string | null;
}
const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'نشط', cls: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'موقوف', cls: 'bg-gray-200 text-gray-600' },
  PENDING: { label: 'بانتظار الموافقة', cls: 'bg-amber-100 text-amber-700' },
  EXPIRED: { label: 'منتهٍ', cls: 'bg-red-100 text-red-700' },
};

export default function AdvertisePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [mine, setMine] = useState<Ad[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [placement, setPlacement] = useState('HOME_TOP');
  const [packageKey, setPackageKey] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string; icon?: string | null }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [geo, setGeo] = useState<{ countryName?: string | null; city?: string | null; regionName?: string | null; detected?: boolean } | null>(null);
  const [gpsRegion, setGpsRegion] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  useEffect(() => { setGpsRegion(storedRegion()); }, []);
  const detectGps = async () => {
    setGpsBusy(true);
    const key = await detectRegionViaGPS();
    setGpsBusy(false);
    if (key) { setGpsRegion(key); uiToast(`📍 منطقتك بدقّة: ${regionName(key)}`, 'success'); }
    else uiToast('تعذّر تحديد الموقع — تأكّد من السماح بالإذن', 'error');
  };
  const load = () => api<{ ads: Ad[] }>('/ads/mine').then((r) => setMine(r.ads)).catch(() => {});
  useEffect(() => { if (user) load(); }, [user]);
  useEffect(() => { api<{ id: string; name: string; icon?: string | null }[]>('/categories').then(setSections).catch(() => {}); }, []);
  useEffect(() => { api<any>('/geo').then(setGeo).catch(() => {}); }, []);

  const pickImage = async (f: FileList | null) => {
    if (!f?.length) return;
    setUploading(true);
    try { const url = await compressImage(f[0]); setImageUrl(url); } catch { uiToast('تعذّر تحميل الصورة'); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!title.trim()) { uiToast('اكتب عنوان الإعلان'); return; }
    if (!packageKey) { uiToast('اختر باقة'); return; }
    setSaving(true);
    try {
      await api('/ads/request', { method: 'POST', body: JSON.stringify({ title, link, imageUrl, placement, packageKey, targetCountries: countries.join(','), targetRegions: regions.join(','), targetCategories: categories.join(',') }) });
      uiToast('✅ تم استلام طلبك — بانتظار موافقة الإدارة', 'success');
      setTitle(''); setLink(''); setImageUrl(''); setPackageKey(''); setCountries([]); setRegions([]); setCategories([]);
      load();
    } catch (e: any) { uiToast(e.message); }
    finally { setSaving(false); }
  };

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8"><p className="mb-4 text-5xl">📣</p><p className="mb-4 text-lg">أعلن معنا — سجّل الدخول أولاً</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button></div>
      </div>
    );
  }

  const pkg = packageByKey(packageKey);

  return (
    <div className="animate-fadeup space-y-5">
      <h1 className="text-2xl font-extrabold text-engrave">📣 أعلن معنا</h1>
      <p className="text-sm text-gray-500">صمّم إعلانك، اختر مكانه ودوله وباقته، وأرسله. يظهر بعد موافقة الإدارة، وتتابع إحصاءاته هنا.</p>

      <div className="card space-y-3 p-4">
        <div><label className="mb-1 block text-sm font-bold text-gray-600">عنوان الإعلان</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مزرعة الوفاء للأغنام" /></div>

        <div><label className="mb-1 block text-sm font-bold text-gray-600">الصورة</label>
          <div className="flex items-center gap-2">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand-100 text-xl">
              {imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : (uploading ? '⏳' : '📷')}
            </div>
            <label className="cursor-pointer rounded-xl bg-sand-100 px-4 py-2 text-sm font-bold text-gray-700">
              {uploading ? 'جارٍ...' : 'اختر صورة'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files)} />
            </label>
          </div></div>

        <div><label className="mb-1 block text-sm font-bold text-gray-600">رابط الإعلان (اختياري)</label>
          <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." /></div>

        <div><label className="mb-1 block text-sm font-bold text-gray-600">مكان الظهور</label>
          <select className="input" value={placement} onChange={(e) => setPlacement(e.target.value)}>
            {AD_PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{p.label} — {p.where}</option>)}
          </select></div>

        <div><label className="mb-1 block text-sm font-bold text-gray-600">الأقسام (فارغ = كل الأقسام)</label>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s) => {
              const on = categories.includes(s.id);
              return <button key={s.id} type="button"
                onClick={() => setCategories((p) => on ? p.filter((x) => x !== s.id) : [...p, s.id])}
                className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${on ? 'bg-brand text-white ring-brand' : 'bg-white text-gray-600 ring-sand-200'}`}>{s.icon} {s.name}</button>;
            })}
          </div></div>

        <div><label className="mb-1 block text-sm font-bold text-gray-600">الدول (فارغ = كل الدول)</label>
          <div className="flex flex-wrap gap-1.5">
            {COUNTRIES.map((c) => {
              const on = countries.includes(c.code);
              return <button key={c.code} type="button"
                onClick={() => setCountries((p) => on ? p.filter((x) => x !== c.code) : [...p, c.code])}
                className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${on ? 'bg-brand text-white ring-brand' : 'bg-white text-gray-600 ring-sand-200'}`}>{c.name}</button>;
            })}
          </div></div>

        <div className="rounded-2xl bg-sand-50 p-3 text-center text-xs text-gray-500">
          {gpsRegion ? (
            <>📍 منطقتك بدقّة (GPS): <b className="text-brand-dark">{regionName(gpsRegion)}</b></>
          ) : geo?.detected ? (
            <>📍 موقعك التقريبي (IP): <b className="text-gray-700">{geo.regionName || geo.city || geo.countryName || 'غير معروف'}</b></>
          ) : '📍 الموقع غير معروف بعد.'}
          <button type="button" onClick={detectGps} disabled={gpsBusy}
            className="mt-2 block w-full rounded-xl bg-brand/10 py-2 font-bold text-brand disabled:opacity-50">
            {gpsBusy ? 'جارٍ التحديد...' : '🎯 حدّد موقعي بدقّة (GPS)'}
          </button>
          <p className="mt-1 text-[10px] text-gray-400">يتطلّب إذنك، ويُحسب محلياً على جهازك بلا إرسال إحداثيات.</p>
        </div>


        <div><label className="mb-1 block text-sm font-bold text-gray-600">المناطق/المدن (اختياري — فارغ = كل المناطق)</label>
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map((r) => {
              const on = regions.includes(r.key);
              return <button key={r.key} type="button"
                onClick={() => setRegions((p) => on ? p.filter((x) => x !== r.key) : [...p, r.key])}
                className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${on ? 'bg-brand text-white ring-brand' : 'bg-white text-gray-600 ring-sand-200'}`}>{r.name}</button>;
            })}
          </div></div>

        <div><label className="mb-1 block text-sm font-bold text-gray-600">الباقة (تنتهي بانتهاء المدة أو بلوغ المشاهدات — أيهما أوّل)</label>
          <div className="grid gap-2">
            {AD_PACKAGES.map((p) => (
              <button key={p.key} type="button" onClick={() => setPackageKey(p.key)}
                className={`flex items-center justify-between rounded-2xl border-2 p-3 text-right ${packageKey === p.key ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>
                <span className="font-bold">{p.label}</span>
                <span className="font-extrabold text-brand-dark">{riyals(p.priceHalalas)} ﷼</span>
              </button>
            ))}
          </div></div>

        {pkg && <div className="rounded-2xl bg-sand-50 p-3 text-center text-sm text-gray-600">المدّة: {pkg.days} يوم · السقف: {pkg.maxImpressions.toLocaleString('ar-SA')} مشاهدة · السعر: <b>{riyals(pkg.priceHalalas)} ﷼</b></div>}

        <button onClick={submit} disabled={saving || uploading} className="btn-primary w-full disabled:opacity-50">{saving ? '...' : 'إرسال الطلب'}</button>
        <p className="text-center text-xs text-gray-400">الدفع لاحقاً عند الاعتماد — لا يُخصم شيء الآن.</p>
      </div>

      {mine.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold">إعلاناتي</h2>
          {mine.map((a) => {
            const st = STATUS[a.status] ?? STATUS.PENDING;
            const cap = a.maxImpressions ?? 0;
            const pct = cap ? Math.min(100, Math.round((a.impressions / cap) * 100)) : 0;
            return (
              <div key={a.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold">{a.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">{placementLabel(a.placement)} · 🌍 {(a.targetCountries || '').split(',').filter(Boolean).map(countryName).join('، ') || 'كل الدول'}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-sand-50 py-2"><div className="font-extrabold text-brand-dark">{a.impressions.toLocaleString('ar-SA')}</div><div className="text-[10px] text-gray-400">مشاهدة</div></div>
                  <div className="rounded-xl bg-sand-50 py-2"><div className="font-extrabold text-brand-dark">{a.clicks.toLocaleString('ar-SA')}</div><div className="text-[10px] text-gray-400">نقرة</div></div>
                </div>
                {cap > 0 && <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-100"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
