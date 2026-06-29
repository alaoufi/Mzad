'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';

interface Cat {
  id: string;
  name: string;
  icon?: string;
  children?: Cat[];
}

const HEALTH_ITEMS = [
  { key: 'vaccinated', label: 'مُطعّم' },
  { key: 'udder', label: 'الضرع سليم' },
  { key: 'teeth', label: 'الأسنان سليمة' },
  { key: 'abscess', label: 'لا يوجد خراجات' },
  { key: 'mange', label: 'لا يوجد جرب' },
  { key: 'limp', label: 'لا يوجد عرج' },
];

const STEPS = ['النوع', 'اللون', 'السلالة', 'العنوان', 'الصور', 'التفاصيل', 'الصحة', 'البيع'];
const TITLES = ['نوع الماشية', 'اللون / الصنف', 'السلالة', 'العنوان والوصف', 'صور الحلال', 'التفاصيل', 'الحالة الصحية', 'طريقة البيع'];

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<any>({
    species: null as Cat | null,
    color: null as Cat | null,
    categoryId: '',
    title: '', description: '', photos: [] as string[],
    count: 1, sex: 'MIXED', approxWeightKg: '', city: '', region: '',
    saleType: 'DIRECT', price: '', startPrice: '', minIncrement: 500, durationHours: 24,
    health: {} as Record<string, boolean>,
  });

  useEffect(() => { api<Cat[]>('/categories').then(setTree).catch(() => {}); }, []);
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
      const health = Object.entries(form.health).map(([key, value]) => ({ key, value }));
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
        body.auction = { startPrice: Number(form.startPrice), minIncrement: Number(form.minIncrement), durationHours: Number(form.durationHours) };
      }
      const created = await api<{ id: string }>('/listings', { method: 'POST', body: JSON.stringify(body) });
      router.push(`/listings/${created.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!form.species;
      case 1: return !!form.color;
      case 2: return !!form.categoryId;
      case 3: return form.title.length > 2 && form.description.length > 2;
      case 4: return true;
      case 5: return !!form.city && !!form.region;
      case 6: return true;
      case 7:
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
      <h1 className="mb-6 text-2xl font-extrabold">{TITLES[step]}</h1>

      {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="card p-5">
        {/* 0: النوع */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tree.map((s) => (
              <button key={s.id}
                onClick={() => { set('species', s); set('color', null); set('categoryId', ''); }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-lg font-bold transition ${
                  form.species?.id === s.id ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>
                <span className="text-4xl">{s.icon}</span>{s.name}
              </button>
            ))}
          </div>
        )}

        {/* 1: اللون/الصنف */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {form.species?.children?.map((c: Cat) => (
              <button key={c.id} onClick={() => { set('color', c); set('categoryId', ''); }}
                className={`rounded-2xl border-2 p-4 text-lg font-bold transition ${
                  form.color?.id === c.id ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{c.name}</button>
            ))}
            {(!form.species?.children || form.species.children.length === 0) && (
              <p className="col-span-2 text-gray-500">لا توجد أصناف — تابع.</p>
            )}
          </div>
        )}

        {/* 2: السلالة */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {form.color?.children?.map((b: Cat) => (
              <button key={b.id} onClick={() => set('categoryId', b.id)}
                className={`rounded-2xl border-2 p-4 text-lg font-bold transition ${
                  form.categoryId === b.id ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{b.name}</button>
            ))}
          </div>
        )}

        {/* 3: العنوان والوصف */}
        {step === 3 && (
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

        {/* 4: الصور */}
        {step === 4 && (
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

        {/* 5: التفاصيل */}
        {step === 5 && (
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

        {/* 6: الصحة */}
        {step === 6 && (
          <div className="space-y-2">
            <p className="mb-3 text-gray-500">حدّد ما ينطبق (إفصاح صادق يرفع ثقتك)</p>
            {HEALTH_ITEMS.map((h) => (
              <label key={h.key} className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-sand-200 px-4 py-3">
                <span className="text-lg font-medium">{h.label}</span>
                <input type="checkbox" className="h-7 w-7 accent-brand" checked={!!form.health[h.key]}
                  onChange={(e) => set('health', { ...form.health, [h.key]: e.target.checked })} />
              </label>
            ))}
          </div>
        )}

        {/* 7: البيع */}
        {step === 7 && (
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
                <div><label className="mb-2 block font-bold">سعر البداية (ريال)</label>
                  <input type="number" className="input text-2xl" value={form.startPrice} onChange={(e) => set('startPrice', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-2 block font-bold">أقل زيادة</label>
                    <input type="number" className="input" value={form.minIncrement} onChange={(e) => set('minIncrement', e.target.value)} /></div>
                  <div><label className="mb-2 block font-bold">المدة (ساعات)</label>
                    <input type="number" className="input" value={form.durationHours} onChange={(e) => set('durationHours', e.target.value)} /></div>
                </div>
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
