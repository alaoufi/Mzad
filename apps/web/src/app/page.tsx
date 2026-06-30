'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, ListingSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ListingCard } from '@/components/ListingCard';
import { InterestPicker } from '@/components/InterestPicker';
import { resolveTheme, resolveIcon, resolveSkin, gradient, sceneBackground, themeVars, skinVars, SUPPLIES_NAME, CatNode } from '@/lib/themes';
import { usePageTheme, useHeaderSection } from '@/lib/theme-context';
import { useSearchTerm, setSearchTerm } from '@/lib/search';
import { AdBanner } from '@/components/AdBanner';

interface Cat {
  id: string; name: string; icon?: string; themeKey?: string | null;
  motifKey?: string | null; shapeKey?: string | null; layoutKey?: string | null; cardStyle?: string | null;
  children?: Cat[];
}
type Mode = 'DIRECT' | 'AUCTION' | 'SUPPLIES';

export default function HomePage() {
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [mode, setMode] = useState<Mode>('DIRECT');
  const [path, setPath] = useState<Cat[]>([]);
  const q = useSearchTerm();
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);

  // الاهتمامات الشخصية
  const [interests, setInterests] = useState<string[]>([]);
  const [interestActive, setInterestActive] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // وضع الدخول (عام/متخصص) — بوابة اختيار النوع أول دخول
  const [entryMode, setEntryMode] = useState<'GENERAL' | 'SPECIALIZED'>('GENERAL');
  const [gateDismissed, setGateDismissed] = useState(true);
  const [txt, setTxt] = useState<Record<string, string>>({});
  const tx = (k: string, def: string) => txt[k]?.trim() || def;
  const [trustInfo, setTrustInfo] = useState<{ ic: string; title: string; body: string } | null>(null);

  useEffect(() => {
    // ترطيب فوري من ذاكرة الجلسة (تصنيفات/نصوص نادراً ما تتغيّر) ثم تحديث صامت بالخلفية —
    // فلا تظهر هياكل تحميل عند العودة للرئيسية، والتصفّح يفتح فوراً
    try {
      const ct = sessionStorage.getItem('mzad_cats');
      if (ct) setTree(JSON.parse(ct));
      const st = sessionStorage.getItem('mzad_settings');
      if (st) { const s = JSON.parse(st); if (s.entryMode) setEntryMode(s.entryMode); if (s.texts) setTxt(s.texts); }
      setGateDismissed(sessionStorage.getItem('mzad_gate') === '1');
    } catch {}
    api<Cat[]>('/categories').then((r) => { setTree(r); try { sessionStorage.setItem('mzad_cats', JSON.stringify(r)); } catch {} }).catch(() => {});
    api<{ entryMode: 'GENERAL' | 'SPECIALIZED'; texts?: Record<string, string> }>('/settings').then((r) => { setEntryMode(r.entryMode); if (r.texts) setTxt(r.texts); try { sessionStorage.setItem('mzad_settings', JSON.stringify(r)); } catch {} }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setProfileLoaded(true); return; }
    // اهتمامات مخزّنة لكل مستخدم → عرض فوري للتصفّح ثم تحديث صامت.
    // لا نعتبر الملف «جاهزاً» إلا إذا كان المخزّن غير فارغ — حتى لا تُجلب «كل المواشي»
    // بناءً على ذاكرة قديمة فارغة بينما لدى الزائر اهتمام فعلي (يسبّب ظهور إعلانات ثم اختفاءها).
    try {
      const cached = localStorage.getItem(`mzad_interests_${user.id}`);
      if (cached) {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr) && arr.length) { setInterests(arr); setProfileLoaded(true); }
      }
    } catch {}
    api<{ interests?: string[] }>('/users/me')
      .then((r) => { const ints = r.interests ?? []; setInterests(ints); try { localStorage.setItem(`mzad_interests_${user.id}`, JSON.stringify(ints)); } catch {} })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, [user]);

  // ذكاء السياق: نسجّل ما يتصفّحه الزائر (مزاد/عرض + التصنيف الحالي) ليُهيَّأ نموذج «أضف إعلان» تلقائياً
  useEffect(() => {
    try {
      sessionStorage.setItem('mzad_sell_ctx', JSON.stringify({
        saleType: mode === 'AUCTION' ? 'AUCTION' : 'DIRECT',
        categoryId: path.length ? path[path.length - 1].id : '',
      }));
    } catch {}
  }, [mode, path]);

  // عرض رسالة «ما يهمّك» أول دخول للمسجّلين بلا اهتمامات
  useEffect(() => {
    if (!profileLoaded || !user) return;
    const skipped = typeof window !== 'undefined' && localStorage.getItem('mazad_interest_skip');
    if (interests.length === 0 && !skipped) setShowPicker(true);
  }, [profileLoaded, user, interests.length]);

  const animals = useMemo(() => tree.filter((s) => s.name !== SUPPLIES_NAME), [tree]);
  const suppliesRoot = useMemo(() => tree.find((s) => s.name === SUPPLIES_NAME), [tree]);

  // فهرسة كل عقدة بالـ id + الأب لكل عقدة
  const catById = useMemo(() => {
    const m = new Map<string, Cat>();
    const walk = (n: Cat) => { m.set(n.id, n); n.children?.forEach(walk); };
    tree.forEach(walk);
    return m;
  }, [tree]);
  const parentOf = useMemo(() => {
    const m = new Map<string, string | undefined>();
    const walk = (n: Cat, p?: string) => { m.set(n.id, p); n.children?.forEach((c) => walk(c, n.id)); };
    tree.forEach((t) => walk(t, undefined));
    return m;
  }, [tree]);

  // تقسيم الاهتمامات: ما يخصّ المستلزمات وما يخصّ المواشي
  const suppliesIds = useMemo(() => {
    const ids = new Set<string>();
    const walk = (c?: Cat) => { if (!c) return; ids.add(c.id); c.children?.forEach(walk); };
    if (suppliesRoot) walk(suppliesRoot);
    return ids;
  }, [suppliesRoot]);
  const animalInterests = useMemo(() => interests.filter((id) => !suppliesIds.has(id)), [interests, suppliesIds]);
  const supplyInterests = useMemo(() => interests.filter((id) => suppliesIds.has(id)), [interests, suppliesIds]);
  const marketInterests = mode === 'SUPPLIES' ? supplyInterests : animalInterests;
  const interestSet = useMemo(() => new Set(marketInterests), [marketInterests]);

  // جذور الاهتمام: العُقد المختارة التي لا يوجد لها سلف مختار — منها يبدأ التصفّح، ولا يُعرض ولا يُختار ما فوقها
  const interestRootCats = useMemo(() => {
    const set = new Set(marketInterests);
    return marketInterests
      .filter((id) => {
        let p = parentOf.get(id);
        while (p) { if (set.has(p)) return false; p = parentOf.get(p); }
        return true;
      })
      .map((id) => catById.get(id))
      .filter(Boolean) as Cat[];
  }, [marketInterests, parentOf, catById]);

  const useInterestNav = interestActive && marketInterests.length > 0 && interestRootCats.length > 0;
  const useInterests = useInterestNav && path.length === 0;

  // قائمة المستوى الأول: تبدأ من جذور الاهتمام عند تفعيله، وإلا كل الأنواع
  const topList = useInterestNav
    ? interestRootCats
    : mode === 'SUPPLIES' ? suppliesRoot?.children ?? [] : animals;

  // صلة التصنيف بالاهتمام: صحيح فقط إن كان العنصر اهتماماً مختاراً أو فرعاً منه (صرامة تامة)
  const relevant = (id: string): boolean => {
    if (!interestActive || marketInterests.length === 0) return true;
    let p: string | undefined = id;
    while (p) { if (interestSet.has(p)) return true; p = parentOf.get(p); }
    return false;
  };

  // سلسلة التصنيفات (من الأعمق للأعلى) لحلّ الثيم والأيقونة — تُبنى من سلف العقدة الأعمق
  const ancestryChain = useMemo(() => {
    const deepest = path[path.length - 1];
    if (!deepest) return [] as CatNode[];
    const out: CatNode[] = [];
    let cur: string | undefined = deepest.id;
    while (cur) {
      const c = catById.get(cur);
      if (c) out.push({
        name: c.name, icon: c.icon ?? null, themeKey: c.themeKey ?? null,
        motifKey: c.motifKey ?? null, shapeKey: c.shapeKey ?? null,
        layoutKey: c.layoutKey ?? null, cardStyle: c.cardStyle ?? null,
      });
      cur = parentOf.get(cur);
    }
    return out;
  }, [path, catById, parentOf]);
  const chain: CatNode[] = ancestryChain.length
    ? ancestryChain
    : (mode === 'SUPPLIES' && suppliesRoot ? [{ name: SUPPLIES_NAME, icon: suppliesRoot.icon ?? null, themeKey: suppliesRoot.themeKey ?? null }] : []);
  // سياق التصنيفات الحالي (التصنيف المفتوح + أسلافه) لاستهداف الإعلانات بالقسم
  const categoryCtx = useMemo(() => {
    const deepest = path[path.length - 1];
    if (!deepest) return [] as string[];
    const ids: string[] = [];
    let cur: string | undefined = deepest.id;
    while (cur) { ids.push(cur); cur = parentOf.get(cur); }
    return ids;
  }, [path, parentOf]);
  const theme = resolveTheme(chain);
  const skin = resolveSkin(chain);
  const { motif, layoutKey, cardStyle, mood } = skin;
  const emoji = path.length || mode === 'SUPPLIES' ? resolveIcon(chain) : '🐾';
  usePageTheme(theme);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('saleType', mode === 'AUCTION' ? 'AUCTION' : 'DIRECT');
    // الفلترة تعتمد على معرّفات الاهتمام المختارة مباشرةً — لا على الجذور المشتقّة (قد تكون فارغة لحظياً
    // أثناء تحديث شجرة التصنيفات) فيتسرّب «كل المواشي». هكذا نسبة الخطأ صفر.
    if (path.length) params.set('categoryId', path[path.length - 1].id);
    else if (interestActive && marketInterests.length) params.set('categoryIds', marketInterests.join(','));
    else if (mode === 'SUPPLIES') { if (suppliesRoot) params.set('categoryId', suppliesRoot.id); }
    else if (suppliesRoot) params.set('exclude', suppliesRoot.id);
    if (q) params.set('q', q);
    if (sort !== 'recent') params.set('sort', sort);
    api<{ items: ListingSummary[] }>(`/listings?${params}`)
      .then((r) => setListings(r.items))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPath([]); }, [mode]);
  // لا نجلب النتائج حتى تجهز الاهتمامات (وإلا تظهر نتائج «كل المواشي» ثم تتغيّر)
  useEffect(() => { if (tree.length && profileLoaded) load(); /* eslint-disable-next-line */ },
    [mode, path.map((p) => p.id).join('/'), tree.length, profileLoaded, useInterests, marketInterests.join(','), suppliesRoot?.id, q, sort]);

  const deepest = path[path.length - 1];
  // اسم القسم في العنوان: التصنيف المفتوح، أو اسم الاهتمام الوحيد، أو «ما يهمّك» عند تعدّده
  const sectionName = deepest?.name
    ?? (useInterests
      ? (interestRootCats.length === 1 ? interestRootCats[0].name : 'ما يهمّك')
      : 'المواشي');
  const title =
    mode === 'SUPPLIES'
      ? `سوق المستلزمات${deepest ? ` — ${deepest.name}` : ''}`
      : `${mode === 'DIRECT' ? 'عروض' : 'مزادات'} ${sectionName}`;

  // دمج هوية القسم داخل الهيدر (بدل اللافتة المنفصلة)
  const headerEmoji = emoji === '🐾' ? '🐪' : emoji;
  const headerSubtitle = loading ? '' : `${listings.length} ${mode === 'SUPPLIES' ? 'منتج' : mode === 'AUCTION' ? 'مزاد' : 'عرض'}`;
  useHeaderSection(profileLoaded ? title : '', headerEmoji, headerSubtitle, motif, mood, skin.font, theme.bg);

  const pick = (level: number, cat: Cat) => setPath((p) => [...p.slice(0, level), cat]);
  const reset = (level: number) => setPath((p) => p.slice(0, level));

  const saveInterests = async (ids: string[]) => {
    setInterests(ids);
    setInterestActive(ids.length > 0);
    setShowPicker(false);
    if (user) {
      try { localStorage.setItem(`mzad_interests_${user.id}`, JSON.stringify(ids)); } catch {}
      try { await api('/users/me', { method: 'PATCH', body: JSON.stringify({ interests: ids }) }); } catch {}
    }
  };
  const skipInterests = () => {
    if (typeof window !== 'undefined') localStorage.setItem('mazad_interest_skip', '1');
    setShowPicker(false);
  };

  const enterSpecies = (s: Cat) => {
    if (typeof window !== 'undefined') sessionStorage.setItem('mzad_gate', '1');
    setGateDismissed(true);
    setPath([s]);
  };
  const dismissGate = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('mzad_gate', '1');
    setGateDismissed(true);
  };

  // بوابة الدخول المتخصص: يختار الزائر النوع أول دخول (لغير المسجّلين أو بلا اهتمامات)
  const showGate = entryMode === 'SPECIALIZED' && !gateDismissed && mode !== 'SUPPLIES'
    && path.length === 0 && interests.length === 0 && animals.length > 0;
  if (showGate) {
    return (
      <div className="scene-root -mx-4 -my-6 min-h-screen px-4 py-10 animate-fadeup"
        style={{ background: sceneBackground(resolveTheme([]), 'bloom'), ...themeVars(resolveTheme([])) }}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-6xl">🐾</p>
          <h1 className="mt-3 text-2xl font-extrabold text-engrave sm:text-3xl">أهلاً بك في مزاد</h1>
          <p className="mt-2 text-gray-500">اختر ما يهمّك لتتصفّحه — كل نوع بهويته الخاصة.</p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {animals.map((s) => {
              const t = resolveTheme([{ name: s.name, themeKey: s.themeKey ?? null }]);
              return (
                <button key={s.id} onClick={() => enterSpecies(s)}
                  className="group relative overflow-hidden rounded-3xl p-6 text-white shadow-lift transition active:scale-95"
                  style={{ backgroundImage: gradient(t), boxShadow: `0 20px 40px -20px ${t.from}aa` }}>
                  <span className="block text-5xl drop-shadow">{s.icon ?? '🐾'}</span>
                  <span className="mt-2 block text-xl font-extrabold text-emboss-light">{s.name}</span>
                </button>
              );
            })}
          </div>
          <button onClick={dismissGate}
            className="mt-6 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-gray-600 ring-1 ring-sand-200">
            🌐 أو تصفّح كل الأنواع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-root relative -mx-4 -my-6 min-h-screen overflow-hidden px-4 py-6 transition-all duration-500 animate-fadeup"
      style={{ background: sceneBackground(theme, motif, mood), ...skinVars(skin) }}>
      <div className="relative">
        {mode === 'SUPPLIES' ? (
          <>
            <button onClick={() => setMode('DIRECT')}
              className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">
              → العودة لأسواق المواشي
            </button>
            <AdBanner placement="SUPPLIES_TOP" categoryIds={categoryCtx} />
          </>
        ) : (
          <>
            <AdBanner placement="HOME_TOP" categoryIds={categoryCtx} />

            {/* المبدّل الرئيسي: عروض / مزادات + مدخل المستلزمات الصغير */}
            <div className="mb-3 flex items-center gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2 rounded-3xl bg-white/80 p-1.5 ring-1 ring-black/[0.04]">
                {([['DIRECT', '🏷️ العروض'], ['AUCTION', '🔨 المزادات']] as [Mode, string][]).map(([m, label]) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`rounded-2xl py-3 text-sm font-bold transition sm:text-base ${mode === m ? 'text-white shadow' : 'text-gray-500'}`}
                    style={mode === m ? { backgroundImage: gradient(theme) } : undefined}>
                    {label}
                  </button>
                ))}
              </div>
              {suppliesRoot && (
                <button onClick={() => setMode('SUPPLIES')} title="سوق المستلزمات"
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-sand-200">
                  🛒
                </button>
              )}
            </div>
          </>
        )}

        {/* شريط الثقة — يطمئن الزائر ويعطي إحساساً راقياً (في الجذر فقط) */}
        {mode !== 'SUPPLIES' && path.length === 0 && !q && profileLoaded && (
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-0.5">
            {([
              ['✅', tx('trust1', 'بائعون موثّقون'), 'نراجع بيانات البائع قبل توثيقه، وتظهر شارة «موثّق» على إعلاناته لتطمئن قبل التواصل.'],
              ['🤝', tx('trust2', 'تفاوض مباشر'), 'تتواصل مع البائع مباشرة وتتفق على السعر والتسليم بينكما — بلا وسيط وبلا عمولة.'],
              ['⚖️', tx('trust3', 'حماية النزاعات'), 'إن حدث خلاف بعد الاتفاق يمكنك فتح بلاغ، وتتابعه إدارة المنصّة للوصول إلى حل عادل.'],
              ['🔒', tx('trust4', 'مراسلات خاصة'), 'محادثاتك مع البائع خاصة ومحفوظة داخل المنصّة، ولا يظهر رقمك إلا إذا شاركته بنفسك.'],
            ] as [string, string, string][]).map(([ic, label, body]) => (
              <button key={label} type="button" onClick={() => setTrustInfo({ ic, title: label, body })}
                className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-white/85 px-3 py-1.5 text-xs font-extrabold text-gray-700 shadow-sm ring-1 ring-black/[0.04] transition active:scale-95">
                <span className="text-base">{ic}</span> {label}
              </button>
            ))}
          </div>
        )}

        {q && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white p-2 text-sm ring-1 ring-sand-200">
            <span className="font-bold text-gray-600">نتائج البحث: «{q}»</span>
            <button onClick={() => setSearchTerm('')} className="mr-auto rounded-lg bg-sand-100 px-2 py-1 text-xs font-bold text-gray-500">✕ مسح</button>
          </div>
        )}

        {/* تصفّح مدمج في سطر واحد: مسار مختار (يُزال بنقرة ✕) + خيارات المستوى الحالي */}
        {(!profileLoaded || !tree.length) ? (
          <div className="mb-2 flex gap-1.5 pb-1">
            {[0, 1, 2].map((i) => <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-black/5" />)}
          </div>
        ) : (() => {
          const deepest = path[path.length - 1];
          const options = (deepest ? (deepest.children ?? []) : topList).filter((c) => relevant(c.id));
          if (path.length === 0 && options.length === 0) return null;
          return (
            <div className="no-scrollbar mb-2 flex items-center gap-1.5 overflow-x-auto pb-1">
              {path.map((node, i) => (
                <button key={node.id} onClick={() => reset(i)}
                  className="chip shrink-0 whitespace-nowrap !px-3 !py-1.5 !text-sm shadow-sm"
                  style={{ backgroundColor: theme.accent, color: '#fff' }}>
                  {node.icon} {node.name} <span className="opacity-80">✕</span>
                </button>
              ))}
              {options.map((c) => (
                <button key={c.id} onClick={() => pick(path.length, c)}
                  className="chip shrink-0 whitespace-nowrap !px-3 !py-1.5 !text-sm shadow-sm">
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          );
        })()}

        {/* عدد النتائج + الفرز */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold" style={{ color: 'var(--th-accent, #0f7b6c)' }}>
            {!loading && listings.length > 0 ? `${listings.length.toLocaleString('ar-SA')} ${mode === 'AUCTION' ? 'مزاد' : mode === 'SUPPLIES' ? 'منتج' : 'عرض'}` : ''}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">ترتيب:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-sand-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700">
              <option value="recent">الأحدث</option>
              <option value="views">الأكثر مشاهدة</option>
              <option value="price_asc">الأقل سعراً</option>
              <option value="price_desc">الأعلى سعراً</option>
            </select>
          </div>
        </div>

        {/* إعلان أعلى القوائم */}
        <AdBanner placement="MARKET_TOP" categoryIds={categoryCtx} />

        {/* النتائج */}
        <div className="mt-3">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="card h-44 animate-pulse bg-black/5" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="card mx-auto my-6 max-w-sm p-8 text-center">
              <p className="text-7xl drop-shadow">{emoji === '🐾' ? '🐪' : emoji}</p>
              <p className="mt-3 text-lg font-extrabold text-engrave">لا توجد نتائج في «{title}»</p>
              <p className="mt-1 text-sm text-gray-500">{tx('homeEmpty', 'كن أوّل من يضيف هنا، أو جرّب تصنيفاً آخر.')}</p>
              <Link href="/sell" className="mt-4 inline-flex items-center rounded-2xl px-6 py-2.5 font-extrabold text-white shadow-md transition active:scale-95" style={{ backgroundImage: gradient(theme) }}>＋ أضف إعلانك</Link>
            </div>
          ) : (
            <div className={`grid ${LAYOUTS[layoutKey]?.gap ?? 'gap-3'} ${LAYOUTS[layoutKey]?.grid ?? LAYOUTS.bloom.grid}`}>
              {listings.map((l, i) => (
                <Fragment key={l.id}>
                  {i === Math.min(4, listings.length - 1) && <div className="col-span-full"><AdBanner placement="HOME_MID" categoryIds={categoryCtx} /></div>}
                  {LAYOUTS[layoutKey]?.featured && i === 0 && !path.length ? (
                    <div className="col-span-2 animate-fadeup" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}><ListingCard listing={l} featured /></div>
                  ) : (
                    <div className="animate-fadeup" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}><ListingCard listing={l} variant={cardStyle} /></div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>

      </div>

      {showPicker && (
        <InterestPicker
          initial={interests}
          onSave={saveInterests}
          onClose={() => setShowPicker(false)}
          onSkip={interests.length === 0 ? skipInterests : undefined}
        />
      )}

      {trustInfo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={() => setTrustInfo(null)}>
          <div className="card w-full max-w-sm animate-fadeup p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100 text-4xl">{trustInfo.ic}</div>
            <h3 className="mb-2 text-lg font-extrabold text-gray-800">{trustInfo.title}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{trustInfo.body}</p>
            <button onClick={() => setTrustInfo(null)} className="btn-primary mt-5 w-full">فهمت 👍</button>
          </div>
        </div>
      )}
    </div>
  );
}

// تخطيط النتائج حسب النمط — كثافة الشبكة وبطاقة مميّزة متصدّرة تتغيّر بحسب الصنف
const LAYOUTS: Record<string, { grid: string; gap: string; featured: boolean }> = {
  dunes:  { grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', gap: 'gap-3', featured: true },
  hills:  { grid: 'grid-cols-2 lg:grid-cols-3',                gap: 'gap-4', featured: false },
  peaks:  { grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', gap: 'gap-2', featured: false },
  waves:  { grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', gap: 'gap-3', featured: false },
  motion: { grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', gap: 'gap-3', featured: true },
  spots:  { grid: 'grid-cols-2 lg:grid-cols-3',                gap: 'gap-4', featured: false },
  scales: { grid: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5', gap: 'gap-2', featured: false },
  grid:   { grid: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5', gap: 'gap-2', featured: false },
  bloom:  { grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', gap: 'gap-3', featured: false },
};

