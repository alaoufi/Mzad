'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ListingSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ListingCard } from '@/components/ListingCard';

export default function FavoritesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<{ items: ListingSummary[] }>('/favorites')
      .then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">❤️</p>
          <p className="mb-4 text-lg">سجّل الدخول لعرض مفضّلتك</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeup">
      <h1 className="mb-4 text-2xl font-extrabold text-engrave">❤️ المفضلة</h1>
      {loading ? (
        <p className="py-8 text-center text-gray-500">جارٍ التحميل...</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <p className="text-4xl">🤍</p>
          <p className="mt-3">لا توجد إعلانات في المفضلة</p>
          <p className="text-sm">اضغط القلب على أي إعلان لحفظه هنا</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
