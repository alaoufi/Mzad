'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, ListingSummary } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { resolveTheme, resolveIcon, gradient, sceneBackground, SUPPLIES_NAME, CatNode } from '@/lib/themes';
import { AdBanner } from '@/components/AdBanner';

interface Cat { id: string; name: string; icon?: string; themeKey?: string | null; children?: Cat[]; }
type Mode = 'DIRECT' | 'AUCTION' | 'SUPPLIES';

export default function HomePage() {
  const [tree, setTree] = useState<Cat[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [mode, setMode] = useState<Mode>('DIRECT');
  const [path, setPath] = useState<Cat[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [entryMode, setEntryMode] = useState<'GENERAL' | 'SPECIALIZED'>('GENERAL');

  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
    api<{ entryMode: 'GENERAL' | 'SPECIALIZED' }>('/settings').then((r) => setEntryMode(r.entryMode)).catch(() => {});
  }, []);

  const animals = useMemo(() => tree.filter((s) => s.name !== SUPPLIES_NAME), [tree]);
  const suppliesRoot = useMemo(() => tree.find((s) => s.name === SUPPLIES_NAME), [tree]);

  const topList = mode === 'SUPPLIES' ? suppliesRoot?.children ?? [] : animals;
  const activeCategoryId =
    path.length ? path[path.length - 1].id : mode === 'SUPPLIES' ? suppliesRoot?.id ?? null : null;

  // سلسلة التصنيفات (من الأعمق للأعلى) لحلّ الثيم والأيقونة
  const chain: CatNode[] = mode === 'SUPPLIES'
    ? [...[...path].reverse(), ...(suppliesRoot ? [{ name: SUPPLIES_NAME, icon: suppliesRoot.icon ?? null, themeKey: suppliesRoot.themeKey ?? null }] : [])]
    : [...path].reverse();
  const theme = resolveTheme(chain);
  const emoji = path.length || mode === 'SUPPLIES' ? resolveIcon(chain) : '🐪';

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('saleType', mode === 'AUCTION' ? 'AUCTION' : 'DIRECT');
    if (activeCategoryId) params.set('categoryId', activeCategoryId);
    else if (mode !== 'SUPPLIES' && suppliesRoot) params.set('exclude', suppliesRoot.id);
    if (q) params.set('q', q);
    api<{ items: ListingSummary[] }>(`/listings?${params}`)
      .then((r) => setListings(r.items))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPath([]); }, [mode]);
  useEffect(() => { if (tree.length) load(); /* eslint-disable-next-line */ }, [mode, activeCategoryId, tree.length]);

  const deepest = path[path.length - 1];
  const title =
    mode === 'SUPPLIES'
      ? `سوق المستلزمات${deepest ? ` — ${deepest.name}` : ''}`
      : `${mode === 'DIRECT' ? 'عروض' : 'مزاد'} ${deepest?.name ?? 'المواشي'}`;
  const tagline = path.length
    ? path.map((p) => p.name).join(' · ')
    : mode === 'SUPPLIES' ? 'أعلاف · صيدليات بيطرية · مستلزمات' : 'إبل · غنم · ماعز · بقر · خيل';

  const pick = (level: number, cat: Cat) => setPath((p) => [...p.slice(0, level), cat]);
  const reset = (level: number) => setPath((p) => p.slice(0, level));

  // بوابة الدخول المتخصص: يختار الزائر النوع أول دخول ويتصفّح داخله كأنه موقع مستقل
  const showGate = entryMode === 'SPECIALIZED' && mode !== 'SUPPLIES' && path.length === 0;
  if (showGate && animals.length > 0) {
    return (
      <div className="-mx-4 -my-6 min-h-screen px-4 py-10 animate-fadeup"
        style={{ background: sceneBackground(resolveTheme([])) }}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-6xl">🐾</p>
          <h1 className="mt-3 text-2xl font-extrabold text-engrave sm:text-3xl">أهلاً بك في مزاد</h1>
          <p className="mt-2 text-gray-500">اختر النوع الذي تريد تصفّحه — كل نوع بهويته الخاصة وكأنه موقع مستقل.</p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {animals.map((s) => {
              const t = resolveTheme([{ name: s.name, themeKey: s.themeKey ?? null }]);
              return (
                <button key={s.id} onClick={() => pick(0, s)}
                  className="group relative overflow-hidden rounded-3xl p-5 text-white shadow-lift transition hover:-translate-y-0.5"
                  style={{ backgroundImage: gradient(t), boxShadow: `0 22px 44px -20px ${t.from}aa` }}>
                  <span className="pointer-events-none absolute -left-3 -bottom-4 select-none text-7xl leading-none opacity-15">{s.icon ?? '🐾'}</span>
                  <span className="relative block text-4xl drop-shadow animate-floaty">{s.icon ?? '🐾'}</span>
                  <span className="relative mt-2 block text-lg font-extrabold text-emboss-light">{s.name}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setMode('SUPPLIES')}
            className="mt-5 rounded-2xl bg-white/70 px-5 py-3 text-sm font-bold text-gray-600 ring-1 ring-sand-200 backdrop-blur">
            🛒 أو تصفّح سوق المستلزمات
          </button>
        </div>
      </div>
    );
  }

  const inSpecialized = entryMode === 'SPECIALIZED' && mode !== 'SUPPLIES';

  return (
    <div className="-mx-4 -my-6 min-h-screen px-4 py-6 transition-all duration-500 animate-fadeup"
      style={{ background: sceneBackground(theme) }}>
      {/* علامة مائية للنوع (إحساس المكان) */}
      <div className="pointer-events-none fixed left-0 top-24 -z-0 select-none text-[40vw] leading-none opacity-[0.04]">
        {emoji}
      </div>

      <div className="relative">
        {/* الهيرو */}
        <div className="relative mb-4 overflow-hidden rounded-4xl p-6 text-white shadow-xl transition-all duration-500"
          style={{ backgroundImage: gradient(theme), boxShadow: `0 26px 52px -22px ${theme.from}aa` }}>
          {/* لمعة علوية وزخرفة */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" />
          <span className="pointer-events-none absolute -left-4 -bottom-6 select-none text-[8rem] leading-none opacity-15">{emoji}</span>
          <div className="relative">
            <h1 className="flex items-center gap-3 text-2xl font-extrabold text-emboss-light sm:text-3xl">
              <span className="text-4xl drop-shadow animate-floaty">{emoji}</span> {title}
            </h1>
            <p className="mt-1 text-white/85">{tagline}</p>
          </div>
        </div>

        {/* مساحة إعلانية حسب السوق */}
        {mode !== 'SUPPLIES' ? (
          <AdBanner placement="HOME_TOP" onClick={() => setMode('SUPPLIES')} />
        ) : (
          <AdBanner placement="SUPPLIES_TOP" />
        )}

        {/* الأسواق الثلاثة */}
        <div className="glass mb-4 grid grid-cols-3 gap-1.5 rounded-3xl p-1.5">
          {([['DIRECT', '🏷️ العروض'], ['AUCTION', '🔨 المزادات'], ['SUPPLIES', '🛒 المستلزمات']] as [Mode, string][]).map(
            ([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`rounded-xl py-3 text-sm font-bold transition sm:text-base ${
                  mode === m ? 'text-white shadow' : 'text-gray-500'}`}
                style={mode === m ? { backgroundImage: gradient(theme) } : undefined}>
                {label}
              </button>
            ),
          )}
        </div>

        {/* بحث */}
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-4 flex gap-2">
          <input className="input flex-1" placeholder="ابحث..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="btn-primary !px-5">🔍</button>
        </form>

        {/* المستوى 1 — في الوضع المتخصص يُستبدل بزر تغيير النوع */}
        {inSpecialized ? (
          <button onClick={() => reset(0)}
            className="mb-2 flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow"
            style={{ backgroundImage: gradient(theme) }}>
            <span>{emoji} {path[0]?.name}</span>
            <span className="opacity-90">↩︎ تغيير النوع</span>
          </button>
        ) : (
          <Row label={mode === 'SUPPLIES' ? 'الفئة' : 'النوع'}>
            <Chip active={path.length === 0} accent={theme.accent} onClick={() => reset(0)}>الكل</Chip>
            {topList.map((c) => (
              <Chip key={c.id} active={path[0]?.id === c.id} accent={theme.accent} onClick={() => pick(0, c)}>
                {c.icon} {c.name}
              </Chip>
            ))}
          </Row>
        )}

        {/* المستوى 2 */}
        {path[0]?.children && path[0].children.length > 0 && (
          <Row label={mode === 'SUPPLIES' ? 'الصنف' : 'اللون / الصنف'}>
            <Chip active={path.length === 1} accent={theme.accent} onClick={() => reset(1)}>الكل</Chip>
            {path[0].children.map((c) => (
              <Chip key={c.id} active={path[1]?.id === c.id} accent={theme.accent} onClick={() => pick(1, c)}>{c.name}</Chip>
            ))}
          </Row>
        )}

        {/* المستوى 3 */}
        {path[1]?.children && path[1].children.length > 0 && (
          <Row label="السلالة">
            <Chip active={path.length === 2} accent={theme.accent} onClick={() => reset(2)}>الكل</Chip>
            {path[1].children.map((c) => (
              <Chip key={c.id} active={path[2]?.id === c.id} accent={theme.accent} onClick={() => pick(2, c)}>{c.name}</Chip>
            ))}
          </Row>
        )}

        {/* النتائج */}
        <div className="mt-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="card h-44 animate-pulse bg-black/5" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <p className="text-6xl">{emoji}</p>
              <p className="mt-3 text-lg font-bold">لا توجد نتائج في «{title}»</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-xs font-bold text-gray-500">{label}</div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function Chip({ children, active, onClick, accent }: { children: React.ReactNode; active?: boolean; onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick}
      className="chip whitespace-nowrap !px-3 !py-1.5 !text-sm shadow-sm transition"
      style={active ? { backgroundColor: accent, color: '#fff' } : undefined}>
      {children}
    </button>
  );
}
