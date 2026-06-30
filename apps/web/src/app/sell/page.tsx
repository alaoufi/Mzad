'use client';

import { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';
import { HijriDate } from '@/components/HijriDate';
import { getCoords } from '@/lib/geo';
import { nearestRegion, regionName } from '@/lib/ads';
import { resolveTheme, gradient } from '@/lib/themes';
import { InterestPicker } from '@/components/InterestPicker';
import { uiToast } from '@/lib/ui';

interface Cat { id: string; name: string; icon?: string; themeKey?: string | null; children?: Cat[] }
interface HealthItem { id: string; label: string }

const FALLBACK_HEALTH: HealthItem[] = [
  { id: 'vaccinated', label: 'مُطعّم' },
  { id: 'udder', label: 'الضرع سليم' },
  { id: 'teeth', label: 'الأسنان سليمة' },
  { id: 'abscess', label: 'خالٍ من الخراجات' },
  { id: 'mange', label: 'خالٍ من الجرب' },
  { id: 'limp', label: 'خالٍ من العرج' },
];

// إطار حسب الحالة: مطلوب=أحمر (أخضر عند التعبئة)، اختياري=أخضر
const tone = (req: boolean, filled = false) => (req ? (filled ? '!border-green-400' : '!border-red-300') : '!border-green-300');
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [manualLoc, setManualLoc] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  const [form, setForm] = useState<any>({
    catPath: [] as Cat[], categoryId: '',
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
  const [commission, setCommission] = useState({ marketCommissionPct: 0, commissionNote: '', zeroCommissionNote: '' });
  const [reqFields, setReqFields] = useState<string[]>([]);
  const req = (k: string) => reqFields.includes(k);
  const [interests, setInterests] = useState<string[]>([]);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const saveInterests = async (ids: string[]) => {
    setInterests(ids); setShowInterestPicker(false);
    try { await api('/users/me', { method: 'PATCH', body: JSON.stringify({ interests: ids }) }); } catch {}
  };
  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
    api<{ types: any[] }>('/auction-types').then((r) => setAuctionTypes(r.types)).catch(() => {});
    api<{ items: HealthItem[] }>('/health-items').then((r) => { if (r.items?.length) setHealthItems(r.items); }).catch(() => {});
    api<{ interests?: string[] }>('/users/me').then((r) => setInterests(r.interests ?? [])).catch(() => {});
    api<{ marketCommissionPct: number; commissionNote: string; zeroCommissionNote: string; reqFields?: string[] }>('/settings')
      .then((r) => { setCommission({ marketCommissionPct: r.marketCommissionPct ?? 0, commissionNote: r.commissionNote ?? '', zeroCommissionNote: r.zeroCommissionNote ?? '' }); setReqFields(r.reqFields ?? []); }).catch(() => {});
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

  // فيديو
  const [videoUrl, setVideoUrl] = useState('');
  const pickVideo = (files: FileList | null) => {
    const f = files?.[0]; if (!f) return;
    if (f.size > 15 * 1024 * 1024) { uiToast('الفيديو كبير — اختر مقطعاً أقصر (حتى 15MB)', 'error'); return; }
    const r = new FileReader(); r.onloadend = () => setVideoUrl(String(r.result)); r.readAsDataURL(f);
  };

  // تسجيل صوتي
  const [audioUrl, setAudioUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const stopRec = () => { clearInterval(timerRef.current); setRecording(false); try { recRef.current?.stop(); } catch {} };
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream); chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const r = new FileReader(); r.onloadend = () => setAudioUrl(String(r.result)); r.readAsDataURL(blob);
      };
      recRef.current = mr; mr.start(); setRecording(true); setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => { if (s >= 90) { stopRec(); return s; } return s + 1; }), 1000);
    } catch { uiToast('تعذّر الوصول للميكروفون — اسمح بالإذن', 'error'); }
  };

  // التصنيف: تسطيح للبحث + ثيم لكل بطاقة
  const allCats = useMemo(() => {
    const out: { cat: Cat; path: Cat[] }[] = [];
    const walk = (nodes: Cat[], path: Cat[]) => nodes.forEach((c) => {
      const p = [...path, c]; out.push({ cat: c, path: p });
      if (c.children?.length) walk(c.children, p);
    });
    walk(tree, []);
    return out;
  }, [tree]);
  // تصفية صارمة حسب الاهتمام: يبدأ التصفّح من جذور الاهتمام مباشرة، ولا يُعرض أي صنف خارجها
  const parentOf = useMemo(() => {
    const m = new Map<string, string | undefined>();
    const walk = (n: Cat, p?: string) => { m.set(n.id, p); n.children?.forEach((c) => walk(c, n.id)); };
    tree.forEach((t) => walk(t, undefined));
    return m;
  }, [tree]);
  const catById = useMemo(() => {
    const m = new Map<string, Cat>();
    const walk = (n: Cat) => { m.set(n.id, n); n.children?.forEach(walk); };
    tree.forEach(walk);
    return m;
  }, [tree]);
  const interestSet = useMemo(() => new Set(interests), [interests]);
  const interestRootCats = useMemo(() => {
    return interests.filter((id) => {
      let p = parentOf.get(id);
      while (p) { if (interestSet.has(p)) return false; p = parentOf.get(p); }
      return true;
    }).map((id) => catById.get(id)).filter(Boolean) as Cat[];
  }, [interests, parentOf, catById, interestSet]);
  // داخل الاهتمام فقط: العنصر اهتمام أو فرع منه
  const relevant = (id: string): boolean => {
    if (!interests.length) return true;
    let p: string | undefined = id;
    while (p) { if (interestSet.has(p)) return true; p = parentOf.get(p); }
    return false;
  };

  const searchResults = catSearch.trim() ? allCats.filter((x) => x.cat.name.includes(catSearch.trim()) && relevant(x.cat.id)).slice(0, 30) : [];
  const deepestCat: Cat | undefined = form.catPath[form.catPath.length - 1];
  const catOptions: Cat[] = form.catPath.length
    ? (deepestCat?.children ?? []).filter((c: Cat) => relevant(c.id))
    : (interests.length ? interestRootCats : tree);
  const chooseCat = (c: Cat) => {
    const newPath = [...form.catPath, c];
    setForm((f: any) => ({ ...f, catPath: newPath, categoryId: c.children && c.children.length ? '' : c.id }));
  };
  const pickPath = (path: Cat[]) => {
    const leaf = path[path.length - 1];
    setForm((f: any) => ({ ...f, catPath: path, categoryId: leaf.children?.length ? '' : leaf.id }));
    setCatSearch('');
  };
  const truncateCat = (i: number) => setForm((f: any) => ({ ...f, catPath: f.catPath.slice(0, i), categoryId: '' }));
  const cardTheme = (c: Cat) => resolveTheme([{ name: c.name, themeKey: c.themeKey ?? null }, ...[...form.catPath].reverse().map((p: Cat) => ({ name: p.name, themeKey: p.themeKey ?? null }))]);

  const hasLoc = form.lat != null;
  const locationOk = hasLoc || (!!form.city.trim() && !!form.region.trim());
  const priceOk = form.saleType === 'DIRECT' ? !!form.price : form.saleType === 'ONSOOM' ? true : !!form.startPrice;
  const healthAllSet = healthItems.every((h) => form.health[h.id] !== undefined);
  const reqOk =
    (!req('photos') || form.photos.length > 0) &&
    (!req('video') || !!videoUrl) &&
    (!req('audio') || !!audioUrl) &&
    (!req('health') || healthAllSet);
  const canSubmit = !!form.categoryId && form.title.trim().length > 2 && form.description.trim().length > 2 && locationOk && priceOk && reqOk;

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
      const media = [
        ...form.photos.map((url: string) => ({ url, type: 'IMAGE' })),
        ...(videoUrl ? [{ url: videoUrl, type: 'VIDEO' }] : []),
        ...(audioUrl ? [{ url: audioUrl, type: 'AUDIO' }] : []),
      ];
      let city = form.city.trim(), region = form.region.trim();
      if (hasLoc) { region = detectedRegion; city = form.city.trim() || detectedRegion; }
      const body: any = {
        title: form.title, description: form.description, categoryId: form.categoryId,
        count: Number(form.count) || 1, sex: form.sex,
        city, region, saleType: form.saleType, health, media,
        lat: form.lat ?? undefined, lng: form.lng ?? undefined,
      };
      if (form.saleType === 'DIRECT') body.price = form.price ? Number(form.price) : undefined;
      else if (form.saleType === 'ONSOOM') { body.saleType = 'DIRECT'; body.onsoom = true; body.auction = { startPrice: Number(form.startPrice || 0), minIncrement: Number(form.minIncrement) }; }
      else body.auction = { startPrice: Number(form.startPrice), minIncrement: Number(form.minIncrement), durationHours: Number(form.durationHours), ...(isBroker && form.startAt ? { startAt: form.startAt } : {}), ...(form.typeId ? { typeId: form.typeId } : {}) };
      const created = await api<{ id: string }>('/listings', { method: 'POST', body: JSON.stringify(body) });
      router.push(`/listings/${created.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl animate-fadeup space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">➕ إضافة إعلان</h1>
        <div className="flex gap-1.5 text-[11px] font-bold">
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-600">🔴 مطلوب</span>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">🟢 اختياري</span>
        </div>
      </div>
      {error && <div className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      {/* الموقع أولاً */}
      <Section title="📍 موقع الحلال" badge="opt" tint="bg-sky-50 border-sky-200" hint="حدّد موقعك بدقّة ليصل المشترون إليك — أو أدخل المدينة يدوياً.">
        {hasLoc ? (
          <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-3">
            <div className="flex items-center gap-2 font-bold text-green-700">
              ✔ موقعك: {detectedRegion}
              <a href={`https://maps.google.com/?q=${form.lat},${form.lng}`} target="_blank" rel="noopener noreferrer" className="mr-auto rounded-lg bg-white px-2 py-1 text-xs font-bold text-brand-dark">🗺️ معاينة</a>
              <button type="button" onClick={() => setForm((f: any) => ({ ...f, lat: null, lng: null }))} className="text-xs font-bold text-red-500">إزالة</button>
            </div>
            <input className={`input mt-2 ${tone(false)}`} placeholder="الحي/المدينة (اختياري)" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
        ) : (
          <>
            <button type="button" onClick={captureLocation} disabled={locBusy} className="w-full rounded-2xl bg-brand/10 py-3 font-bold text-brand disabled:opacity-50">
              {locBusy ? 'جارٍ التحديد...' : '🎯 تحديد موقعي بدقّة (GPS)'}
            </button>
            <button type="button" onClick={() => setManualLoc((v) => !v)} className="mt-2 w-full text-center text-sm font-bold text-gray-500">
              {manualLoc ? '▲ إخفاء الإدخال اليدوي' : '▼ أو أدخل المدينة والمنطقة يدوياً'}
            </button>
            {manualLoc && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <input className={`input ${tone(true, !!form.city.trim())}`} placeholder="المدينة *" value={form.city} onChange={(e) => set('city', e.target.value)} />
                <input className={`input ${tone(true, !!form.region.trim())}`} placeholder="المنطقة *" value={form.region} onChange={(e) => set('region', e.target.value)} />
              </div>
            )}
          </>
        )}
      </Section>

      {/* التصنيف — بحث + بطاقات ملوّنة */}
      <Section title="🗂️ التصنيف" badge="req" tint="bg-amber-50 border-amber-200">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-500">{interests.length ? '✦ من اهتماماتك فقط' : 'كل التصنيفات'}</span>
          <button type="button" onClick={() => setShowInterestPicker(true)} className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold text-brand ring-1 ring-sand-200">✎ تعديل الاهتمامات</button>
        </div>
        <div className="relative mb-3">
          <input className={`input !pr-10 ${tone(true, !!form.categoryId)}`} placeholder="🔍 ابحث عن تصنيف بالاسم..." value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
        </div>

        {catSearch.trim() ? (
          <div className="space-y-1.5">
            {searchResults.length === 0 ? <p className="py-3 text-center text-gray-500">لا نتائج لـ «{catSearch}»</p> :
              searchResults.map(({ cat, path }) => {
                const t = resolveTheme([{ name: cat.name, themeKey: cat.themeKey ?? null }]);
                return (
                  <button key={path.map((p) => p.id).join('/')} onClick={() => pickPath(path)}
                    className="flex w-full items-center gap-2 rounded-xl border-2 border-sand-200 p-2 text-right hover:border-brand">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundImage: gradient(t), color: '#fff' }}>{cat.icon ?? '🐾'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{cat.name}</span>
                      <span className="block truncate text-xs text-gray-500">{path.map((p) => p.name).join(' › ')}</span>
                    </span>
                    {cat.children?.length ? <span className="shrink-0 text-xs text-gray-400">فروع ›</span> : <span className="shrink-0 text-xs font-bold text-brand">اختيار</span>}
                  </button>
                );
              })}
          </div>
        ) : (
          <>
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
                  const t = cardTheme(c);
                  return (
                    <button key={c.id} onClick={() => chooseCat(c)}
                      className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl p-4 text-center font-bold text-white shadow-sm transition active:scale-95 ${selected ? 'ring-4 ring-white' : ''}`}
                      style={{ backgroundImage: gradient(t), boxShadow: `0 10px 24px -14px ${t.from}` }}>
                      <span className="text-3xl drop-shadow">{c.icon ?? '🐾'}</span>
                      <span className="text-emboss-light">{c.name}</span>
                      <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold">{isLeaf ? (selected ? '✓ محدّد' : 'اختيار') : 'فروع ›'}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-white/70 p-3 text-center text-sm text-gray-500">
                {interests.length ? 'لا تطابق اهتماماتك هنا — عدّل اهتماماتك بالأعلى لعرض أصناف أخرى.' : 'لا توجد تصنيفات فرعية.'}
              </p>
            )}
          </>
        )}
        {form.categoryId && <p className="mt-3 rounded-2xl bg-green-50 p-2 text-center font-bold text-green-700">✓ {form.catPath.map((c: Cat) => c.name).join(' › ')}</p>}
      </Section>

      {/* العنوان والوصف — مطلوب */}
      <Section title="✍️ العنوان والوصف" badge="req" tint="bg-emerald-50 border-emerald-200">
        <input className={`input mb-3 ${tone(true, form.title.trim().length > 2)}`} placeholder="عنوان الإعلان * (مثال: ناقة مجاهيم منتجة)" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <textarea className={`input min-h-[110px] ${tone(true, form.description.trim().length > 2)}`} placeholder="الوصف * — اكتب وصفاً صادقاً للحلال..." value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Section>

      {/* الصور */}
      <Section title="📷 الصور" badge={req('photos') ? 'req' : 'opt'} tint="bg-violet-50 border-violet-200" hint="حتى 8 صور واضحة.">
        <div className="grid grid-cols-3 gap-3">
          {form.photos.map((src: string, i: number) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl ring-2 ring-green-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button onClick={() => set('photos', form.photos.filter((_: string, j: number) => j !== i))} className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">✕</button>
            </div>
          ))}
          {form.photos.length < 8 && (
            <label className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-gray-500 hover:border-brand ${req('photos') && form.photos.length === 0 ? 'border-red-300' : 'border-green-300'}`}>
              <span className="text-3xl">{uploading ? '⏳' : '📷'}</span>
              <span className="text-xs font-bold">{uploading ? 'جارٍ...' : 'أضف صورة'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
            </label>
          )}
        </div>
      </Section>

      {/* فيديو */}
      <Section title="🎬 مقطع فيديو" badge={req('video') ? 'req' : 'opt'} tint="bg-rose-50 border-rose-200" hint="مقطع قصير يوضّح الحلال (حتى 15MB).">
        {videoUrl ? (
          <div className="space-y-2">
            <video src={videoUrl} controls className="w-full rounded-2xl bg-black" />
            <button onClick={() => setVideoUrl('')} className="text-sm font-bold text-red-500">🗑️ إزالة الفيديو</button>
          </div>
        ) : (
          <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed py-6 font-bold text-gray-600 hover:border-brand ${req('video') ? 'border-red-300' : 'border-green-300'}`}>
            <span className="text-3xl">🎬</span>
            <span>اختر مقطع فيديو</span>
            <input type="file" accept="video/*" className="hidden" onChange={(e) => pickVideo(e.target.files)} />
          </label>
        )}
      </Section>

      {/* مقطع صوتي توضيحي */}
      <Section title="🎤 مقطع صوتي توضيحي" badge={req('audio') ? 'req' : 'opt'} tint="bg-teal-50 border-teal-200" hint="سجّل توضيحاً صوتياً عن الحلال.">
        {audioUrl ? (
          <div className="space-y-2">
            <audio src={audioUrl} controls className="w-full" />
            <button onClick={() => { setAudioUrl(''); }} className="text-sm font-bold text-red-500">🗑️ حذف وإعادة التسجيل</button>
          </div>
        ) : recording ? (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-bold text-red-600">{mmss(recSecs)}</span>
            <span className="text-sm text-gray-500">جارٍ التسجيل…</span>
            <button onClick={stopRec} className="btn-primary mr-auto !min-h-0 !px-5 !py-2">إيقاف</button>
          </div>
        ) : (
          <button onClick={startRec} className="w-full rounded-2xl bg-brand/10 py-3 font-bold text-brand">🎤 ابدأ التسجيل</button>
        )}
      </Section>

      {/* التفاصيل — اختياري */}
      <Section title="📋 التفاصيل" badge="opt" tint="bg-indigo-50 border-indigo-200">
        <div className="mb-3">
          <label className="mb-1 block text-sm font-bold text-gray-600">العدد</label>
          <input type="number" className={`input w-32 ${tone(false)}`} value={form.count} onChange={(e) => set('count', e.target.value)} />
        </div>
        <label className="mb-1 block text-sm font-bold text-gray-600">الجنس</label>
        <div className="flex gap-2">
          {[['MALE', 'ذكر'], ['FEMALE', 'أنثى'], ['MIXED', 'مختلط']].map(([v, l]) => (
            <button key={v} onClick={() => set('sex', v)} className={`flex-1 rounded-2xl border-2 py-3 font-bold transition ${form.sex === v ? 'border-brand bg-sand-50' : 'border-green-200'}`}>{l}</button>
          ))}
        </div>
      </Section>

      {/* الصحة */}
      <Section title="🩺 الحالة الصحية" badge={req('health') ? 'req' : 'opt'} tint="bg-lime-50 border-lime-200" hint="إفصاح صادق يرفع ثقتك.">
        <div className="space-y-2">
          {healthItems.map((h) => {
            const v = form.health[h.id];
            return (
              <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-sand-200 px-3 py-2.5">
                <span className="font-medium">{h.label}</span>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => set('health', { ...form.health, [h.id]: true })} className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${v === true ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 ring-1 ring-green-200'}`}>✔ سليم</button>
                  <button type="button" onClick={() => set('health', { ...form.health, [h.id]: false })} className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${v === false ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>✕ غير سليم</button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* البيع — مطلوب */}
      <Section title="💰 طريقة البيع" badge="req" tint="bg-orange-50 border-orange-200">
        <div className="mb-4 grid grid-cols-3 gap-2">
          {([['DIRECT', '🏷️ سعر ثابت'], ['ONSOOM', '🤝 على السوم'], ['AUCTION', '🔨 مزاد']] as [string, string][]).map(([v, l]) => (
            <button key={v} onClick={() => set('saleType', v)} className={`rounded-2xl border-2 py-3 text-sm font-bold transition ${form.saleType === v ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{l}</button>
          ))}
        </div>
        {commission.marketCommissionPct > 0 ? (() => {
          const base = Number(form.saleType === 'DIRECT' ? form.price : form.startPrice) || 0;
          const amount = Math.round((base * commission.marketCommissionPct) / 100);
          return (
            <div className="mb-4 rounded-2xl border-2 border-gold/40 bg-gold/10 p-3 text-sm">
              <div className="font-extrabold text-brand-dark">💰 عمولة السوق {commission.marketCommissionPct}%{base > 0 && <> = <span className="text-amber-700">{amount.toLocaleString('ar-SA')} ﷼</span></>}</div>
              <p className="mt-1 leading-relaxed text-gray-600">{commission.commissionNote}</p>
            </div>
          );
        })() : (
          commission.zeroCommissionNote && (
            <div className="mb-4 rounded-2xl border-2 border-green-300 bg-green-50 p-3 text-center text-sm font-bold text-green-700">
              {commission.zeroCommissionNote}
            </div>
          )
        )}
        {form.saleType === 'DIRECT' && (
          <div><label className="mb-2 block font-bold">السعر (ريال) *</label>
            <input type="number" className={`input text-2xl ${tone(true, !!form.price)}`} placeholder="0" value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
        )}
        {form.saleType === 'ONSOOM' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-sand-50 p-3 text-sm text-gray-600">🤝 على السوم: يساوم المشترون بمزايدة مفتوحة <b>بدون وقت محدّد</b>، وتقبل أنت أعلى مبلغ متى شئت.</div>
            <div><label className="mb-2 block font-bold">أقل مبلغ للمساومة <span className="text-xs text-green-700">(اختياري)</span></label>
              <input type="number" className={`input text-2xl ${tone(false)}`} placeholder="0" value={form.startPrice} onChange={(e) => set('startPrice', e.target.value)} /></div>
            <div><label className="mb-2 block font-bold">أقل زيادة</label>
              <input type="number" className={`input ${tone(false)}`} value={form.minIncrement} onChange={(e) => set('minIncrement', e.target.value)} /></div>
          </div>
        )}
        {form.saleType === 'AUCTION' && (
          <div className="space-y-3">
            {auctionTypes.length > 0 && (
              <div><label className="mb-2 block font-bold">نوع المزاد <span className="text-xs text-green-700">(اختياري)</span></label>
                <select className={`input ${tone(false)}`} value={form.typeId} onChange={(e) => set('typeId', e.target.value)}>
                  <option value="">— اختر نوعاً —</option>
                  {auctionTypes.map((t) => <option key={t.id} value={t.id}>{t.icon ? `${t.icon} ` : ''}{t.name}{t.commissionPct ? ` (عمولة ${t.commissionPct}%)` : ''}</option>)}
                </select></div>
            )}
            <div><label className="mb-2 block font-bold">سعر البداية (ريال) *</label>
              <input type="number" className={`input text-2xl ${tone(true, !!form.startPrice)}`} value={form.startPrice} onChange={(e) => set('startPrice', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-2 block font-bold">أقل زيادة</label>
                <input type="number" className={`input ${tone(false)}`} value={form.minIncrement} onChange={(e) => set('minIncrement', e.target.value)} /></div>
              <div><label className="mb-2 block font-bold">المدة (ساعات)</label>
                <input type="number" className={`input ${tone(false)}`} value={form.durationHours} onChange={(e) => set('durationHours', e.target.value)} /></div>
            </div>
            {isBroker && (
              <div>
                <label className="mb-2 block font-bold">🗓️ موعد بداية المزاد (للدلال — اختياري)</label>
                <input type="datetime-local" className={`input ${tone(false)}`} value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
                {form.startAt && <p className="mt-1 text-sm font-bold text-brand-dark">🗓️ <HijriDate value={form.startAt} withTime /></p>}
              </div>
            )}
          </div>
        )}
      </Section>

      <button onClick={submit} disabled={!canSubmit || busy} className="btn-gold w-full !py-4 text-lg disabled:opacity-40">{busy ? 'جارٍ النشر...' : '✔ نشر الإعلان'}</button>
      {!canSubmit && <p className="text-center text-xs text-gray-500">أكمل الحقول ذات الإطار الأحمر: التصنيف، العنوان، الوصف، الموقع، والسعر.</p>}

      {showInterestPicker && (
        <InterestPicker
          initial={interests}
          title="اهتماماتي"
          subtitle="اختر الأصناف التي تبيعها لتظهر لك عند إضافة الإعلان. الفارغ يعرض كل التصنيفات."
          onSave={saveInterests}
          onClose={() => setShowInterestPicker(false)}
        />
      )}
    </div>
  );
}

function Section({ title, hint, badge, tint, children }: { title: string; hint?: string; badge?: 'req' | 'opt'; tint?: string; children: ReactNode }) {
  return (
    <div className={`card border-2 p-4 ${tint ?? 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-engrave">{title}</h2>
        {badge && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge === 'req' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{badge === 'req' ? 'مطلوب' : 'اختياري'}</span>}
      </div>
      {hint && <p className="mb-3 mt-0.5 text-xs text-gray-500">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </div>
  );
}
