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
    <div className="space-y-5 animate-fadeup">
      {/* بطاقة الملف الشخصي — هوية بصرية */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand-light p-6 text-white shadow-xl"
        style={{ boxShadow: '0 24px 48px -22px rgba(10,92,80,0.5)' }}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold backdrop-blur">
            {(profile?.name ?? user.name).charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-emboss-light">{profile?.name ?? user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-white/20 px-3 py-0.5 font-bold">{ROLE_LABEL[profile?.role ?? 'USER']}</span>
              {profile?.identityStatus === 'VERIFIED' && (
                <span className="rounded-full bg-white/20 px-3 py-0.5 font-bold">✔ موثّق بالهوية</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات الثقة — مربّعات طائرة */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="إعلاناتي" value={profile?._count.listings ?? 0} />
        <Stat label="التقييم" value={profile?.ratings.count ? `${profile.ratings.avgRating.toFixed(1)} ⭐` : '—'} />
        <Stat label="مطابقة الوصف"
          value={profile?.ratings.avgDescMatch ? `${Math.round((profile.ratings.avgDescMatch / 5) * 100)}%` : '—'} />
      </div>

      {/* روابط اللوحات */}
      {(profile?.role === 'BROKER' || profile?.role === 'ADMIN') && (
        <button className="btn-outline w-full !border-brand !text-brand" onClick={() => router.push('/broker')}>
          🧑‍⚖️ لوحة الدلال
        </button>
      )}
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
    <div className="card float-box p-3">
      <div className="text-xl font-extrabold text-brand-dark text-emboss">{value}</div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  );
}
