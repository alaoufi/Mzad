'use client';

import { useEffect, useState } from 'react';
import { api, ListingSummary } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { themeFor, gradient } from '@/lib/themes';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

export default function HomePage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  const load = (categoryId?: string | null, query?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (query) params.set('q', query);
    api<{ items: ListingSummary[] }>(`/listings?${params}`)
      .then((r) => setListings(r.items))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(activeCat, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat]);

  const auctionsCount = listings.filter((l) => l.saleType === 'AUCTION').length;
  const activeSpecies = categories.find((c) => c.id === activeCat)?.name;
  const theme = themeFor(activeSpecies);

  return (
    <div
      className="-mx-4 -my-6 min-h-screen px-4 py-6 transition-colors duration-500 animate-fadeup"
      style={{ backgroundColor: theme.bg }}
    >
      {/* بطاقة ترحيب تتغيّر حسب نوع السوق */}
      <div
        className="mb-5 overflow-hidden rounded-3xl p-6 text-white shadow-lg transition-all duration-500"
        style={{ backgroundImage: gradient(theme) }}
      >
        <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
          <span className="text-4xl">{theme.emoji}</span> {theme.label}
        </h1>
        <p className="mt-1 text-white/85">{theme.tagline}</p>
      </div>

      {/* البحث */}
      <form
        onSubmit={(e) => { e.preventDefault(); load(activeCat, q); }}
        className="mb-5 flex gap-2"
      >
        <input
          className="input flex-1"
          placeholder="ابحث... مثال: ناقة مجاهيم في القصيم"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn-primary !px-5">🔍</button>
        <button type="button" title="البحث الصوتي (قريباً)" className="btn-outline !px-5"
          onClick={() => alert('🎙️ البحث الصوتي يأتي قريباً')}>🎙️</button>
      </form>

      {/* التصنيفات */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveCat(null)}
          className="chip whitespace-nowrap !px-4 !py-2 !text-base"
          style={!activeCat ? { backgroundColor: theme.accent, color: '#fff' } : undefined}>
          الكل
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setActiveCat(c.id)}
            className="chip whitespace-nowrap !px-4 !py-2 !text-base"
            style={activeCat === c.id ? { backgroundColor: themeFor(c.name).accent, color: '#fff' } : undefined}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* شريط إحصائي */}
      {!loading && listings.length > 0 && (
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <span>{listings.length} إعلان</span>
          {auctionsCount > 0 && <span className="chip !bg-gold/15 !text-gold">🔨 {auctionsCount} مزاد مباشر</span>}
        </div>
      )}

      {/* النتائج */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-72 animate-pulse bg-sand-100" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="text-6xl">🐑</p>
          <p className="mt-3 text-lg font-bold">لا توجد إعلانات مطابقة</p>
          <p className="text-sm">جرّب تصنيفاً آخر أو أضف إعلانك أنت</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
