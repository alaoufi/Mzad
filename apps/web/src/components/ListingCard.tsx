import Link from 'next/link';
import { ListingSummary } from '@/lib/api';
import { Countdown } from './Countdown';
import { isOpenEnd } from '@/lib/auction';

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const img = listing.media?.[0]?.url;
  const isAuction = listing.saleType === 'AUCTION';
  const isOnsoom = !isAuction && !!listing.auction && isOpenEnd(listing.auction.endAt);

  return (
    <Link href={`/listings/${listing.id}`} className="card-3d group block">
      <div className="relative aspect-[4/3] bg-sand-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {listing.category?.icon ?? '🐾'}
          </div>
        )}
        {isAuction && (
          <span className="absolute right-2 top-2 rounded-full bg-gradient-to-l from-gold to-amber-500 px-3 py-1 text-sm font-bold text-white shadow">
            🔨 مزاد
          </span>
        )}
        {isOnsoom && (
          <span className="absolute right-2 top-2 rounded-full bg-brand px-3 py-1 text-sm font-bold text-white shadow">
            🤝 على السوم
          </span>
        )}
        {listing.seller?.identityStatus === 'VERIFIED' && (
          <span className="absolute left-2 top-2 rounded-full bg-brand/90 px-2 py-1 text-xs font-bold text-white backdrop-blur">
            ✔ موثّق
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-lg font-bold">{listing.title}</h3>
        <p className="mb-3 text-sm text-gray-500">
          {listing.category?.icon} {listing.category?.name} · {listing.city}
        </p>

        <div className="flex items-center justify-between">
          {isAuction ? (
            <div className="text-sm">
              <span className="text-gray-500">يبدأ من </span>
              <span className="font-extrabold text-brand-dark">
                {Number(listing.auction?.startPrice ?? 0).toLocaleString('ar-SA')} ﷼
              </span>
            </div>
          ) : (
            <div className="text-lg font-extrabold text-brand-dark">
              {listing.price ? `${Number(listing.price).toLocaleString('ar-SA')} ﷼` : 'على السوم'}
            </div>
          )}
          {isAuction && listing.auction && (
            <div className="rounded-lg bg-sand-50 px-2 py-1 text-sm">
              <Countdown endAt={listing.auction.endAt} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
