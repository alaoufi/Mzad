'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LiveAuction } from '@/components/LiveAuction';

const HEALTH_LABELS: Record<string, string> = {
  vaccinated: 'مُطعّم',
  udder: 'سلامة الضرع',
  abscess: 'خالٍ من الخراجات',
  mange: 'خالٍ من الجرب',
  teeth: 'سلامة الأسنان',
  limp: 'خالٍ من العرج',
};

export default function ListingPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api(`/listings/${params.id}`).then(setListing).catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <p className="py-10 text-center text-red-600">{error}</p>;
  if (!listing) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  const media = listing.media ?? [];

  return (
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

        {/* السعر / المزاد */}
        {listing.saleType === 'AUCTION' && listing.auction ? (
          <LiveAuction auctionId={listing.auction.id} />
        ) : (
          <div className="card flex items-center justify-between p-5">
            <div>
              <div className="text-gray-500">السعر</div>
              <div className="text-3xl font-extrabold text-brand-dark">
                {listing.price
                  ? `${Number(listing.price).toLocaleString('ar-SA')} ﷼`
                  : 'على السوم'}
              </div>
            </div>
            <button className="btn-primary">اطلب الشراء</button>
          </div>
        )}

        <button
          className="w-full text-center text-sm text-gray-400"
          onClick={() => alert('🚩 شكراً، سيراجع فريق الأمان البلاغ')}
        >
          🚩 إبلاغ عن الإعلان
        </button>
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
