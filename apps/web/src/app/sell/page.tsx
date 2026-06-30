'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';
import { HijriDate } from '@/components/HijriDate';
import { getCoords } from '@/lib/geo';
import { nearestRegion, regionName } from '@/lib/ads';
import { uiToast } from '@/lib/ui';

interface Cat { id: string; name: string; icon?: string; children?: Cat[] }
interface HealthItem { id: string; label: string }

const FALLBACK_HEALTH: HealthItem[] = [
  { id: 'vaccinated', label: 'مُطعّم' },
  { id: 'udder', label: 'الضرع سليم' },
  { id: 'teeth', label: 'الأسنان سليمة' },
  { id: 'abscess', label: 'خالٍ من الخراجات' },
  { id: 'mange', label: 'خالٍ من الجرب' },
  { id: 'limp', label: 'خالٍ من العرج' },
];

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [manualLoc, setManualLoc] = useState(false);

  const [form, setForm] = useState<any>({
    catPath: [] as Cat[],
    categoryId: '',
    title: '', description: '', photos: [] as string[],
    count: 1, sex: 'MIXED', city: '', region: '',
    lat: null as number | null, lng: null as number | null,
    saleType: 'DIRECT', price: '', startPrice: '', minIncrement: 500, durationHours: 24, startAt: '', typeId: '',
    health: {} as Record<string, boolean>,
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const [locBusy, setLocBusy] = useState(false);
  const captureLocation = async () => {
    setLocBusy(true);
    const c = await getCoords();
    setLocBusy(false);
    if (!c) { uiToast('تعذّر تحديد الموقع — اسمح بالإذن', 'error'); return; }
    setForm((f: any) => ({ ...f, lat: c.lat, lng: c.lng }));
    const rk = nearestRegion(c.lat, c.lng);
    uiToast(rk ? `📍 تم تحديد موقعك — ${regionName(rk)}` : '📍 تم تحديد موقعك', 'success');
  };
  const detectedRegion = form.lat != null ? (nearestRegion(form.lat, form.lng) ? regionName(nearestRegion(form.lat, form.lng)!) : 'موقع محدّد') : '';

  const isBroker = user?.role === 'BROKER' || user?.role === 'ADMIN';

  const [auctionTypes, setAuctionTypes] = useState<{ id: string; name: string; icon?: string | null; commissionPct: number }[]>([]);
  const [healthItems, setHealthItems] = useState<HealthItem[]>(FALLBACK_HEALTH);
  const [commission, setCommission] = useState({ marketCommissionPct: 0, commissionNote: '' });
  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
    api<{ types: any[] }>('/auction-types').then((r) => setAuctionTypes(r.types)).catch(() => {});
    api<{ items: HealthItem[] }>('/health-items').then((r) => { if (r.items?.length) setHealthItems(r.items); }).catch(() => {});
    api<{ marketCommissionPct: number; commissionNote: string }>('/settings')
      .then((r) => setCommission({ marketCommissionPct: r.marketCommissionPct ?? 0, commissionNote: r.commissionNote ?? '' })).catch(() => {});
  }, []);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const out: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) out.push(await compressImage(file));
      set('photos', [...form.photos, ...out].slice(0, 8));
    } catch { setError('تعذّر تحميل بعض الصور'); }
    finally { setUploading(false); }
  };

  // اختيار التصنيف بأي عمق
  const catOptions: Cat[] = form.catPath.length ? (form.catPath[form.catPath.length - 1].children ?? []) : tree;
  const chooseCat = (c: Cat) => {
    const newPath = [...form.catPath, c];
    if (c.children && c.children.length) setForm((f: any) => ({ ...f, catPath: newPath, categoryId: '' }));
    else setForm((f: any) => ({ ...f, catPath: newPath, categoryId: c.id }));
  };
  const truncateCat = (i: number) => setForm((f: any) => ({ ...f, catPath: f.catPath.slice(0, i), categoryId: '' }));

  const hasLoc = form.lat != null;
  const locationOk = hasLoc || (!!form.city.trim() && !!form.region.trim());
  const priceOk = form.saleType === 'DIRECT' ? !!form.price : form.saleType === 'ONSOOM' ? true : !!form.startPrice;
  const canSubmit = !!form.categoryId && form.title.trim().length > 2 && form.description.trim().length > 2 && locationOk && priceOk;

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🔐</p>
          <p className="mb-4 text-lg">سجّل الدخول أولاً لإضافة إعلان</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setError('');
    try {
      const labelOf = (k: string) => healthItems.find((h) => h.id === k)?.label ?? k;
      const health = Object.entries(form.health)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => ({ key, value, label: labelOf(key) }));
      const media = form.photos.map((url: string) => ({ url, type: 'IMAGE' }));

      // الموقع: عند تحديد GPS نشتقّ المنطقة والمدينة تلقائياً
      let city = form.city.trim(), region = form.region.trim();
      if (hasLoc) { region = detectedRegion; city = form.city.trim() || detectedRegion; }

      const body: any = {
        title: form.title, description: form.description, categoryId: form.categoryId,
        count: Number(form.count) || 1, sex: form.sex,
        city, region, saleType: form.saleType, health, media,
        lat: form.lat ?? undefined, lng: form.lng ?? undefined,
      };
      if (form.saleType === 'DIRECT') {
        body.price = form.price ? Number(form.price) : undefined;
      } else if (form.saleType === 'ONSOOM') {
        body.saleType = 'DIRECT'; body.onsoom = true;
        body.auction = { startPrice: Number(form.startPrice || 0), minIncrement: Number(form.minIncrement) };
      } else {
        body.auction = {
          startPrice: Number(form.startPrice), minIncrement: Number(form.minIncrement), durationHours: Number(form.durationHours),
          ...(isBroker && form.startAt ? { startAt: form.startAt } : {}),
          ...(form.typeId ? { typeId: form.typeId } : {}),
        };
      }
      const created = await api<{ id: string }>('/listings', { method: 'POST', body: JSON.stringify(body) });
      router.push(`/listings/${created.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl animate-fadeup space-y-4 pb-4">
      <h1 className="text-2xl font-extrabold text-engrave">➕ إضافة إعلان</h1>
      {error && <div className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      {/* الموقع أولاً — يختصر حقول المدينة/المنطقة */}
      <Section title="📍 موقع الحلال" hint="حدّد موقعك بدقّة ليصل المشترون إليك — أو أدخل المدينة يدوياً.">
        {hasLoc ? (
          <div className="rounded-2xl bg-green-50 p-3">
            <div className="flex items-center gap-2 font-bold text-green-700">
              ✔ موقعك: {detectedRegion}
              <a href={`https://maps.google.com/?q=${form.lat},${form.lng}`} target="_blank" rel="noopener noreferrer"
                className="mr-auto rounded-lg bg-white px-2 py-1 text-xs font-bold text-brand-dark">🗺️ معاينة</a>
              <button type="button" onClick={() => setForm((f: any) => ({ ...f, lat: null, lng: null }))} className="text-xs font-bold text-red-500">إزالة</button>
            </div>
            <input className="input mt-2" placeholder="الحي/المدينة (اختياري)" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
        ) : (
          <>
            <button type="button" onClick={captureLocation} disabled={locBusy}
              className="w-full rounded-2xl bg-brand/10 py-3 font-bold text-brand disabled:opacity-50">
              {locBusy ? 'جارٍ التحديد...' : '🎯 تحديد موقعي بدقّة (GPS)'}
            </button>
            <button type="button" onClick={() => setManualLoc((v) => !v)} className="mt-2 w-full text-center text-sm font-bold text-gray-500">
              {manualLoc ? '▲ إخفاء الإدخال اليدوي' : '▼ أو أدخل المدينة والمنطقة يدوياً'}
            </button>
            {manualLoc && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <input className="input" placeholder="المدينة" value={form.city} onChange={(e) => set('city', e.target.value)} />
                <input className="input" placeholder="المنطقة" value={form.region} onChange={(e) => set('region', e.target.value)} />
              </div>
            )}
          </>
        )}
      </Section>

      {/* التصنيف */}
      <Section title="🗂️ التصنيف">
        <div className="mb-3 flex flex-wrap items-center gap-1 text-sm">
          <button onClick={() => truncateCat(0)} className={`font-bold ${form.catPath.length === 0 ? 'text-brand' : 'text-gray-500'}`}>الكل</button>
          {form.catPath.map((c: Cat, i: number) => (
            <span key={c.id} className="flex items-center gap-1">
              <span className="text-gray-300">›</span>
              <button onClick={() => truncateCat(i + 1)} className="font-bold text-gray-600">{c.icon} {c.name}</button>
            </span>
          ))}
        </div>
        {catOptions.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {catOptions.map((c) => {
              const isLeaf = !c.children || c.children.length === 0;
              const selected = form.categoryId === c.id;
              return (
                <button key={c.id} onClick={() => chooseCat(c)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center font-bold transition ${selected ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>
                  {c.icon && <span className="text-3xl">{c.icon}</span>}
                  <span>{c.name}</span>
                  <span className="text-[11px] font-normal text-gray-400">{isLeaf ? (selected ? '✓ محدّد' : 'اختيار') : 'فروع ›'}</span>
                </button>
              );
            })}
          </div>
        ) : <p className="text-gray-500">لا توجد تصنيفات فرعية.</p>}
        {form.categoryId && <p className="mt-3 rounded-2xl bg-green-50 p-2 text-center font-bold text-green-700">✓ {form.catPath.map((c: Cat) => c.name).join(' › ')}</p>}
      </Section>

      {/* العنوان والوصف */}
      <Section title="✍️ العنوان والوصف">
        <input className="input mb-3" placeholder="عنوان الإعلان (مثال: ناقة مجاهيم منتجة)" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <textarea className="input min-h-[110px]" placeholder="اكتب وصفاً صادقاً للحلال..." value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Section>

      {/* الصور */}
      <Section title="📷 الصور" hint="حتى 8 صور واضحة.">
        <div className="grid grid-cols-3 gap-3">
          {form.photos.map((src: string, i: number) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button onClick={() => set('photos', form.photos.filter((_: string, j: number) => j !== i))}
                className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">✕</button>
            </div>
          ))}
          {form.photos.length < 8 && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-sand-300 text-gray-400 hover:border-brand">
              <span className="text-3xl">{uploading ? '⏳' : '📷'}</span>
              <span className="text-xs font-bold">{uploading ? 'جارٍ...' : 'أضف صورة'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
            </label>
          )}
        </div>
      </Section>

      {/* التفاصيل (بلا وزن) */}
      <Section title="📋 التفاصيل">
        <div className="mb-3">
          <label className="mb-1 block text-sm font-bold text-gray-600">العدد</label>
          <input type="number" className="input w-32" value={form.count} onChange={(e) => set('count', e.target.value)} />
        </div>
        <label className="mb-1 block text-sm font-bold text-gray-600">الجنس</label>
        <div className="flex gap-2">
          {[['MALE', 'ذكر'], ['FEMALE', 'أنثى'], ['MIXED', 'مختلط']].map(([v, l]) => (
            <button key={v} onClick={() => set('sex', v)}
              className={`flex-1 rounded-2xl border-2 py-3 font-bold transition ${form.sex === v ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{l}</button>
          ))}
        </div>
      </Section>

      {/* الصحة */}
      <Section title="🩺 الحالة الصحية" hint="إفصاح صادق يرفع ثقتك.">
        <div className="space-y-2">
          {healthItems.map((h) => {
            const v = form.health[h.id];
            return (
              <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-sand-200 px-3 py-2.5">
                <span className="font-medium">{h.label}</span>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => set('health', { ...form.health, [h.id]: true })}
                    className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${v === true ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 ring-1 ring-green-200'}`}>✔ سليم</button>
                  <button type="button" onClick={() => set('health', { ...form.health, [h.id]: false })}
                    className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${v === false ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>✕ غير سليم</button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* البيع */}
      <Section title="💰 طريقة البيع">
        <div className="mb-4 grid grid-cols-3 gap-2">
          {([['DIRECT', '🏷️ سعر ثابت'], ['ONSOOM', '🤝 على السوم'], ['AUCTION', '🔨 مزاد']] as [string, string][]).map(([v, l]) => (
            <button key={v} onClick={() => set('saleType', v)}
              className={`rounded-2xl border-2 py-3 text-sm font-bold transition ${form.saleType === v ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{l}</button>
          ))}
        </div>

        {commission.marketCommissionPct > 0 && (() => {
          const base = Number(form.saleType === 'DIRECT' ? form.price : form.startPrice) || 0;
          const amount = Math.round((base * commission.marketCommissionPct) / 100);
          return (
            <div className="mb-4 rounded-2xl border-2 border-gold/40 bg-gold/10 p-3 text-sm">
              <div className="font-extrabold text-brand-dark">💰 عمولة السوق {commission.marketCommissionPct}%{base > 0 && <> = <span className="text-amber-700">{amount.toLocaleString('ar-SA')} ﷼</span></>}</div>
              <p className="mt-1 leading-relaxed text-gray-600">{commission.commissionNote}</p>
            </div>
          );
        })()}

        {form.saleType === 'DIRECT' && (
          <div><label className="mb-2 block font-bold">السعر (ريال)</label>
            <input type="number" className="input text-2xl" placeholder="0" value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
        )}
        {form.saleType === 'ONSOOM' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-sand-50 p-3 text-sm text-gray-600">🤝 على السوم: يساوم المشترون بمزايدة مفتوحة <b>بدون وقت محدّد</b>، وتقبل أنت أعلى مبلغ متى شئت.</div>
            <div><label className="mb-2 block font-bold">أقل مبلغ للمساومة (اختياري)</label>
              <input type="number" className="input text-2xl" placeholder="0" value={form.startPrice} onChange={(e) => set('startPrice', e.target.value)} /></div>
            <div><label className="mb-2 block font-bold">أقل زيادة</label>
              <input type="number" className="input" value={form.minIncrement} onChange={(e) => set('minIncrement', e.target.value)} /></div>
          </div>
        )}
        {form.saleType === 'AUCTION' && (
          <div className="space-y-3">
            {auctionTypes.length > 0 && (
              <div><label className="mb-2 block font-bold">نوع المزاد</label>
                <select className="input" value={form.typeId} onChange={(e) => set('typeId', e.target.value)}>
                  <option value="">— اختر نوعاً (اختياري) —</option>
                  {auctionTypes.map((t) => <option key={t.id} value={t.id}>{t.icon ? `${t.icon} ` : ''}{t.name}{t.commissionPct ? ` (عمولة ${t.commissionPct}%)` : ''}</option>)}
                </select></div>
            )}
            <div><label className="mb-2 block font-bold">سعر البداية (ريال)</label>
              <input type="number" className="input text-2xl" value={form.startPrice} onChange={(e) => set('startPrice', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-2 block font-bold">أقل زيادة</label>
                <input type="number" className="input" value={form.minIncrement} onChange={(e) => set('minIncrement', e.target.value)} /></div>
              <div><label className="mb-2 block font-bold">المدة (ساعات)</label>
                <input type="number" className="input" value={form.durationHours} onChange={(e) => set('durationHours', e.target.value)} /></div>
            </div>
            {isBroker && (
              <div>
                <label className="mb-2 block font-bold">🗓️ موعد بداية المزاد (للدلال — اختياري)</label>
                <input type="datetime-local" className="input" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
                {form.startAt && <p className="mt-1 text-sm font-bold text-brand-dark">🗓️ <HijriDate value={form.startAt} withTime /></p>}
                <p className="mt-1 text-sm text-gray-500">اتركه فارغاً ليبدأ فوراً، أو حدّد موعداً مستقبلياً ليُجدول.</p>
              </div>
            )}
          </div>
        )}
      </Section>

      <button onClick={submit} disabled={!canSubmit || busy}
        className="btn-gold w-full !py-4 text-lg disabled:opacity-40">{busy ? 'جارٍ النشر...' : '✔ نشر الإعلان'}</button>
      {!canSubmit && <p className="text-center text-xs text-gray-400">أكمل: التصنيف، العنوان والوصف، الموقع، والسعر.</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="text-lg font-extrabold text-engrave">{title}</h2>
      {hint && <p className="mb-3 mt-0.5 text-xs text-gray-400">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </div>
  );
}
