'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

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

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<any>({
    species: null as Cat | null,
    categoryId: '',
    title: '',
    description: '',
    count: 1,
    sex: 'MIXED',
    approxWeightKg: '',
    city: '',
    region: '',
    saleType: 'DIRECT',
    price: '',
    startPrice: '',
    minIncrement: 500,
    durationHours: 24,
    health: {} as Record<string, boolean>,
  });

  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
  }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-lg">سجّل الدخول أولاً لإضافة إعلان</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    'نوع الماشية',
    'السلالة',
    'العنوان والوصف',
    'التفاصيل',
    'الحالة الصحية',
    'طريقة البيع',
  ];

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const health = Object.entries(form.health).map(([key, value]) => ({ key, value }));
      const body: any = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        count: Number(form.count) || 1,
        sex: form.sex,
        approxWeightKg: form.approxWeightKg ? Number(form.approxWeightKg) : undefined,
        city: form.city,
        region: form.region,
        saleType: form.saleType,
        health,
      };
      if (form.saleType === 'DIRECT') {
        body.price = form.price ? Number(form.price) : undefined;
      } else {
        body.auction = {
          startPrice: Number(form.startPrice),
          minIncrement: Number(form.minIncrement),
          durationHours: Number(form.durationHours),
        };
      }
      const created = await api<{ id: string }>('/listings', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/listings/${created.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!form.species;
      case 1: return !!form.categoryId;
      case 2: return form.title.length > 2 && form.description.length > 2;
      case 3: return !!form.city && !!form.region;
      case 4: return true;
      case 5:
        return form.saleType === 'DIRECT'
          ? !!form.price
          : !!form.startPrice;
      default: return false;
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* مؤشر التقدّم */}
      <div className="mb-6 flex items-center gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-sand-200'}`}
          />
        ))}
      </div>
      <p className="mb-1 text-sm text-gray-400">
        خطوة {step + 1} من {steps.length}
      </p>
      <h1 className="mb-6 text-2xl font-extrabold">{steps[step]}</h1>

      {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="card p-5">
        {/* 0: النوع */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tree.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  set('species', s);
                  set('categoryId', '');
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-lg font-bold ${
                  form.species?.id === s.id
                    ? 'border-brand bg-sand-50'
                    : 'border-sand-200'
                }`}
              >
                <span className="text-4xl">{s.icon}</span>
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* 1: السلالة */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {form.species?.children?.map((b: Cat) => (
              <button
                key={b.id}
                onClick={() => set('categoryId', b.id)}
                className={`rounded-2xl border-2 p-4 text-lg font-bold ${
                  form.categoryId === b.id ? 'border-brand bg-sand-50' : 'border-sand-200'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* 2: العنوان والوصف */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-bold">عنوان الإعلان</label>
              <input
                className="input"
                placeholder="مثال: ناقة مجاهيم منتجة"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block font-bold">الوصف</label>
              <textarea
                className="input min-h-[120px]"
                placeholder="اكتب وصفاً صادقاً للحلال..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
              <button
                type="button"
                className="mt-2 text-sm text-brand"
                onClick={() => alert('🎙️ الإدخال الصوتي يأتي في المرحلة الرابعة')}
              >
                🎙️ أو سجّل وصفك صوتياً
              </button>
            </div>
          </div>
        )}

        {/* 3: التفاصيل */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block font-bold">العدد</label>
                <input
                  type="number"
                  className="input"
                  value={form.count}
                  onChange={(e) => set('count', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block font-bold">الوزن التقريبي (كجم)</label>
                <input
                  type="number"
                  className="input"
                  value={form.approxWeightKg}
                  onChange={(e) => set('approxWeightKg', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block font-bold">الجنس</label>
              <div className="flex gap-2">
                {[
                  ['MALE', 'ذكر'],
                  ['FEMALE', 'أنثى'],
                  ['MIXED', 'مختلط'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => set('sex', v)}
                    className={`flex-1 rounded-2xl border-2 py-3 font-bold ${
                      form.sex === v ? 'border-brand bg-sand-50' : 'border-sand-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block font-bold">المدينة</label>
                <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block font-bold">المنطقة</label>
                <input className="input" value={form.region} onChange={(e) => set('region', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* 4: الحالة الصحية */}
        {step === 4 && (
          <div className="space-y-2">
            <p className="mb-3 text-gray-500">حدّد ما ينطبق (إفصاح صادق يرفع ثقتك)</p>
            {HEALTH_ITEMS.map((h) => (
              <label
                key={h.key}
                className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-sand-200 px-4 py-3"
              >
                <span className="text-lg font-medium">{h.label}</span>
                <input
                  type="checkbox"
                  className="h-7 w-7 accent-brand"
                  checked={!!form.health[h.key]}
                  onChange={(e) =>
                    set('health', { ...form.health, [h.key]: e.target.checked })
                  }
                />
              </label>
            ))}
          </div>
        )}

        {/* 5: طريقة البيع */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => set('saleType', 'DIRECT')}
                className={`flex-1 rounded-2xl border-2 py-4 text-lg font-bold ${
                  form.saleType === 'DIRECT' ? 'border-brand bg-sand-50' : 'border-sand-200'
                }`}
              >
                💵 بيع مباشر
              </button>
              <button
                onClick={() => set('saleType', 'AUCTION')}
                className={`flex-1 rounded-2xl border-2 py-4 text-lg font-bold ${
                  form.saleType === 'AUCTION' ? 'border-brand bg-sand-50' : 'border-sand-200'
                }`}
              >
                🔨 مزاد
              </button>
            </div>

            {form.saleType === 'DIRECT' ? (
              <div>
                <label className="mb-2 block font-bold">السعر (ريال)</label>
                <input
                  type="number"
                  className="input text-2xl"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block font-bold">سعر البداية (ريال)</label>
                  <input
                    type="number"
                    className="input text-2xl"
                    value={form.startPrice}
                    onChange={(e) => set('startPrice', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block font-bold">أقل زيادة</label>
                    <input
                      type="number"
                      className="input"
                      value={form.minIncrement}
                      onChange={(e) => set('minIncrement', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-bold">المدة (ساعات)</label>
                    <input
                      type="number"
                      className="input"
                      value={form.durationHours}
                      onChange={(e) => set('durationHours', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* أزرار التنقّل */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn-outline flex-1">
            رجوع
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            التالي
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canNext() || busy}
            className="btn-gold flex-1 disabled:opacity-40"
          >
            {busy ? '...' : '✔ نشر الإعلان'}
          </button>
        )}
      </div>
    </div>
  );
}
