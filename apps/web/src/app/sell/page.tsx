'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';
import { HijriDate } from '@/components/HijriDate';

interface Cat {
  id: string;
  name: string;
  icon?: string;
  children?: Cat[];
}

interface HealthItem { id: string; label: string }

// بنود افتراضية تُستخدم إن لم تُضِف الإدارة بنوداً بعد
const FALLBACK_HEALTH: HealthItem[] = [
  { id: 'vaccinated', label: 'مُطعّم' },
  { id: 'udder', label: 'الضرع سليم' },
  { id: 'teeth', label: 'الأسنان سليمة' },
  { id: 'abscess', label: 'خالٍ من الخراجات' },
  { id: 'mange', label: 'خالٍ من الجرب' },
  { id: 'limp', label: 'خالٍ من العرج' },
];

const STEPS = ['التصنيف', 'العنوان', 'الصور', 'التفاصيل', 'الصحة', 'البيع'];
const TITLES = ['اختر التصنيف', 'العنوان والوصف', 'صور الحلال', 'التفاصيل', 'الحالة الصحية', 'طريقة البيع'];

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<any>({
    catPath: [] as Cat[],
    categoryId: '',
    title: '', description: '', photos: [] as string[],
    count: 1, sex: 'MIXED', approxWeightKg: '', city: '', region: '',
    saleType: 'DIRECT', price: '', startPrice: '', minIncrement: 500, durationHours: 24, startAt: '', typeId: '',
    health: {} as Record<string, boolean>,
  });

  const isBroker = user?.role === 'BROKER' || user?.role === 'ADMIN';

  const [auctionTypes, setAuctionTypes] = useState<{ id: string; name: string; icon?: string | null; commissionPct: number }[]>([]);
  const [healthItems, setHealthItems] = useState<HealthItem[]>(FALLBACK_HEALTH);
  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
    api<{ types: any[] }>('/auction-types').then((r) => setAuctionTypes(r.types)).catch(() => {});
    api<{ items: HealthItem[] }>('/health-items')
      .then((r) => { if (r.items?.length) setHealthItems(r.items); })
      .catch(() => {});
  }, []);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

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
    setBusy(true); setError('');
    try {
      const labelOf = (k: string) => healthItems.find((h) => h.id === k)?.label ?? k;
      const health = Object.entries(form.health)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => ({ key, value, label: labelOf(key) }));
      const media = form.photos.map((url: string) => ({ url, type: 'IMAGE' }));
      const body: any = {
        title: form.title, description: form.description, categoryId: form.categoryId,
        count: Number(form.count) || 1, sex: form.sex,
        approxWeightKg: form.approxWeightKg ? Number(form.approxWeightKg) : undefined,
        city: form.city, region: form.region, saleType: form.saleType, health, media,
      };
      if (form.saleType === 'DIRECT') {
        body.price = form.price ? Number(form.price) : undefined;
      } else if (form.saleType === 'ONSOOM') {
        body.saleType = 'DIRECT';
        body.onsoom = true;
        body.auction = { startPrice: Number(form.startPrice || 0), minIncrement: Number(form.minIncrement) };
      } else {
        body.auction = {
          startPrice: Number(form.startPrice), minIncrement: Number(form.minIncrement),
          durationHours: Number(form.durationHours),
          ...(isBroker && form.startAt ? { startAt: form.startAt } : {}),
          ...(form.typeId ? { typeId: form.typeId } : {}),
        };
      }
      const created = await api<{ id: string }>('/listings', { method: 'POST', body: JSON.stringify(body) });
      router.push(`/listings/${created.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  // اختيار التصنيف بأي عمق
  const catOptions: Cat[] = form.catPath.length ? (form.catPath[form.catPath.length - 1].children ?? []) : tree;
  const chooseCat = (c: Cat) => {
    const newPath = [...form.catPath, c];
    if (c.children && c.children.length) setForm((f: any) => ({ ...f, catPath: newPath, categoryId: '' }));
    else setForm((f: any) => ({ ...f, catPath: newPath, categoryId: c.id }));
  };
  const truncateCat = (i: number) => setForm((f: any) => ({ ...f, catPath: f.catPath.slice(0, i), categoryId: '' }));

  const canNext = () => {
    switch (step) {
      case 0: return !!form.categoryId;
      case 1: return form.title.length > 2 && form.description.length > 2;
      case 2: return true;
      case 3: return !!form.city && !!form.region;
      case 4: return true;
      case 5:
        if (form.saleType === 'DIRECT') return !!form.price;
        if (form.saleType === 'ONSOOM') return true;
        return !!form.startPrice;
      default: return false;
    }
  };

  return (
    <div className="mx-auto max-w-xl animate-fadeup">
      <div className="mb-6 flex items-center gap-1">
        {STEPS.map((_, i) => <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-sand-200'}`} />)}
      </div>
      <p className="mb-1 text-sm text-gray-400">خطوة {step + 1} من {STEPS.length}</p>
      <h1 className="mb-6 text-2xl font-extrabold text-engrave">{TITLES[step]}</h1>

      {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="card p-5">
        {/* 0: التصنيف — تنقّل بأي عمق حتى تصل لتصنيف نهائي */}
        {step === 0 && (
          <div>
            {/* مسار الاختيار */}
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
                      <span className="text-[11px] font-normal text-gray-400">{isLeaf ? (selected ? '✓ محدّد' : 'اختيار') : 'تصنيفات فرعية ›'}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">لا توجد تصنيفات فرعية.</p>
            )}

            {form.categoryId && (
              <p className="mt-4 rounded-2xl bg-green-50 p-3 text-center font-bold text-green-700">
                ✓ اخترت: {form.catPath.map((c: Cat) => c.name).join(' › ')}
              </p>
            )}
          </div>
        )}

        {/* 1: العنوان والوصف */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-bold">عنوان الإعلان</label>
              <input className="input" placeholder="مثال: ناقة مجاهيم منتجة" value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block font-bold">الوصف</label>
              <textarea className="input min-h-[120px]" placeholder="اكتب وصفاً صادقاً للحلال..." value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>
        )}

        {/* 2: الصور */}
        {step === 2 && (
          <div>
            <p className="mb-3 text-gray-500">أضف صوراً واضحة للحلال (حتى 8 صور).</p>
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
          </div>
        )}

        {/* 3: التفاصيل */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-2 block font-bold">العدد</label>
                <input type="number" className="input" value={form.count} onChange={(e) => set('count', e.target.value)} /></div>
              <div><label className="mb-2 block font-bold">الوزن (كجم)</label>
                <input type="number" className="input" value={form.approxWeightKg} onChange={(e) => set('approxWeightKg', e.target.value)} /></div>
            </div>
            <div>
              <label className="mb-2 block font-bold">الجنس</label>
              <div className="flex gap-2">
                {[['MALE', 'ذكر'], ['FEMALE', 'أنثى'], ['MIXED', 'مختلط']].map(([v, l]) => (
                  <button key={v} onClick={() => set('sex', v)}
                    className={`flex-1 rounded-2xl border-2 py-3 font-bold transition ${form.sex === v ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-2 block font-bold">المدينة</label>
                <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div><label className="mb-2 block font-bold">المنطقة</label>
                <input className="input" value={form.region} onChange={(e) => set('region', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* 4: الصحة */}
        {step === 4 && (
          <div className="space-y-2">
            <p className="mb-3 text-gray-500">حدّد لكل بند: <b className="text-green-700">سليم</b> أو <b className="text-red-600">غير سليم</b> (إفصاح صادق يرفع ثقتك)</p>
            {healthItems.map((h) => {
              const v = form.health[h.id];
              return (
                <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-sand-200 px-4 py-3">
                  <span className="text-lg font-medium">{h.label}</span>
                  <div className="flex shrink-0 gap-2">
                    <button type="button"
                      onClick={() => set('health', { ...form.health, [h.id]: true })}
                      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${v === true ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 ring-1 ring-green-200'}`}>
                      ✔ سليم
                    </button>
                    <button type="button"
                      onClick={() => set('health', { ...form.health, [h.id]: false })}
                      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${v === false ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                      ✕ غير سليم
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5: البيع */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {([['DIRECT', '🏷️ سعر ثابت'], ['ONSOOM', '🤝 على السوم'], ['AUCTION', '🔨 مزاد']] as [string, string][]).map(([v, l]) => (
                <button key={v} onClick={() => set('saleType', v)}
                  className={`rounded-2xl border-2 py-4 text-base font-bold transition ${form.saleType === v ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{l}</button>
              ))}
            </div>

            {form.saleType === 'DIRECT' && (
              <div><label className="mb-2 block font-bold">السعر (ريال)</label>
                <input type="number" className="input text-2xl" placeholder="0" value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
            )}

            {form.saleType === 'ONSOOM' && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-sand-50 p-3 text-sm text-gray-600">
                  🤝 على السوم: يساوم المشترون بمزايدة مفتوحة <b>بدون وقت محدّد</b>، وتقبل أنت أعلى مبلغ متى شئت.
                </div>
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
                      {auctionTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.icon ? `${t.icon} ` : ''}{t.name}{t.commissionPct ? ` (عمولة ${t.commissionPct}%)` : ''}</option>
                      ))}
                    </select>
                  </div>
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
                    {form.startAt && (
                      <p className="mt-1 text-sm font-bold text-brand-dark">🗓️ <HijriDate value={form.startAt} withTime /></p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">اتركه فارغاً ليبدأ فوراً، أو حدّد موعداً مستقبلياً ليُجدول.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="btn-outline flex-1">رجوع</button>}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="btn-primary flex-1 disabled:opacity-40">التالي</button>
        ) : (
          <button onClick={submit} disabled={!canNext() || busy} className="btn-gold flex-1 disabled:opacity-40">{busy ? '...' : '✔ نشر الإعلان'}</button>
        )}
      </div>
    </div>
  );
}
