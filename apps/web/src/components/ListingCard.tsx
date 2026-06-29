import Link from 'next/link';
import { ListingSummary } from '@/lib/api';
import { Countdown } from './Countdown';
import { isOpenEnd } from '@/lib/auction';
import { HeartButton } from '@/lib/favorites';

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const img = listing.media?.[0]?.url;
  const isAuction = listing.saleType === 'AUCTION';
  const isOnsoom = !isAuction && !!listing.auction && isOpenEnd(listing.auction.endAt);
  const priceNum = isAuction || isOnsoom ? Number(listing.auction?.startPrice ?? 0) : Number(listing.price ?? 0);

  return (
    <Link href={`/listings/${listing.id}`} className="card-3d group block">
      <div className="relative aspect-[4/3] bg-sand-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">{listing.category?.icon ?? '🐾'}</div>
        )}
        {isAuction && (
          <span className="float-box absolute right-2 top-2 rounded-full bg-gradient-to-l from-gold to-amber-500 px-2.5 py-1 text-xs font-bold text-white">
            🔨 مزاد
          </span>
        )}
        {isOnsoom && (
          <span className="float-box absolute right-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
            🤝 على السوم
          </span>
        )}
        <HeartButton id={listing.id} className="absolute left-2 top-2 !h-9 !w-9 !text-lg" />
        {listing.seller?.identityStatus === 'VERIFIED' && (
          <span className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand shadow-sm">
            ✔ موثّق
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 text-base font-bold text-engrave">{listing.title}</h3>
        <p className="mt-0.5 truncate text-sm text-gray-500">📍 {listing.city}</p>

        {/* السعر واضح وكبير */}
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            {(isAuction || isOnsoom) && <div className="text-[11px] text-gray-400">{isOnsoom ? 'يبدأ من' : 'أعلى مزايدة'}</div>}
            <div className="text-lg font-extrabold leading-none text-brand-dark">
              {priceNum > 0 ? <>{priceNum.toLocaleString('ar-SA')} <span className="text-sm">﷼</span></> : 'على السوم'}
            </div>
          </div>
          {isAuction && listing.auction && (
            <span className="rounded-lg bg-sand-100 px-2 py-1 text-xs font-bold text-brand-dark">
              ⏱ <Countdown endAt={listing.auction.endAt} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
