'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AdminData {
  stats: {
    users: number;
    listings: number;
    activeListings: number;
    auctions: number;
    bids: number;
    reports: number;
  };
  recent: any[];
  openReports: any[];
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'نشط',
  DRAFT: 'مسودة',
  SOLD: 'مُباع',
  CLOSED: 'مغلق',
};

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api<AdminData>('/admin/stats')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm('حذف هذا الإعلان نهائياً؟')) return;
    try {
      await api(`/admin/listings/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🛡️</p>
          <p className="mb-4 text-lg">لوحة الإدارة — سجّل الدخول بحساب مشرف</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-5xl">🚫</p>
        <p className="mt-3 text-lg font-bold">{error}</p>
        <p className="mt-1 text-sm text-gray-500">ادخل بحساب الإدارة (الجوال 0500000000).</p>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: 'المستخدمون', value: data.stats.users, icon: '👥' },
    { label: 'الإعلانات', value: data.stats.listings, icon: '📋' },
    { label: 'النشطة', value: data.stats.activeListings, icon: '✅' },
    { label: 'المزادات', value: data.stats.auctions, icon: '🔨' },
    { label: 'المزايدات', value: data.stats.bids, icon: '💰' },
    { label: 'البلاغات', value: data.stats.reports, icon: '🚩' },
  ];

  return (
    <div className="animate-fadeup space-y-6">
      <h1 className="text-2xl font-extrabold">🛡️ لوحة الإدارة</h1>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-4 text-center">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-1 text-2xl font-extrabold text-brand-dark">{c.value}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* البلاغات المفتوحة */}
      {data.openReports.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">🚩 بلاغات مفتوحة</h2>
          <ul className="space-y-2">
            {data.openReports.map((r) => (
              <li key={r.id} className="rounded-xl bg-red-50 p-3 text-sm">
                <b>{r.targetType}</b> — {r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* أحدث الإعلانات */}
      <div className="card p-4">
        <h2 className="mb-3 text-lg font-bold">أحدث الإعلانات</h2>
        <div className="space-y-2">
          {data.recent.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
              <div className="min-w-0 flex-1">
                <Link href={`/listings/${l.id}`} className="truncate font-bold hover:text-brand">
                  {l.title}
                </Link>
                <div className="text-xs text-gray-500">
                  {l.category?.name} · {l.city} · {l.seller?.name} ·{' '}
                  <span className="font-bold">{STATUS_LABEL[l.status] ?? l.status}</span>
                  {l.saleType === 'AUCTION' && ' · 🔨 مزاد'}
                </div>
              </div>
              <button onClick={() => remove(l.id)}
                className="shrink-0 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-200">
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
