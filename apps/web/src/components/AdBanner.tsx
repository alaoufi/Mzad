'use client';

import Link from 'next/link';

/**
 * مكوّن المساحة الإعلانية. حالياً نموذج ثابت لإظهار "مكان الإعلان".
 * لاحقاً يجلب الإعلان المناسب من قاعدة البيانات حسب الموضع والاستهداف،
 * ويسجّل الظهور والنقر. راجع docs/10.
 */
const DEMO: Record<string, { title: string; sub: string; emoji: string; href: string; from: string; to: string }> = {
  HOME_TOP: {
    title: 'سوق المستلزمات',
    sub: 'أعلاف · صيدليات بيطرية · أدوات — كل ما يحتاجه حلالك',
    emoji: '🌾',
    href: '/?market=supplies',
    from: '#0e5a6b', to: '#28a0a8',
  },
};

export function AdBanner({ placement = 'HOME_TOP', onClick }: { placement?: string; onClick?: () => void }) {
  const ad = DEMO[placement];
  if (!ad) return null;

  const className =
    'relative mb-4 flex w-full items-center gap-4 overflow-hidden rounded-3xl p-4 text-right text-white shadow-lg transition active:scale-[0.99]';
  const style = {
    backgroundImage: `linear-gradient(135deg, ${ad.from}, ${ad.to})`,
    boxShadow: `0 18px 36px -18px ${ad.from}99`,
  };
  const inner = (
    <>
      <span className="absolute left-3 top-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold">إعلان</span>
      <span className="text-4xl drop-shadow">{ad.emoji}</span>
      <div className="flex-1">
        <div className="text-lg font-extrabold">{ad.title}</div>
        <div className="text-sm text-white/85">{ad.sub}</div>
      </div>
      <span className="rounded-xl bg-white/20 px-3 py-2 text-sm font-bold backdrop-blur">تصفّح ←</span>
    </>
  );

  if (onClick) {
    return <button type="button" onClick={onClick} className={className} style={style}>{inner}</button>;
  }
  return <Link href={ad.href} className={className} style={style}>{inner}</Link>;
}
