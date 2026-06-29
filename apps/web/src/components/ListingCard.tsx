import Link from 'next/link';
import { ListingSummary } from '@/lib/api';
import { Countdown } from './Countdown';
import { isOpenEnd } from '@/lib/auction';
import { HeartButton } from '@/lib/favorites';

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const img = listing.media?.[0]?.url;
  const isAuction = listing.saleType === 'AUCTION';
  const isOnsoom = !isAuction && !!listing.auction && isOpenEnd(listing.auction.endAt);

  return (
    <Link href={`/listings/${listing.id}`} className="card-3d group block">
      <div className="relative aspect-square bg-sand-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">{listing.category?.icon ?? '🐾'}</div>
        )}
        {isAuction && (
          <span className="float-box absolute right-1.5 top-1.5 rounded-full bg-gradient-to-l from-gold to-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
            🔨 مزاد
          </span>
        )}
        {isOnsoom && (
          <span className="float-box absolute right-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
            🤝 سوم
          </span>
        )}
        <HeartButton id={listing.id} className="absolute left-1.5 top-1.5 !h-8 !w-8 !text-base" />
        {listing.seller?.identityStatus === 'VERIFIED' && (
          <span className="absolute left-11 top-2 rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-bold text-brand backdrop-blur">
            ✔ موثّق
          </span>
        )}
        {/* السعر يطفو فوق الصورة */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2 pt-6">
          {isAuction || isOnsoom ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-white text-emboss-light">
                {Number(listing.auction?.startPrice ?? 0).toLocaleString('ar-SA')} ﷼
              </span>
              {isAuction && listing.auction && (
                <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-brand-dark">
                  <Countdown endAt={listing.auction.endAt} />
                </span>
              )}
            </div>
          ) : (
            <span className="text-base font-extrabold text-white text-emboss-light">
              {listing.price ? `${Number(listing.price).toLocaleString('ar-SA')} ﷼` : 'على السوم'}
            </span>
          )}
        </div>
      </div>

      <div className="p-2.5">
        <h3 className="line-clamp-1 text-sm font-bold text-engrave">{listing.title}</h3>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {listing.category?.icon} {listing.category?.name} · {listing.city}
        </p>
      </div>
    </Link>
  );
}
