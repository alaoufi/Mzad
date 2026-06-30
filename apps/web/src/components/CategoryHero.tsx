import { Theme, Mood, gradient, motifPattern, heroEdgePath } from '@/lib/themes';

// شريط قسم مدمج بهويّة كاملة: تدرّج + زخرفة + ظلّ خفيف + حافة مقصوصة — ملتصق بالهيدر
export function CategoryHero({
  theme, motif, emoji, title, subtitle, mood = 'airy',
}: { theme: Theme; motif: string; emoji: string; title: string; subtitle?: string; mood?: Mood }) {
  const pat = motifPattern(motif, '#ffffff');
  const rich = mood === 'rich';
  return (
    <div className="relative -mx-4 -mt-6 mb-3 overflow-hidden px-4 pb-5 pt-2.5"
      style={{ backgroundImage: gradient(theme) }}>
      {/* زخرفة النمط بلون أبيض شفّاف */}
      <div className="pointer-events-none absolute inset-0" style={{ opacity: rich ? 0.26 : 0.18, backgroundImage: pat.image, backgroundSize: pat.size, backgroundRepeat: 'repeat' }} />
      {rich && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />}
      {/* ظلّ النوع الخفيف */}
      <div aria-hidden className="pointer-events-none absolute -left-3 -top-2 select-none text-[88px] leading-none text-white/12">{emoji}</div>

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-2xl drop-shadow">{emoji}</span>
          <h1 className="truncate text-lg font-extrabold leading-tight text-white text-emboss-light"
            style={{ fontFamily: 'var(--font-display, inherit)' }}>{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {rich && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white ring-1 ring-white/30">✦ مميّز</span>}
          {subtitle && <span className="max-w-[9rem] truncate rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-bold text-white/90">{subtitle}</span>}
        </div>
      </div>

      {/* حافة مقصوصة بلون الصفحة */}
      <svg className="absolute inset-x-0 bottom-0 h-3.5 w-full" viewBox="0 0 1440 48" preserveAspectRatio="none" fill={theme.bg}>
        <path d={heroEdgePath(motif)} />
      </svg>
    </div>
  );
}
