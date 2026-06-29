'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ListingSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ListingCard } from '@/components/ListingCard';

interface Profile {
  name: string;
  role: string;
  city?: string;
  region?: string;
  isPhoneVerified: boolean;
  identityStatus: string;
  trustScore: number;
  _count: { listings: number; reviewsReceived: number };
  ratings: { avgRating: number; avgDescMatch: number; count: number };
}

const ROLE_LABEL: Record<string, string> = {
  USER: 'مستخدم',
  BROKER: 'دلال معتمد',
  ADMIN: 'إدارة',
};

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      api<Profile>('/users/me').then(setProfile).catch(() => {}),
      api<{ items: ListingSummary[] }>('/listings/mine')
        .then((r) => setListings(r.items))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">👤</p>
          <p className="mb-4 text-lg">سجّل الدخول لعرض حسابك وإعلاناتك</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقة الملف الشخصي */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl text-white">
            {(profile?.name ?? user.name).charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{profile?.name ?? user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="chip">{ROLE_LABEL[profile?.role ?? 'USER']}</span>
              {profile?.identityStatus === 'VERIFIED' && (
                <span className="chip !bg-green-100 !text-green-800">✔ موثّق بالهوية</span>
              )}
              {profile?.isPhoneVerified && (
                <span className="chip">📱 جوال موثّق</span>
              )}
            </div>
          </div>
        </div>

        {/* إحصائيات الثقة */}
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="إعلاناتي" value={profile?._count.listings ?? 0} />
          <Stat
            label="التقييم"
            value={profile?.ratings.count ? `${profile.ratings.avgRating.toFixed(1)} ⭐` : '—'}
          />
          <Stat
            label="مطابقة الوصف"
            value={
              profile?.ratings.avgDescMatch
                ? `${Math.round((profile.ratings.avgDescMatch / 5) * 100)}%`
                : '—'
            }
          />
        </div>
      </div>

      {/* رابط الإدارة */}
      {profile?.role === 'ADMIN' && (
        <button className="btn-outline w-full !border-brand !text-brand" onClick={() => router.push('/admin')}>
          🛡️ لوحة الإدارة
        </button>
      )}

      {/* أزرار */}
      <div className="flex gap-3">
        <button className="btn-primary flex-1" onClick={() => router.push('/sell')}>
          ＋ أضف إعلان
        </button>
        <button
          className="btn-outline flex-1 !border-red-300 !text-red-600"
          onClick={() => {
            logout();
            router.push('/');
          }}
        >
          تسجيل الخروج
        </button>
      </div>

      {/* إعلاناتي */}
      <div>
        <h2 className="mb-3 text-xl font-bold">إعلاناتي</h2>
        {loading ? (
          <p className="py-8 text-center text-gray-500">جارٍ التحميل...</p>
        ) : listings.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">
            <p className="text-4xl">📭</p>
            <p className="mt-3">لا توجد لديك إعلانات بعد</p>
            <button className="btn-primary mt-4" onClick={() => router.push('/sell')}>
              أضف أول إعلان
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-sand-50 p-3">
      <div className="text-xl font-extrabold text-brand-dark">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
