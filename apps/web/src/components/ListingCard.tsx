import Link from 'next/link';
import { ListingSummary } from '@/lib/api';
import { Countdown } from './Countdown';
import { isOpenEnd } from '@/lib/auction';
import { HeartButton } from '@/lib/favorites';

export type CardVariant = 'classic' | 'overlay' | 'polaroid' | 'ticket';

export function ListingCard({
  listing, featured, variant = 'classic',
}: { listing: ListingSummary; featured?: boolean; variant?: CardVariant }) {
  const img = listing.media?.[0]?.url;
  const isAuction = listing.saleType === 'AUCTION';
  const isOnsoom = !isAuction && !!listing.auction && isOpenEnd(listing.auction.endAt);
  const priceNum = isAuction || isOnsoom ? Number(listing.auction?.startPrice ?? 0) : Number(listing.price ?? 0);
  const priceLabel = priceNum > 0 ? priceNum.toLocaleString('ar-SA') : null;

  const picture = img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img} alt={listing.title}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
  ) : (
    <div className="flex h-full min-h-[8rem] items-center justify-center text-5xl">{listing.category?.icon ?? '🐾'}</div>
  );

  const badges = (
    <>
      {isAuction && (
        <span className="float-box absolute right-2 top-2 rounded-full bg-gradient-to-l from-gold to-amber-500 px-2.5 py-1 text-xs font-bold text-white">🔨 مزاد</span>
      )}
      {isOnsoom && (
        <span className="float-box absolute right-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">🤝 على السوم</span>
      )}
      <HeartButton id={listing.id} className="absolute left-2 top-2 !h-9 !w-9 !text-lg" />
      {listing.seller?.identityStatus === 'VERIFIED' && (
        <span className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand shadow-sm">✔ موثّق</span>
      )}
    </>
  );

  const priceBig = (
    <div className="flex items-end justify-between gap-2">
      <div>
        {(isAuction || isOnsoom) && <div className="text-[11px] text-gray-400">{isOnsoom ? 'يبدأ من' : 'أعلى مزايدة'}</div>}
        <div className="text-lg font-extrabold leading-none text-brand-dark">
          {priceLabel ? <>{priceLabel} <span className="text-sm">﷼</span></> : 'على السوم'}
        </div>
      </div>
      {isAuction && listing.auction && (
        <span className="rounded-lg bg-sand-100 px-2 py-1 text-xs font-bold text-brand-dark">⏱ <Countdown endAt={listing.auction.endAt} /></span>
      )}
    </div>
  );

  // ★ بطاقة مميّزة عريضة (صورة جانبية)
  if (featured) {
    return (
      <Link href={`/listings/${listing.id}`} className="card-3d group flex overflow-hidden">
        <div className="relative h-full min-h-[9.5rem] w-2/5 shrink-0 bg-sand-100">{picture}{badges}</div>
        <div className="flex flex-1 flex-col justify-center p-4">
          <span className="mb-1 w-fit rounded-full px-2 py-0.5 text-[11px] font-extrabold"
            style={{ backgroundColor: 'color-mix(in srgb, var(--th-accent, #0f7b6c) 14%, white)', color: 'var(--th-accent, #0f7b6c)' }}>★ مميّز</span>
          <h3 className="line-clamp-2 text-lg font-extrabold text-engrave">{listing.title}</h3>
          <p className="mt-0.5 truncate text-sm text-gray-500">📍 {listing.city}</p>
          <div className="mt-3 text-2xl font-extrabold leading-none text-brand-dark">
            {priceLabel ? <>{priceLabel} <span className="text-base">﷼</span></> : 'على السوم'}
          </div>
        </div>
      </Link>
    );
  }

  // مجلّة — النص فوق الصورة بتدرّج داكن
  if (variant === 'overlay') {
    return (
      <Link href={`/listings/${listing.id}`} className="card-3d group relative block">
        <div className="relative aspect-[3/4] bg-sand-100">
          {picture}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          {badges}
          <div className="absolute inset-x-0 bottom-0 p-3 text-white">
            <h3 className="line-clamp-1 text-base font-extrabold drop-shadow">{listing.title}</h3>
            <p className="truncate text-xs text-white/80">📍 {listing.city}</p>
            <div className="mt-1 text-lg font-extrabold drop-shadow">
              {priceLabel ? <>{priceLabel} <span className="text-sm">﷼</span></> : 'على السوم'}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // بولارويد — إطار أبيض وتعليق وسط
  if (variant === 'polaroid') {
    return (
      <Link href={`/listings/${listing.id}`} className="card-3d group block bg-white p-2">
        <div className="relative aspect-square overflow-hidden rounded-[inherit] bg-sand-100">{picture}{badges}</div>
        <div className="px-1 pb-1 pt-2 text-center">
          <h3 className="line-clamp-1 text-sm font-extrabold text-engrave">{listing.title}</h3>
          <p className="truncate text-xs text-gray-400">📍 {listing.city}</p>
          <div className="mt-1 text-base font-extrabold leading-none text-brand-dark">
            {priceLabel ? <>{priceLabel} <span className="text-xs">﷼</span></> : 'على السوم'}
          </div>
        </div>
      </Link>
    );
  }

  // تذكرة — فاصل منقّط بين الصورة والمحتوى
  if (variant === 'ticket') {
    return (
      <Link href={`/listings/${listing.id}`} className="card-3d group block">
        <div className="relative aspect-[4/3] bg-sand-100">{picture}{badges}</div>
        <div className="border-t-2 border-dashed border-sand-200 p-3">
          <h3 className="line-clamp-1 text-base font-bold text-engrave">{listing.title}</h3>
          <p className="mt-0.5 truncate text-sm text-gray-500">📍 {listing.city}</p>
          <div className="mt-2">{priceBig}</div>
        </div>
      </Link>
    );
  }

  // كلاسيكي
  return (
    <Link href={`/listings/${listing.id}`} className="card-3d group block">
      <div className="relative aspect-[4/3] bg-sand-100">{picture}{badges}</div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-base font-bold text-engrave">{listing.title}</h3>
        <p className="mt-0.5 truncate text-sm text-gray-500">📍 {listing.city}</p>
        <div className="mt-2">{priceBig}</div>
      </div>
    </Link>
  );
}
