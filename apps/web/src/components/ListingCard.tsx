import Link from 'next/link';
import { ListingSummary } from '@/lib/api';
import { Countdown } from './Countdown';
import { isOpenEnd } from '@/lib/auction';
import { HeartButton } from '@/lib/favorites';

export function ListingCard({ listing, featured }: { listing: ListingSummary; featured?: boolean }) {
  const img = listing.media?.[0]?.url;
  const isAuction = listing.saleType === 'AUCTION';
  const isOnsoom = !isAuction && !!listing.auction && isOpenEnd(listing.auction.endAt);
  const priceNum = isAuction || isOnsoom ? Number(listing.auction?.startPrice ?? 0) : Number(listing.price ?? 0);

  const media = (
    <div className={`relative bg-sand-100 ${featured ? 'h-full min-h-[9.5rem] w-2/5 shrink-0' : 'aspect-[4/3]'}`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full min-h-[8rem] items-center justify-center text-5xl">{listing.category?.icon ?? '🐾'}</div>
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
  );

  const price = (
    <div className={`flex items-end justify-between gap-2 ${featured ? 'mt-3' : 'mt-2'}`}>
      <div>
        {(isAuction || isOnsoom) && <div className="text-[11px] text-gray-400">{isOnsoom ? 'يبدأ من' : 'أعلى مزايدة'}</div>}
        <div className={`font-extrabold leading-none text-brand-dark ${featured ? 'text-2xl' : 'text-lg'}`}>
          {priceNum > 0 ? <>{priceNum.toLocaleString('ar-SA')} <span className="text-sm">﷼</span></> : 'على السوم'}
        </div>
      </div>
      {isAuction && listing.auction && (
        <span className="rounded-lg bg-sand-100 px-2 py-1 text-xs font-bold text-brand-dark">
          ⏱ <Countdown endAt={listing.auction.endAt} />
        </span>
      )}
    </div>
  );

  return (
    <Link href={`/listings/${listing.id}`}
      className={`card-3d group ${featured ? 'flex overflow-hidden' : 'block'}`}>
      {media}
      <div className={featured ? 'flex flex-1 flex-col justify-center p-4' : 'p-3'}>
        {featured && (
          <span className="mb-1 w-fit rounded-full px-2 py-0.5 text-[11px] font-extrabold"
            style={{ backgroundColor: 'color-mix(in srgb, var(--th-accent, #0f7b6c) 14%, white)', color: 'var(--th-accent, #0f7b6c)' }}>
            ★ مميّز
          </span>
        )}
        <h3 className={`text-engrave ${featured ? 'line-clamp-2 text-lg font-extrabold' : 'line-clamp-1 text-base font-bold'}`}>{listing.title}</h3>
        <p className="mt-0.5 truncate text-sm text-gray-500">📍 {listing.city}</p>
        {price}
      </div>
    </Link>
  );
}
