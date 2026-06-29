'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, ListingSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ListingCard } from '@/components/ListingCard';
import { InterestPicker } from '@/components/InterestPicker';
import { resolveTheme, resolveIcon, gradient, sceneBackground, themeVars, SUPPLIES_NAME, CatNode } from '@/lib/themes';
import { usePageTheme } from '@/lib/theme-context';
import { useSearchTerm, setSearchTerm } from '@/lib/search';
import { AdBanner } from '@/components/AdBanner';

interface Cat { id: string; name: string; icon?: string; themeKey?: string | null; children?: Cat[]; }
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

  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
    api<{ entryMode: 'GENERAL' | 'SPECIALIZED' }>('/settings').then((r) => setEntryMode(r.entryMode)).catch(() => {});
    if (typeof window !== 'undefined') setGateDismissed(sessionStorage.getItem('mzad_gate') === '1');
  }, []);

  useEffect(() => {
    if (!user) { setProfileLoaded(true); return; }
    api<{ interests?: string[] }>('/users/me')
      .then((r) => setInterests(r.interests ?? []))
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, [user]);

  // عرض رسالة «ما يهمّك» أول دخول للمسجّلين بلا اهتمامات
  useEffect(() => {
    if (!profileLoaded || !user) return;
    const skipped = typeof window !== 'undefined' && localStorage.getItem('mazad_interest_skip');
    if (interests.length === 0 && !skipped) setShowPicker(true);
  }, [profileLoaded, user, interests.length]);

  const animals = useMemo(() => tree.filter((s) => s.name !== SUPPLIES_NAME), [tree]);
  const suppliesRoot = useMemo(() => tree.find((s) => s.name === SUPPLIES_NAME), [tree]);

  const topList = mode === 'SUPPLIES' ? suppliesRoot?.children ?? [] : animals;

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

  const useInterests = interestActive && path.length === 0 && marketInterests.length > 0;

  // فهرسة الأب لكل عقدة + حساب صلة التصنيف بالاهتمام (لتصفية أزرار التصفّح)
  const parentOf = useMemo(() => {
    const m = new Map<string, string | undefined>();
    const walk = (n: Cat, p?: string) => { m.set(n.id, p); n.children?.forEach((c) => walk(c, n.id)); };
    tree.forEach((t) => walk(t, undefined));
    return m;
  }, [tree]);
  const interestSet = useMemo(() => new Set(marketInterests), [marketInterests]);
  const interestAncestors = useMemo(() => {
    const s = new Set<string>();
    for (const id of marketInterests) { let p = parentOf.get(id); while (p) { s.add(p); p = parentOf.get(p); } }
    return s;
  }, [marketInterests, parentOf]);
  const relevant = (id: string): boolean => {
    if (!interestActive || marketInterests.length === 0) return true;
    if (interestSet.has(id) || interestAncestors.has(id)) return true;
    let p: string | undefined = id;
    while (p) { if (interestSet.has(p)) return true; p = parentOf.get(p); }
    return false;
  };

  // سلسلة التصنيفات (من الأعمق للأعلى) لحلّ الثيم والأيقونة
  const chain: CatNode[] = mode === 'SUPPLIES'
    ? [...[...path].reverse(), ...(suppliesRoot ? [{ name: SUPPLIES_NAME, icon: suppliesRoot.icon ?? null, themeKey: suppliesRoot.themeKey ?? null }] : [])]
    : [...path].reverse();
  const theme = resolveTheme(chain);
  const emoji = path.length || mode === 'SUPPLIES' ? resolveIcon(chain) : '🐾';
  usePageTheme(theme);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('saleType', mode === 'AUCTION' ? 'AUCTION' : 'DIRECT');
    if (path.length) params.set('categoryId', path[path.length - 1].id);
    else if (useInterests) params.set('categoryIds', marketInterests.join(','));
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
  useEffect(() => { if (tree.length) load(); /* eslint-disable-next-line */ },
    [mode, path.map((p) => p.id).join('/'), tree.length, useInterests, marketInterests.join(','), suppliesRoot?.id, q, sort]);

  const deepest = path[path.length - 1];
  const title =
    mode === 'SUPPLIES'
      ? `سوق المستلزمات${deepest ? ` — ${deepest.name}` : ''}`
      : `${mode === 'DIRECT' ? 'عروض' : 'مزادات'} ${deepest?.name ?? (useInterests ? 'تهمّك' : 'المواشي')}`;

  const pick = (level: number, cat: Cat) => setPath((p) => [...p.slice(0, level), cat]);
  const reset = (level: number) => setPath((p) => p.slice(0, level));

  const saveInterests = async (ids: string[]) => {
    setInterests(ids);
    setInterestActive(ids.length > 0);
    setShowPicker(false);
    if (user) { try { await api('/users/me', { method: 'PATCH', body: JSON.stringify({ interests: ids }) }); } catch {} }
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
      <div className="-mx-4 -my-6 min-h-screen px-4 py-10 animate-fadeup"
        style={{ background: sceneBackground(resolveTheme([])), ...themeVars(resolveTheme([])) }}>
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
    <div className="relative -mx-4 -my-6 min-h-screen overflow-hidden px-4 py-6 transition-all duration-500 animate-fadeup"
      style={{ background: sceneBackground(theme), ...themeVars(theme) }}>
      <div className="relative">
        {/* سطر سياق مدمج بدل الهيرو الكبير */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-xl font-extrabold">
            <span className="text-2xl">{emoji === '🐾' ? '🐪' : emoji}</span>
            <span style={{ color: 'var(--th-accent, #0f7b6c)' }}>{title}</span>
          </h1>
          {user && interests.length > 0 && mode !== 'SUPPLIES' && (
            <button onClick={() => setShowPicker(true)}
              className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-brand ring-1 ring-sand-200">
              ✎ اهتماماتي
            </button>
          )}
        </div>

        {mode === 'SUPPLIES' ? (
          <>
            <button onClick={() => setMode('DIRECT')}
              className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">
              → العودة لأسواق المواشي
            </button>
            <AdBanner placement="SUPPLIES_TOP" />
          </>
        ) : (
          <>
            <AdBanner placement="HOME_TOP" />

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


        {q && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white p-2 text-sm ring-1 ring-sand-200">
            <span className="font-bold text-gray-600">نتائج البحث: «{q}»</span>
            <button onClick={() => setSearchTerm('')} className="mr-auto rounded-lg bg-sand-100 px-2 py-1 text-xs font-bold text-gray-500">✕ مسح</button>
          </div>
        )}

        {/* المستوى 1 (الرأس) — مصفّى حسب اهتمامك */}
        <Row label={levelLabel(mode, 0)}>
          <Chip active={path.length === 0} accent={theme.accent} onClick={() => reset(0)}>الكل</Chip>
          {topList.filter((c) => relevant(c.id)).map((c) => (
            <Chip key={c.id} active={path[0]?.id === c.id} accent={theme.accent} onClick={() => pick(0, c)}>
              {c.icon} {c.name}
            </Chip>
          ))}
        </Row>

        {/* المستويات الأعمق — بأي عدد حسب التصنيف */}
        {path.map((node, i) => {
          const kids = (node.children ?? []).filter((c) => relevant(c.id));
          return kids.length > 0 ? (
            <Row key={node.id} label={levelLabel(mode, i + 1)}>
              <Chip active={path.length === i + 1} accent={theme.accent} onClick={() => reset(i + 1)}>الكل</Chip>
              {kids.map((c) => (
                <Chip key={c.id} active={path[i + 1]?.id === c.id} accent={theme.accent} onClick={() => pick(i + 1, c)}>
                  {c.icon} {c.name}
                </Chip>
              ))}
            </Row>
          ) : null;
        }
        )}

        {/* الفرز */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="text-xs font-bold text-gray-400">ترتيب:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-sand-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700">
            <option value="recent">الأحدث</option>
            <option value="views">الأكثر مشاهدة</option>
            <option value="price_asc">الأقل سعراً</option>
            <option value="price_desc">الأعلى سعراً</option>
          </select>
        </div>

        {/* النتائج */}
        <div className="mt-3">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="card h-44 animate-pulse bg-black/5" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="py-14 text-center text-gray-500">
              <p className="text-6xl">{emoji === '🐾' ? '🐪' : emoji}</p>
              <p className="mt-3 text-lg font-bold">لا توجد نتائج في «{title}»</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
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
    </div>
  );
}

function levelLabel(mode: Mode, depth: number): string {
  if (mode === 'SUPPLIES') return ['الفئة', 'الصنف', 'النوع'][depth] ?? `مستوى ${depth + 1}`;
  return ['النوع', 'اللون / الصنف', 'السلالة'][depth] ?? `مستوى ${depth + 1}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-xs font-extrabold" style={{ color: 'var(--th-accent, #6b7280)' }}>{label}</div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function Chip({ children, active, onClick, accent }: { children: React.ReactNode; active?: boolean; onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick}
      className="chip whitespace-nowrap shadow-sm transition"
      style={active ? { backgroundColor: accent, color: '#fff' } : undefined}>
      {children}
    </button>
  );
}
