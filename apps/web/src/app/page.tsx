'use client';

import { useEffect, useState } from 'react';
import { api, ListingSummary } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { themeFor, gradient } from '@/lib/themes';

interface Cat {
  id: string;
  name: string;
  icon?: string;
  children?: Cat[];
}

export default function HomePage() {
  const [tree, setTree] = useState<Cat[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [mode, setMode] = useState<'DIRECT' | 'AUCTION'>('DIRECT');
  const [species, setSpecies] = useState<Cat | null>(null);
  const [color, setColor] = useState<Cat | null>(null);
  const [breed, setBreed] = useState<Cat | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
  }, []);

  const activeCategoryId = breed?.id ?? color?.id ?? species?.id ?? null;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('saleType', mode);
    if (activeCategoryId) params.set('categoryId', activeCategoryId);
    if (q) params.set('q', q);
    api<{ items: ListingSummary[] }>(`/listings?${params}`)
      .then((r) => setListings(r.items))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeCategoryId]);

  const theme = themeFor(species?.name);

  return (
    <div
      className="-mx-4 -my-6 min-h-screen px-4 py-6 transition-colors duration-500 animate-fadeup"
      style={{ backgroundColor: theme.bg }}
    >
      {/* بطاقة ترحيب حسب النوع */}
      <div className="mb-4 overflow-hidden rounded-3xl p-6 text-white shadow-lg transition-all duration-500"
        style={{ backgroundImage: gradient(theme) }}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
          <span className="text-4xl">{theme.emoji}</span> {theme.label}
        </h1>
        <p className="mt-1 text-white/85">{theme.tagline}</p>
      </div>

      {/* فاصل: العروض / المزادات */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-sand-200">
        <button onClick={() => setMode('DIRECT')}
          className={`rounded-xl py-3 text-lg font-bold transition ${mode === 'DIRECT' ? 'bg-brand text-white shadow' : 'text-gray-500'}`}>
          🏷️ العروض
        </button>
        <button onClick={() => setMode('AUCTION')}
          className={`rounded-xl py-3 text-lg font-bold transition ${mode === 'AUCTION' ? 'bg-gradient-to-l from-gold to-amber-500 text-white shadow' : 'text-gray-500'}`}>
          🔨 المزادات
        </button>
      </div>

      {/* بحث */}
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-4 flex gap-2">
        <input className="input flex-1" placeholder="ابحث..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn-primary !px-5">🔍</button>
      </form>

      {/* المستوى 1: النوع */}
      <Row label="النوع">
        <Chip active={!species} onClick={() => { setSpecies(null); setColor(null); setBreed(null); }}>الكل</Chip>
        {tree.map((s) => (
          <Chip key={s.id} active={species?.id === s.id}
            color={species?.id === s.id ? themeFor(s.name).accent : undefined}
            onClick={() => { setSpecies(s); setColor(null); setBreed(null); }}>
            {s.icon} {s.name}
          </Chip>
        ))}
      </Row>

      {/* المستوى 2: اللون/الصنف */}
      {species?.children && species.children.length > 0 && (
        <Row label="اللون / الصنف">
          <Chip active={!color} onClick={() => { setColor(null); setBreed(null); }} color={!color ? theme.accent : undefined}>الكل</Chip>
          {species.children.map((c) => (
            <Chip key={c.id} active={color?.id === c.id} color={color?.id === c.id ? theme.accent : undefined}
              onClick={() => { setColor(c); setBreed(null); }}>{c.name}</Chip>
          ))}
        </Row>
      )}

      {/* المستوى 3: السلالة */}
      {color?.children && color.children.length > 0 && (
        <Row label="السلالة">
          <Chip active={!breed} onClick={() => setBreed(null)} color={!breed ? theme.accent : undefined}>الكل</Chip>
          {color.children.map((b) => (
            <Chip key={b.id} active={breed?.id === b.id} color={breed?.id === b.id ? theme.accent : undefined}
              onClick={() => setBreed(b)}>{b.name}</Chip>
          ))}
        </Row>
      )}

      {/* النتائج */}
      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="card h-72 animate-pulse bg-black/5" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-6xl">{theme.emoji}</p>
            <p className="mt-3 text-lg font-bold">
              {mode === 'AUCTION' ? 'لا توجد مزادات في هذا القسم' : 'لا توجد عروض في هذا القسم'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-xs font-bold text-gray-400">{label}</div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function Chip({
  children, active, onClick, color,
}: { children: React.ReactNode; active?: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick}
      className={`chip whitespace-nowrap !px-4 !py-2 !text-base ${active && !color ? '!bg-brand !text-white' : ''}`}
      style={color ? { backgroundColor: color, color: '#fff' } : undefined}>
      {children}
    </button>
  );
}
