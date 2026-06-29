'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LiveAuction } from '@/components/LiveAuction';
import { ListingChat } from '@/components/ListingChat';
import { SellerReviews } from '@/components/SellerReviews';
import { themeFor, gradient, sceneBackground } from '@/lib/themes';
import { isOpenEnd } from '@/lib/auction';

const HEALTH_LABELS: Record<string, string> = {
  vaccinated: 'مُطعّم',
  udder: 'سلامة الضرع',
  abscess: 'خالٍ من الخراجات',
  mange: 'خالٍ من الجرب',
  teeth: 'سلامة الأسنان',
  limp: 'خالٍ من العرج',
};

export default function ListingPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  const load = useCallback(() => {
    api(`/listings/${params.id}`).then(setListing).catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const convert = async (to: 'DIRECT' | 'AUCTION' | 'ONSOOM') => {
    try {
      const body: any = { to };
      if (to === 'AUCTION') {
        body.startPrice = Number(prompt('سعر بداية المزاد (ريال):', '1000') || 0);
        body.durationHours = Number(prompt('مدة المزاد بالساعات:', '24') || 24);
      } else if (to === 'ONSOOM') {
        body.startPrice = Number(prompt('أقل مبلغ للمساومة (ريال):', '0') || 0);
      } else if (to === 'DIRECT') {
        body.price = Number(prompt('السعر الثابت (ريال):', '0') || 0);
      }
      await api(`/listings/${params.id}/convert`, { method: 'POST', body: JSON.stringify(body) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  if (error) return <p className="py-10 text-center text-red-600">{error}</p>;
  if (!listing) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  const media = listing.media ?? [];
  const species = listing.category?.parent?.name ?? listing.category?.name;
  const theme = themeFor(species);

  return (
    <div className="-mx-4 -my-6 min-h-screen px-4 py-6 animate-fadeup" style={{ background: sceneBackground(theme) }}>
      {/* لافتة السوق حسب النوع */}
      <div className="mb-5 flex items-center gap-3 rounded-3xl p-4 text-white shadow-lg"
        style={{ backgroundImage: gradient(theme), boxShadow: `0 20px 40px -18px ${theme.from}88` }}>
        <span className="text-4xl">{theme.emoji}</span>
        <div>
          <div className="text-lg font-extrabold">{theme.label}</div>
          <div className="text-sm text-white/80">{theme.tagline}</div>
        </div>
      </div>

      {listing.status === 'DRAFT' && (
        <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-center font-bold text-amber-800">
          ⏳ إعلانك بانتظار موافقة الإدارة قبل ظهوره للجميع
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
      {/* الميديا */}
      <div>
        <div className="card aspect-[4/3] bg-sand-100">
          {media[activeImg] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media[activeImg].url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">
              {listing.category?.parent?.icon ?? listing.category?.icon ?? '🐾'}
            </div>
          )}
        </div>
        {media.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {media.map((m: any, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={m.url}
                onClick={() => setActiveImg(i)}
                className={`h-20 w-20 cursor-pointer rounded-xl object-cover ${
                  i === activeImg ? 'ring-2 ring-brand' : ''
                }`}
                alt=""
              />
            ))}
          </div>
        )}
      </div>

      {/* التفاصيل */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold">{listing.title}</h1>
          <p className="mt-1 text-gray-500">
            📍 {listing.city} — {listing.region}
          </p>
        </div>

        {/* البائع والثقة */}
        <div className="card flex items-center justify-between p-4">
          <div>
            <div className="font-bold">{listing.seller?.name}</div>
            <div className="text-sm text-gray-500">
              ⭐ {listing.seller?.trustScore?.toFixed(1) ?? '—'}
              {listing.seller?.identityStatus === 'VERIFIED' && (
                <span className="mr-2 chip">✔ موثّق</span>
              )}
            </div>
          </div>
          <a
            href={`https://wa.me/`}
            className="btn-outline !px-4 !py-2 !text-base !min-h-0"
          >
            تواصل
          </a>
        </div>

        {/* المواصفات */}
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">المواصفات</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Spec label="النوع" value={`${listing.category?.parent?.name ?? ''} / ${listing.category?.name ?? ''}`} />
            <Spec label="العدد" value={listing.count} />
            <Spec label="الجنس" value={sexLabel(listing.sex)} />
            {listing.approxWeightKg && <Spec label="الوزن التقريبي" value={`${listing.approxWeightKg} كجم`} />}
            {listing.productionStatus && <Spec label="حالة الإنتاج" value={listing.productionStatus} />}
          </dl>
        </div>

        {/* الحالة الصحية */}
        {listing.health?.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-3 text-lg font-bold">🩺 الحالة الصحية والعيوب</h2>
            <div className="flex flex-wrap gap-2">
              {listing.health.map((h: any) => (
                <span
                  key={h.id}
                  className={`chip ${h.value ? '!bg-green-100 !text-green-800' : '!bg-red-100 !text-red-800'}`}
                >
                  {h.value ? '✔' : '✕'} {HEALTH_LABELS[h.key] ?? h.key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* الوصف */}
        <div className="card p-4">
          <h2 className="mb-2 text-lg font-bold">الوصف</h2>
          <p className="leading-relaxed text-gray-700">{listing.description}</p>
        </div>

        {/* السعر / المزاد / على السوم */}
        {(() => {
          const canManage =
            !!user && (user.id === listing.seller?.id || user.role === 'BROKER' || user.role === 'ADMIN');
          const hasAuction = !!listing.auction;
          const open = hasAuction && isOpenEnd(listing.auction.endAt);
          const timed = hasAuction && !open;

          return (
            <>
              {hasAuction ? (
                <LiveAuction auctionId={listing.auction.id} canManage={canManage} />
              ) : (
                <div className="card flex items-center justify-between p-5">
                  <div>
                    <div className="text-gray-500">السعر</div>
                    <div className="text-3xl font-extrabold text-brand-dark">
                      {listing.price ? `${Number(listing.price).toLocaleString('ar-SA')} ﷼` : 'على السوم'}
                    </div>
                  </div>
                  <button className="btn-primary">اطلب الشراء</button>
                </div>
              )}

              {/* تحويل نوع البيع (للمالك أو الدلال أو الإدارة) */}
              {canManage && (
                <div className="card p-4">
                  <h3 className="mb-2 text-sm font-bold text-gray-500">تحويل نوع البيع</h3>
                  <div className="flex flex-wrap gap-2">
                    {(timed || open) && (
                      <button onClick={() => convert('DIRECT')} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">🏷️ عرض بسعر</button>
                    )}
                    {!open && (
                      <button onClick={() => convert('ONSOOM')} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">🤝 على السوم</button>
                    )}
                    {!timed && (
                      <button onClick={() => convert('AUCTION')} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">🔨 مزاد مؤقّت</button>
                    )}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* المحادثة والتقييمات */}
        <ListingChat listingId={listing.id} />
        {listing.seller?.id && <SellerReviews sellerId={listing.seller.id} />}

        <button
          className="w-full text-center text-sm text-gray-400"
          onClick={() => alert('🚩 شكراً، سيراجع فريق الأمان البلاغ')}
        >
          🚩 إبلاغ عن الإعلان
        </button>
      </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-sand-50 px-3 py-2">
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function sexLabel(s: string) {
  return { MALE: 'ذكر', FEMALE: 'أنثى', MIXED: 'مختلط' }[s] ?? s;
}
