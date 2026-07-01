'use client';

import { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';
import { HijriDate } from '@/components/HijriDate';
import { getCoords } from '@/lib/geo';
import { nearestRegion, regionName } from '@/lib/ads';
import { resolveTheme, gradient, catImageIcon } from '@/lib/themes';
import { InterestPicker } from '@/components/InterestPicker';
import { RegionCityPicker } from '@/components/RegionCityPicker';
import { TEXT_DEFAULTS } from '@/lib/texts';
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
  const { user, ready } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [manualLoc, setManualLoc] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [catOpen, setCatOpen] = useState(false);

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
  const [txt, setTxt] = useState<Record<string, string>>(TEXT_DEFAULTS);
  const t = (k: string) => txt[k] ?? TEXT_DEFAULTS[k] ?? '';
  const [defectsNote, setDefectsNote] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsReady, setInterestsReady] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const saveInterests = async (ids: string[]) => {
    setInterests(ids); setShowInterestPicker(false);
    try { await api('/users/me', { method: 'PATCH', body: JSON.stringify({ interests: ids }) }); } catch {}
  };
  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
    api<{ types: any[] }>('/auction-types').then((r) => setAuctionTypes(r.types)).catch(() => {});
    api<{ items: HealthItem[] }>('/health-items').then((r) => { if (r.items?.length) setHealthItems(r.items); }).catch(() => {});
    api<{ interests?: string[] }>('/users/me').then((r) => setInterests(r.interests ?? [])).catch(() => {}).finally(() => setInterestsReady(true));
    api<{ marketCommissionPct: number; commissionNote: string; zeroCommissionNote: string; reqFields?: string[]; texts?: Record<string, string> }>('/settings')
      .then((r) => { setCommission({ marketCommissionPct: r.marketCommissionPct ?? 0, commissionNote: r.commissionNote ?? '', zeroCommissionNote: r.zeroCommissionNote ?? '' }); setReqFields(r.reqFields ?? []); if (r.texts) setTxt(r.texts); }).catch(() => {});
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

  // ذكاء السياق: نهيّئ نوع البيع والتصنيف من آخر تصفّح للزائر (مرّة واحدة، وما لم يكن قد اختار بنفسه)
  const ctxAppliedRef = useRef(false);
  useEffect(() => {
    if (ctxAppliedRef.current || !tree.length) return;
    ctxAppliedRef.current = true;
    try {
      const raw = sessionStorage.getItem('mzad_sell_ctx');
      if (!raw) return;
      const ctx = JSON.parse(raw);
      setForm((f: any) => {
        if (f.catPath.length || f.categoryId) return f; // الزائر اختار بنفسه — لا نُبدّل
        const next = { ...f };
        if (ctx.saleType === 'AUCTION' || ctx.saleType === 'DIRECT') next.saleType = ctx.saleType;
        if (ctx.categoryId && catById.has(ctx.categoryId)) {
          const p: Cat[] = [];
          let cur: string | undefined = ctx.categoryId;
          while (cur) { const c = catById.get(cur); if (c) p.unshift(c); cur = parentOf.get(cur); }
          if (p.length) { const leaf = p[p.length - 1]; next.catPath = p; next.categoryId = leaf.children?.length ? '' : leaf.id; }
        }
        return next;
      });
    } catch {}
  }, [tree, catById, parentOf]);

  // أقل زيادة مقترحة ذكياً ≈ ٥٪ من سعر البداية مقرّبة لرقم لطيف
  const niceIncrement = (price: number) => {
    if (!price || price <= 0) return 0;
    const steps = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
    const raw = price * 0.05;
    let best = 50;
    for (const s of steps) if (s <= raw) best = s;
    return best;
  };

  // اقتراح ذكي للعنوان من التصنيف المختار + العدد — تسهيل وجذب
  const suggestTitle = useMemo(() => {
    if (!form.catPath.length) return '';
    const base = form.catPath.map((c: Cat) => c.name).slice(-2).join(' ');
    const cnt = Number(form.count) || 0;
    return `${cnt > 1 ? cnt + ' من ' : ''}${base}`.trim();
  }, [form.catPath, form.count]);

  const searchResults = catSearch.trim() ? allCats.filter((x) => x.cat.name.includes(catSearch.trim()) && relevant(x.cat.id)).slice(0, 30) : [];
  const deepestCat: Cat | undefined = form.catPath[form.catPath.length - 1];
  const catOptions: Cat[] = form.catPath.length
    ? (deepestCat?.children ?? []).filter((c: Cat) => relevant(c.id))
    : (interests.length ? interestRootCats : tree);
  const chooseCat = (c: Cat) => {
    const isLeaf = !(c.children && c.children.length);
    const newPath = [...form.catPath, c];
    setForm((f: any) => ({ ...f, catPath: newPath, categoryId: isLeaf ? c.id : '' }));
    if (isLeaf) setCatOpen(false); // إغلاق القائمة المنسدلة عند اختيار صنف نهائي
  };
  const pickPath = (path: Cat[]) => {
    const leaf = path[path.length - 1];
    const isLeaf = !leaf.children?.length;
    setForm((f: any) => ({ ...f, catPath: path, categoryId: isLeaf ? leaf.id : '' }));
    setCatSearch('');
    if (isLeaf) setCatOpen(false);
  };
  const truncateCat = (i: number) => setForm((f: any) => ({ ...f, catPath: f.catPath.slice(0, i), categoryId: '' }));
  const cardTheme = (c: Cat) => resolveTheme([{ name: c.name, themeKey: c.themeKey ?? null }, ...[...form.catPath].reverse().map((p: Cat) => ({ name: p.name, themeKey: p.themeKey ?? null }))]);

  const hasLoc = form.lat != null;
  const priceOk = form.saleType === 'DIRECT' ? !!form.price : form.saleType === 'ONSOOM' ? true : !!form.startPrice;
  const healthAllSet = healthItems.every((h) => form.health[h.id] !== undefined);
  const reqOk =
    (!req('photos') || form.photos.length > 0) &&
    (!req('video') || !!videoUrl) &&
    (!req('audio') || !!audioUrl) &&
    (!req('health') || healthAllSet);
  const canSubmit = !!form.categoryId && form.title.trim().length > 2 && form.description.trim().length > 2 && priceOk && reqOk;

  if (!ready) return null;
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
      if (defectsNote.trim()) health.push({ key: 'other_defects', value: false as any, label: t('sellDefectsTitle'), note: defectsNote.trim() } as any);
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
      <Section title="📍 موقع الحلال" badge="opt" tint="bg-sky-50 border-sky-200" hint={t('sellLocationHint')}>
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
              <div className="mt-2">
                <RegionCityPicker region={form.region} city={form.city} required
                  onChange={(r, c) => setForm((f: any) => ({ ...f, region: r, city: c }))} />
              </div>
            )}
          </>
        )}
      </Section>

      {/* التصنيف — قائمة منسدلة مضغوطة توفّر المساحة */}
      <Section title="🗂️ التصنيف" badge="req" tint="bg-amber-50 border-amber-200">
        {/* زرّ منسدل يعرض المحدّد ويفتح المنتقي */}
        <button type="button" onClick={() => setCatOpen((o) => !o)}
          className={`flex w-full items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 text-right ring-1 transition ${form.categoryId ? 'ring-2 ring-green-400' : 'ring-sand-200'}`}>
          <span className="min-w-0 flex-1 truncate">
            {form.categoryId
              ? `✓ ${form.catPath.map((c: Cat) => c.name).join(' › ')}`
              : form.catPath.length
                ? `${form.catPath.map((c: Cat) => c.name).join(' › ')} … (أكمِل)`
                : 'اختر التصنيف'}
          </span>
          <span className={`shrink-0 text-gray-400 transition ${catOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {catOpen && (
          <div className="mt-2 rounded-2xl bg-white p-3 ring-1 ring-sand-200">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">{interests.length ? '✦ من اهتماماتك فقط' : 'كل التصنيفات'}</span>
              <button type="button" onClick={() => setShowInterestPicker(true)} className="flex shrink-0 items-center gap-1 rounded-lg bg-sand-50 px-2 py-1 text-xs text-brand ring-1 ring-sand-200">✎ تعديل الاهتمامات</button>
            </div>
            <div className="relative mb-3">
              <input className="input !pr-10" placeholder="🔍 ابحث عن تصنيف بالاسم..." value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
            </div>

            {(!interestsReady || !tree.length) ? (
              <div className="space-y-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />)}</div>
            ) : catSearch.trim() ? (
              <div className="max-h-72 space-y-1.5 overflow-y-auto">
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
                <div className="mb-2 flex flex-wrap items-center gap-1 text-sm">
                  <button onClick={() => truncateCat(0)} className={`${form.catPath.length === 0 ? 'text-brand' : 'text-gray-500'}`}>الكل</button>
                  {form.catPath.map((c: Cat, i: number) => (
                    <span key={c.id} className="flex items-center gap-1">
                      <span className="text-gray-300">›</span>
                      <button onClick={() => truncateCat(i + 1)} className="text-gray-600">{c.icon} {c.name}</button>
                    </span>
                  ))}
                </div>
                {catOptions.length > 0 ? (
                  <div className="max-h-72 space-y-1.5 overflow-y-auto">
                    {catOptions.map((c) => {
                      const isLeaf = !c.children || c.children.length === 0;
                      const selected = form.categoryId === c.id;
                      const t = cardTheme(c);
                      return (
                        <button key={c.id} type="button" onClick={() => chooseCat(c)}
                          className={`flex w-full items-center gap-2 rounded-xl border-2 p-2 text-right transition active:scale-[0.99] ${selected ? 'border-brand bg-brand/5' : 'border-sand-200 hover:border-brand'}`}>
                          {catImageIcon(c.name) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={catImageIcon(c.name)!} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-white" style={{ backgroundImage: gradient(t) }}>{c.icon ?? '🐾'}</span>
                          )}
                          <span className="min-w-0 flex-1 truncate font-bold">{c.name}</span>
                          <span className={`shrink-0 text-xs font-bold ${isLeaf ? 'text-brand' : 'text-gray-400'}`}>{isLeaf ? (selected ? '✓ محدّد' : 'اختيار') : 'فروع ›'}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-sand-50 p-3 text-center text-sm text-gray-500">
                    {interests.length ? 'لا تطابق اهتماماتك هنا — عدّل اهتماماتك بالأعلى.' : 'لا توجد تصنيفات فرعية.'}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </Section>

      {/* العنوان والوصف — مطلوب */}
      <Section title="✍️ العنوان والوصف" badge="req" tint="bg-emerald-50 border-emerald-200">
        <input maxLength={120} className={`input ${tone(true, form.title.trim().length > 2)}`} placeholder="عنوان الإعلان * (مثال: ناقة مجاهيم منتجة)" value={form.title} onChange={(e) => set('title', e.target.value)} />
        {suggestTitle && form.title.trim().length < 3 && (
          <button type="button" onClick={() => set('title', suggestTitle)}
            className="mt-2 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-800 ring-1 ring-emerald-200 transition active:scale-95">
            ✨ اقتراح: «{suggestTitle}» — اضغط للتعبئة
          </button>
        )}
        <textarea maxLength={2000} className={`input mt-3 min-h-[110px] ${tone(true, form.description.trim().length > 2)}`} placeholder={`الوصف * — ${t('sellDescPlaceholder')}`} value={form.description} onChange={(e) => set('description', e.target.value)} />
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
      <Section title="🩺 الحالة الصحية" badge={req('health') ? 'req' : 'opt'} tint="bg-lime-50 border-lime-200" hint={t('sellHealthHint')}>
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
        {/* حقل حرّ: عيوب لم تُذكر أعلاه */}
        <div className="mt-3">
          <label className="mb-1 block text-sm font-bold text-gray-700">{t('sellDefectsTitle')}</label>
          <textarea maxLength={1000} className="input min-h-[70px]" placeholder={t('sellDefectsPlaceholder')} value={defectsNote} onChange={(e) => setDefectsNote(e.target.value)} />
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
            <div className="flex flex-wrap gap-2">
              {([['٢٤ ساعة', 24], ['يومان', 48], ['٣ أيام', 72], ['أسبوع', 168]] as [string, number][]).map(([l, h]) => (
                <button key={h} type="button" onClick={() => set('durationHours', h)}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 transition active:scale-95 ${Number(form.durationHours) === h ? 'bg-brand text-white ring-brand' : 'bg-white text-gray-600 ring-sand-200'}`}>{l}</button>
              ))}
            </div>
            {(() => { const sug = niceIncrement(Number(form.startPrice) || 0); return sug && Number(form.minIncrement) !== sug ? (
              <button type="button" onClick={() => set('minIncrement', sug)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-800 ring-1 ring-emerald-200 transition active:scale-95">
                ✨ أقل زيادة مقترحة: {sug.toLocaleString('ar-SA')} ﷼ — اضغط للتطبيق
              </button>
            ) : null; })()}
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
      {!canSubmit && <p className="text-center text-xs text-gray-500">أكمل الحقول ذات الإطار الأحمر: التصنيف، العنوان، الوصف، وطريقة البيع.</p>}

      {showInterestPicker && (
        <InterestPicker
          initial={interests}
          title="اهتماماتي"
          subtitle={t('interestSubtitle')}
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
