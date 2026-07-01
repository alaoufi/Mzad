'use client';

import { useEffect, useState } from 'react';
import { uiToast, uiConfirm, uiPrompt } from '@/lib/ui';
import { useRouter } from 'next/navigation';
import { api, ListingSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ListingCard } from '@/components/ListingCard';
import { HijriDate } from '@/components/HijriDate';
import { InterestPicker } from '@/components/InterestPicker';
import { ProfileEditSheet } from '@/components/ProfileEditSheet';
import { accountTypeDef } from '@/lib/roles';

interface Profile {
  name: string;
  role: string;
  accountType?: string;
  city?: string | null;
  region?: string | null;
  isPhoneVerified: boolean;
  identityStatus: string;
  trustScore: number;
  interests?: string[];
  bio?: string | null;
  experienceYears?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  iban?: string | null;
  createdAt?: string;
  _count: { listings: number; reviewsReceived: number };
  ratings: { avgRating: number; avgDescMatch: number; count: number };
  stats?: { sales: number; purchases: number; bids: number; auctionsBidIn: number; offers: number; auctionsListed: number };
}

interface Cat { id: string; name: string; icon?: string; children?: Cat[] }
const SUPPLIES_NAME = 'مستلزمات الحلال';


export default function AccountPage() {
  const router = useRouter();
  const { user, logout, ready } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [editInterests, setEditInterests] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  // ترتيب العرض الافتراضي في الصفحة الرئيسية (محفوظ محلياً)
  const [sortPref, setSortPref] = useState('recent');
  useEffect(() => { try { setSortPref(localStorage.getItem('mzad_sort') || 'recent'); } catch {} }, []);
  const changeSortPref = (v: string) => { setSortPref(v); try { localStorage.setItem('mzad_sort', v); } catch {} };

  const loadProfile = () => api<Profile>('/users/me').then(setProfile).catch(() => {});

  // فهرسة التصنيفات لعرض أسماء الاهتمامات (لا أرقام) وتقسيمها: حلال/مستلزمات
  useEffect(() => { api<Cat[]>('/categories').then(setCats).catch(() => {}); }, []);
  const catName = (id: string): { name: string; icon?: string; supply: boolean } | null => {
    let found: { name: string; icon?: string; supply: boolean } | null = null;
    const walk = (n: Cat, supply: boolean) => {
      if (n.id === id) found = { name: n.name, icon: n.icon, supply };
      n.children?.forEach((c) => walk(c, supply || n.name === SUPPLIES_NAME));
    };
    cats.forEach((c) => walk(c, c.name === SUPPLIES_NAME));
    return found;
  };
  const interestChips = (profile?.interests ?? []).map((id) => ({ id, ...(catName(id) ?? { name: '', icon: undefined, supply: false }) }));
  const animalChips = interestChips.filter((c) => c.name && !c.supply);
  const supplyChips = interestChips.filter((c) => c.name && c.supply);

  const saveInterests = async (ids: string[]) => {
    setEditInterests(false);
    try { await api('/users/me', { method: 'PATCH', body: JSON.stringify({ interests: ids }) }); await loadProfile(); }
    catch (e: any) { uiToast(e.message); }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      loadProfile(),
      api<{ items: ListingSummary[] }>('/listings/mine')
        .then((r) => setListings(r.items))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  const requestVerification = async () => {
    if (!await uiConfirm('سيُراجع فريق المنصة هويتك لمنحك شارة «موثّق». هل تريد إرسال الطلب؟')) return;
    setVerifying(true);
    try {
      await api('/users/me', { method: 'PATCH', body: JSON.stringify({ requestVerification: true }) });
      await loadProfile();
    } catch (e: any) { uiToast(e.message); }
    finally { setVerifying(false); }
  };

  if (!ready) return null;
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand-light p-6 text-white shadow-xl"
        style={{ boxShadow: '0 24px 48px -22px rgba(10,92,80,0.5)' }}>
        <button onClick={() => setEditProfile(true)}
          className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30 hover:bg-white/30">
          ✏️ تعديل بياناتي
        </button>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-2xl font-extrabold">
            {(profile?.name ?? user.name).charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-emboss-light">{profile?.name ?? user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-white/20 px-3 py-0.5 font-bold">
                {accountTypeDef(profile?.accountType).emoji} {accountTypeDef(profile?.accountType).label}
              </span>
              {profile?.identityStatus === 'VERIFIED' && (
                <span className="rounded-full bg-white/20 px-3 py-0.5 font-bold">✔ موثّق بالهوية</span>
              )}
              {!!profile?.experienceYears && (
                <span className="rounded-full bg-white/20 px-3 py-0.5 font-bold">🏅 خبرة {profile.experienceYears} سنة</span>
              )}
            </div>
            {profile?.bio && <p className="mt-2 text-sm leading-relaxed text-white/85">{profile.bio}</p>}
            {profile?.createdAt && (
              <div className="mt-1 text-xs text-white/70">عضو منذ: <HijriDate value={profile.createdAt} short /></div>
            )}
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

      {/* تاريخي في السوق — إحصائيات كاملة */}
      <div className="card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-engrave">📊 تاريخي في السوق</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="مبيعاتي" value={profile?.stats?.sales ?? 0} />
          <Stat label="مشترياتي" value={profile?.stats?.purchases ?? 0} />
          <Stat label="مزايداتي" value={profile?.stats?.bids ?? 0} />
          <Stat label="عروضي" value={profile?.stats?.offers ?? 0} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="مزاداتي المطروحة" value={profile?.stats?.auctionsListed ?? 0} />
          <Stat label="مزادات شاركت فيها" value={profile?.stats?.auctionsBidIn ?? 0} />
        </div>
      </div>

      {/* بطاقة التوثيق */}
      {profile && (
        <div className="card p-4">
          {profile.identityStatus === 'VERIFIED' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <div className="font-bold text-green-700">✔ هويتك موثّقة</div>
                <div className="text-sm text-gray-500">تظهر شارة «موثّق» على إعلاناتك وترفع ثقة المشترين.</div>
              </div>
            </div>
          ) : profile.identityStatus === 'PENDING' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏳</span>
              <div>
                <div className="font-bold text-amber-700">طلب التوثيق قيد المراجعة</div>
                <div className="text-sm text-gray-500">سيصلك إشعار عند اعتماد هويتك من الإدارة.</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                <div>
                  <div className="font-bold">وثّق هويتك</div>
                  <div className="text-sm text-gray-500">احصل على شارة «موثّق» وزد ثقة المشترين بك.</div>
                </div>
              </div>
              <button onClick={requestVerification} disabled={verifying}
                className="btn-primary !min-h-0 !px-4 !py-2 !text-sm disabled:opacity-50">
                {verifying ? '...' : 'اطلب التوثيق'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* روابط سريعة */}
      <div className="grid grid-cols-3 gap-3">
        <button className="card float-box flex flex-col items-center justify-center gap-1 p-4 font-bold" onClick={() => router.push('/wallet')}>
          👛 <span className="text-sm">المحفظة</span>
        </button>
        <button className="card float-box flex flex-col items-center justify-center gap-1 p-4 font-bold" onClick={() => router.push('/favorites')}>
          ❤️ <span className="text-sm">المفضلة</span>
        </button>
        <button className="card float-box flex flex-col items-center justify-center gap-1 p-4 font-bold" onClick={() => router.push('/messages')}>
          💬 <span className="text-sm">رسائلي</span>
        </button>
      </div>

      {/* اهتماماتي — تُعرض كل الاختيارات بالاسم، مقسّمة: حلال / مستلزمات */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            <div>
              <div className="font-bold">اهتماماتي</div>
              <div className="text-sm text-gray-500">
                {profile?.interests?.length ? `${profile.interests.length} اختيار — تظهر لك إعلاناته فقط` : 'لم تحدّد بعد — اختر ما يهمّك'}
              </div>
            </div>
          </div>
          <button onClick={() => setEditInterests(true)} className="btn-primary !min-h-0 !px-4 !py-2 !text-sm">
            {profile?.interests?.length ? 'تعديل' : 'اختيار'}
          </button>
        </div>

        {animalChips.length > 0 && (
          <div className="mb-2">
            <div className="mb-1.5 text-xs font-extrabold text-brand-dark">🐾 المواشي (الحلال)</div>
            <div className="flex flex-wrap gap-1.5">
              {animalChips.map((c) => (
                <span key={c.id} className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand-dark">
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {supplyChips.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-extrabold text-amber-700">🛒 المستلزمات</div>
            <div className="flex flex-wrap gap-1.5">
              {supplyChips.map((c) => (
                <span key={c.id} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ترتيب العرض الافتراضي — ينطبق على الصفحة الرئيسية */}
      <div className="card flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">↕️</span>
          <div>
            <div className="font-bold">ترتيب العرض الافتراضي</div>
            <div className="text-sm text-gray-500">كيف تُرتَّب الإعلانات في الرئيسية</div>
          </div>
        </div>
        <select value={sortPref} onChange={(e) => changeSortPref(e.target.value)}
          className="shrink-0 rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm">
          <option value="recent">الأحدث</option>
          <option value="views">الأكثر مشاهدة</option>
          <option value="price_asc">الأقل سعراً</option>
          <option value="price_desc">الأعلى سعراً</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="card float-box flex flex-col items-center justify-center gap-1 p-3 text-sm font-bold" onClick={() => router.push('/disputes')}>
          ⚖️ <span>نزاعاتي</span>
        </button>
        <button className="card float-box flex flex-col items-center justify-center gap-1 p-3 text-sm font-bold" onClick={() => router.push('/help')}>
          ❓ <span>كيف يعمل</span>
        </button>
        <a href="https://wa.me/9665000000" target="_blank" rel="noopener noreferrer"
          className="card float-box flex flex-col items-center justify-center gap-1 p-3 text-sm font-bold text-green-700">
          💬 <span>الدعم</span>
        </a>
        <button className="card float-box col-span-3 flex items-center justify-center gap-2 p-3 text-sm font-bold text-brand-dark" onClick={() => router.push('/advertise')}>
          📣 <span>أعلن معنا — إعلانات مبوبة</span>
        </button>
      </div>

      {editInterests && (
        <InterestPicker
          initial={profile?.interests ?? []}
          title="اهتماماتي"
          onSave={saveInterests}
          onClose={() => setEditInterests(false)}
        />
      )}

      {editProfile && profile && (
        <ProfileEditSheet
          initial={{
            name: profile.name, city: profile.city, region: profile.region,
            bio: profile.bio, experienceYears: profile.experienceYears,
            bankName: profile.bankName, bankAccount: profile.bankAccount, iban: profile.iban,
          }}
          onSaved={loadProfile}
          onClose={() => setEditProfile(false)}
        />
      )}

      {/* روابط اللوحات */}
      {(profile?.role === 'BROKER' || profile?.role === 'ADMIN') && (
        <button className="btn-outline w-full !border-brand !text-brand" onClick={() => router.push('/broker')}>
          🧑‍⚖️ لوحة الدلال
        </button>
      )}
      {(profile?.accountType === 'BROKERS_LEAD' || profile?.role === 'ADMIN') && (
        <button className="btn-outline w-full !border-brand !text-brand" onClick={() => router.push('/brokers')}>
          🎖️ إدارة الدلالين ونطاقاتهم
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="card h-44 animate-pulse bg-black/5" />)}
          </div>
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
            {listings.filter((l) => !l.archived).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>

      {/* الأرشيف */}
      {listings.some((l) => l.archived) && (
        <div>
          <h2 className="mb-3 text-xl font-bold">🗄️ الأرشيف</h2>
          <p className="mb-3 text-sm text-gray-500">إعلانات أخفيتها عن العرض — افتحها لاسترجاعها.</p>
          <div className="grid grid-cols-1 gap-4 opacity-70 sm:grid-cols-2">
            {listings.filter((l) => l.archived).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
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
