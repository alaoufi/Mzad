'use client';

import { useEffect, useState } from 'react';
import { api, ListingSummary } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';

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

  return (
    <div>
      {/* البحث */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(activeCat, q);
        }}
        className="mb-5 flex gap-2"
      >
        <input
          className="input flex-1"
          placeholder="ابحث... مثال: ناقة مجاهيم في القصيم"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn-primary !px-5">
          🔍
        </button>
        <button
          type="button"
          title="البحث الصوتي (قريباً)"
          className="btn-outline !px-5"
          onClick={() => alert('🎙️ البحث الصوتي يأتي في المرحلة الرابعة')}
        >
          🎙️
        </button>
      </form>

      {/* التصنيفات */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCat(null)}
          className={`chip whitespace-nowrap !px-4 !py-2 !text-base ${
            !activeCat ? '!bg-brand !text-white' : ''
          }`}
        >
          الكل
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`chip whitespace-nowrap !px-4 !py-2 !text-base ${
              activeCat === c.id ? '!bg-brand !text-white' : ''
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* النتائج */}
      {loading ? (
        <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="text-5xl">🐑</p>
          <p className="mt-3 text-lg">لا توجد إعلانات مطابقة</p>
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
