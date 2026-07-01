'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ListingSummary } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { HijriDate } from '@/components/HijriDate';
import { SellerReviews } from '@/components/SellerReviews';
import { accountTypeDef } from '@/lib/roles';

interface PublicProfile {
  user: { id: string; name: string; accountType?: string; identityStatus: string; trustScore: number; bio?: string | null; experienceYears?: number | null; createdAt: string };
  stats: { sales: number; activeListings: number; totalListings: number; avgRating: number; reviewsCount: number };
  listings: ListingSummary[];
}

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<PublicProfile>(`/users/${params.id}`).then(setP).catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <div className="card p-8 text-center text-red-600">{error}</div>;
  if (!p) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  const u = p.user;
  const def = accountTypeDef(u.accountType);

  return (
    <div className="animate-fadeup space-y-4">
      {/* بطاقة عامة — يطّلع عليها أي زائر */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand-light p-6 text-white shadow-xl float-box" style={{ boxShadow: '0 24px 48px -22px rgba(10,92,80,0.5)' }}>
        <div className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-2xl font-extrabold">{u.name.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-emboss-light">
              {u.name}
              {u.identityStatus === 'VERIFIED' && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold">✔ موثّق</span>}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-white/20 px-3 py-0.5 font-bold">{def.emoji} {def.label}</span>
              {!!u.experienceYears && <span className="rounded-full bg-white/20 px-3 py-0.5 font-bold">🏅 خبرة {u.experienceYears} سنة</span>}
            </div>
            {u.bio && <p className="mt-2 text-sm leading-relaxed text-white/85">{u.bio}</p>}
            <div className="mt-1 text-xs text-white/70">عضو منذ: <HijriDate value={u.createdAt} short /></div>
          </div>
        </div>
      </div>

      {/* التقييم والنشاط في السوق — عام */}
      <div className="card p-4">
        <h2 className="mb-3 text-base font-extrabold text-engrave">📊 النشاط في السوق</h2>
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
          <Stat label="التقييم" value={p.stats.reviewsCount ? `${p.stats.avgRating.toFixed(1)} ⭐` : '—'} />
          <Stat label="التقييمات" value={p.stats.reviewsCount} />
          <Stat label="مبيعات" value={p.stats.sales} />
          <Stat label="إعلانات نشطة" value={p.stats.activeListings} />
          <Stat label="إجمالي الإعلانات" value={p.stats.totalListings} />
        </div>
        <p className="mt-3 rounded-xl bg-sand-50 p-2 text-center text-xs text-gray-500">
          🔒 بيانات التواصل والموقع خاصّة — تظهر داخل الإعلان عند الحاجة فقط.
        </p>
      </div>

      {/* إعلاناته النشطة */}
      <div>
        <h2 className="mb-3 text-xl font-bold">إعلاناته النشطة</h2>
        {p.listings.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">لا توجد إعلانات نشطة حالياً.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {p.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      {/* تقييمات البائع */}
      <SellerReviews sellerId={u.id} />

      <button onClick={() => router.back()} className="btn-outline w-full">← رجوع</button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-sand-50 p-3">
      <div className="text-lg font-extrabold text-brand-dark text-emboss">{value}</div>
      <div className="mt-0.5 text-[11px] text-gray-500">{label}</div>
    </div>
  );
}
